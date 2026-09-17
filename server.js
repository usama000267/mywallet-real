

require("dotenv").config({
    path: require("path").join(__dirname, ".env")
});

const express = require("express");
const bcrypt = require("bcryptjs");
const { Resend } = require("resend");
const session = require("express-session");
const pgSession = require("connect-pg-simple")(session);
const multer = require("multer");
const { v2: cloudinary } = require("cloudinary");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const db = require("./database");
const app = express();
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});
const PORT = Number(process.env.PORT || 3000);
const resend = process.env.RESEND_API_KEY
    ? new Resend(process.env.RESEND_API_KEY)
    : null;
    /* =========================================================
   EMAIL OTP HELPERS
========================================================= */

function generateOTP(){
    return crypto
        .randomInt(100000, 1000000)
        .toString();
}

function hashOTP(otp){
    return crypto
        .createHash("sha256")
        .update(String(otp))
        .digest("hex");
}

async function sendEmailOTP({
    email,
    purpose,
    userId = null
}){

    if(!resend){
        throw new Error("Email service is not configured.");
    }

    const cleanEmail =
        String(email || "")
            .trim()
            .toLowerCase();

    if(!cleanEmail){
        throw new Error("Email is required.");
    }

    /* ==========================================
       CHECK 60 SECOND RESEND LIMIT
    ========================================== */

    const existing =
        await db.query(
            `
            SELECT
                id,
                resend_available_at
            FROM email_otps
            WHERE email = $1
            AND purpose = $2
            AND used = FALSE
            ORDER BY created_at DESC
            LIMIT 1
            `,
            [
                cleanEmail,
                purpose
            ]
        );

    if(existing.rows.length > 0){

        const resendAt =
            new Date(
                existing.rows[0].resend_available_at
            );

        if(Date.now() < resendAt.getTime()){

            const seconds =
                Math.ceil(
                    (
                        resendAt.getTime() -
                        Date.now()
                    ) / 1000
                );

            throw new Error(
                `Please wait ${seconds} seconds before requesting a new OTP.`
            );
        }
    }

    /* ==========================================
       NEW OTP INVALIDATES OLD OTP
    ========================================== */

    await db.query(
        `
        UPDATE email_otps
        SET used = TRUE
        WHERE email = $1
        AND purpose = $2
        AND used = FALSE
        `,
        [
            cleanEmail,
            purpose
        ]
    );

    const otp =
        generateOTP();

    const otpHash =
        hashOTP(otp);

    const expiresAt =
        new Date(
            Date.now() +
            10 * 60 * 1000
        );

    const resendAvailableAt =
        new Date(
            Date.now() +
            60 * 1000
        );

    await db.query(
        `
        INSERT INTO email_otps
        (
            user_id,
            email,
            purpose,
            otp_hash,
            expires_at,
            resend_available_at
        )
        VALUES
        ($1,$2,$3,$4,$5,$6)
        `,
        [
            userId,
            cleanEmail,
            purpose,
            otpHash,
            expiresAt,
            resendAvailableAt
        ]
    );

    const purposeText =
        purpose === "registration"
            ? "complete your Meta NFT registration"
            : "confirm your Meta NFT withdrawal";

    await resend.emails.send({
        from: "Meta NFT <support@metanft.work.gd>",
        to: [cleanEmail],
        subject: "Meta NFT Verification Code",
        html: `
            <div style="
                font-family:Arial,sans-serif;
                max-width:520px;
                margin:auto;
                padding:30px;
                border:1px solid #e5e7eb;
                border-radius:16px;
            ">

                <h2 style="
                    margin-top:0;
                    color:#111827;
                ">
                    Meta NFT
                </h2>

                <p>
                    Your verification code is:
                </p>

                <div style="
                    font-size:32px;
                    font-weight:bold;
                    letter-spacing:8px;
                    padding:18px;
                    text-align:center;
                    background:#f3f4f6;
                    border-radius:12px;
                ">
                    ${otp}
                </div>

                <p>
                    This code will expire in
                    <strong>10 minutes</strong>.
                </p>

                <p style="color:#6b7280;">
                    Use this code to ${purposeText}.
                </p>

                <p style="color:#9ca3af;font-size:13px;">
                    If you did not request this code,
                    you can safely ignore this email.
                </p>

            </div>
        `
    });

    return {
        success: true
    };
}

/* =====================================================
   NFT IMAGE UPLOAD SETUP
===================================================== */

const uploadDirectory =
    path.join(__dirname, "uploads");

if(!fs.existsSync(uploadDirectory)){

    fs.mkdirSync(
        uploadDirectory,
        {
            recursive:true
        }
    );

}const nftUpload =
    multer({

        storage:
            multer.memoryStorage(),

        limits:{
            fileSize:
                5 * 1024 * 1024
        },

        fileFilter:function(
            req,
            file,
            cb
        ){

            const allowed = [
                "image/jpeg",
                "image/png",
                "image/webp",
                "image/gif"
            ];

            if(
                allowed.includes(
                    file.mimetype
                )
            ){

                cb(
                    null,
                    true
                );

            }else{

                cb(
                    new Error(
                        "Only JPG, PNG, WEBP or GIF images are allowed."
                    )
                );

            }

        }

    });



/* =====================================================
   CONFIG
===================================================== */

const ADMIN_EMAIL = String(
    process.env.ADMIN_EMAIL || "admin@example.com"
).trim().toLowerCase();

const ADMIN_PASSWORD = String(
    process.env.ADMIN_PASSWORD || "ChangeThis123!"
);

const BEP20_ADDRESS =
    process.env.BEP20_USDT_ADDRESS || "BEP20-ADDRESS";

const TRC20_ADDRESS =
    process.env.TRC20_USDT_ADDRESS || "TRC20-ADDRESS";


/* =====================================================
   MIDDLEWARE
===================================================== */

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
    session({
        store: new pgSession({
            pool: db.pool,
            tableName: "user_sessions",
            createTableIfMissing: true
        }),

        secret:
            process.env.SESSION_SECRET ||
            "meta-nft-change-this-secret",

        resave: false,
        saveUninitialized: false,

        cookie: {
            httpOnly: true,
            sameSite: "lax",
            secure: false,
            maxAge: 24 * 60 * 60 * 1000
        }
    })
);

app.use(express.static(__dirname));


/* =====================================================
   HELPERS
===================================================== */

function normalizeEmail(email) {
    return String(email || "")
        .trim()
        .toLowerCase();
}


function validAmount(amount) {
    const value = Number(amount);

    return (
        Number.isFinite(value) &&
        value > 0 &&
        value <= 100000000
    );
}


function requireLogin(req, res, next) {

    if (!req.session.userId) {
        return res.status(401).json({
            success: false,
            message: "Please login first."
        });
    }

    next();
}


function requireAdmin(req, res, next) {

    if (!req.session.isAdmin) {
        return res.status(401).json({
            success: false,
            message: "Admin login required."
        });
    }

    next();
}


function generateReferralCode() {

    return (
        Math.random()
            .toString(36)
            .substring(2, 8)
            .toUpperCase() +
        Math.random()
            .toString(36)
            .substring(2, 6)
            .toUpperCase()
    );
}


async function createUniqueReferralCode() {

    while (true) {

        const code =
            generateReferralCode();

        const result =
            await db.query(
                `
                SELECT id
                FROM users
                WHERE referral_code = $1
                `,
                [code]
            );

        if (result.rows.length === 0) {
            return code;
        }
    }
}


/*
   User protection.

   Existing users remain intact.
   A blocked user simply cannot use protected
   account actions.
*/

async function checkUserAllowed(userId) {

    const result =
        await db.query(
            `
            SELECT
                id,
                is_blocked
            FROM users
            WHERE id = $1
            `,
            [userId]
        );

    if (result.rows.length === 0) {
        return {
            exists: false,
            blocked: false
        };
    }

    return {
        exists: true,
        blocked: Boolean(
            result.rows[0].is_blocked
        )
    };
}


async function requireAllowedUser(req, res, next) {

    if (!req.session.userId) {
        return res.status(401).json({
            success: false,
            message: "Please login first."
        });
    }

    try {

        const user =
            await checkUserAllowed(
                req.session.userId
            );

        if (!user.exists) {

            return res.status(401).json({
                success: false,
                message: "User account not found."
            });
        }

        if (user.blocked) {

            return res.status(403).json({
                success: false,
                blocked: true,
                message:
                    "Your account has been blocked by the administrator."
            });
        }

        next();

    } catch (error) {

        console.error(
            "USER ACCESS ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Unable to verify account status."
        });
    }
}


/*
   The old requireLogin remains available for
   read-only endpoints where necessary.
*/


/* =====================================================
   HOME
===================================================== */

app.get("/", (req, res) => {

    res.sendFile(
        __dirname + "/index.html"
    );
});


app.get("/admin", (req, res) => {

    res.sendFile(
        __dirname + "/admin.html"
    );
});


/* =====================================================
   HEALTH
===================================================== */

app.get(
    "/api/health",
    async (req, res) => {

        try {

            await db.query("SELECT 1");

            res.json({
                success: true,
                server: "running",
                database: "connected",
                platform: "Meta NFT"
            });

        } catch (error) {

            console.error(
                "HEALTH ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                server: "running",
                database: "error"
            });
        }
    }
);


