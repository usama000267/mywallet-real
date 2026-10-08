

/* =========================================================
   GLOBAL STATE
========================================================= */
let currentUser = null;
let appConfig = null;

let selectedDepositNetwork = "BEP20";
let selectedWithdrawNetwork = "BEP20";
let selectedBuyNFT = null;
let selectedSellNFT = null;


/* =========================================================
   HELPERS
========================================================= */

function escapeHtml(value){

    if(value === null || value === undefined){
        return "";
    }

    return String(value)
        .replace(/&/g,"&amp;")
        .replace(/</g,"&lt;")
        .replace(/>/g,"&gt;")
        .replace(/"/g,"&quot;")
        .replace(/'/g,"&#039;");
}


function money(value){

    const n = Number(value || 0);
    const sign = n < 0 ? "-$" : "$";

    return sign + Math.abs(n).toLocaleString("en-US",{
        minimumFractionDigits:2,
        maximumFractionDigits:2
    });
}

function formatDate(value){

    if(!value){
        return "-";
    }

    const date = new Date(value);

    if(Number.isNaN(date.getTime())){
        return "-";
    }

    return date.toLocaleString();
}


function getInitial(name){

    if(!name){
        return "U";
    }

    return String(name).trim().charAt(0).toUpperCase();
}


function showToast(message,type=""){

    const toast = document.getElementById("toast");

    toast.textContent = message;

    toast.className = "toast show " + type;

    clearTimeout(window.toastTimer);

    window.toastTimer = setTimeout(()=>{
        toast.className = "toast";
    },3500);
}


async function api(url,options={}){

    try{

        const finalOptions = {
            ...options,
            headers:{
                ...(options.body ? {"Content-Type":"application/json"} : {}),
                ...(options.headers || {})
            }
        };

        const response = await fetch(url,finalOptions);

        const text = await response.text();

        let data = {};

        try{
            data = text ? JSON.parse(text) : {};
        }catch{
            throw new Error("Server returned an invalid response.");
        }

        if(!response.ok){

            throw new Error(
                data.message ||
                data.error ||
                "Request failed."
            );
        }

        return data;

    }catch(error){

        console.error("API ERROR:",url,error);

        throw error;
    }
}


/* =========================================================
   AUTH UI
========================================================= */
function showRegister(){

    const loginBox = document.getElementById("loginFormBox");
    const registerBox = document.getElementById("registerFormBox");

    if(loginBox){
        loginBox.classList.add("hidden");
    }

    if(registerBox){
        registerBox.classList.remove("hidden");
    }

    clearMessage("loginMessage");
}

function showLogin(){

    const loginBox = document.getElementById("loginFormBox");
    const registerBox = document.getElementById("registerFormBox");

    if(loginBox){
        loginBox.classList.remove("hidden");
    }

    if(registerBox){
        registerBox.classList.add("hidden");
    }

    clearMessage("registerMessage");
}
function showMessage(id,message,type="error"){

    const el = document.getElementById(id);

    if(!el){
        return;
    }

    el.textContent = message;

    el.className = "auth-message " + type;
}


function clearMessage(id){

    const el = document.getElementById(id);

    if(!el){
        return;
    }

    el.textContent = "";
    el.className = "auth-message";
}
window.addEventListener("DOMContentLoaded", function(){

    const params = new URLSearchParams(
        window.location.search
    );

    const referralCode =
        params.get("ref");

    if(
        params.get("register") === "1" ||
        referralCode
    ){

        showRegister();

        if(referralCode){

            const referralInput =
                document.getElementById(
                    "registerReferral"
                );

            if(referralInput){

                referralInput.value =
                    referralCode
                        .trim()
                        .toUpperCase();

                referralInput.readOnly = true;

                referralInput.style.background =
                    "#f5f3ff";

                referralInput.style.cursor =
                    "not-allowed";
            }
        }
    }

});
/* =========================================================
   REGISTER
========================================================= */

document.getElementById("registerForm").addEventListener("submit",async function(e){

    e.preventDefault();

    clearMessage("registerMessage");


    const name =
        document.getElementById("registerName").value.trim();

    const username =
        document.getElementById("registerUsername").value.trim();

    const email =
        document.getElementById("registerEmail").value.trim();

    const mobile =
        document.getElementById("registerMobile").value.trim();

    const password =
        document.getElementById("registerPassword").value;

    const confirmPassword =
        document.getElementById("registerConfirmPassword").value;

    const referral =
        document.getElementById("registerReferral").value.trim();

    const otp =
        document.getElementById("registerOTP").value.trim();


    /* ==========================================
       PASSWORD CHECK
    ========================================== */

    if(password !== confirmPassword){

        showMessage(
            "registerMessage",
            "Passwords do not match.",
            "error"
        );

        return;
    }


    if(password.length < 6){

        showMessage(
            "registerMessage",
            "Password must contain at least 6 characters.",
            "error"
        );

        return;
    }


    /* ==========================================
       OTP CHECK
    ========================================== */

    if(!otp){

        showMessage(
            "registerMessage",
            "Please enter the 6-digit email verification code.",
            "error"
        );

        document
            .getElementById("registerOTP")
            .focus();

        return;
    }


    if(!/^\d{6}$/.test(otp)){

        showMessage(
            "registerMessage",
            "OTP must be exactly 6 digits.",
            "error"
        );

        document
            .getElementById("registerOTP")
            .focus();

        return;
    }


    const button =
        this.querySelector("button[type=submit]");

    const oldText =
        button.textContent;


    button.disabled = true;

    button.textContent =
        "Creating Account...";


    try{

        const data =
            await api(
                "/api/register",
                {
                    method:"POST",

                    body:JSON.stringify({

                        name,

                        fullName:name,

                        username,

                        email,

                        mobile,

                        password,

                        referralCode:referral,

                        referral_code:referral,

                        otp

                    })
                }
            );


        if(data.success === false){

            throw new Error(
                data.message ||
                "Registration failed."
            );
        }


        showMessage(
            "registerMessage",
            data.message ||
            "Account created successfully. Please login.",
            "success"
        );


        setTimeout(()=>{

            showLogin();

            document
                .getElementById("loginEmail")
                .value = email;

        },900);


    }catch(error){

        showMessage(
            "registerMessage",
            error.message,
            "error"
        );

    }finally{

        button.disabled = false;

        button.textContent =
            oldText;

    }

});

/* =========================================================
   LOGIN
========================================================= */

document.getElementById("loginForm").addEventListener("submit",async function(e){

    e.preventDefault();

    clearMessage("loginMessage");

    const email =
        document.getElementById("loginEmail").value.trim();

    const password =
        document.getElementById("loginPassword").value;


    const button =
        this.querySelector("button[type=submit]");

    const oldText = button.textContent;

    button.disabled = true;
    button.textContent = "Signing in...";


    try{

        const data = await api("/api/login",{

            method:"POST",

            body:JSON.stringify({
                email,
                password
            })

        });


        if(data.success === false){

            throw new Error(
                data.message || "Login failed."
            );
        }


        await startApplication();

    }catch(error){

        showMessage(
            "loginMessage",
            error.message,
            "error"
        );

    }finally{

        button.disabled = false;
        button.textContent = oldText;

    }

});


/* =========================================================
   START APP
========================================================= */

async function startApplication(){

    try{

        const meData = await api("/api/me");

        currentUser =
            meData.user ||
            meData.data ||
            meData;


        document.getElementById("authPage").style.display = "none";

        document.getElementById("dashboardApp").classList.add("active");
document.getElementById("mobileNav").classList.add("app-visible");

        updateUserUI();


        await loadConfig();

        await loadDashboard();

        await loadNFTs();

        await loadMyNFTs();

        await loadHistory();

        await loadReferral();

        showToast("Welcome to Meta NFT","success");


    }catch(error){

        console.error(error);

        document.getElementById("authPage").style.display = "flex";

        document.getElementById("dashboardApp").classList.remove("active");

        showToast(error.message,"error");

    }

}


/* =========================================================
   USER UI
========================================================= */

function updateUserUI(){

    if(!currentUser){
        return;
    }


    const name =
        currentUser.name ||
        currentUser.full_name ||
        currentUser.username ||
        "User";


    document.getElementById("welcomeName").textContent = name;

    document.getElementById("topUserName").textContent = name;

    document.getElementById("topAvatar").textContent =
        getInitial(name);

    document.getElementById("profileAvatar").textContent =
        getInitial(name);

    document.getElementById("profileName").textContent =
        name;

    document.getElementById("profileEmail").textContent =
        currentUser.email || "-";

    document.getElementById("profileReferral").textContent =
        currentUser.referral_code ||
        currentUser.referralCode ||
        "-";

    document.getElementById("profileBalance").textContent =
        money(currentUser.balance);

}


/* =========================================================
   CONFIG
========================================================= */

async function loadConfig(){

    try{

        const data = await api("/api/config");

        appConfig =
            data.config ||
            data;

        updateDepositAddress();

    }catch(error){

        console.error("CONFIG ERROR:",error);

        document.getElementById("depositAddress").value =
            "Address unavailable";

    }

}


function getNetworkAddress(network){

    if(!appConfig){
        return "";
    }


    if(network === "BEP20"){

        return (
            appConfig.networks?.bep20?.address ||
            appConfig.usdtBep20Address ||
            appConfig.usdt_bep20_address ||
            appConfig.bep20Address ||
            appConfig.bep20_address ||
            appConfig.USDT_BEP20 ||
            ""
        );

    }


    if(network === "TRC20"){

        return (
            appConfig.networks?.trc20?.address ||
            appConfig.usdtTrc20Address ||
            appConfig.usdt_trc20_address ||
            appConfig.trc20Address ||
            appConfig.trc20_address ||
            appConfig.USDT_TRC20 ||
            ""
        );

    }


    return "";
}


function updateDepositAddress(){

    const address =
        getNetworkAddress(selectedDepositNetwork);

    document.getElementById("depositAddress").value =
        address || "Address not configured";
}


/* =========================================================
   NAVIGATION
========================================================= */

const pageTitles = {

    dashboard:"Dashboard",
    marketplace:"Marketplace",
    "my-nfts":"My NFTs",
    sell:"Sell NFT",
    deposit:"Deposit",
    withdraw:"Withdraw",
    history:"History",
    referral:"Referral",
     "promotional-reward":"Promotional Reward",

};


function openPage(page){
    document.querySelectorAll(".page").forEach(el=>{
        el.classList.remove("active");
    });


    const target =
        document.getElementById("page-" + page);

    if(target){
        target.classList.add("active");
    }


    document.querySelectorAll(".nav-item[data-page]").forEach(el=>{

        el.classList.toggle(
            "active",
            el.dataset.page === page
        );

    });


    document.querySelectorAll(".mobile-nav button[data-page]").forEach(el=>{

        el.classList.toggle(
            "active",
            el.dataset.page === page
        );

    });


    document.getElementById("pageTitle").textContent =
        pageTitles[page] || "Meta NFT";


    if(page === "marketplace"){
        loadNFTs();
    }

    if(page === "my-nfts"){
        loadMyNFTs();
    }

    if(page === "sell"){
        loadSellNFTs();
        loadSellHistoryRecords();
    }
        loadHistory();

    if(page === "promotional-reward"){loadPromotionalRewards();}

    if(page === "referral"){
        loadReferral();
    }

}


document.querySelectorAll(".nav-item[data-page]").forEach(button=>{

    button.addEventListener("click",()=>{

        openPage(button.dataset.page);

    });

});


document.querySelectorAll(".mobile-nav button[data-page]").forEach(button=>{

    button.addEventListener("click",()=>{

        openPage(button.dataset.page);

    });

});


/* =========================================================
   DASHBOARD
========================================================= */

async function loadPromotionalRewards(){
    const container=document.getElementById("promotionalRewardsList");
    if(!container)return;
    container.innerHTML='<div class="promo-loading">Loading rewards...</div>';
    try{
        const data=await api("/api/promotional-rewards");
        if(!data||!data.success)throw new Error(data?.message||"Unable to load rewards.");
        const validMembers=Number(data.validMembers||0);
        const balanceEl=document.getElementById("promoBalance");
        const membersEl=document.getElementById("promoValidMembers");
        const nextRewardEl=document.getElementById("promoNextReward");
        if(balanceEl)balanceEl.textContent=money(Number(currentUser?.balance||0));
        if(membersEl)membersEl.textContent=validMembers;
        const next=data.rewards?.find(r=>!r.claimed&&validMembers<Number(r.members));
        if(nextRewardEl)nextRewardEl.textContent=next?"$"+Number(next.amount).toFixed(2):"All Unlocked";
        let html="";
        (data.rewards||[]).forEach(reward=>{
            const members=Number(reward.members||0);
            const amount=Number(reward.amount||0);
            const progress=members?Math.min(100,validMembers/members*100):0;
            let status="";
            let button="";
            if(reward.claimed){
                status="? Claimed";
                button='<button class="promo-claim-btn claimed" type="button" disabled>? Claimed</button>';
            }else if(reward.unlocked){
                status="Unlocked";
                button='<button class="promo-claim-btn unlocked" type="button" onclick="claimPromotionalReward('+members+')">Claim $'+amount.toFixed(2)+'</button>';
            }else{
                const remaining=Math.max(0,members-validMembers);
                status=remaining+" more valid member"+(remaining===1?"":"s");
                button='<button class="promo-claim-btn locked" type="button" disabled>Locked</button>';
            }
            html+='<div class="promo-reward-row"><div class="promo-members">'+members+'<span>Valid Members</span></div><div class="promo-progress-wrap"><div class="promo-progress-text"><span>'+status+'</span><strong>'+validMembers+'/'+members+'</strong></div><div class="promo-fuel"><div class="promo-fuel-fill" style="width:'+progress+'%"></div></div></div><div class="promo-reward-amount">$'+amount.toFixed(2)+'</div><div>'+button+'</div></div>';
        });
        container.innerHTML=html||'<div class="promo-loading">No reward levels available.</div>';
    }catch(error){
        console.error("PROMOTIONAL REWARDS LOAD ERROR:",error);
        container.innerHTML='<div class="promo-loading">Unable to load promotional rewards.</div>';
    }
}


async function claimPromotionalReward(members){
    try{
        const response=await api("/api/promotional-rewards/"+encodeURIComponent(members)+"/claim",{method:"POST"});
        if(!response||!response.success){
            throw new Error(response?.message||"Unable to claim reward.");
        }
        showToast(response.message||"Promotional reward claimed successfully.","success");
        await loadPromotionalRewards();
        if(typeof loadDashboard==="function")await loadDashboard();
    }catch(error){
        console.error("PROMOTIONAL REWARD CLAIM ERROR:",error);
        showToast(error.message||"Unable to claim promotional reward.","error");
    }
}


async function loadDashboard(){

    try{

        const data = await api("/api/dashboard");

        const dashboard =
    data.stats ||
    data.dashboard ||
    data.data ||
    data;

        const balance =
            dashboard.balance ??
            dashboard.walletBalance ??
            currentUser?.balance ??
            0;


        document.getElementById("dashboardBalance").textContent =
            money(balance);

        document.getElementById("totalEarnings").textContent =
            money(
             dashboard.totalEarnings ??
dashboard.earnings ??
0
);

document.getElementById("todayEarnings").textContent =
    money(
        dashboard.todayEarnings ??
        0
    );
    document.getElementById("todayTeamEarnings").textContent =
    money(
        dashboard.todayTeamEarnings ??
        0
    );
document.getElementById("referralEarnings").textContent =
    money(
        dashboard.referralEarnings ??
        0
    );


document.getElementById("ownedNFTs").textContent =
    dashboard.ownedNFTs ??
    dashboard.ownedNfts ??
    0;
   document.getElementById("teamCount").textContent =
    dashboard.teamCount ??
    0;



        if(currentUser){

            currentUser.balance =
                balance;

            updateUserUI();

        }


    }catch(error){

        console.error("Dashboard:",error);

    }

}


/* =========================================================
   LOAD NFTS
========================================================= */

async function loadNFTs(){

    const containers = [

        document.getElementById("marketplaceGrid"),
        document.getElementById("dashboardNFTs")

    ];


    containers.forEach(container=>{

        if(container){

            container.innerHTML = `
                <div class="empty" style="grid-column:1/-1;">
                    Loading NFTs...
                </div>
            `;

        }

    });


    try{

        const data = await api("/api/nfts");

        let nfts =
            data.nfts ||
            data.data ||
            data;
nfts = Array.isArray(nfts)
    ? nfts.sort((a, b) => Number(a.price || 0) - Number(b.price || 0))
    : nfts;

        if(!Array.isArray(nfts)){
            nfts = [];
        }


        renderNFTs(
            document.getElementById("marketplaceGrid"),
            nfts
        );


        renderNFTs(
            document.getElementById("dashboardNFTs"),
            nfts.slice(0,3)
        );


    }catch(error){

        containers.forEach(container=>{

            if(container){

                container.innerHTML = `
                    <div class="empty" style="grid-column:1/-1;">
                        <div class="empty-icon">•</div>
                        Unable to load NFTs.
                    </div>
                `;

            }

        });

        showToast(error.message,"error");

    }

}


function renderNFTs(container,nfts){

    if(!container){
        return;
    }


    if(!nfts.length){

        container.innerHTML = `
            <div class="empty" style="grid-column:1/-1;">
                <div class="empty-icon">•</div>
                <strong>No NFTs available</strong>
                <p style="margin-top:7px;">
                    New NFTs will appear here when available.
                </p>
            </div>
        `;

        return;
    }


    container.innerHTML = nfts.map(nft=>{

        const image =
            nft.image_url ||
            nft.imageUrl ||
            "";


        const name =
            nft.name ||
            "Untitled NFT";


        const description =
            nft.description ||
            "Exclusive digital NFT";


        const price =
            Number(nft.price || 0);


        const profitPercent =
            Number(nft.profit_percent || nft.profitPercent || 0);


        return `

            <div class="nft-card">

                <div class="nft-image">

                    ${
                        image
                        ?
                        `<img
                            src="${escapeHtml(image)}"
                            alt="${escapeHtml(name)}"
                            onerror="this.style.display='none';this.parentElement.innerHTML='<div class=\\'nft-placeholder\\'>?</div>';"
                        >`
                        :
                        `<div class="nft-placeholder">NFT</div>`
                    }

                </div>

                <div class="nft-body">

                    <div class="nft-name">
                        ${escapeHtml(name)}
                    </div>

                    <div class="nft-description">
                        ${escapeHtml(description)}
                    </div>

                    <div class="nft-meta">

                        <div class="nft-price">
                            ${money(price)}
                        </div>

                        ${
                            profitPercent > 0
                            ?
                            `<div class="nft-profit">
                                ${profitPercent}% display
                            </div>`
                            :
                            `<div class="nft-profit">
                                NFT
                            </div>`
                        }

                    </div>

                    <button
                        class="btn btn-primary"
                        onclick="openBuyModal(${Number(nft.id)})"
                    >
                        Buy NFT
                    </button>

                </div>

            </div>

        `;

    }).join("");

}


/* =========================================================
   BUY NFT
========================================================= */

async function openBuyModal(nftId){

    try{

        const data = await api("/api/nfts");

        let nfts =
            data.nfts ||
            data.data ||
            data;


        if(!Array.isArray(nfts)){
            nfts = [];
        }


        selectedBuyNFT =
            nfts.find(nft=>Number(nft.id) === Number(nftId));


        if(!selectedBuyNFT){

            showToast("NFT not found.","error");

            return;
        }


        const price =
            Number(selectedBuyNFT.price || 0);


        document.getElementById("buyNFTDetails").innerHTML = `

            <div style="display:flex;gap:15px;align-items:center;">

                <div style="
                    width:90px;
                    height:90px;
                    border-radius:14px;
                    overflow:hidden;
                    background:#eeeaff;
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    flex-shrink:0;
                ">

                    ${
                        selectedBuyNFT.image_url
                        ?
                        `<img
                            src="${escapeHtml(selectedBuyNFT.image_url)}"
                            style="width:100%;height:100%;object-fit:cover;"
                        >`
                        :
                        `<span style="font-size:35px;">NFT</span>`
                    }

                </div>

                <div>

                    <div style="font-size:18px;font-weight:850;">
                        ${escapeHtml(selectedBuyNFT.name)}
                    </div>

                    <div style="color:#777;font-size:13px;margin-top:5px;">
                        ${escapeHtml(selectedBuyNFT.description || "NFT")}
                    </div>

                    <div style="font-size:20px;font-weight:850;margin-top:9px;">
                        ${money(price)}
                    </div>

                </div>

            </div>

        `;


        document.getElementById("buyModal").classList.add("show");


        document.getElementById("confirmBuyBtn").onclick =
            confirmBuyNFT;


    }catch(error){

        showToast(error.message,"error");

    }

}


function closeBuyModal(){

    document.getElementById("buyModal").classList.remove("show");

    selectedBuyNFT = null;

}


async function confirmBuyNFT(){

    if(!selectedBuyNFT){
        return;
    }


    const button =
        document.getElementById("confirmBuyBtn");

    button.disabled = true;
    button.textContent = "Processing...";


    try{

        const data = await api("/api/reservations",{

            method:"POST",

            body:JSON.stringify({

                nftId:Number(selectedBuyNFT.id)

            })

        });


        if(data.success === false){

            throw new Error(
                data.message || "NFT purchase failed."
            );

        }


        closeBuyModal();

        showToast(
            "NFT purchased successfully.",
            "success"
        );


        await loadDashboard();

        await loadMyNFTs();

        await loadSellNFTs();

        await loadNFTs();

        openPage("my-nfts");


    }catch(error){

    const message =
        error.message ||
        "NFT purchase failed.";

    closeBuyModal();

    alert(message);

}finally{

        button.disabled = false;
        button.textContent = "Confirm Purchase";

    }

}


/* =========================================================
   MY NFTS
========================================================= */

async function loadMyNFTs(){

    const container =
        document.getElementById("myNFTsContainer");


    container.innerHTML = `
        <div class="empty" style="grid-column:1/-1;">
            Loading your NFTs...
        </div>
    `;


    try{

        const data = await api("/api/my-nfts");

        let nfts =
            data.nfts ||
            data.userNFTs ||
            data.data ||
            data;


        if(!Array.isArray(nfts)){
            nfts = [];
        }


        renderMyNFTs(container,nfts);


    }catch(error){

        container.innerHTML = `
            <div class="empty" style="grid-column:1/-1;">
                Unable to load your NFTs.
            </div>
        `;

        showToast(error.message,"error");

    }

}


function renderMyNFTs(container,nfts){

    if(!nfts.length){

        container.innerHTML = `
            <div class="card empty" style="grid-column:1/-1;">
                <div class="empty-icon">•</div>
                <strong>You don't own any NFTs yet.</strong>
                <p style="margin-top:7px;">
                    Visit the marketplace to purchase your first NFT.
                </p>

                <button
                    class="btn btn-primary"
                    style="margin-top:17px;"
                    onclick="openPage('marketplace')"
                >
                    Explore Marketplace
                </button>

            </div>
        `;

        return;
    }


    container.innerHTML = nfts.map(nft=>{

        const image =
            nft.image_url ||
            nft.imageUrl ||
            "";


        const name =
            nft.name ||
            "NFT";


        const purchasePrice =
            Number(nft.purchase_price || 0);


        const salePrice =
            nft.sale_price !== null &&
            nft.sale_price !== undefined
            ?
            Number(nft.sale_price)
            :
            null;


        const profit =
            nft.profit_amount !== null &&
            nft.profit_amount !== undefined
            ?
            Number(nft.profit_amount)
            :
            null;


        const status =
            nft.status ||
            "owned";


        return `

            <div class="card my-nft-card">

                <div class="my-nft-row">

                    <div class="my-nft-thumb">

                        ${
                            image
                            ?
                            `<img
                                src="${escapeHtml(image)}"
                                alt="${escapeHtml(name)}"
                            >`
                            :
                            `<div style="
                                width:100%;
                                height:100%;
                                display:flex;
                                align-items:center;
                                justify-content:center;
                                font-size:40px;
                            ">?</div>`
                        }

                    </div>


                    <div class="my-nft-info">

                        <div style="
                            display:flex;
                            justify-content:space-between;
                            gap:10px;
                            align-items:flex-start;
                        ">

                            <div class="nft-name">
                                ${escapeHtml(name)}
                            </div>

                            <span class="badge ${
                                status === "owned"
                                ? "badge-green"
                                : "badge-yellow"
                            }">
                                ${escapeHtml(status)}
                            </span>

                        </div>


                        <div class="data-row">
                            <span>Purchase Price</span>
                            <strong>${money(purchasePrice)}</strong>
                        </div>


                        <div class="data-row">
                            <span>Purchase Date</span>
                            <strong>${formatDate(nft.purchase_date)}</strong>
                        </div>


                        ${
                            salePrice !== null
                            ?
                            `
                            <div class="data-row">
                                <span>Sale Price</span>
                                <strong>${money(salePrice)}</strong>
                            </div>
                            `
                            :
                            ""
                        }


                        ${
                            profit !== null
                            ?
                            `
                            <div class="data-row">
                                <span>Realized Profit</span>
                                <strong style="color:${profit >= 0 ? "var(--green)" : "var(--red)"}">
                                    ${money(profit)}
                                </strong>
                            </div>
                            `
                            :
                            ""
                        }


                        ${
                            status === "owned"
                            ?
                            `<button
    class="btn btn-primary"
    style="margin-top:7px;"
    onclick="openSellModal(
        ${Number(nft.id)},
        '${escapeHtml(name).replace(/'/g,"&#039;")}',
        ${purchasePrice},
        '${escapeHtml(image).replace(/'/g,"&#039;")}',
        ${Number(nft.expected_profit_percent || nft.profit_percent || 0)}
    )"
>
    Sell NFT
                           
                            </button>
                            `
                            :
                            ""
                        }

                    </div>

                </div>

            </div>

        `;

    }).join("");

}


/* =========================================================
   SELL NFT
========================================================= */

async function loadSellHistoryRecords(){

    const container =
        document.getElementById("sellHistoryRecords");

    if(!container){
        return;
    }

    try{

        const data =
            await api("/api/history");

        let sales =
            Array.isArray(data.nftSales)
            ? data.nftSales
            : [];

        if(!sales.length){

            container.innerHTML = `
                <div class="sell-history-empty">
                    No NFT sales yet.
                </div>
            `;

            return;
        }

        container.innerHTML =
            sales.map(item => {

                const purchase =
                    Number(
                        item.purchase_price ||
                        item.amount ||
                        0
                    );

                const sale =
                    Number(
                        item.sale_price ||
                        item.amount ||
                        0
                    );

                const profit =
                    Number(
                        item.profit_amount ||
                        0
                    );

                const date =
                    item.created_at
                    ?
                    new Date(
                        item.created_at
                    ).toLocaleString(
                        undefined,
                        {
                            year:"numeric",
                            month:"short",
                            day:"numeric",
                            hour:"2-digit",
                            minute:"2-digit"
                        }
                    )
                    :
                    "-";

                const nftName =
                    item.nft_name ||
                    item.name ||
                    "NFT";

                return `

                    <div class="sell-history-record">

                        <div class="sell-history-main">

                            <div class="sell-history-nft">
                                ${escapeHtml(nftName)}
                            </div>

                            <div class="sell-history-date">
                                ${escapeHtml(date)}
                            </div>

                            <div class="sell-history-values">

                                <span class="sell-value">
                                    Bought $${purchase.toFixed(2)}
                                </span>

                                <span class="sell-value sale">
                                    Sold $${sale.toFixed(2)}
                                </span>

                                <span class="sell-value profit">
                                    Profit +$${profit.toFixed(2)}
                                </span>

                            </div>

                        </div>

                        <div class="sell-history-profit">

                            <span class="sell-history-profit-label">
                                Profit
                            </span>

                            <span class="sell-history-profit-amount">
                                +$${profit.toFixed(2)}
                            </span>

                        </div>

                    </div>

                `;

            }).join("");

    }catch(error){

        console.error(
            "SELL HISTORY ERROR:",
            error
        );

        container.innerHTML = `
            <div class="sell-history-empty">
                Unable to load sales records.
            </div>
        `;
    }
}

async function loadSellNFTs(){

    const container =
        document.getElementById("sellNFTContainer");


    container.innerHTML = `
        <div class="empty" style="grid-column:1/-1;">
            Loading...
        </div>
    `;


    try{

        const data = await api("/api/my-nfts");

        let nfts =
            data.nfts ||
            data.userNFTs ||
            data.data ||
            data;


        if(!Array.isArray(nfts)){
            nfts = [];
        }


        nfts =
            nfts.filter(nft =>
                String(nft.status || "").toLowerCase() === "owned"
            );


        if(!nfts.length){

            container.innerHTML = `
                <div class="card empty" style="grid-column:1/-1;">
                    <div class="empty-icon">•</div>
                    <strong>No NFTs available for sale.</strong>
                    <p style="margin-top:7px;">
                        Purchase an NFT first.
                    </p>
                </div>
            `;

            return;
        }


        container.innerHTML = nfts.map(nft=>{

            const image =
                nft.image_url ||
                nft.imageUrl ||
                "";


            const price =
                Number(nft.purchase_price || 0);


            return `

                <div class="card my-nft-card">

                    <div class="my-nft-row">

                        <div class="my-nft-thumb">

                            ${
                                image
                                ?
                                `<img
                                    src="${escapeHtml(image)}"
                                    alt="${escapeHtml(nft.name || "NFT")}"
                                >`
                                :
                                `<div style="
                                    width:100%;
                                    height:100%;
                                    display:flex;
                                    align-items:center;
                                    justify-content:center;
                                    font-size:40px;
                                ">?</div>`
                            }

                        </div>


                        <div class="my-nft-info">

                            <div class="nft-name">
                                ${escapeHtml(nft.name || "NFT")}
                            </div>

                            <div class="data-row">
                                <span>Purchase Price</span>
                                <strong>${money(price)}</strong>
                            </div>

                            <div class="data-row">
                                <span>Purchased</span>
                                <strong>${formatDate(nft.purchase_date)}</strong>
                            </div>

                            <button
                                class="btn btn-primary"
                                onclick="openSellModal(
                                    ${Number(nft.id)},
                                    '${escapeHtml(nft.name || "NFT").replace(/'/g,"&#039;")}',
                                    ${price},
                                    '${escapeHtml(image).replace(/'/g,"&#039;")}'
                                )"
                            >
                                Sell NFT
                            </button>

                        </div>

                    </div>

                </div>

            `;

        }).join("");


    }catch(error){

        container.innerHTML = `
            <div class="empty" style="grid-column:1/-1;">
                Unable to load NFTs.
            </div>
        `;

        showToast(error.message,"error");

    }

}


function openSellModal(id,name,purchasePrice,image,profitPercent){

    selectedSellNFT = {
        id,
        name,
        purchasePrice,
        image,
        profitPercent
    };

    document.getElementById("sellNFTDetails").innerHTML = `

        <div style="display:flex;gap:15px;align-items:center;">

            <div style="
                width:80px;
                height:80px;
                border-radius:13px;
                overflow:hidden;
                background:#eeeaff;
                display:flex;
                align-items:center;
                justify-content:center;
                flex-shrink:0;
            ">

                ${
                    image
                    ?
                    `<img
                        src="${escapeHtml(image)}"
                        style="width:100%;height:100%;object-fit:cover;"
                    >`
                    :
                    `<span style="font-size:32px;">NFT</span>`
                }

            </div>

            <div>

                <div style="font-size:17px;font-weight:850;">
                    ${escapeHtml(name)}
                </div>

                <div style="font-size:13px;color:#777;margin-top:5px;">
                    Purchase price: ${money(purchasePrice)}
                </div>

            </div>

        </div>

    `;

    updateSellCalculation();

    document.getElementById("sellModal").classList.add("show");

    document.getElementById("confirmSellBtn").onclick =
        confirmSellNFT;
}


function closeSellModal(){

    document.getElementById("sellModal").classList.remove("show");

    selectedSellNFT = null;

}


function updateSellCalculation(){

    if(!selectedSellNFT){
        return;
    }

    const purchasePrice =
        Number(selectedSellNFT.purchasePrice || 0);

    const profitPercent =
        Number(selectedSellNFT.profitPercent || 0);

    const profit =
        purchasePrice * profitPercent / 100;

    const salePrice =
        purchasePrice + profit;

    document.getElementById("sellCalculation").innerHTML = `

        Purchase Price:
        <strong>${money(purchasePrice)}</strong>
        <br>

        Admin Profit:
        <strong>${profitPercent}%</strong>
        <br>

        Profit Amount:
        <strong style="color:var(--green)">
            ${money(profit)}
        </strong>
        <br>

        Automatic Sale Price:
        <strong style="color:var(--green)">
            ${money(salePrice)}
        </strong>

    `;

}


async function confirmSellNFT(){

    if(!selectedSellNFT){
        return;
    }

    const button =
        document.getElementById("confirmSellBtn");

    button.disabled = true;
    button.textContent = "Selling...";

    try{

        const data = await api(
            "/api/my-nfts/" +
            Number(selectedSellNFT.id) +
            "/sell",
            {
                method:"POST",
                body:JSON.stringify({})
            }
        );

        if(data.success === false){

            throw new Error(
                data.message || "NFT sale failed."
            );

        }

        closeSellModal();

        showToast(
            "NFT sold successfully.",
            "success"
        );

        await loadDashboard();
        await loadMyNFTs();
        await loadSellNFTs();
        await loadHistory();

        openPage("my-nfts");

    }catch(error){

        showToast(error.message,"error");

    }finally{

        button.disabled = false;
        button.textContent = "Sell NFT";

    }

}

/* =========================================================
   DEPOSIT
========================================================= */

function selectDepositNetwork(network){

    selectedDepositNetwork = network;


    document
        .getElementById("depositBep20")
        .classList.toggle(
            "selected",
            network === "BEP20"
        );


    document
        .getElementById("depositTrc20")
        .classList.toggle(
            "selected",
            network === "TRC20"
        );


    updateDepositAddress();

}


async function copyDepositAddress(){

    const input =
        document.getElementById("depositAddress");


    const value = input.value;


    if(!value || value === "Loading..." || value === "Address not configured"){

        showToast(
            "Deposit address is not available.",
            "error"
        );

        return;
    }


    try{

        await navigator.clipboard.writeText(value);

        showToast(
            "? Copy Successful! Deposit address copied to clipboard.",
            "success"
        );

    }catch{

        input.select();

        document.execCommand("copy");

        showToast(
            "? Copy Successful! Deposit address copied to clipboard.",
            "success"
        );

    }

}


document.getElementById("depositForm").addEventListener(
    "submit",
    async function(e){

        e.preventDefault();


        const amount =
            Number(
                document.getElementById("depositAmount").value
            );


        const txHash =
            document.getElementById("depositTxHash").value.trim();


        if(!amount || amount <= 0){

            showToast(
                "Enter a valid deposit amount.",
                "error"
            );

            return;
        }


        if(!txHash){

            showToast(
                "Enter the transaction hash.",
                "error"
            );

            return;
        }


        const button =
            this.querySelector("button[type=submit]");


        const oldText = button.textContent;

        button.disabled = true;
        button.textContent = "Submitting...";


        try{

            const data = await api("/api/deposits",{

                method:"POST",

                body:JSON.stringify({

                    amount,
                    network:selectedDepositNetwork,
                    txHash

                })

            });


            if(data.success === false){

                throw new Error(
                    data.message || "Deposit request failed."
                );

            }


            showToast(
                data.message ||
                "Deposit request submitted successfully.",
                "success"
            );


            document.getElementById("depositAmount").value = "";

            document.getElementById("depositTxHash").value = "";


            await loadHistory();


        }catch(error){

            showToast(
                error.message,
                "error"
            );

        }finally{

            button.disabled = false;
            button.textContent = oldText;

        }

    }
);


/* =========================================================
   WITHDRAW
========================================================= */

function selectWithdrawNetwork(network){

    selectedWithdrawNetwork = network;


    document
        .getElementById("withdrawBep20")
        .classList.toggle(
            "selected",
            network === "BEP20"
        );


    document
        .getElementById("withdrawTrc20")
        .classList.toggle(
            "selected",
            network === "TRC20"
        );

}
function startWithdrawOtpCountdown(){

    const button =
        document.getElementById("sendWithdrawOtpBtn");

    if(!button){
        return;
    }

    let seconds = 60;

    button.disabled = true;
    button.textContent = "Resend • 60s";

    clearInterval(
        window.withdrawOtpTimer
    );

    window.withdrawOtpTimer =
        setInterval(function(){

            seconds--;

            if(seconds > 0){

                button.textContent =
                    `Resend • ${seconds}s`;

            }else{

                clearInterval(
                    window.withdrawOtpTimer
                );

                window.withdrawOtpTimer = null;

                button.disabled = false;
                button.textContent = "Resend OTP";

            }

        },1000);

}
async function sendWithdrawOTP(){

    const button =
        document.getElementById("sendWithdrawOtpBtn");

    const message =
        document.getElementById("withdrawOtpMessage");

    if(!button){
        return;
    }

    const oldText =
        button.textContent;

    button.disabled = true;
    button.textContent = "Sending...";

    if(message){
        message.textContent = "";
    }

    try{

        const data =
            await api(
                "/api/withdrawals/send-otp",
                {
                    method:"POST"
                }
            );

        if(data.success === false){

            throw new Error(
                data.message ||
                "Unable to send OTP."
            );

        }

        if(message){

            message.textContent =
                data.message ||
                "OTP sent to your email.";

            message.style.color =
                "#16a34a";

        }

        showToast(
            data.message ||
            "Withdrawal OTP sent.",
            "success"
        );

startWithdrawOtpCountdown();
        


    }catch(error){

        if(message){

            message.textContent =
                error.message ||
                "Unable to send OTP.";

            message.style.color =
                "#dc2626";

        }

        showToast(
            error.message ||
            "Unable to send OTP.",
            "error"
        );


        button.disabled = false;
        button.textContent = oldText;

    }

}

document.getElementById("withdrawForm").addEventListener(
    "submit",
    async function(e){

        e.preventDefault();
e.stopImmediatePropagation();
        const amount =
            Number(
                document.getElementById("withdrawAmount").value
            );

        const walletAddress =
            document
                .getElementById("withdrawWalletAddress")
                .value
                .trim();

        const otp =
            document
                .getElementById("withdrawOtp")
                .value
                .trim();

        const currentBalance =
            Number(
                currentUser?.balance || 0
            );

        if(!amount || amount <= 0){
            showToast(
                "Enter a valid withdrawal amount.",
                "error"
            );
            return;
        }

        if(amount > currentBalance){
            showToast(
                "Insufficient balance.",
                "error"
            );
            return;
        }

        if(!walletAddress){
            showToast(
                "Enter your wallet address.",
                "error"
            );
            return;
        }

        if(!/^\d{6}$/.test(otp)){
            showToast(
                "Enter the 6-digit withdrawal OTP.",
                "error"
            );
            return;
        }

        const button =
            this.querySelector(
                "button[type=submit]"
            );

        const oldText =
            button.textContent;

        button.disabled = true;
        button.textContent = "Submitting...";

        try{

            const data =
                await api(
                    "/api/withdrawals",
                    {
                        method:"POST",

                        body:JSON.stringify({
                            amount,
                            network:selectedWithdrawNetwork,
                            walletAddress,
                            otp
                        })
                    }
                );

            if(data.success === false){
                throw new Error(
                    data.message ||
                    "Withdrawal request failed."
                );
            }

            showToast(
                data.message ||
                "Withdrawal request submitted successfully.",
                "success"
            );

            document.getElementById(
                "withdrawAmount"
            ).value = "";

            document.getElementById(
                "withdrawWalletAddress"
            ).value = "";

            document.getElementById(
                "withdrawOtp"
            ).value = "";

            await loadDashboard();
            await loadHistory();

        }catch(error){

            showToast(
                error.message ||
                "Withdrawal request failed.",
                "error"
            );

        }finally{

            button.disabled = false;
            button.textContent = oldText;

        }

    }
);

/* =========================================================
   HISTORY
========================================================= */

async function loadHistory(){

    const tbody =
        document.getElementById("historyTableBody");


    tbody.innerHTML = `
        <tr>
            <td colspan="5" style="text-align:center;">
                Loading history...
            </td>
        </tr>
    `;


    try{

        const data = await api("/api/history");


        let deposits =
            Array.isArray(data.deposits)
            ?
            data.deposits
            :
            [];


        let withdrawals =
            Array.isArray(data.withdrawals)
            ?
            data.withdrawals
            :
            [];


        let earnings =
            Array.isArray(data.earnings)
            ?
            data.earnings
            :
            [];
let nftPurchases =
    Array.isArray(data.nftPurchases)
    ? data.nftPurchases
    : [];

let nftSales =
    Array.isArray(data.nftSales)
    ? data.nftSales
    : [];

        const rows = [];


        deposits.forEach(item=>{

            rows.push({

                date:item.created_at,

                type:"Deposit",

                network:item.network || "-",

                amount:Number(item.amount || 0),

                status:item.status || "pending"

            });

        });


        withdrawals.forEach(item=>{

            rows.push({

                date:item.created_at,

                type:"Withdrawal",

                network:item.network || "-",

                amount:Number(item.amount || 0),

                status:item.status || "pending"

            });

        });


        earnings.forEach(item=>{

            rows.push({

                date:item.created_at,

                type:
                    item.type ||
                    "Earning",

                network:"-",

                amount:Number(item.amount || 0),

                description:
                    item.description || "",

                status:item.status || "completed"
                 });
         });
nftPurchases.forEach(item=>{
    rows.push({
        date:item.created_at,
        type:"NFT Purchase",
        network:"-",
        amount:Number(item.amount || 0),
        status:"completed"
    });
});

nftSales.forEach(item=>{
    rows.push({
        date:item.created_at,
        type:"NFT Sale",
        network:"-",
        amount:Number(item.amount || 0),
        status:"completed"
    });
});
        rows.sort((a,b)=>{

            return new Date(b.date) - new Date(a.date);

        });


        if(!rows.length){

            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align:center;padding:40px;">
                        No transaction history yet.
                    </td>
                </tr>
            `;

            return;
        }


        tbody.innerHTML = rows.map(item=>{

            const status =
                String(item.status).toLowerCase();


            let badgeClass = "badge-yellow";


            if(
                status === "approved" ||
                status === "completed"
            ){
                badgeClass = "badge-green";
            }


            if(status === "rejected"){
                badgeClass = "badge-red";
            }


            const typeName =
                String(item.type)
                    .replaceAll("_"," ")
                    .replace(/\b\w/g,c=>c.toUpperCase());


            return `

                <tr>

                    <td>
                        ${formatDate(item.date)}
                    </td>

                    <td>
                        <strong>
                            ${escapeHtml(typeName)}
                            ${item.description ? `<div style="font-size:12px;opacity:.75;margin-top:4px;">${escapeHtml(item.description)}</div>` : ""}
                        </strong>

                    </td>
                    <td>
                    </td>

                    <td>
                        ${money(item.amount)}
                    </td>

                    <td>
                        <span class="badge ${badgeClass}">
                            ${escapeHtml(status)}
                        </span>
                    </td>

                </tr>

            `;

        }).join("");


    }catch(error){

        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center;padding:40px;">
                    Unable to load history.
                </td>
            </tr>
        `;

        console.error(error);

    }

}

/* =========================================================
   REFERRAL
========================================================= */
async function loadReferral(){

    try{

        const data = await api("/api/referral");

        document.getElementById("referralCode").textContent =
            data.referralCode || "-";

        document.getElementById("referralLink").value =
            data.referralLink || "";

        document.getElementById("referralPercent").textContent =
            Number(data.bonusPercent || 10) + "%";

        document.getElementById("teamCount").textContent =
            data.teamCount || 0;

        document.getElementById("totalReferralBonus").textContent =
            money(data.totalBonus || 0);

        document.getElementById("profileReferral").textContent =
            data.referralCode || "-";


        const historyBox =
            document.getElementById("referralHistory");


        if(historyBox){

            if(!data.team || data.team.length === 0){

                historyBox.innerHTML = `
                    <div style="
                        text-align:center;
                        color:#777;
                        padding:24px 12px;
                        font-size:13px;
                    ">
                        No referral members yet.
                    </div>
                `;

            }else{

                historyBox.innerHTML = `

                    <div style="
                        display:grid;
                        grid-template-columns:
                            1.05fr 1.45fr .9fr .9fr;
                        gap:8px;
                        align-items:center;
                        padding:12px 10px;
                        background:#f8f9fb;
                        border-bottom:1px solid #e8e8e8;
                        font-size:11px;
                        font-weight:700;
                        color:#888;
                        text-transform:uppercase;
                    ">

                        <div>Name</div>
                        <div>Email</div>
                        <div>Balance</div>
                        <div>Joined</div>

                    </div>


                   ${data.team.map(user => {

    const level =
        Number(user.level || 1);

    const teamCount =
        Number(user.total_team_count || 0);

    const isDirect =
        level === 1;

    return `

        <div style="
            position:relative;
            margin:10px 0;
            padding:16px;
            border:1px solid ${
                isDirect
                    ? "rgba(124,58,237,.16)"
                    : "rgba(6,182,212,.16)"
            };
            border-radius:18px;
            background:
                linear-gradient(
                    135deg,
                    ${
                        isDirect
                            ? "rgba(124,58,237,.055)"
                            : "rgba(6,182,212,.045)"
                    },
                    #ffffff
                );
            box-shadow:
                0 8px 25px rgba(15,23,42,.055);
            overflow:hidden;
        ">

            <div style="
                display:flex;
                justify-content:space-between;
                align-items:flex-start;
                gap:12px;
            ">

                <div style="
                    display:flex;
                    align-items:center;
                    gap:12px;
                    min-width:0;
                ">

                    <div style="
                        width:44px;
                        height:44px;
                        min-width:44px;
                        border-radius:14px;
                        display:flex;
                        align-items:center;
                        justify-content:center;
                        background:
                            ${
                                isDirect
                                    ? "linear-gradient(135deg,#7c3aed,#a855f7)"
                                    : "linear-gradient(135deg,#06b6d4,#3b82f6)"
                            };
                        color:#fff;
                        font-size:20px;
                        box-shadow:
                            0 7px 18px
                            ${
                                isDirect
                                    ? "rgba(124,58,237,.22)"
                                    : "rgba(6,182,212,.20)"
                            };
                    ">
                        ${isDirect ? "??" : "??"}
                    </div>


                    <div style="
                        min-width:0;
                    ">

                        <div style="
                            display:flex;
                            align-items:center;
                            gap:7px;
                            flex-wrap:wrap;
                        ">

                            <div style="
                                font-size:14px;
                                font-weight:800;
                                color:#17142b;
                                overflow:hidden;
                                text-overflow:ellipsis;
                                white-space:nowrap;
                                max-width:180px;
                            ">
                                ${user.name || "-"}
                            </div>


                            <span style="
                                display:inline-flex;
                                align-items:center;
                                padding:4px 8px;
                                border-radius:999px;
                                font-size:10px;
                                font-weight:800;
                                letter-spacing:.3px;
                                color:#fff;
                                background:
                                    ${
                                        isDirect
                                            ? "linear-gradient(135deg,#7c3aed,#9333ea)"
                                            : "linear-gradient(135deg,#0891b2,#2563eb)"
                                    };
                            ">
                                ${
                                    isDirect
                                        ? "LEVEL 1 • DIRECT"
                                        : `LEVEL ${level} • INDIRECT`
                                }
                            </span>

                        </div>


                        <div style="
                            margin-top:4px;
                            color:#777;
                            font-size:11px;
                            overflow:hidden;
                            text-overflow:ellipsis;
                            white-space:nowrap;
                        ">
                            ${user.email || "-"}
                        </div>

                    </div>

                </div>


                <div style="
                    text-align:right;
                    min-width:75px;
                ">

                    <div style="
                        color:#777;
                        font-size:10px;
                        font-weight:700;
                        text-transform:uppercase;
                        letter-spacing:.5px;
                    ">
                        Balance
                    </div>

                    <div style="
                        margin-top:3px;
                        color:#17142b;
                        font-size:13px;
                        font-weight:850;
                        white-space:nowrap;
                    ">
                        ${money(user.balance || 0)}
                    </div>

                </div>

            </div>


            <div style="
                display:flex;
                flex-wrap:wrap;
                gap:8px;
                margin-top:14px;
                padding-top:12px;
                border-top:1px solid rgba(15,23,42,.07);
            ">

                <div style="
                    flex:1;
                    min-width:120px;
                    padding:9px 11px;
                    border-radius:12px;
                    background:rgba(255,255,255,.75);
                    border:1px solid rgba(15,23,42,.06);
                ">

                    <div style="
                        color:#888;
                        font-size:9px;
                        font-weight:800;
                        text-transform:uppercase;
                        letter-spacing:.5px;
                    ">
                        Team Size
                    </div>

                    <div style="
                        margin-top:3px;
                        color:#17142b;
                        font-size:13px;
                        font-weight:850;
                    ">
                        ${teamCount}
                        ${
                            teamCount === 1
                                ? " member"
                                : " members"
                        }
                    </div>

                </div>


                <div style="
                    flex:1;
                    min-width:120px;
                    padding:9px 11px;
                    border-radius:12px;
                    background:rgba(255,255,255,.75);
                    border:1px solid rgba(15,23,42,.06);
                ">

                    <div style="
                        color:#888;
                        font-size:9px;
                        font-weight:800;
                        text-transform:uppercase;
                        letter-spacing:.5px;
                    ">
                        Joined
                    </div>

                    <div style="
                        margin-top:3px;
                        color:#17142b;
                        font-size:12px;
                        font-weight:750;
                        white-space:nowrap;
                    ">
                        ${
                            user.created_at
                                ? new Date(
                                    user.created_at
                                ).toLocaleDateString()
                                : "-"
                        }
                    </div>

                </div>

            </div>

        </div>

    `;

}).join("")}
                `;

            }

        }


   

    }catch(error){

        console.error(
            "Referral:",
            error
        );

    }

}
/* =========================================================
   COPY REFERRAL LINK
========================================================= */
async function copyReferralLink(){

    const input =
        document.getElementById("referralLink");

    if(!input || !input.value.trim()){

        showToast(
            "Referral link is not available.",
            "error"
        );

        return;
    }

    const value =
        input.value.trim();

    try{

        if(
            navigator.clipboard &&
            window.isSecureContext
        ){

            await navigator.clipboard.writeText(value);

        }else{

            const textarea =
                document.createElement("textarea");

            textarea.value = value;

            textarea.style.position = "fixed";
            textarea.style.left = "-9999px";
            textarea.style.top = "0";
            textarea.style.opacity = "0";

            document.body.appendChild(textarea);

            textarea.focus();
            textarea.select();
            textarea.setSelectionRange(
                0,
                value.length
            );

            const copied =
                document.execCommand("copy");

            document.body.removeChild(textarea);

            if(!copied){

                throw new Error("Copy failed");
            }
        }

        showToast(
            "Referral link copied successfully.",
            "success"
        );

    }catch(error){

        console.error(
            "REFERRAL COPY ERROR:",
            error
        );

        showToast(
            "Unable to copy referral link.",
            "error"
        );

    }

}
/* =========================================================
   PROFILE CHANGE PASSWORD UI
========================================================= */

function openForgotPassword(){

    passwordResetForgotMode = true;

    const loginBox =
        document.getElementById("loginFormBox");

    const passwordPanel =
        document.getElementById("profileChangePasswordPanel");

    if(loginBox){
        loginBox.classList.add("hidden");
    }

    if(passwordPanel){
        passwordPanel.style.display = "block";
    }

    const emailCard = document.querySelector("#profileChangePasswordPanel .profile-password-email-card");

    const emailInputWrap = document.getElementById("forgotPasswordEmailInputWrap");

    if(emailCard){
        emailCard.style.display = "none";
    }

    if(emailInputWrap){
        emailInputWrap.style.display = "block";
    }

    const emailBox =
        document.getElementById("profilePasswordEmail");

    if(emailBox){
        emailBox.textContent = "";
    }

    const step1 =
        document.getElementById("profilePasswordOtpStep1");

    const step2 =
        document.getElementById("profilePasswordOtpStep2");

    const step3 =
        document.getElementById("profilePasswordOtpStep3");

    const success =
        document.getElementById("profilePasswordSuccess");

    if(step1) step1.style.display = "block";
    if(step2) step2.style.display = "none";
    if(step3) step3.style.display = "none";
    if(success) success.style.display = "none";

    if(passwordPanel){
        passwordPanel.scrollIntoView({
            behavior:"smooth",
            block:"start"
        });
    }
}
let passwordResetForgotMode = false;

function openChangePassword(){

    passwordResetForgotMode = false;

    const profileCard =
        document.querySelector("#page-profile .profile-card");

    const passwordPanel =
        document.getElementById("profileChangePasswordPanel");

    if(!profileCard || !passwordPanel){
        console.error("Change Password panel not found.");
        return;
    }

    profileCard.style.display = "none";
    passwordPanel.style.display = "block";

    const emailBox =
        document.getElementById("profilePasswordEmail");

    if(emailBox){
        emailBox.textContent =
            currentUser && currentUser.email
                ? currentUser.email
                : "Email unavailable";
    }

    passwordPanel.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}


function closeChangePassword(){

    const profileCard =
        document.querySelector("#page-profile .profile-card");

    const passwordPanel =
        document.getElementById("profileChangePasswordPanel");

    if(!profileCard || !passwordPanel){
        return;
    }

    passwordPanel.style.display = "none";
    profileCard.style.display = "";

    passwordPanel.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}


function toggleProfilePassword(inputId, button){

    const input =
        document.getElementById(inputId);

    if(!input){
        return;
    }

    if(input.type === "password"){

        input.type = "text";

        button.textContent = "??";

    }else{

        input.type = "password";

        button.textContent = "??";

    }
}
/* =========================================================
   PROFILE PASSWORD - OTP + CHANGE PASSWORD
========================================================= */

async function sendProfilePasswordOTP(){

    try{

        let email = "";

        if(passwordResetForgotMode){

            const forgotEmailInput =
                document.getElementById(
                    "forgotPasswordEmailInput"
                );

            email =
                forgotEmailInput
                    ? String(
                        forgotEmailInput.value || ""
                    ).trim().toLowerCase()
                    : "";

        }else{

            email =
                currentUser &&
                currentUser.email
                    ? currentUser.email
                    : "";
        }

        if(!email){
            showToast(
                "Unable to find your registered email.",
                "error"
            );
            return;
        }

        const emailBox =
            document.getElementById(
                "profilePasswordEmail"
            );

        if(emailBox){
            emailBox.textContent = email;
        }

        const sendBtn =
            document.getElementById(
                "profilePasswordSendOtpBtn"
            );

        const resendBtn =
            document.getElementById(
                "profilePasswordResendBtn"
            );

        if(sendBtn){
            sendBtn.disabled = true;
            sendBtn.innerHTML =
                "<span>•</span> Sending OTP...";
        }

        if(resendBtn){
            resendBtn.disabled = true;
            resendBtn.textContent = "Sending...";
        }

        const data =
            await api(
                "/api/password-reset/send-otp",
                {
                    method:"POST",
                    headers:{
                        "Content-Type":
                            "application/json"
                    },
                    body:JSON.stringify({
                        email:email
                    })
                }
            );

        if(!data || !data.success){

            throw new Error(
                data &&
                data.message
                    ? data.message
                    : "Unable to send OTP."
            );

        }

        const step1 =
            document.getElementById(
                "profilePasswordOtpStep1"
            );

        const step2 =
            document.getElementById(
                "profilePasswordOtpStep2"
            );

        if(step1){
            step1.style.display = "none";
        }

        if(step2){
            step2.style.display = "block";
        }

        const otpInput =
            document.getElementById(
                "profilePasswordOTP"
            );

        if(otpInput){
            otpInput.value = "";
            setTimeout(() => otpInput.focus(), 100);
        }

        showToast(
            data.message ||
            "OTP sent to your registered email.",
            "success"
        );

    }catch(error){

        console.error(
            "PROFILE PASSWORD SEND OTP ERROR:",
            error
        );

        showToast(
            error.message ||
            "Unable to send OTP.",
            "error"
        );

    }finally{

        const sendBtn =
            document.getElementById(
                "profilePasswordSendOtpBtn"
            );

        const resendBtn =
            document.getElementById(
                "profilePasswordResendBtn"
            );

        if(sendBtn){

            sendBtn.disabled = false;

            sendBtn.innerHTML =
                "<span>•</span> Get OTP";

        }

        if(resendBtn){

            resendBtn.disabled = false;
            resendBtn.textContent = "Resend OTP";

        }

    }

}


async function verifyProfilePasswordOTP(){

    try{

        let email = "";

        if(passwordResetForgotMode){

            const forgotEmailInput =
                document.getElementById(
                    "forgotPasswordEmailInput"
                );

            email =
                forgotEmailInput
                    ? String(
                        forgotEmailInput.value || ""
                    ).trim().toLowerCase()
                    : "";

        }else{

            email =
                currentUser &&
                currentUser.email
                    ? currentUser.email
                    : "";
        }

        const otpInput =
            document.getElementById(
                "profilePasswordOTP"
            );

        const otp =
            otpInput
                ? String(otpInput.value || "").trim()
                : "";

        if(!email){

            showToast(
                "Unable to find your registered email.",
                "error"
            );

            return;
        }

        if(!/^\d{6}$/.test(otp)){

            showToast(
                "Please enter the 6-digit OTP.",
                "error"
            );

            return;
        }

        const verifyBtn =
            document.getElementById(
                "profilePasswordVerifyBtn"
            );

        if(verifyBtn){

            verifyBtn.disabled = true;

            verifyBtn.innerHTML =
                "<span>•</span> Verifying...";

        }

        const data =
            await api(
                "/api/password-reset/verify-otp",
                {
                    method:"POST",
                    headers:{
                        "Content-Type":
                            "application/json"
                    },
                    body:JSON.stringify({
                        email:email,
                        otp:otp
                    })
                }
            );

        if(!data || !data.success){

            throw new Error(
                data &&
                data.message
                    ? data.message
                    : "Unable to verify OTP."
            );

        }

        const step2 =
            document.getElementById(
                "profilePasswordOtpStep2"
            );

        const step3 =
            document.getElementById(
                "profilePasswordOtpStep3"
            );

        if(step2){
            step2.style.display = "none";
        }

        if(step3){
            step3.style.display = "block";
        }

        const newPassword =
            document.getElementById(
                "profileNewPassword"
            );

        if(newPassword){

            newPassword.value = "";

            setTimeout(
                () => newPassword.focus(),
                100
            );

        }

        const confirmPassword =
            document.getElementById(
                "profileConfirmPassword"
            );

        if(confirmPassword){
            confirmPassword.value = "";
        }

        updateProfilePasswordStrength();

        showToast(
            data.message ||
            "OTP verified successfully.",
            "success"
        );

    }catch(error){

        console.error(
            "PROFILE PASSWORD VERIFY OTP ERROR:",
            error
        );

        showToast(
            error.message ||
            "Unable to verify OTP.",
            "error"
        );

    }finally{

        const verifyBtn =
            document.getElementById(
                "profilePasswordVerifyBtn"
            );

        if(verifyBtn){

            verifyBtn.disabled = false;

            verifyBtn.innerHTML =
                "<span>•</span> Verify OTP";

        }

    }

}


function updateProfilePasswordStrength(){

    const input =
        document.getElementById(
            "profileNewPassword"
        );

    const bar =
        document.getElementById(
            "profilePasswordStrengthBar"
        );

    const text =
        document.getElementById(
            "profilePasswordStrengthText"
        );

    if(!input || !bar || !text){
        return;
    }

    const password =
        String(input.value || "");

    let score = 0;

    if(password.length >= 8){
        score++;
    }

    if(/[a-z]/.test(password)){
        score++;
    }

    if(/[A-Z]/.test(password)){
        score++;
    }

    if(/\d/.test(password)){
        score++;
    }

    if(/[^A-Za-z0-9]/.test(password)){
        score++;
    }

    const widths = [
        "0%",
        "20%",
        "40%",
        "60%",
        "80%",
        "100%"
    ];

    const labels = [
        "Password strength",
        "Very weak",
        "Weak",
        "Medium",
        "Strong",
        "Very strong"
    ];

    bar.style.width =
        widths[score];

    text.textContent =
        labels[score];

}


async function submitProfilePasswordChange(){

    try{

        const newPassword =
            String(
                (
                    document.getElementById(
                        "profileNewPassword"
                    ) || {}
                ).value || ""
            );

        const confirmPassword =
            String(
                (
                    document.getElementById(
                        "profileConfirmPassword"
                    ) || {}
                ).value || ""
            );

        if(!newPassword){

            showToast(
                "New password is required.",
                "error"
            );

            return;
        }

        if(!confirmPassword){

            showToast(
                "Please confirm your new password.",
                "error"
            );

            return;
        }

        if(newPassword !== confirmPassword){

            showToast(
                "New password and confirm password do not match.",
                "error"
            );

            return;
        }

        if(newPassword.length < 8){

            showToast(
                "Password must be at least 8 characters long.",
                "error"
            );

            return;
        }

        const changeBtn =
            document.getElementById(
                "profilePasswordChangeBtn"
            );

        if(changeBtn){

            changeBtn.disabled = true;

            changeBtn.innerHTML =
                "<span>•</span> Updating Password...";

        }

        const data =
            await api(
                "/api/password-reset/change",
                {
                    method:"POST",
                    headers:{
                        "Content-Type":
                            "application/json"
                    },
                    body:JSON.stringify({
                        newPassword:
                            newPassword,
                        confirmPassword:
                            confirmPassword
                    })
                }
            );

        if(!data || !data.success){

            throw new Error(
                data &&
                data.message
                    ? data.message
                    : "Unable to change password."
            );

        }

        const step3 =
            document.getElementById(
                "profilePasswordOtpStep3"
            );

        const success =
            document.getElementById(
                "profilePasswordSuccess"
            );

        if(step3){
            step3.style.display = "none";
        }

        if(success){
            success.style.display = "block";
        }

        showToast(
            data.message ||
            "Password changed successfully.",
            "success"
        );

    }catch(error){

        console.error(
            "PROFILE PASSWORD CHANGE ERROR:",
            error
        );

        showToast(
            error.message ||
            "Unable to change password.",
            "error"
        );

    }finally{

        const changeBtn =
            document.getElementById(
                "profilePasswordChangeBtn"
            );

        if(changeBtn){

            changeBtn.disabled = false;

            changeBtn.innerHTML =
                "<span>•</span> Change Password";

        }

    }

}


document.addEventListener(
    "input",
    function(event){

        if(
            event.target &&
            event.target.id ===
                "profileNewPassword"
        ){

            updateProfilePasswordStrength();

        }

    }
);

/* =========================================================
   LOGOUT
========================================================= */

async function logout(){

    try{

        await api("/api/logout",{
            method:"POST"
        });

    }catch(error){

        console.error(error);

    }


    currentUser = null;


    document.getElementById("dashboardApp")
        .classList.remove("active");
document.getElementById("mobileNav")
    .classList.remove("app-visible");

    document.getElementById("authPage").style.display =
        "flex";


    document.getElementById("loginPassword").value = "";


    showLogin();


    showToast(
        "Logged out successfully.",
        "success"
    );

}
function openMobileMenu(){

    const menu = document.getElementById("mobileMenu");

    if (!menu) {
        alert("mobileMenu not found");
        return;
    }

    menu.classList.add("show");
    menu.style.display = "block";
    menu.style.position = "fixed";
    menu.style.top = "0";
    menu.style.left = "0";
    menu.style.right = "0";
    menu.style.bottom = "0";
    menu.style.width = "100%";
    menu.style.height = "100%";
    menu.style.visibility = "visible";
    menu.style.opacity = "1";
    menu.style.zIndex = "99999999";

    document.body.style.overflow = "hidden";

}

function closeMobileMenu(){

    const menu = document.getElementById("mobileMenu");

    if(!menu){
        return;
    }

    menu.classList.remove("show");

    menu.style.setProperty(
        "display",
        "none",
        "important"
    );

    document.body.style.overflow = "";

}
function openTelegramSupport(){
    window.open(
        "https://t.me/MetaNFTSupport",
        "_blank"
    );
}
/* =========================================================
   INITIAL SESSION CHECK
========================================================= */

async function checkExistingSession(){

    try{

        const data = await api("/api/me");


        if(
            data &&
            (
                data.success !== false ||
                data.user
            )
        ){

            currentUser =
                data.user ||
                data.data ||
                data;


            if(currentUser && currentUser.id){

                await startApplication();

                return;
            }

        }

    }catch(error){

        console.log("No active session.");

    }


    document.getElementById("authPage").style.display =
        "flex";

}


/* =========================================================
   MODAL BACKGROUND CLOSE
========================================================= */

document.getElementById("buyModal").addEventListener(
    "click",
    function(e){

        if(e.target === this){
            closeBuyModal();
        }

    }
);


document.getElementById("sellModal").addEventListener(
    "click",
    function(e){

        if(e.target === this){
            closeSellModal();
        }

    }
);


/* =========================================================
   START
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    checkExistingSession
);
/* =========================================================
   REGISTRATION EMAIL OTP
========================================================= */

let registrationOtpTimer = null;
let registrationOtpSeconds = 0;


async function sendRegistrationOTP(){

    const emailInput =
        document.getElementById("registerEmail");

    const button =
        document.getElementById("registerSendOtpBtn");

    const message =
        document.getElementById("registerOtpMessage");


    const email =
        String(
            emailInput?.value || ""
        ).trim();


    if(!email){

        message.textContent =
            "Please enter your email address.";

        message.style.color =
            "#dc2626";

        emailInput?.focus();

        return;
    }


    /* Basic email check */

    const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


    if(!emailPattern.test(email)){

        message.textContent =
            "Please enter a valid email address.";

        message.style.color =
            "#dc2626";

        emailInput?.focus();

        return;
    }


    button.disabled = true;

    button.textContent =
        "Sending...";

    message.textContent =
        "";


    try{

        const response =
            await fetch(
                "/api/register/send-otp",
                {
                    method:"POST",

                    headers:{
                        "Content-Type":
                            "application/json"
                    },

                    body:JSON.stringify({
                        email:email
                    })
                }
            );


        const data =
            await response.json();


        if(!response.ok || !data.success){

            throw new Error(
                data.message ||
                "Unable to send OTP."
            );
        }


        message.textContent =
            "OTP sent successfully. Please check your email.";

        message.style.color =
            "#16a34a";


        startRegistrationOtpTimer();


    }catch(error){

        console.error(
            "Registration OTP:",
            error
        );


        message.textContent =
            error.message ||
            "Unable to send OTP.";

        message.style.color =
            "#dc2626";


        button.disabled = false;

        button.textContent =
            "Send OTP";
    }
}


/* =========================================================
   OTP COUNTDOWN
========================================================= */

function startRegistrationOtpTimer(){

    const button =
        document.getElementById(
            "registerSendOtpBtn"
        );


    registrationOtpSeconds =
        60;


    if(registrationOtpTimer){

        clearInterval(
            registrationOtpTimer
        );
    }


    button.disabled = true;


    button.textContent =
        `Resend (${registrationOtpSeconds}s)`;


    registrationOtpTimer =
        setInterval(
            function(){

                registrationOtpSeconds--;


                if(
                    registrationOtpSeconds <= 0
                ){

                    clearInterval(
                        registrationOtpTimer
                    );

                    registrationOtpTimer =
                        null;


                    button.disabled =
                        false;

                    button.textContent =
                        "Resend OTP";

                    return;
                }


                button.textContent =
                    `Resend (${registrationOtpSeconds}s)`;

            },
            1000
        );
}


var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
(function(){
var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
s1.async=true;
s1.src='https://embed.tawk.to/6aafb884a240be343f64af86/1k2v6hhia';
s1.charset='UTF-8';
s1.setAttribute('crossorigin','*');
s0.parentNode.insertBefore(s1,s0);
})();


Tawk_API = Tawk_API || {};

Tawk_API.onLoad = function(){
    Tawk_API.hideWidget();
};

