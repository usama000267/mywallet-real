require("dotenv").config();

const BSC_RPC =
    "https://bsc-dataseed.binance.org/";

const REQUIRED_CONFIRMATIONS = 3;

const BEP20_ADDRESS = (process.env.BEP20_USDT_ADDRESS || "").trim().toLowerCase();

const BSC_USDT_CONTRACT = (process.env.BSC_USDT_CONTRACT || "").trim().toLowerCase();
if (!/^0x[a-fA-F0-9]{40}$/.test(BEP20_ADDRESS)) {
    throw new Error("BEP20_USDT_ADDRESS is missing or invalid.");
}

if (!/^0x[a-fA-F0-9]{40}$/.test(BSC_USDT_CONTRACT)) {
    throw new Error("BSC_USDT_CONTRACT is missing or invalid.");
}


async function rpc(method, params = []) {
    const response = await fetch(BSC_RPC, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method,
            params
        })
    });

    if (!response.ok) {
        throw new Error(`BSC RPC HTTP ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
        throw new Error(
            `BSC RPC error: ${data.error.message || "Unknown RPC error"}`
        );
    }

    if (!Object.prototype.hasOwnProperty.call(data, "result")) {
        throw new Error("BSC RPC response is missing result.");
    }

    return data;
}

async function verifyBEP20Transaction(
    txHash,
    requestedAmount
) {

    /*
       Basic input validation.
    */

    if (
        typeof txHash !== "string" ||
        !/^0x[a-fA-F0-9]{64}$/.test(
            txHash.trim()
        )
    ) {

        return {
            valid: false,
            reason:
                "Invalid transaction hash."
        };

    }


    const expectedAmount =
        Number(requestedAmount);


    if (
        !Number.isFinite(expectedAmount) ||
        expectedAmount <= 0
    ) {

        return {
            valid: false,
            reason:
                "Invalid requested amount."
        };

    }


    /*
       Get transaction.
    */

    const txResult =
        await rpc(
            "eth_getTransactionByHash",
            [txHash.trim()]
        );

    const tx =
        txResult.result;


    if (!tx) {

        return {
            valid: false,
            reason:
                "Transaction not found."
        };

    }


    /*
       Must be the official
       BEP20 USDT contract.
    */

    if (
        tx.to?.toLowerCase() !==
        BSC_USDT_CONTRACT
    ) {

        return {
            valid: false,
            reason:
                "Transaction is not a BEP20 USDT transaction."
        };

    }


    /*
       transfer(address,uint256)
       selector = a9059cbb
    */

  if (
    typeof tx.input !== "string" ||
    !/^0xa9059cbb[0-9a-fA-F]{128}$/.test(tx.input)
) {
    return {
        valid: false,
        reason: "Invalid USDT transfer data."
    };
}


    /*
       Decode recipient.
    */

    const recipient =
        "0x" +
        tx.input.slice(
            34,
            74
        );


    /*
       Decode USDT amount.
    */

    const amountHex =
        tx.input.slice(
            74,
            138
        );


    const rawAmount =
        BigInt(
            "0x" +
            amountHex
        );


    const blockchainAmount =
        Number(rawAmount) / 1e18;


    /*
       Receiving wallet must match.
    */

    if (
        recipient.toLowerCase() !==
        BEP20_ADDRESS
    ) {

        return {
            valid: false,
            reason:
                "USDT was not sent to the configured BEP20 wallet.",
            blockchainAmount,
            recipient
        };

    }


    /*
       Amount must match the
       user's deposit request.
    */

    const amountMatches =
        Math.abs(
            blockchainAmount -
            expectedAmount
        ) < 0.000001;


    if (!amountMatches) {

        return {
            valid: false,
            reason:
                "Transaction amount does not match deposit amount.",
            requestedAmount:
                expectedAmount,
            blockchainAmount,
            recipient
        };

    }


    /*
       Get transaction receipt.
    */

    const receiptResult =
        await rpc(
            "eth_getTransactionReceipt",
            [txHash.trim()]
        );

    const receipt =
        receiptResult.result;


    if (!receipt) {

        return {
            valid: false,
            reason:
                "Transaction is not confirmed yet.",
            requestedAmount:
                expectedAmount,
            blockchainAmount
        };

    }


    /*
       status 0x1 = successful
       status 0x0 = failed
    */

    if (
        receipt.status !==
        "0x1"
    ) {

        return {
            valid: false,
            reason:
                "Blockchain transaction failed."
        };

    }
/*
       Verify actual BEP20 Transfer event.
    */

    const TRANSFER_TOPIC =
        "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

    const matchingLog = (receipt.logs || []).find(log =>
        log.address?.toLowerCase() === BSC_USDT_CONTRACT &&
        log.topics?.[0]?.toLowerCase() === TRANSFER_TOPIC &&
        log.topics?.length >= 3 &&
        ("0x" + log.topics[2].slice(-40)).toLowerCase() === BEP20_ADDRESS &&
        typeof log.data === "string" &&
        /^0x[0-9a-fA-F]{64}$/.test(log.data)
    );

    if (!matchingLog) {
        return {
            valid: false,
            reason: "Verified USDT Transfer event not found."
        };
    }

    const eventSender =
        "0x" + matchingLog.topics[1].slice(-40);

    const eventRecipient =
        "0x" + matchingLog.topics[2].slice(-40);

    const eventRawAmount =
        BigInt(matchingLog.data);

    const eventAmount =
        Number(eventRawAmount) / 1e18;

    if (
        eventSender.toLowerCase() !== tx.from.toLowerCase() ||
        eventRecipient.toLowerCase() !== BEP20_ADDRESS ||
        Math.abs(eventAmount - expectedAmount) >= 0.000001 ||
        Math.abs(eventAmount - blockchainAmount) >= 0.000001
    ) {
        return {
            valid: false,
            reason: "USDT Transfer event details do not match."
        };
    }

    /*
       Check confirmations.
    */

    const latestBlockResult =
        await rpc(
            "eth_blockNumber"
        );


    const latestBlock =
        parseInt(
            latestBlockResult.result,
            16
        );


    const transactionBlock =
        parseInt(
            receipt.blockNumber,
            16
        );


    const confirmations =
        latestBlock -
        transactionBlock +
        1;


    if (
        confirmations <
        REQUIRED_CONFIRMATIONS
    ) {

        return {
            valid: false,
            reason:
                "Not enough confirmations.",
            confirmations,
            requiredConfirmations:
                REQUIRED_CONFIRMATIONS
        };

    }


    /*
       Everything matched.
    */

    return {

        valid: true,

        transactionHash:
            tx.hash,

        from:
            tx.from,

        to:
            recipient,

        requestedAmount:
            expectedAmount,

        blockchainAmount,

        token:
            "USDT",

        contract:
            tx.to,

        confirmations,

        recipientMatches:
            true,

        amountMatches:
            true,

        transactionSuccessful:
            true

    };

}


module.exports = {
    verifyBEP20Transaction
};