/* =====================================================
   CONFIG
===================================================== */
app.get(
    "/api/config",
    async (req, res) => {
        try {
            const result = await db.query(`
                SELECT setting_key, setting_value
                FROM site_settings
                WHERE setting_key IN (
                    'bep20_usdt_address',
                    'trc20_usdt_address'
                )
            `);

            const settings = {};

            result.rows.forEach(row => {
                settings[row.setting_key] =
                    row.setting_value;
            });

            const bep20Address =
                settings.bep20_usdt_address ||
                process.env.BEP20_USDT_ADDRESS ||
                "BEP20-ADDRESS";

            const trc20Address =
                settings.trc20_usdt_address ||
                process.env.TRC20_USDT_ADDRESS ||
                "TRC20-ADDRESS";

            res.json({
                success: true,
                brand: "Meta NFT",
                currency: "USD",

                networks: {
                    bep20: {
                        name: "USDT BEP20",
                        chainId: 56,
                        address: bep20Address
                    },

                    trc20: {
                        name: "USDT TRC20",
                        address: trc20Address
                    }
                }
            });

        } catch (error) {
            console.error(
                "CONFIG ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Unable to load configuration."
            });
        }
    }
);
/* =====================================================
   REGISTER - SEND OTP
===================================================== */

app.post(
    "/api/register/send-otp",
    async (req, res) => {

        try {

            await db.ready;

            const email =
                normalizeEmail(
                    req.body.email
                );


            if(!email){

                return res.status(400).json({
                    success:false,
                    message:"Email is required."
                });

            }


            /* ==========================================
               CHECK EMAIL
            ========================================== */

            const existingUser =
                await db.query(
                    `
                    SELECT id
                    FROM users
                    WHERE email = $1
                    `,
                    [email]
                );


            if(
                existingUser.rows.length > 0
            ){

                return res.status(409).json({
                    success:false,
                    message:
                        "This email is already registered."
                });

            }


            /* ==========================================
               SEND OTP
            ========================================== */

            await sendEmailOTP({
                email: email,
                purpose: "registration"
            });


            res.json({
                success:true,
                message:
                    "Verification code has been sent to your email."
            });


        } catch(error){

            console.error(
                "REGISTER OTP ERROR:",
                error
            );


            res.status(400).json({
                success:false,
                message:
                    error.message ||
                    "Unable to send verification code."
            });

        }

    }
);
/* =====================================================
   REGISTER
===================================================== */

app.post(
    "/api/register",
    async (req, res) => {

        try {

            await db.ready;

            const name =
                String(
                    req.body.name || ""
                ).trim();

            const email =
                normalizeEmail(
                    req.body.email
                );

            const password =
                String(
                    req.body.password || ""
                );

            const referralCode =
                String(
                    req.body.referralCode || ""
                )
                .trim()
                .toUpperCase();

            const otp =
                String(
                    req.body.otp || ""
                ).trim();


            /* ==========================================
               BASIC VALIDATION
            ========================================== */

            if (
                !name ||
                !email ||
                !password
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Name, email and password are required."
                });
            }


            if (password.length < 8) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Password must be at least 8 characters."
                });
            }


            /* ==========================================
               OTP REQUIRED
            ========================================== */

            if (!/^\d{6}$/.test(otp)) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Please enter the 6-digit verification code sent to your email."
                });
            }


            /* ==========================================
               CHECK EXISTING USER
            ========================================== */

            const existingUser =
                await db.query(
                    `
                    SELECT id
                    FROM users
                    WHERE email = $1
                    `,
                    [email]
                );


            if (
                existingUser.rows.length > 0
            ) {

                return res.status(409).json({
                    success: false,
                    message:
                        "This email is already registered."
                });
            }


            /* ==========================================
               VERIFY OTP
            ========================================== */

            const otpResult =
                await db.query(
                    `
                    SELECT
                        id,
                        otp_hash,
                        expires_at,
                        attempts
                    FROM email_otps
                    WHERE email = $1
                    AND purpose = 'registration'
                    AND used = FALSE
                    ORDER BY created_at DESC
                    LIMIT 1
                    `,
                    [email]
                );


            if (
                otpResult.rows.length === 0
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Verification code not found. Please request a new OTP."
                });
            }


            const otpRecord =
                otpResult.rows[0];


            /* ==========================================
               OTP EXPIRY
            ========================================== */

            if (
                new Date(
                    otpRecord.expires_at
                ).getTime() < Date.now()
            ) {

                await db.query(
                    `
                    UPDATE email_otps
                    SET used = TRUE
                    WHERE id = $1
                    `,
                    [otpRecord.id]
                );

                return res.status(400).json({
                    success: false,
                    message:
                        "This OTP has expired. Please request a new one."
                });
            }


            /* ==========================================
               OTP ATTEMPTS
            ========================================== */

            if (
                Number(
                    otpRecord.attempts
                ) >= 5
            ) {

                await db.query(
                    `
                    UPDATE email_otps
                    SET used = TRUE
                    WHERE id = $1
                    `,
                    [otpRecord.id]
                );

                return res.status(400).json({
                    success: false,
                    message:
                        "Too many incorrect attempts. Please request a new OTP."
                });
            }


            const submittedOtpHash =
                hashOTP(otp);


            if (
                submittedOtpHash !==
                otpRecord.otp_hash
            ) {

                const newAttempts =
                    Number(
                        otpRecord.attempts
                    ) + 1;


                await db.query(
                    `
                    UPDATE email_otps
                    SET attempts = $1,
                        used =
                            CASE
                                WHEN $1 >= 5
                                THEN TRUE
                                ELSE used
                            END
                    WHERE id = $2
                    `,
                    [
                        newAttempts,
                        otpRecord.id
                    ]
                );


                return res.status(400).json({
                    success: false,
                    message:
                        newAttempts >= 5
                            ? "Too many incorrect attempts. Please request a new OTP."
                            : "Incorrect verification code."
                });
            }


            /* ==========================================
               REFERRAL
            ========================================== */

            let referrerId = null;


            if (referralCode) {

                const referrer =
                    await db.query(
                        `
                        SELECT id
                        FROM users
                        WHERE referral_code = $1
                        `,
                        [referralCode]
                    );


                if (
                    referrer.rows.length === 0
                ) {

                    return res.status(400).json({
                        success: false,
                        message:
                            "Invalid referral link."
                    });
                }


                referrerId =
                    referrer.rows[0].id;
            }


            /* ==========================================
               PASSWORD
            ========================================== */

            const hash =
                await bcrypt.hash(
                    password,
                    12
                );


            const newReferralCode =
                await createUniqueReferralCode();


            /* ==========================================
               CREATE ACCOUNT
            ========================================== */

            const result =
                await db.query(
                    `
                    INSERT INTO users
                    (
                        name,
                        email,
                        password,
                        balance,
                        referral_code,
                        referred_by,
                        is_blocked
                    )
                    VALUES
                    (
                        $1,
                        $2,
                        $3,
                        0,
                        $4,
                        $5,
                        FALSE
                    )
                    RETURNING id
                    `,
                    [
                        name,
                        email,
                        hash,
                        newReferralCode,
                        referrerId
                    ]
                );


            /* ==========================================
               MARK OTP AS USED
            ========================================== */

            await db.query(
                `
                UPDATE email_otps
                SET used = TRUE
                WHERE id = $1
                `,
                [otpRecord.id]
            );


            req.session.userId =
                result.rows[0].id;

            req.session.isAdmin = false;


            res.status(201).json({
                success: true,
                message:
                    "Meta NFT account created successfully.",
                referralCode:
                    newReferralCode
            });

        } catch (error) {

            console.error(
                "REGISTER ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Unable to create account."
            });
        }
    }
);
/* =====================================================
   LOGIN
===================================================== */

app.post(
    "/api/login",
    async (req, res) => {

        try {

            await db.ready;

            const email =
                normalizeEmail(
                    req.body.email
                );

            const password =
                String(
                    req.body.password || ""
                );


            const result =
                await db.query(
                    `
                    SELECT *
                    FROM users
                    WHERE email = $1
                    `,
                    [email]
                );


            if (
                result.rows.length === 0
            ) {

                return res.status(401).json({
                    success: false,
                    message:
                        "Invalid email or password."
                });
            }


            const user =
                result.rows[0];


            if (
                Boolean(user.is_blocked)
            ) {

                return res.status(403).json({
                    success: false,
                    blocked: true,
                    message:
                        "Your account has been blocked by the administrator."
                });
            }


            const correct =
                await bcrypt.compare(
                    password,
                    user.password
                );


            if (!correct) {

                return res.status(401).json({
                    success: false,
                    message:
                        "Invalid email or password."
                });
            }


            req.session.regenerate(
                error => {

                    if (error) {

                        console.error(
                            "SESSION REGENERATE ERROR:",
                            error
                        );

                        return res.status(500).json({
                            success: false,
                            message:
                                "Unable to create login session."
                        });
                    }


                    req.session.userId =
                        user.id;

                    req.session.isAdmin =
                        false;


                    req.session.save(
                        saveError => {

                            if (saveError) {

                                console.error(
                                    "SESSION SAVE ERROR:",
                                    saveError
                                );

                                return res.status(500).json({
                                    success: false,
                                    message:
                                        "Unable to save login session."
                                });
                            }


                            res.json({
                                success: true,
                                message:
                                    "Login successful."
                            });
                        }
                    );
                }
            );

        } catch (error) {

            console.error(
                "LOGIN ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Unable to login."
            });
        }
    }
);


/* =====================================================
   LOGOUT
===================================================== */

app.post(
    "/api/logout",
    (req, res) => {

        req.session.destroy(
            error => {

                if (error) {

                    return res.status(500).json({
                        success: false,
                        message:
                            "Unable to logout."
                    });
                }


                res.clearCookie(
                    "connect.sid"
                );


                res.json({
                    success: true
                });
            }
        );
    }
);


/* =====================================================
   CURRENT USER
===================================================== */

app.get(
    "/api/me",
    requireAllowedUser,
    async (req, res) => {

        try {

            const result =
                await db.query(
                    `
                    SELECT
                        id,
                        name,
                        email,
                        balance,
                        referral_code,
                        referred_by,
                        is_blocked,
                        created_at
                    FROM users
                    WHERE id = $1
                    `,
                    [req.session.userId]
                );


            if (
                result.rows.length === 0
            ) {

                return res.status(404).json({
                    success: false,
                    message:
                        "User not found."
                });
            }


            res.json({
                success: true,
                user:
                    result.rows[0]
            });

        } catch (error) {

            console.error(
                "ME ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Unable to load user."
            });
        }
    }
);


