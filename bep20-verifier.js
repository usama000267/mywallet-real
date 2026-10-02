require("dotenv").config();

const BSC_RPC =
    "https://bsc-dataseed.binance.org/";

const REQUIRED_CONFIRMATIONS = 3;

const BEP20_ADDRESS =
    process.env.BEP20_USDT_ADDRESS.toLowerCase();

const BSC_USDT_CONTRACT =
    process.env.BSC_USDT_CONTRACT.toLowerCase();


async function rpc(
    method,
    params = []
) {

    const response =
        await fetch(BSC_RPC, {
            method: "POST",
            headers: {
                "Content-Type":
                    "application/json"
            },
            body: JSON.stringify({
                jsonrpc: "2.0",
                id: 1,
                method,
                params
            })
        });

    if (!response.ok) {
        throw new Error(
            `BSC RPC HTTP ${response.status}`
        );
    }

    return response.json();
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
        !tx.input ||
        !tx.input.startsWith(
            "0xa9059cbb"
        )
    ) {

        return {
            valid: false,
            reason:
                "Transaction is not a USDT transfer."
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