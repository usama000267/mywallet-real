/* =====================================================
   META NFT — PASSWORD SYSTEM
   Secure OTP + Password Utilities
===================================================== */

const express = require("express");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const router = express.Router();


/* =====================================================
   CONFIG
===================================================== */

const OTP_EXPIRY_MINUTES = 10;
const OTP_RESEND_SECONDS = 60;
const MAX_OTP_ATTEMPTS = 5;


/* =====================================================
   GENERATE OTP
===================================================== */

function generateOTP() {

    return crypto
        .randomInt(100000, 1000000)
        .toString();

}


/* =====================================================
   HASH OTP
===================================================== */

function hashOTP(otp) {

    return crypto
        .createHash("sha256")
        .update(String(otp))
        .digest("hex");

}


/* =====================================================
   PASSWORD VALIDATION
===================================================== */

function validatePassword(password) {

    if (
        typeof password !== "string" ||
        password.length < 8
    ) {

        return {
            valid: false,
            message:
                "Password must be at least 8 characters."
        };

    }


    if (!/[A-Z]/.test(password)) {

        return {
            valid: false,
            message:
                "Password must contain at least one uppercase letter."
        };

    }


    if (!/[a-z]/.test(password)) {

        return {
            valid: false,
            message:
                "Password must contain at least one lowercase letter."
        };

    }


    if (!/[0-9]/.test(password)) {

        return {
            valid: false,
            message:
                "Password must contain at least one number."
        };

    }


    return {
        valid: true
    };

}


/* =====================================================
   HASH PASSWORD
===================================================== */

async function hashPassword(password) {

    return bcrypt.hash(
        password,
        12
    );

}


/* =====================================================
   EXPIRY
===================================================== */

function getExpiryDate() {

    return new Date(
        Date.now() +
        OTP_EXPIRY_MINUTES * 60 * 1000
    );

}


/* =====================================================
   PASSWORD SYSTEM ROUTER FACTORY
===================================================== */

function createPasswordSystem({
    db,
    resend,
    requireAllowedUser
}) {

    if (!db) {
        throw new Error(
            "Password system requires database."
        );
    }


    if (!resend) {
        throw new Error(
            "Password system requires email service."
        );
    }


    if (!requireAllowedUser) {
        throw new Error(
            "Password system requires user authentication middleware."
        );
    }
const passwordRouter =
        express.Router();
/* =====================================================
   GET REGISTERED EMAIL — CHANGE PASSWORD
===================================================== */

passwordRouter.get(
    "/change-password/email",
    requireAllowedUser,
    async (req, res) => {

        try {

            const userId =
                req.session.userId;


            const userResult =
                await db.query(
                    `
                    SELECT email
                    FROM users
                    WHERE id = $1
                    `,
                    [userId]
                );


            if (
                userResult.rows.length === 0
            ) {

                return res.status(404).json({
                    success: false,
                    message:
                        "User account not found."
                });

            }


            const email =
                String(
                    userResult.rows[0].email || ""
                )
                .trim()
                .toLowerCase();


            if (!email) {

                return res.status(400).json({
                    success: false,
                    message:
                        "No registered email found for this account."
                });

            }


            return res.json({

                success: true,

                email

            });


        } catch (error) {

            console.error(
                "PASSWORD EMAIL ERROR:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Unable to load registered email."

            });

        }

    }
);
/* =====================================================
   GET OTP — CHANGE PASSWORD
===================================================== */