/* =====================================================
   DASHBOARD
===================================================== */

app.get(
    "/api/dashboard",
    requireAllowedUser,
    async (req, res) => {

        try {

            const userResult =
                await db.query(
                    `
                    SELECT
                        id,
                        name,
                        email,
                        balance,
                        referral_code,
                        is_blocked,
                        created_at
                    FROM users
                    WHERE id = $1
                    `,
                    [req.session.userId]
                );


            if (
                userResult.rows.length === 0
            ) {

                return res.status(404).json({
                    success: false,
                    message:
                        "User not found."
                });
            }


            const user =
                userResult.rows[0];


           /* ==============================
   TODAY'S TOTAL EARNINGS

   Includes:
   - NFT profits
   - Referral bonuses
   - Any future earning types

   Only earnings created today.
============================== */

const todayEarningsResult =
    await db.query(
        `
        SELECT
            COALESCE(
                SUM(amount),
                0
            ) AS amount
        FROM earnings
        WHERE user_id = $1
        AND created_at >= CURRENT_DATE
        AND created_at <
            CURRENT_DATE +
            INTERVAL '1 day'
        `,
        [req.session.userId]
    );

            /* ==============================
               TOTAL EARNINGS
            ============================== */

            const totalEarningsResult =
                await db.query(
                    `
                    SELECT
                        COALESCE(
                            SUM(amount),
                            0
                        ) AS total
                    FROM earnings
                    WHERE user_id = $1
                    `,
                    [req.session.userId]
                );


            /* ==============================
               NFT COUNT
            ============================== */

            const nftCountResult =
                await db.query(
                    `
                    SELECT
                        COUNT(*) AS count
                    FROM user_nfts
                    WHERE user_id = $1
                    AND status = 'owned'
                    `,
                    [req.session.userId]
                );
/* ==============================
   TOTAL TEAM
   Users directly referred by this user
============================== */

const totalTeamResult =
    await db.query(
        `
        SELECT
            COUNT(*) AS count
        FROM users
        WHERE referred_by = $1
        `,
        [req.session.userId]
    );
/* ==============================
   TOTAL TEAM
============================== */

const teamCountResult =
    await db.query(
        `
        SELECT
            COUNT(*) AS count
        FROM users
        WHERE referred_by = $1
        `,
        [req.session.userId]
    );
            /* ==============================
               REFERRAL EARNINGS
            ============================== */

            const referralResult =
                await db.query(
                    `
                    SELECT
                        COALESCE(
                            SUM(amount),
                            0
                        ) AS total
                    FROM earnings
                    WHERE user_id = $1
                    AND type = 'referral_bonus'
                    `,
                    [req.session.userId]
                );


            res.json({

                success: true,

                user,

                stats: {

                    balance:
                        Number(
                            user.balance || 0
                        ),

                    totalEarnings:
                        Number(
                            totalEarningsResult
                                .rows[0]
                                .total || 0
                        ),

                    todayEarnings:
    Number(
        todayEarningsResult
            .rows[0]
            .amount || 0
    ),

                    referralEarnings:
                        Number(
                            referralResult
                                .rows[0]
                                .total || 0
                        ),

  ownedNFTs:
    Number(
        nftCountResult
            .rows[0]
            .count || 0
    ),

teamCount:
    Number(
        teamCountResult
            .rows[0]
            .count || 0
    )
                }
            });

        } catch (error) {

            console.error(
                "DASHBOARD ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Unable to load dashboard."
            });
        }
    }
);


/* =====================================================
   NFT LIST
===================================================== */

app.get(
    "/api/nfts",
    requireAllowedUser,
    async (req, res) => {

        try {

            const result =
                await db.query(
                    `
                    SELECT
                        id,
                        name,
                        description,
                        image_url,
                        price,
                        profit_percent,
                        status,
                        created_at
                    FROM nfts
                    WHERE status = 'active'
                    ORDER BY id DESC
                    `
                );


            res.json({
                success: true,
                nfts:
                    result.rows
            });

        } catch (error) {

            console.error(
                "NFT LIST ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Unable to load NFTs."
            });
        }
    }
);


/* =====================================================
   MY NFTs
===================================================== */

app.get(
    "/api/my-nfts",
    requireAllowedUser,
    async (req, res) => {

        try {

            const result =
                await db.query(
                    `
                    SELECT
                        user_nfts.id,
                        user_nfts.user_id,
                        user_nfts.nft_id,
                        user_nfts.purchase_price,
                        user_nfts.expected_profit_percent,
                        user_nfts.expected_profit_amount,
                        user_nfts.purchase_date,
                        user_nfts.sold_at,
                        user_nfts.sale_price,
                        user_nfts.profit_amount,
                        user_nfts.status,

                        nfts.name,
                        nfts.description,
                        nfts.image_url

                    FROM user_nfts

                    LEFT JOIN nfts
                        ON user_nfts.nft_id =
                           nfts.id

                    WHERE user_nfts.user_id = $1

                    ORDER BY
                        user_nfts.id DESC
                    `,
                    [req.session.userId]
                );


            res.json({
                success: true,
                nfts:
                    result.rows
            });

        } catch (error) {

            console.error(
                "MY NFT ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Unable to load your NFTs."
            });
        }
    }
);


/* =====================================================
   DAILY RESERVATION STATUS
   Calendar-day based.

   Example:
   Reservation on Sep 12
   -> unavailable for Sep 12
   -> available again after Sep 13 begins.

   Existing old reservation records are NOT deleted.
===================================================== */

app.get(
    "/api/reservations",
    requireAllowedUser,
    async (req, res) => {

        try {

            const result =
                await db.query(
                    `
                    SELECT
                        id,
                        user_id,
                        balance_before,
                        profit_percent,
                        profit_amount,
                        balance_after,
                        status,
                        created_at
                    FROM reservations
                    WHERE user_id = $1
                    ORDER BY id DESC
                    `,
                    [req.session.userId]
                );


            const todayResult =
                await db.query(
                    `
                    SELECT id
                    FROM reservations
                    WHERE user_id = $1
                    AND created_at >= CURRENT_DATE
                    AND created_at <
                        CURRENT_DATE +
                        INTERVAL '1 day'
                    LIMIT 1
                    `,
                    [req.session.userId]
                );


            res.json({
                success: true,

                canReserve:
                    todayResult.rows.length === 0,

                reservations:
                    result.rows
            });

        } catch (error) {

            console.error(
                "RESERVATION GET ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Unable to load reservation history."
            });
        }
    }
);


/* =====================================================
   NFT RESERVATION / PURCHASE

   This replaces the old automatic-profit reservation.

   It buys an actual NFT using the user's balance.

   No automatic guaranteed profit is created.
===================================================== */

app.post(
    "/api/reservations",
    requireAllowedUser,
    async (req, res) => {

        const client =
            await db.pool.connect();

        try {

            const nftId =
                Number(req.body.nftId);


            if (
                !Number.isInteger(nftId) ||
                nftId <= 0
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Please select a valid NFT."
                });
            }


            await client.query(
                "BEGIN"
            );


            /* ==============================
               LOCK USER
            ============================== */

            const userResult =
                await client.query(
                    `
                    SELECT
                        id,
                        balance
                    FROM users
                    WHERE id = $1
                    AND is_blocked = FALSE
                    FOR UPDATE
                    `,
                    [req.session.userId]
                );


            if (
                userResult.rows.length === 0
            ) {

                await client.query(
                    "ROLLBACK"
                );

                return res.status(403).json({
                    success: false,
                    message:
                        "User account is unavailable."
                });
            }


            const user =
                userResult.rows[0];


            /* ==============================
               DAILY CALENDAR-DAY LIMIT
            ============================== */

            const todayReservation =
                await client.query(
                    `
                    SELECT id
                    FROM reservations
                    WHERE user_id = $1
                    AND created_at >= CURRENT_DATE
                    AND created_at <
                        CURRENT_DATE +
                        INTERVAL '1 day'
                    LIMIT 1
                    FOR UPDATE
                    `,
                    [user.id]
                );


            if (
                todayReservation.rows.length > 0
            ) {

                await client.query(
                    "ROLLBACK"
                );

                return res.status(429).json({
                    success: false,
                    message:
                        "You have already reserved an NFT today. Please try again after 12:00 AM."
                });
            }


            /* ==============================
               NFT
            ============================== */

            const nftResult =
                await client.query(
                    `
                    SELECT
                        id,
                        name,
                        price,
                        profit_percent,
                        status
                    FROM nfts
                    WHERE id = $1
                    AND status = 'active'
                    FOR UPDATE
                    `,
                    [nftId]
                );


            if (
                nftResult.rows.length === 0
            ) {

                await client.query(
                    "ROLLBACK"
                );

                return res.status(404).json({
                    success: false,
                    message:
                        "NFT is no longer available."
                });
            }


            const nft =
                nftResult.rows[0];


            const price =
                Number(nft.price || 0);


            const balanceBefore =
                Number(user.balance || 0);


            if (
                !Number.isFinite(price) ||
                price <= 0
            ) {

                await client.query(
                    "ROLLBACK"
                );

                return res.status(400).json({
                    success: false,
                    message:
                        "NFT price is invalid."
                });
            }


            if (
                balanceBefore < price
            ) {

                await client.query(
                    "ROLLBACK"
                );

                return res.status(400).json({
                    success: false,
                    message:
                        "Insufficient balance for this NFT."
                });
            }


            /* ==============================
               PURCHASE
            ============================== */

            const balanceAfter =
                Number(
                    (
                        balanceBefore -
                        price
                    ).toFixed(6)
                );


            await client.query(
                `
                UPDATE users
                SET balance = $1
                WHERE id = $2
                `,
                [
                    balanceAfter,
                    user.id
                ]
            );


            const userNFTResult =
                await client.query(
                    `
                    INSERT INTO user_nfts
                    (
                        user_id,
                        nft_id,
                        purchase_price,
                        expected_profit_percent,
                        expected_profit_amount,
                        status
                    )
                    VALUES
                    (
                        $1,
                        $2,
                        $3,
                        $4,
                        0,
                        'owned'
                    )
                    RETURNING id
                    `,
                    [
                        user.id,
                        nft.id,
                        price,
                        Number(
                            nft.profit_percent || 0
                        )
                    ]
                );


            /*
               Keep a reservation record for history.

               IMPORTANT:
               It is NOT an automatic profit record.
            */

            await client.query(
                `
                INSERT INTO reservations
                (
                    user_id,
                    balance_before,
                    profit_percent,
                    profit_amount,
                    balance_after,
                    status
                )
                VALUES
                (
                    $1,
                    $2,
                    0,
                    0,
                    $3,
                    'completed'
                )
                `,
                [
                    user.id,
                    balanceBefore,
                    balanceAfter
                ]
            );


            await client.query(
                "COMMIT"
            );


            res.status(201).json({

                success: true,

                message:
                    "NFT reserved successfully.",

                nft: {
                    id:
                        nft.id,

                    name:
                        nft.name,

                    price
                },

                userNFTId:
                    userNFTResult
                        .rows[0]
                        .id,

                balance:
                    balanceAfter
            });

        } catch (error) {

            try {
                await client.query(
                    "ROLLBACK"
                );
            } catch (_) {}

            console.error(
                "NFT RESERVATION ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Unable to reserve NFT."
            });

        } finally {

            client.release();
        }
    }
);

/* =====================================================
   SELL NFT
   Automatic sale price based on admin NFT profit %
===================================================== */

app.post(
    "/api/my-nfts/:id/sell",
    requireAllowedUser,
    async (req, res) => {

        const client =
            await db.pool.connect();

        try {

            const userNFTId =
                Number(req.params.id);


            if (
                !Number.isInteger(userNFTId) ||
                userNFTId <= 0
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid NFT."
                });
            }


            await client.query("BEGIN");


            /*
               Get user's NFT + original NFT settings.

               IMPORTANT:
               Sale price is NOT taken from the
               user's request.

               It is calculated automatically from
               the profit percentage saved with the NFT.
            */

            const nftResult =
                await client.query(
                    `
                    SELECT
                        user_nfts.id,
                        user_nfts.user_id,
                        user_nfts.purchase_price,
                        user_nfts.expected_profit_percent,
                        user_nfts.status,

                        nfts.id AS nft_id,
                        nfts.name AS nft_name,
                        nfts.profit_percent AS admin_profit_percent

                    FROM user_nfts

                    LEFT JOIN nfts
                        ON user_nfts.nft_id = nfts.id

                    WHERE user_nfts.id = $1
                    AND user_nfts.user_id = $2

                    FOR UPDATE OF user_nfts
                    `,
                    [
                        userNFTId,
                        req.session.userId
                    ]
                );


            if (
                nftResult.rows.length === 0
            ) {

                await client.query("ROLLBACK");

                return res.status(404).json({
                    success: false,
                    message:
                        "NFT not found."
                });
            }


            const userNFT =
                nftResult.rows[0];


            if (
                userNFT.status !== "owned"
            ) {

                await client.query("ROLLBACK");

                return res.status(400).json({
                    success: false,
                    message:
                        "This NFT has already been sold."
                });
            }


            const purchasePrice =
                Number(
                    userNFT.purchase_price || 0
                );


            /*
               Use the profit percentage that was
               saved when the user purchased the NFT.

               This protects already-purchased NFTs
               from unexpected admin changes later.
            */

            const profitPercent =
                Number(
                    userNFT.expected_profit_percent || 0
                );


            if (
                !Number.isFinite(purchasePrice) ||
                purchasePrice <= 0
            ) {

                await client.query("ROLLBACK");

                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid NFT purchase price."
                });
            }


            if (
                !Number.isFinite(profitPercent) ||
                profitPercent < 0
            ) {

                await client.query("ROLLBACK");

                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid NFT profit percentage."
                });
            }


            /*
               AUTOMATIC SELL PRICE

               Example:
               Purchase = $50
               Profit = 2%

               Profit amount = $1
               Sale price = $51
            */

            const profitAmount =
                Number(
                    (
                        purchasePrice *
                        profitPercent /
                        100
                    ).toFixed(6)
                );


            const salePrice =
                Number(
                    (
                        purchasePrice +
                        profitAmount
                    ).toFixed(6)
                );


            /*
               Credit the complete automatic
               sale price to user's wallet.
            */

            await client.query(
                `
                UPDATE users
                SET balance = balance + $1
                WHERE id = $2
                `,
                [
                    salePrice,
                    req.session.userId
                ]
            );


            /*
               Mark NFT as sold.
            */

            await client.query(
                `
                UPDATE user_nfts
                SET
                    status = 'sold',
                    sold_at = CURRENT_TIMESTAMP,
                    sale_price = $1,
                    profit_amount = $2
                WHERE id = $3
                `,
                [
                    salePrice,
                    profitAmount,
                    userNFTId
                ]
            );


            /*
               Create NFT sale history.
            */

            const saleResult =
                await client.query(
                    `
                    INSERT INTO nft_sales
                    (
                        user_nft_id,
                        user_id,
                        purchase_price,
                        sale_price,
                        profit_amount,
                        status
                    )
                    VALUES
                    (
                        $1,
                        $2,
                        $3,
                        $4,
                        $5,
                        'completed'
                    )
                    RETURNING id
                    `,
                    [
                        userNFTId,
                        req.session.userId,
                        purchasePrice,
                        salePrice,
                        profitAmount
                    ]
                );


            /*
               Positive NFT profit becomes
               an earning.

               The original purchase amount
               is NOT an earning.
            */

            if (profitAmount > 0) {

                await client.query(
                    `
                    INSERT INTO earnings
                    (
                        user_id,
                        type,
                        source_id,
                        description,
                        amount
                    )
                    VALUES
                    (
                        $1,
                        'nft_profit',
                        $2,
                        $3,
                        $4
                    )
                    `,
                    [
                        req.session.userId,
                        saleResult.rows[0].id,
                        `NFT profit - ${userNFT.nft_name || "NFT"} (${profitPercent}%)`,
                        profitAmount
                    ]
                );
            }


            /*
               Get updated balance.
            */

            const balanceResult =
                await client.query(
                    `
                    SELECT balance
                    FROM users
                    WHERE id = $1
                    `,
                    [req.session.userId]
                );


            const newBalance =
                Number(
                    balanceResult.rows[0].balance || 0
                );


            await client.query("COMMIT");


            res.json({

                success: true,

                message:
                    `NFT sold successfully for $${salePrice.toFixed(2)}.`,

                salePrice,

                purchasePrice,

                profitPercent,

                profit:
                    profitAmount,

                balanceAdded:
                    salePrice,

                balance:
                    newBalance
            });


        } catch (error) {

            try {
                await client.query("ROLLBACK");
            } catch (_) {}


            console.error(
                "SELL NFT ERROR:",
                error
            );


            res.status(500).json({
                success: false,
                message:
                    "Unable to sell NFT."
            });


        } finally {

            client.release();
        }
    }
);

/* =====================================================
   EARNINGS SUMMARY
===================================================== */

app.get(
    "/api/earnings",
    requireAllowedUser,
    async (req, res) => {

        try {

            const historyResult =
                await db.query(
                    `
                    SELECT
                        id,
                        type,
                        source_id,
                        description,
                        amount,
                        created_at
                    FROM earnings
                    WHERE user_id = $1
                    ORDER BY id DESC
                    `,
                    [req.session.userId]
                );


            const totalResult =
                await db.query(
                    `
                    SELECT
                        COALESCE(
                            SUM(amount),
                            0
                        ) AS total
                    FROM earnings
                    WHERE user_id = $1
                    `,
                    [req.session.userId]
                );


            const nftResult =
                await db.query(
                    `
                    SELECT
                        COALESCE(
                            SUM(amount),
                            0
                        ) AS total
                    FROM earnings
                    WHERE user_id = $1
                    AND type = 'nft_profit'
                    `,
                    [req.session.userId]
                );


            const referralResult =
                await db.query(
                    `
                    SELECT
                        COALESCE(
                            SUM(amount),
                            0
                        ) AS total
                    FROM earnings
                    WHERE user_id = $1
                    AND type = 'referral_bonus'
                    `,
                    [req.session.userId]
                );


            res.json({

                success: true,

                summary: {

                    totalEarnings:
                        Number(
                            totalResult
                                .rows[0]
                                .total || 0
                        ),

                    nftProfits:
                        Number(
                            nftResult
                                .rows[0]
                                .total || 0
                        ),

                    referralBonuses:
                        Number(
                            referralResult
                                .rows[0]
                                .total || 0
                        )
                },

                history:
                    historyResult.rows
            });

        } catch (error) {

            console.error(
                "EARNINGS ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Unable to load earnings."
            });
        }
    }
);


/* =====================================================
   DEPOSIT
===================================================== */