passwordRouter.post(
    "/change-password/request-otp",
    requireAllowedUser,
    async (req, res) => {

        try {

            const userId =
                req.session.userId;


            const userResult =
                await db.query(
                    `
                    SELECT
                        id,
                        email
                    FROM users
                    WHERE id = $1
                    `,
                    [userId]
                );


            if (
                userResult.rows.length === 0
            ) {

                return res.status(404).json({
                    success: false,
                    message:
                        "User account not found."
                });

            }


            const email =
                String(
                    userResult.rows[0].email || ""
                )
                .trim()
                .toLowerCase();


            if (!email) {

                return res.status(400).json({
                    success: false,
                    message:
                        "No registered email found for this account."
                });

            }


            /* ==========================================
               CHECK RESEND LIMIT
            ========================================== */

            const existing =
                await db.query(
                    `
                    SELECT
                        id,
                        resend_available_at
                    FROM email_otps
                    WHERE email = $1
                    AND purpose = 'password_change'
                    AND used = FALSE
                    ORDER BY created_at DESC
                    LIMIT 1
                    `,
                    [email]
                );


            if (
                existing.rows.length > 0 &&
                existing.rows[0].resend_available_at
            ) {

                const resendAt =
                    new Date(
                        existing.rows[0]
                            .resend_available_at
                    );


                if (
                    Date.now() <
                    resendAt.getTime()
                ) {

                    const seconds =
                        Math.ceil(
                            (
                                resendAt.getTime() -
                                Date.now()
                            ) / 1000
                        );


                    return res.status(429).json({
                        success: false,
                        message:
                            `Please wait ${seconds} seconds before requesting a new OTP.`
                    });

                }

            }


            /* ==========================================
               INVALIDATE OLD PASSWORD OTP
            ========================================== */

            await db.query(
                `
                UPDATE email_otps
                SET used = TRUE
                WHERE email = $1
                AND purpose = 'password_change'
                AND used = FALSE
                `,
                [email]
            );


            const otp =
                generateOTP();


            const otpHash =
                hashOTP(otp);


            const expiresAt =
                new Date(
                    Date.now() +
                    OTP_EXPIRY_MINUTES *
                    60 *
                    1000
                );


            const resendAvailableAt =
                new Date(
                    Date.now() +
                    OTP_RESEND_SECONDS *
                    1000
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
                    resend_available_at,
                    attempts,
                    used
                )
                VALUES
                ($1,$2,$3,$4,$5,$6,0,FALSE)
                `,
                [
                    userId,
                    email,
                    "password_change",
                    otpHash,
                    expiresAt,
                    resendAvailableAt
                ]
            );


            /* ==========================================
               SEND EMAIL
            ========================================== */

            await resend.emails.send({

                from:
                    "Meta NFT <support@metanft.work.gd>",

                to:
                    [email],

                subject:
                    "Meta NFT Password Change OTP",

                html: `
                    <div style="
                        font-family:Arial,sans-serif;
                        max-width:520px;
                        margin:auto;
                        padding:30px;
                        border:1px solid #e5e7eb;
                        border-radius:18px;
                        background:#ffffff;
                    ">

                        <h2 style="
                            color:#111827;
                            margin-top:0;
                        ">
                            Meta NFT
                        </h2>

                        <p>
                            Your password change
                            verification code is:
                        </p>

                        <div style="
                            font-size:32px;
                            font-weight:bold;
                            letter-spacing:8px;
                            padding:18px;
                            text-align:center;
                            background:#eef2ff;
                            color:#4f46e5;
                            border-radius:14px;
                        ">
                            ${otp}
                        </div>

                        <p>
                            This code will expire in
                            <strong>10 minutes</strong>.
                        </p>

                        <p style="
                            color:#6b7280;
                            font-size:13px;
                        ">
                            If you did not request a
                            password change, please ignore
                            this email.
                        </p>

                    </div>
                `
            });


            return res.json({

                success: true,

                message:
                    "Verification code sent to your registered email.",

                email

            });


        } catch (error) {

            console.error(
                "PASSWORD CHANGE OTP ERROR:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Unable to send verification code."

            });
}

    }
);

/* =====================================================
   VERIFY OTP + CHANGE PASSWORD
===================================================== */

passwordRouter.post(
    "/change-password/confirm",
    requireAllowedUser,
    async (req, res) => {

        try {

            const userId =
                req.session.userId;

            const otp =
                String(
                    req.body?.otp || ""
                ).trim();

            const newPassword =
                req.body?.newPassword;

            const confirmPassword =
                req.body?.confirmPassword;


            /* ==========================================
               BASIC VALIDATION
            ========================================== */

            if (!/^\d{6}$/.test(otp)) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Please enter the 6-digit verification code."
                });

            }


            if (
                typeof newPassword !== "string" ||
                typeof confirmPassword !== "string"
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Please enter both password fields."
                });

            }


            if (
                newPassword !==
                confirmPassword
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "New password and confirm password do not match."
                });

            }


            const passwordCheck =
                validatePassword(
                    newPassword
                );


            if (!passwordCheck.valid) {

                return res.status(400).json({
                    success: false,
                    message:
                        passwordCheck.message
                });

            }


            /* ==========================================
               GET USER EMAIL
            ========================================== */

            const userResult =
                await db.query(
                    `
                    SELECT
                        id,
                        email
                    FROM users
                    WHERE id = $1
                    `,
                    [userId]
                );


            if (
                userResult.rows.length === 0
            ) {

                return res.status(404).json({
                    success: false,
                    message:
                        "User account not found."
                });

            }


            const email =
                String(
                    userResult.rows[0].email || ""
                )
                .trim()
                .toLowerCase();


            /* ==========================================
               GET ACTIVE PASSWORD OTP
            ========================================== */

            const otpResult =
                await db.query(
                    `
                    SELECT
                        id,
                        otp_hash,
                        expires_at,
                        attempts,
                        used
                    FROM email_otps
                    WHERE user_id = $1
                    AND email = $2
                    AND purpose = 'password_change'
                    AND used = FALSE
                    ORDER BY created_at DESC
                    LIMIT 1
                    `,
                    [
                        userId,
                        email
                    ]
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
               MAX ATTEMPTS
            ========================================== */

            if (
                Number(
                    otpRecord.attempts || 0
                ) >= MAX_OTP_ATTEMPTS
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Too many incorrect attempts. Please request a new OTP."
                });

            }


            /* ==========================================
               OTP EXPIRY
            ========================================== */

            if (
                new Date(
                    otpRecord.expires_at
                ).getTime() <= Date.now()
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
                        "This verification code has expired. Please request a new OTP."
                });

            }


            /* ==========================================
               VERIFY OTP
            ========================================== */

            const submittedOtpHash =
                hashOTP(otp);


            if (
                submittedOtpHash !==
                otpRecord.otp_hash
            ) {

                const newAttempts =
                    Number(
                        otpRecord.attempts || 0
                    ) + 1;


                await db.query(
                    `
                    UPDATE email_otps
                    SET
                        attempts = $1,
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
               HASH NEW PASSWORD
            ========================================== */

            const passwordHash =
                await hashPassword(
                    newPassword
                );


            /* ==========================================
               UPDATE PASSWORD
            ========================================== */

            await db.query(
                `
                UPDATE users
                SET password = $1
                WHERE id = $2
                `,
                [
                    passwordHash,
                    userId
                ]
            );


            /* ==========================================
               OTP CAN NEVER BE USED AGAIN
            ========================================== */

            await db.query(
                `
                UPDATE email_otps
                SET used = TRUE
                WHERE id = $1
                `,
                [otpRecord.id]
            );


            return res.json({

                success: true,

                message:
                    "Password changed successfully."

            });


        } catch (error) {

            console.error(
                "PASSWORD CHANGE ERROR:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Unable to change password."

            });

        }

    }
);
/* =====================================================
   RETURN PASSWORD ROUTER
===================================================== */

    return passwordRouter;

}


/* =====================================================
   EXPORT
===================================================== */

module.exports = {

    router,

    createPasswordSystem,

    generateOTP,
    hashOTP,
    validatePassword,
    hashPassword,
    getExpiryDate,

    OTP_EXPIRY_MINUTES,
    OTP_RESEND_SECONDS,
    MAX_OTP_ATTEMPTS

};