app.post(
    "/api/deposits",
    requireAllowedUser,
    async (req, res) => {

        try {

            const amount =
                Number(
                    req.body.amount
                );

            const network =
                String(
                    req.body.network || ""
                ).trim();

            const txHash =
                String(
                    req.body.txHash || ""
                ).trim();


            if (
                !validAmount(amount)
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Enter a valid amount."
                });
            }


            if (
                network !== "BEP20" &&
                network !== "TRC20"
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid network."
                });
            }


            if (!txHash) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Transaction reference is required."
                });
            }


            const existing =
                await db.query(
                    `
                    SELECT id
                    FROM deposits
                    WHERE tx_hash = $1
                    `,
                    [txHash]
                );


            if (
                existing.rows.length > 0
            ) {

                return res.status(409).json({
                    success: false,
                    message:
                        "This transaction reference already exists."
                });
            }


            const result =
                await db.query(
                    `
                    INSERT INTO deposits
                    (
                        user_id,
                        amount,
                        network,
                        tx_hash,
                        status
                    )
                    VALUES
                    (
                        $1,
                        $2,
                        $3,
                        $4,
                        'pending'
                    )
                    RETURNING id
                    `,
                    [
                        req.session.userId,
                        amount,
                        network,
                        txHash
                    ]
                );


            res.status(201).json({
                success: true,
                message:
                    "Deposit request submitted.",
                depositId:
                    result.rows[0].id,
                status:
                    "pending"
            });

        } catch (error) {

            console.error(
                "DEPOSIT ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Unable to submit deposit."
            });
        }
    }
);


/* =====================================================
   WITHDRAWAL
===================================================== */
/* =========================================================
   SEND WITHDRAWAL OTP
========================================================= */

app.post(
    "/api/withdrawals/send-otp",
    requireAllowedUser,
    async (req, res) => {

        try {

            await db.ready;

            const userResult =
                await db.query(
                    `
                    SELECT
                        id,
                        email
                    FROM users
                    WHERE id = $1
                    AND is_blocked = FALSE
                    LIMIT 1
                    `,
                    [req.session.userId]
                );


            if(
                userResult.rows.length === 0
            ){

                return res.status(403).json({
                    success:false,
                    message:
                        "User account is unavailable."
                });

            }


            const user =
                userResult.rows[0];


            await sendEmailOTP({
                email:user.email,
                purpose:"withdrawal",
                userId:user.id
            });


            return res.json({
                success:true,
                message:
                    "Withdrawal OTP has been sent to your email."
            });


        }catch(error){

            console.error(
                "SEND WITHDRAWAL OTP ERROR:",
                error
            );


            return res.status(400).json({
                success:false,
                message:
                    error.message ||
                    "Unable to send withdrawal OTP."
            });

        }

    }
);
app.post(
    "/api/withdrawals",
    requireAllowedUser,
    async (req, res) => {
const otp =
                String(
                    req.body.otp || ""
                ).trim();

            if(!/^\d{6}$/.test(otp)){
                return res.status(400).json({
                    success:false,
                    message:
                        "Enter the 6-digit withdrawal OTP."
                });
            }

            const otpResult =
                await db.query(
                    `
                    SELECT
                        id,
                        otp_hash,
                        expires_at,
                        attempts
                    FROM email_otps
                    WHERE user_id = $1
                    AND purpose = 'withdrawal'
                    AND used = FALSE
                    ORDER BY created_at DESC
                    LIMIT 1
                    `,
                    [req.session.userId]
                );

            if(otpResult.rows.length === 0){
                return res.status(400).json({
                    success:false,
                    message:
                        "Withdrawal OTP not found. Please request a new OTP."
                });
            }

            const otpRecord =
                otpResult.rows[0];

            if(
                new Date(otpRecord.expires_at).getTime()
                < Date.now()
            ){
                return res.status(400).json({
                    success:false,
                    message:
                        "Withdrawal OTP has expired. Please request a new OTP."
                });
            }

            if(
                Number(otpRecord.attempts || 0) >= 5
            ){
                return res.status(400).json({
                    success:false,
                    message:
                        "Too many incorrect OTP attempts. Please request a new OTP."
                });
            }

            const submittedOtpHash =
                hashOTP(otp);

            if(
                submittedOtpHash !==
                otpRecord.otp_hash
            ){

                await db.query(
                    `
                    UPDATE email_otps
                    SET attempts = attempts + 1
                    WHERE id = $1
                    `,
                    [otpRecord.id]
                );

                return res.status(400).json({
                    success:false,
                    message:
                        "Incorrect withdrawal OTP."
                });
            }

            await db.query(
                `
                UPDATE email_otps
                SET used = TRUE
                WHERE id = $1
                `,
                [otpRecord.id]
            );
        const client =
            await db.pool.connect();

        try {

            const amount =
                Number(
                    req.body.amount
                );

            const network =
                String(
                    req.body.network || ""
                ).trim();

            const walletAddress =
                String(
                    req.body.walletAddress || ""
                ).trim();


            if (
                !validAmount(amount)
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Enter a valid amount."
                });
            }


            if (
                network !== "BEP20" &&
                network !== "TRC20"
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid network."
                });
            }


            if (!walletAddress) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Wallet address is required."
                });
            }


            await client.query(
                "BEGIN"
            );


            const userResult =
                await client.query(
                    `
                    SELECT
                        id,
                        balance
                    FROM users
                    WHERE id = $1
                    AND is_blocked = FALSE
                    FOR UPDATE
                    `,
                    [req.session.userId]
                );


            if (
                userResult.rows.length === 0
            ) {

                await client.query(
                    "ROLLBACK"
                );

                return res.status(403).json({
                    success: false,
                    message:
                        "User account is unavailable."
                });
            }


            const balance =
                Number(
                    userResult.rows[0].balance
                );


            if (
                balance < amount
            ) {

                await client.query(
                    "ROLLBACK"
                );

                return res.status(400).json({
                    success: false,
                    message:
                        "Insufficient balance."
                });
            }


            /*
               Existing project behavior:
               amount is reserved/deducted when
               withdrawal is submitted.

               If admin rejects it, the amount
               is returned.
            */

            await client.query(
                `
                UPDATE users
                SET balance = balance - $1
                WHERE id = $2
                `,
                [
                    amount,
                    req.session.userId
                ]
            );


            const result =
                await client.query(
                    `
                    INSERT INTO withdrawals
                    (
                        user_id,
                        amount,
                        network,
                        wallet_address,
                        status
                    )
                    VALUES
                    (
                        $1,
                        $2,
                        $3,
                        $4,
                        'pending'
                    )
                    RETURNING id
                    `,
                    [
                        req.session.userId,
                        amount,
                        network,
                        walletAddress
                    ]
                );


            await client.query(
                "COMMIT"
            );


            res.status(201).json({

                success: true,

                message:
                    "Withdrawal request submitted.",

                withdrawalId:
                    result.rows[0].id
            });

        } catch (error) {

            try {
                await client.query(
                    "ROLLBACK"
                );
            } catch (_) {}

            console.error(
                "WITHDRAW ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Unable to submit withdrawal."
            });

        } finally {

            client.release();
        }
    }
);


/* =====================================================
   HISTORY
===================================================== */

app.get(
    "/api/history",
    requireAllowedUser,
    async (req, res) => {

        try {

            const deposits =
                await db.query(
                    `
                    SELECT
                        id,
                        'deposit' AS type,
                        amount,
                        network,
                        status,
                        created_at
                    FROM deposits
                    WHERE user_id = $1
                    ORDER BY id DESC
                    `,
                    [req.session.userId]
                );


            const withdrawals =
                await db.query(
                    `
                    SELECT
                        id,
                        'withdrawal' AS type,
                        amount,
                        network,
                        status,
                        created_at
                    FROM withdrawals
                    WHERE user_id = $1
                    ORDER BY id DESC
                    `,
                    [req.session.userId]
                );


            const earnings =
                await db.query(
                    `
                    SELECT
                        id,
                        type,
                        description,
                        amount,
                        'completed' AS status,
                        created_at
                    FROM earnings
                    WHERE user_id = $1
                    ORDER BY id DESC
                    `,
                    [req.session.userId]
                );
const nftPurchases =
    await db.query(
        `
        SELECT
            user_nfts.id,
            nfts.name AS nft_name,
            user_nfts.purchase_price AS amount,
            user_nfts.purchase_date AS created_at
        FROM user_nfts
        INNER JOIN nfts
            ON nfts.id = user_nfts.nft_id
        WHERE user_nfts.user_id = $1
        ORDER BY user_nfts.id DESC
        `,
        [req.session.userId]
    );

const nftSales =
    await db.query(
        `
        SELECT
            nft_sales.id,
            nfts.name AS nft_name,
            nft_sales.sale_price AS amount,
            nft_sales.profit_amount,
            nft_sales.created_at
        FROM nft_sales
        INNER JOIN user_nfts
            ON user_nfts.id = nft_sales.user_nft_id
        INNER JOIN nfts
            ON nfts.id = user_nfts.nft_id
        WHERE nft_sales.user_id = $1
        ORDER BY nft_sales.id DESC
        `,
        [req.session.userId]
    );

           res.json({
    success: true,
    deposits:
        deposits.rows,
    withdrawals:
        withdrawals.rows,
    earnings:
        earnings.rows,
    nftPurchases:
        nftPurchases.rows,
    nftSales:
        nftSales.rows
});
        } catch (error) {

            console.error(
                "HISTORY ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Unable to load history."
            });
        }
    }
);


/* =====================================================
   REFERRAL
===================================================== */

app.get(
    "/api/referral",
    requireAllowedUser,
    async (req, res) => {

        try {

            const userResult =
                await db.query(
                    `
                    SELECT
                        id,
                        referral_code
                    FROM users
                    WHERE id = $1
                    `,
                    [req.session.userId]
                );


            if (
                userResult.rows.length === 0
            ) {

                return res.status(404).json({
                    success: false,
                    message:
                        "User not found."
                });
            }


            const user =
                userResult.rows[0];


            const referralCode =
                user.referral_code;


            const referralLink =
                `${req.protocol}://${req.get("host")}/?ref=${encodeURIComponent(referralCode)}`;


            const teamResult =
                await db.query(
                    `
                    SELECT
                        id,
                        name,
                        email,
                        created_at
                    FROM users
                    WHERE referred_by = $1
                    ORDER BY id DESC
                    `,
                    [req.session.userId]
                );


            const earningsResult =
                await db.query(
                    `
                    SELECT
                        id,
                        source_id,
                        description,
                        amount,
                        created_at
                    FROM earnings
                    WHERE user_id = $1
                    AND type = 'referral_bonus'
                    ORDER BY id DESC
                    `,
                    [req.session.userId]
                );


            const totalResult =
                await db.query(
                    `
                    SELECT
                        COALESCE(
                            SUM(amount),
                            0
                        ) AS total
                    FROM earnings
                    WHERE user_id = $1
                    AND type = 'referral_bonus'
                    `,
                    [req.session.userId]
                );


            res.json({

                success: true,

                referralCode,

                referralLink,

                bonusPercent: 10,

                teamCount:
                    teamResult.rows.length,

                totalBonus:
                    Number(
                        totalResult
                            .rows[0]
                            .total || 0
                    ),

                team:
                    teamResult.rows,

                bonuses:
                    earningsResult.rows
            });

        } catch (error) {

            console.error(
                "REFERRAL ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Unable to load referral information."
            });
        }
    }
);


/* =====================================================
   ADMIN LOGIN
===================================================== */

app.post(
    "/api/admin/login",
    (req, res) => {

        const email =
            normalizeEmail(
                req.body.email
            );

        const password =
            String(
                req.body.password || ""
            );


        if (
            email !== ADMIN_EMAIL ||
            password !== ADMIN_PASSWORD
        ) {

            return res.status(401).json({
                success: false,
                message:
                    "Invalid admin credentials."
            });
        }


        req.session.regenerate(
            error => {

                if (error) {

                    return res.status(500).json({
                        success: false,
                        message:
                            "Unable to create admin session."
                    });
                }


                req.session.isAdmin =
                    true;

                req.session.userId =
                    null;


                req.session.save(
                    saveError => {

                        if (saveError) {

                            return res.status(500).json({
                                success: false,
                                message:
                                    "Unable to save admin session."
                            });
                        }


                        res.json({
                            success: true,
                            message:
                                "Admin login successful."
                        });
                    }
                );
            }
        );
    }
);


/* =====================================================
   ADMIN LOGOUT
===================================================== */

app.post(
    "/api/admin/logout",
    (req, res) => {

        req.session.destroy(
            error => {

                if (error) {

                    return res.status(500).json({
                        success: false,
                        message:
                            "Unable to logout."
                    });
                }


                res.clearCookie(
                    "connect.sid"
                );


                res.json({
                    success: true
                });
            }
        );
    }
);


/* =====================================================
   ADMIN ME
===================================================== */

app.get(
    "/api/admin/me",
    requireAdmin,
    (req, res) => {

        res.json({
            success: true,
            admin: true,
            email: ADMIN_EMAIL,
            platform: "Meta NFT"
        });
    }
);


/* =====================================================
   ADMIN USERS
===================================================== */

app.get(
    "/api/admin/users",
    requireAdmin,
    async (req, res) => {

        try {

            const result =
                await db.query(
                    `
                    SELECT
                        id,
                        name,
                        email,
                        balance,
                        referral_code,
                        referred_by,
                        is_blocked,
                        created_at
                    FROM users
                    ORDER BY id DESC
                    `
                );


            res.json({
                success: true,
                users:
                    result.rows
            });

        } catch (error) {

            console.error(
                "ADMIN USERS ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Unable to load users."
            });
        }
    }
);


/* =====================================================
   ADMIN BLOCK USER
===================================================== */

app.post(
    "/api/admin/users/:id/block",
    requireAdmin,
    async (req, res) => {

        try {

            const userId =
                Number(req.params.id);


            if (
                !Number.isInteger(userId) ||
                userId <= 0
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid user ID."
                });
            }


            const result =
                await db.query(
                    `
                    UPDATE users
                    SET is_blocked = TRUE
                    WHERE id = $1
                    RETURNING id
                    `,
                    [userId]
                );


            if (
                result.rows.length === 0
            ) {

                return res.status(404).json({
                    success: false,
                    message:
                        "User not found."
                });
            }


            res.json({
                success: true,
                message:
                    "User blocked successfully."
            });

        } catch (error) {

            console.error(
                "BLOCK USER ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Unable to block user."
            });
        }
    }
);


/* =====================================================
   ADMIN ALLOW USER
===================================================== */

app.post(
    "/api/admin/users/:id/allow",
    requireAdmin,
    async (req, res) => {

        try {

            const userId =
                Number(req.params.id);


            if (
                !Number.isInteger(userId) ||
                userId <= 0
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid user ID."
                });
            }


            const result =
                await db.query(
                    `
                    UPDATE users
                    SET is_blocked = FALSE
                    WHERE id = $1
                    RETURNING id
                    `,
                    [userId]
                );


            if (
                result.rows.length === 0
            ) {

                return res.status(404).json({
                    success: false,
                    message:
                        "User not found."
                });
            }


            res.json({
                success: true,
                message:
                    "User allowed successfully."
            });

        } catch (error) {

            console.error(
                "ALLOW USER ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Unable to allow user."
            });
        }
    }
);


/* =====================================================
   ADMIN DEPOSITS
===================================================== */

app.get(
    "/api/admin/deposits",
    requireAdmin,
    async (req, res) => {

        try {

            const result =
                await db.query(
                    `
                    SELECT
                        deposits.id,
                        deposits.user_id,
                        deposits.amount,
                        deposits.network,
                        deposits.tx_hash,
                        deposits.status,
                        deposits.created_at,
                        users.name,
                        users.email
                    FROM deposits
                    LEFT JOIN users
                        ON deposits.user_id =
                           users.id
                    ORDER BY deposits.id DESC
                    `
                );


            res.json({
                success: true,
                deposits:
                    result.rows
            });

        } catch (error) {

            console.error(
                "ADMIN DEPOSITS ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Unable to load deposits."
            });
        }
    }
);


/* =====================================================
   ADMIN APPROVE DEPOSIT
===================================================== */

app.post(
    "/api/admin/deposits/:id/approve",
    requireAdmin,
    async (req, res) => {

        const client =
            await db.pool.connect();

        try {

            const depositId =
                Number(req.params.id);


            await client.query(
                "BEGIN"
            );


            const depositResult =
                await client.query(
                    `
                    SELECT
                        id,
                        user_id,
                        amount,
                        status
                    FROM deposits
                    WHERE id = $1
                    FOR UPDATE
                    `,
                    [depositId]
                );


            if (
                depositResult.rows.length === 0
            ) {

                await client.query(
                    "ROLLBACK"
                );

                return res.status(404).json({
                    success: false,
                    message:
                        "Deposit request not found."
                });
            }


            const deposit =
                depositResult.rows[0];


            if (
                deposit.status !==
                "pending"
            ) {

                await client.query(
                    "ROLLBACK"
                );

                return res.status(400).json({
                    success: false,
                    message:
                        "This deposit has already been processed."
                });
            }


            await client.query(
                `
                UPDATE deposits
                SET status = 'approved'
                WHERE id = $1
                `,
                [depositId]
            );


            await client.query(
                `
                UPDATE users
                SET balance = balance + $1
                WHERE id = $2
                `,
                [
                    Number(
                        deposit.amount
                    ),
                    deposit.user_id
                ]
            );


            /*
               Existing referral system preserved.

               Additionally, the referral bonus is now
               recorded in the central earnings table.
            */

            const userResult =
                await client.query(
                    `
                    SELECT
                        referred_by
                    FROM users
                    WHERE id = $1
                    `,
                    [deposit.user_id]
                );


            let referralBonus = 0;


            if (
                userResult.rows.length > 0 &&
                userResult.rows[0].referred_by
            ) {

                const referrerId =
                    Number(
                        userResult.rows[0]
                            .referred_by
                    );


                referralBonus =
                    Number(
                        (
                            Number(
                                deposit.amount
                            ) *
                            10 /
                            100
                        ).toFixed(6)
                    );


                await client.query(
                    `
                    UPDATE users
                    SET balance =
                        balance + $1
                    WHERE id = $2
                    `,
                    [
                        referralBonus,
                        referrerId
                    ]
                );


                /*
                   Preserve existing referral_bonuses
                   table data/structure.
                */

                await client.query(
                    `
                    INSERT INTO referral_bonuses
                    (
                        referrer_id,
                        referred_user_id,
                        deposit_id,
                        deposit_amount,
                        bonus_percent,
                        bonus_amount
                    )
                    VALUES
                    (
                        $1,
                        $2,
                        $3,
                        $4,
                        10,
                        $5
                    )
                    `,
                    [
                        referrerId,
                        deposit.user_id,
                        deposit.id,
                        Number(
                            deposit.amount
                        ),
                        referralBonus
                    ]
                );


                /*
                   New central earnings history.
                */

                await client.query(
                    `
                    INSERT INTO earnings
                    (
                        user_id,
                        type,
                        source_id,
                        description,
                        amount
                    )
                    VALUES
                    (
                        $1,
                        'referral_bonus',
                        $2,
                        $3,
                        $4
                    )
                    `,
                    [
                        referrerId,
                        deposit.id,
                        "Team referral bonus",
                        referralBonus
                    ]
                );
            }


            await client.query(
                "COMMIT"
            );


            res.json({

                success: true,

                message:
                    "Deposit approved and balance updated.",

                depositId:
                    deposit.id,

                amount:
                    Number(
                        deposit.amount
                    ),

                referralBonus
            });

        } catch (error) {

            try {
                await client.query(
                    "ROLLBACK"
                );
            } catch (_) {}

            console.error(
                "APPROVE DEPOSIT ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Unable to approve deposit."
            });

        } finally {

            client.release();
        }
    }
);


/* =====================================================
   ADMIN REJECT DEPOSIT
===================================================== */

app.post(
    "/api/admin/deposits/:id/reject",
    requireAdmin,
    async (req, res) => {

        try {

            const depositId =
                Number(req.params.id);


            const result =
                await db.query(
                    `
                    SELECT
                        id,
                        status
                    FROM deposits
                    WHERE id = $1
                    `,
                    [depositId]
                );


            if (
                result.rows.length === 0
            ) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Deposit not found."
                });
            }


            if (
                result.rows[0].status !==
                "pending"
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "This deposit has already been processed."
                });
            }


            await db.query(
                `
                UPDATE deposits
                SET status = 'rejected'
                WHERE id = $1
                `,
                [depositId]
            );


            res.json({
                success: true,
                message:
                    "Deposit rejected."
            });

        } catch (error) {

            console.error(
                "REJECT DEPOSIT ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Unable to reject deposit."
            });
        }
    }
);


/* =====================================================
   ADMIN WITHDRAWALS
===================================================== */

app.get(
    "/api/admin/withdrawals",
    requireAdmin,
    async (req, res) => {

        try {

            const result =
                await db.query(
                    `
                    SELECT
                        withdrawals.id,
                        withdrawals.user_id,
                        withdrawals.amount,
                        withdrawals.network,
                        withdrawals.wallet_address,
                        withdrawals.status,
                        withdrawals.created_at,
                        users.name,
                        users.email
                    FROM withdrawals
                    LEFT JOIN users
                        ON withdrawals.user_id =
                           users.id
                    ORDER BY withdrawals.id DESC
                    `
                );


            res.json({
                success: true,
                withdrawals:
                    result.rows
            });

        } catch (error) {

            console.error(
                "ADMIN WITHDRAWALS ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Unable to load withdrawals."
            });
        }
    }
);


/* =====================================================
   ADMIN APPROVE WITHDRAWAL
===================================================== */

app.post(
    "/api/admin/withdrawals/:id/approve",
    requireAdmin,
    async (req, res) => {

        try {

            const withdrawalId =
                Number(req.params.id);


            const result =
                await db.query(
                    `
                    SELECT
                        id,
                        amount,
                        status
                    FROM withdrawals
                    WHERE id = $1
                    `,
                    [withdrawalId]
                );


            if (
                result.rows.length === 0
            ) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Withdrawal request not found."
                });
            }


            const withdrawal =
                result.rows[0];


            if (
                withdrawal.status !==
                "pending"
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "This withdrawal has already been processed."
                });
            }


            /*
               Amount was already reserved from
               the balance when request was created.

               Therefore approval changes only
               the request status.
            */

            await db.query(
                `
                UPDATE withdrawals
                SET status = 'approved'
                WHERE id = $1
                `,
                [withdrawalId]
            );


            res.json({

                success: true,

                message:
                    "Withdrawal approved.",

                withdrawalId:
                    withdrawal.id,

                amount:
                    Number(
                        withdrawal.amount
                    )
            });

        } catch (error) {

            console.error(
                "APPROVE WITHDRAWAL ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Unable to approve withdrawal."
            });
        }
    }
);


/* =====================================================
   ADMIN REJECT WITHDRAWAL
===================================================== */

app.post(
    "/api/admin/withdrawals/:id/reject",
    requireAdmin,
    async (req, res) => {

        const client =
            await db.pool.connect();

        try {

            const withdrawalId =
                Number(req.params.id);


            await client.query(
                "BEGIN"
            );


            const result =
                await client.query(
                    `
                    SELECT
                        id,
                        user_id,
                        amount,
                        status
                    FROM withdrawals
                    WHERE id = $1
                    FOR UPDATE
                    `,
                    [withdrawalId]
                );


            if (
                result.rows.length === 0
            ) {

                await client.query(
                    "ROLLBACK"
                );

                return res.status(404).json({
                    success: false,
                    message:
                        "Withdrawal request not found."
                });
            }


            const withdrawal =
                result.rows[0];


            if (
                withdrawal.status !==
                "pending"
            ) {

                await client.query(
                    "ROLLBACK"
                );

                return res.status(400).json({
                    success: false,
                    message:
                        "This withdrawal has already been processed."
                });
            }


            await client.query(
                `
                UPDATE withdrawals
                SET status = 'rejected'
                WHERE id = $1
                `,
                [withdrawalId]
            );


            await client.query(
                `
                UPDATE users
                SET balance =
                    balance + $1
                WHERE id = $2
                `,
                [
                    Number(
                        withdrawal.amount
                    ),
                    withdrawal.user_id
                ]
            );


            await client.query(
                "COMMIT"
            );


            res.json({

                success: true,

                message:
                    "Withdrawal rejected and amount returned.",

                withdrawalId:
                    withdrawal.id,

                amount:
                    Number(
                        withdrawal.amount
                    )
            });

        } catch (error) {

            try {
                await client.query(
                    "ROLLBACK"
                );
            } catch (_) {}

            console.error(
                "REJECT WITHDRAWAL ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Unable to reject withdrawal."
            });

        } finally {

            client.release();
        }
    }
);


/* =====================================================
   ADMIN RESERVATIONS
===================================================== */

app.get(
    "/api/admin/reservations",
    requireAdmin,
    async (req, res) => {

        try {

            const result =
                await db.query(
                    `
                    SELECT
                        reservations.id,
                        reservations.user_id,
                        reservations.balance_before,
                        reservations.profit_percent,
                        reservations.profit_amount,
                        reservations.balance_after,
                        reservations.status,
                        reservations.created_at,
                        users.name,
                        users.email
                    FROM reservations
                    LEFT JOIN users
                        ON reservations.user_id =
                           users.id
                    ORDER BY reservations.id DESC
                    `
                );


            res.json({
                success: true,
                reservations:
                    result.rows
            });

        } catch (error) {

            console.error(
                "ADMIN RESERVATIONS ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Unable to load reservations."
            });
        }
    }
);


/* =====================================================
   ADMIN NFT LIST
===================================================== */

app.get(
    "/api/admin/nfts",
    requireAdmin,
    async (req, res) => {

        try {

            const result =
                await db.query(
                    `
                    SELECT
                        id,
                        name,
                        description,
                        image_url,
                        price,
                        profit_percent,
                        status,
                        created_at
                    FROM nfts
                    ORDER BY id DESC
                    `
                );


            res.json({
                success: true,
                nfts:
                    result.rows
            });

        } catch (error) {

            console.error(
                "ADMIN NFT LIST ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Unable to load NFTs."
            });
        }
    }
);

/* =====================================================
   ADMIN CREATE NFT
===================================================== */

app.post(
    "/api/admin/nfts",
    requireAdmin,
    nftUpload.single("image"),
    async (req, res) => {

        try {

            const name =
                String(
                    req.body.name || ""
                ).trim();


            const description =
                String(
                    req.body.description || ""
                ).trim();


            const price =
                Number(
                    req.body.price
                );


            const profitPercent =
                Number(
                    req.body.profit_percent || 0
                );


            if (!name) {

                if (
                    req.file &&
                    req.file.path &&
                    fs.existsSync(req.file.path)
                ) {
                    fs.unlinkSync(req.file.path);
                }

                return res.status(400).json({
                    success: false,
                    message:
                        "NFT name is required."
                });
            }


            if (
                !validAmount(price)
            ) {

                if (
                    req.file &&
                    req.file.path &&
                    fs.existsSync(req.file.path)
                ) {
                    fs.unlinkSync(req.file.path);
                }

                return res.status(400).json({
                    success: false,
                    message:
                        "NFT price must be greater than zero."
                });
            }


            if (
                !Number.isFinite(
                    profitPercent
                ) ||
                profitPercent < 0
            ) {

                if (
                    req.file &&
                    req.file.path &&
                    fs.existsSync(req.file.path)
                ) {
                    fs.unlinkSync(req.file.path);
                }

                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid profit percentage."
                });
            }


            if (!req.file) {

                return res.status(400).json({
                    success: false,
                    message:
                        "NFT image is required."
                });
            }


            const uploadResult =
    await new Promise(
        (resolve, reject) => {

            const uploadStream =
                cloudinary.uploader.upload_stream(
                    {
                        folder: "meta-nft"
                    },
                    (
                        error,
                        result
                    ) => {

                        if (error) {
                            reject(error);
                        } else {
                            resolve(result);
                        }

                    }
                );

            uploadStream.end(
                req.file.buffer
            );

        }
    );


const imageUrl =
    uploadResult.secure_url;


            const result =
                await db.query(
                    `
                    INSERT INTO nfts
                    (
                        name,
                        description,
                        image_url,
                        price,
                        profit_percent,
                        status
                    )
                    VALUES
                    (
                        $1,
                        $2,
                        $3,
                        $4,
                        $5,
                        'active'
                    )
                    RETURNING *
                    `,
                    [
                        name,
                        description,
                        imageUrl,
                        price,
                        profitPercent
                    ]
                );


            res.status(201).json({

                success: true,

                message:
                    "NFT created successfully.",

                nft:
                    result.rows[0]
            });


        } catch (error) {

            console.error(
                "CREATE NFT ERROR:",
                error
            );


            if (
                req.file &&
                req.file.path &&
                fs.existsSync(req.file.path)
            ) {

                try {

                    fs.unlinkSync(
                        req.file.path
                    );

                } catch (deleteError) {

                    console.error(
                        "IMAGE CLEANUP ERROR:",
                        deleteError
                    );

                }
            }


            res.status(500).json({
                success: false,
                message:
                    error.message ||
                    "Unable to create NFT."
            });
        }
    }
);
/* =====================================================
   ADMIN REPLACE NFT IMAGE
===================================================== */

app.post(
    "/api/admin/nfts/:id/image",
    requireAdmin,
    nftUpload.single("image"),
    async (req, res) => {

        try {

            const nftId =
                Number(req.params.id);

            if (
                !Number.isInteger(nftId) ||
                nftId <= 0
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid NFT ID."
                });
            }


            if (!req.file) {

                return res.status(400).json({
                    success: false,
                    message:
                        "NFT image is required."
                });
            }


            const uploadResult =
                await new Promise(
                    (resolve, reject) => {

                        const uploadStream =
                            cloudinary.uploader.upload_stream(
                                {
                                    folder:
                                        "meta-nft"
                                },
                                (
                                    error,
                                    result
                                ) => {

                                    if (error) {
                                        reject(error);
                                    } else {
                                        resolve(result);
                                    }

                                }
                            );


                        uploadStream.end(
                            req.file.buffer
                        );

                    }
                );


            const imageUrl =
                uploadResult.secure_url;


            const result =
                await db.query(
                    `
                    UPDATE nfts
                    SET image_url = $1
                    WHERE id = $2
                    RETURNING id, name, image_url
                    `,
                    [
                        imageUrl,
                        nftId
                    ]
                );


            if (
                result.rows.length === 0
            ) {

                return res.status(404).json({
                    success: false,
                    message:
                        "NFT not found."
                });
            }


            res.json({

                success: true,

                message:
                    "NFT image replaced successfully.",

                nft:
                    result.rows[0]

            });


        } catch (error) {

            console.error(
                "REPLACE NFT IMAGE ERROR:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    error.message ||
                    "Unable to replace NFT image."

            });

        }

    }
);


/* =====================================================
   ADMIN PAYMENT ADDRESSES
===================================================== */

app.get(
    "/api/admin/payment-addresses",
    requireAdmin,
    async (req, res) => {

        try {

            const result =
                await db.query(`
                    SELECT
                        setting_key,
                        setting_value
                    FROM site_settings
                    WHERE setting_key IN (
                        'bep20_usdt_address',
                        'trc20_usdt_address'
                    )
                `);


            const settings = {};


            result.rows.forEach(row => {

                settings[
                    row.setting_key
                ] = row.setting_value;

            });


            res.json({

                success: true,

                bep20:
                    settings.bep20_usdt_address ||
                    process.env.BEP20_USDT_ADDRESS ||
                    "",

                trc20:
                    settings.trc20_usdt_address ||
                    process.env.TRC20_USDT_ADDRESS ||
                    ""

            });


        } catch (error) {

            console.error(
                "GET PAYMENT ADDRESSES ERROR:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Unable to load payment addresses."

            });

        }
    }
);


app.post(
    "/api/admin/payment-addresses",
    requireAdmin,
    async (req, res) => {

        try {

            const bep20 =
                String(
                    req.body.bep20 || ""
                ).trim();


            const trc20 =
                String(
                    req.body.trc20 || ""
                ).trim();


            if (!bep20) {

                return res.status(400).json({

                    success: false,

                    message:
                        "BEP20 address is required."

                });

            }


            if (!trc20) {

                return res.status(400).json({

                    success: false,

                    message:
                        "TRC20 address is required."

                });

            }


            await db.query(
                `
                INSERT INTO site_settings
                (
                    setting_key,
                    setting_value,
                    updated_at
                )
                VALUES
                (
                    'bep20_usdt_address',
                    $1,
                    CURRENT_TIMESTAMP
                )
                ON CONFLICT (setting_key)
                DO UPDATE SET
                    setting_value =
                        EXCLUDED.setting_value,
                    updated_at =
                        CURRENT_TIMESTAMP
                `,
                [bep20]
            );


            await db.query(
                `
                INSERT INTO site_settings
                (
                    setting_key,
                    setting_value,
                    updated_at
                )
                VALUES
                (
                    'trc20_usdt_address',
                    $1,
                    CURRENT_TIMESTAMP
                )
                ON CONFLICT (setting_key)
                DO UPDATE SET
                    setting_value =
                        EXCLUDED.setting_value,
                    updated_at =
                        CURRENT_TIMESTAMP
                `,
                [trc20]
            );


            res.json({

                success: true,

                message:
                    "USDT payment addresses updated successfully."

            });


        } catch (error) {

            console.error(
                "UPDATE PAYMENT ADDRESSES ERROR:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Unable to update payment addresses."

            });

        }
    }
);

/* =====================================================
   ADMIN UPDATE NFT STATUS
===================================================== */

app.post(
    "/api/admin/nfts/:id/status",
    requireAdmin,
    async (req, res) => {

        try {

            const nftId =
                Number(req.params.id);

            const status =
                String(
                    req.body.status || ""
                ).trim().toLowerCase();


            if (
                !["active", "inactive"]
                    .includes(status)
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid NFT status."
                });
            }


            const result =
                await db.query(
                    `
                    UPDATE nfts
                    SET status = $1
                    WHERE id = $2
                    RETURNING id
                    `,
                    [
                        status,
                        nftId
                    ]
                );


            if (
                result.rows.length === 0
            ) {

                return res.status(404).json({
                    success: false,
                    message:
                        "NFT not found."
                });
            }


            res.json({
                success: true,
                message:
                    "NFT status updated."
            });

        } catch (error) {

            console.error(
                "NFT STATUS ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Unable to update NFT status."
            });
        }
    }
);


/* =====================================================
   ADMIN USER NFTS
===================================================== */

app.get(
    "/api/admin/user-nfts",
    requireAdmin,
    async (req, res) => {

        try {

            const result =
                await db.query(
                    `
                    SELECT
                        user_nfts.id,
                        user_nfts.user_id,
                        user_nfts.nft_id,
                        user_nfts.purchase_price,
                        user_nfts.purchase_date,
                        user_nfts.sale_price,
                        user_nfts.profit_amount,
                        user_nfts.status,

                        users.name,
                        users.email,

                        nfts.name AS nft_name

                    FROM user_nfts

                    LEFT JOIN users
                        ON user_nfts.user_id =
                           users.id

                    LEFT JOIN nfts
                        ON user_nfts.nft_id =
                           nfts.id

                    ORDER BY
                        user_nfts.id DESC
                    `
                );


            res.json({
                success: true,
                userNFTs:
                    result.rows
            });

        } catch (error) {

            console.error(
                "ADMIN USER NFT ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Unable to load user NFTs."
            });
        }
    }
);


/* =====================================================
   ADMIN EARNINGS
===================================================== */

app.get(
    "/api/admin/earnings",
    requireAdmin,
    async (req, res) => {

        try {

            const result =
                await db.query(
                    `
                    SELECT
                        earnings.id,
                        earnings.user_id,
                        earnings.type,
                        earnings.source_id,
                        earnings.description,
                        earnings.amount,
                        earnings.created_at,
                        users.name,
                        users.email
                    FROM earnings
                    LEFT JOIN users
                        ON earnings.user_id =
                           users.id
                    ORDER BY
                        earnings.id DESC
                    `
                );


            res.json({
                success: true,
                earnings:
                    result.rows
            });

        } catch (error) {

            console.error(
                "ADMIN EARNINGS ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Unable to load earnings."
            });
        }
    }
);


/* =====================================================
   ADMIN DASHBOARD SUMMARY
===================================================== */

app.get(
    "/api/admin/summary",
    requireAdmin,
    async (req, res) => {

        try {

            const usersResult =
                await db.query(
                    `
                    SELECT
                        COUNT(*) AS total_users,
                        COALESCE(
                            SUM(balance),
                            0
                        ) AS total_balance,
                        COUNT(*) FILTER (
                            WHERE is_blocked = TRUE
                        ) AS blocked_users
                    FROM users
                    `
                );


            const depositsResult =
                await db.query(
                    `
                    SELECT
                        COUNT(*) FILTER (
                            WHERE status = 'pending'
                        ) AS pending,
                        COALESCE(
                            SUM(amount) FILTER (
                                WHERE status = 'approved'
                            ),
                            0
                        ) AS approved_total
                    FROM deposits
                    `
                );


            const withdrawalsResult =
                await db.query(
                    `
                    SELECT
                        COUNT(*) FILTER (
                            WHERE status = 'pending'
                        ) AS pending,
                        COALESCE(
                            SUM(amount) FILTER (
                                WHERE status = 'approved'
                            ),
                            0
                        ) AS approved_total
                    FROM withdrawals
                    `
                );


            const earningsResult =
                await db.query(
                    `
                    SELECT
                        COALESCE(
                            SUM(amount),
                            0
                        ) AS total
                    FROM earnings
                    `
                );


            const nftResult =
                await db.query(
                    `
                    SELECT
                        COUNT(*) AS total
                    FROM nfts
                    WHERE status = 'active'
                    `
                );


            res.json({

                success: true,

                users: {
                    total:
                        Number(
                            usersResult
                                .rows[0]
                                .total_users || 0
                        ),

                    blocked:
                        Number(
                            usersResult
                                .rows[0]
                                .blocked_users || 0
                        ),

                    totalBalance:
                        Number(
                            usersResult
                                .rows[0]
                                .total_balance || 0
                        )
                },

                deposits: {
                    pending:
                        Number(
                            depositsResult
                                .rows[0]
                                .pending || 0
                        ),

                    approvedTotal:
                        Number(
                            depositsResult
                                .rows[0]
                                .approved_total || 0
                        )
                },

                withdrawals: {
                    pending:
                        Number(
                            withdrawalsResult
                                .rows[0]
                                .pending || 0
                        ),

                    approvedTotal:
                        Number(
                            withdrawalsResult
                                .rows[0]
                                .approved_total || 0
                        )
                },

                earnings:
                    Number(
                        earningsResult
                            .rows[0]
                            .total || 0
                    ),

                activeNFTs:
                    Number(
                        nftResult
                            .rows[0]
                            .total || 0
                    )
            });

        } catch (error) {

            console.error(
                "ADMIN SUMMARY ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Unable to load admin summary."
            });
        }
    }
);


/* =====================================================
   SERVER START
===================================================== */

async function startServer() {

    try {

        await db.ready;


        app.listen(
            PORT,
            "0.0.0.0",
            () => {

                console.log(
                    "Meta NFT server running on port " +
                    PORT
                );
            }
        );

    } catch (error) {

        console.error(
            "SERVER START ERROR:",
            error
        );

        process.exit(1);
    }
}


startServer();