require("dotenv").config({
    path: require("path").join(__dirname, ".env")
});

const express = require("express");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const db = require("./database");

const app = express();
const PORT = Number(process.env.PORT || 3000);

const ADMIN_EMAIL = String(
    process.env.ADMIN_EMAIL || "admin@example.com"
).trim().toLowerCase();

const ADMIN_PASSWORD = String(
    process.env.ADMIN_PASSWORD || "ChangeThis123!"
);

const BEP20_ADDRESS =
    process.env.BEP20_USDT_ADDRESS || "DEMO-BEP20-ADDRESS";

const TRC20_ADDRESS =
    process.env.TRC20_USDT_ADDRESS || "DEMO-TRC20-ADDRESS";

/* ================= MIDDLEWARE ================= */

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
    session({
        secret:
            process.env.SESSION_SECRET ||
            "mywallet-demo-secret-change-this",

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

/* ================= HELPERS ================= */

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

/* ================= HOME ================= */

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
});

app.get("/admin", (req, res) => {
    res.sendFile(__dirname + "/admin.html");
});

/* ================= HEALTH ================= */

app.get("/api/health", (req, res) => {
    try {
        db.prepare("SELECT 1").get();

        res.json({
            success: true,
            server: "running",
            database: "connected"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            server: "running",
            database: "error"
        });
    }
});

/* ================= CONFIG ================= */

app.get("/api/config", (req, res) => {
    res.json({
        success: true,

        networks: {
            bep20: {
                name: "USDT BEP20",
                chainId: 56,
                address: BEP20_ADDRESS
            },

            trc20: {
                name: "USDT TRC20",
                address: TRC20_ADDRESS
            }
        }
    });
});

/* ================= REGISTER ================= */
/* ================= REGISTER ================= */

function createReferralCode() {
    let code;

    do {
        code =
            Math.random()
                .toString(36)
                .substring(2, 8)
                .toUpperCase() +
            Math.random()
                .toString(36)
                .substring(2, 6)
                .toUpperCase();

        const existing = db.prepare(`
            SELECT id
            FROM users
            WHERE referral_code = ?
        `).get(code);

        if (!existing) {
            return code;
        }

    } while (true);
}

app.post("/api/register", async (req, res) => {

    try {

        const name =
            String(req.body.name || "").trim();

        const email =
            normalizeEmail(req.body.email);

        const password =
            String(req.body.password || "");

        const referralCode =
            String(
                req.body.referralCode || ""
            )
                .trim()
                .toUpperCase();

        if (!name || !email || !password) {

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

        const existingUser =
            db.prepare(`
                SELECT id
                FROM users
                WHERE email = ?
            `).get(email);

        if (existingUser) {

            return res.status(409).json({
                success: false,
                message:
                    "This email is already registered."
            });
        }

        let referrer = null;

        if (referralCode) {

            referrer =
                db.prepare(`
                    SELECT id, referral_code
                    FROM users
                    WHERE referral_code = ?
                `).get(referralCode);

            if (!referrer) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid referral link."
                });
            }
        }

        const hash =
            await bcrypt.hash(
                password,
                12
            );

        const newReferralCode =
            createReferralCode();

        const result =
            db.prepare(`
                INSERT INTO users
                (
                    name,
                    email,
                    password,
                    balance,
                    referral_code,
                    referred_by
                )
                VALUES (?, ?, ?, 0, ?, ?)
            `).run(
                name,
                email,
                hash,
                newReferralCode,
                referrer
                    ? referrer.id
                    : null
            );

        req.session.userId =
            Number(
                result.lastInsertRowid
            );

        req.session.isAdmin = false;

        res.status(201).json({

            success: true,

            message:
                "Account created successfully.",

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
});


/* ================= LOGIN ================= */

app.post("/api/login", async (req, res) => {
    try {
        const email = normalizeEmail(req.body.email);
        const password = String(req.body.password || "");

        const user = db.prepare(`
            SELECT *
            FROM users
            WHERE email = ?
        `).get(email);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        const correct = await bcrypt.compare(
            password,
            user.password
        );

        if (!correct) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        req.session.userId = user.id;
        req.session.isAdmin = false;

        res.json({
            success: true,
            message: "Login successful."
        });

    } catch (error) {
        console.error("LOGIN ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Unable to login."
        });
    }
});

/* ================= ADMIN LOGIN ================= */

app.post("/api/admin/login", (req, res) => {
    const email =
        normalizeEmail(req.body.email);

    const password =
        String(req.body.password || "");

    if (
        email !== ADMIN_EMAIL ||
        password !== ADMIN_PASSWORD
    ) {
        return res.status(401).json({
            success: false,
            message: "Invalid admin credentials."
        });
    }

    req.session.isAdmin = true;
    req.session.userId = null;

    res.json({
        success: true,
        message: "Admin login successful."
    });
});

/* ================= ADMIN LOGOUT ================= */

app.post("/api/admin/logout", (req, res) => {
    req.session.destroy(() => {
        res.json({
            success: true
        });
    });
});

/* ================= ADMIN ME ================= */

app.get("/api/admin/me", requireAdmin, (req, res) => {
    res.json({
        success: true,
        admin: true,
        email: ADMIN_EMAIL
    });
});

/* ================= USER LOGOUT ================= */

app.post("/api/logout", (req, res) => {
    req.session.destroy(() => {
        res.json({
            success: true,
            message: "Logged out."
        });
    });
});
/* ================= REFERRAL INFO ================= */

app.get("/api/referral", requireLogin, (req, res) => {

    try {

        const user = db.prepare(`
            SELECT
                id,
                referral_code
            FROM users
            WHERE id = ?
        `).get(req.session.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        const referralCode =
            user.referral_code;

        const referralLink =
            `${req.protocol}://${req.get("host")}/?ref=${encodeURIComponent(referralCode)}`;

        const referrals = db.prepare(`
            SELECT
                rb.id,
                rb.referred_user_id,
                rb.deposit_amount,
                rb.bonus_percent,
                rb.bonus_amount,
                rb.created_at,
                u.name,
                u.email
            FROM referral_bonuses rb
            LEFT JOIN users u
                ON rb.referred_user_id = u.id
            WHERE rb.referrer_id = ?
            ORDER BY rb.id DESC
        `).all(req.session.userId);

        const totalBonus = referrals.reduce(
            (sum, item) =>
                sum + Number(item.bonus_amount || 0),
            0
        );

        res.json({
            success: true,

            referralCode,

            referralLink,

            bonusPercent: 10,

            totalBonus,

            referrals
        });

    } catch (error) {

        console.error(
            "REFERRAL INFO ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Unable to load referral information."
        });
    }
});
/* ================= CURRENT USER ================= */

app.get("/api/me", requireLogin, (req, res) => {
    const user = db.prepare(`
        SELECT
            id,
            name,
            email,
            balance,
            created_at
        FROM users
        WHERE id = ?
    `).get(req.session.userId);

    if (!user) {
        return res.status(404).json({
            success: false,
            message: "User not found."
        });
    }

    res.json({
        success: true,
        user
    });
});

/* ================= DASHBOARD ================= */

app.get("/api/dashboard", requireLogin, (req, res) => {
    const user = db.prepare(`
        SELECT
            id,
            name,
            email,
            balance,
            created_at
        FROM users
        WHERE id = ?
    `).get(req.session.userId);

    if (!user) {
        return res.status(404).json({
            success: false,
            message: "User not found."
        });
    }

    const deposits = db.prepare(`
        SELECT
            id,
            amount,
            network,
            tx_hash,
            status,
            created_at
        FROM deposits
        WHERE user_id = ?
        ORDER BY id DESC
    `).all(req.session.userId);

    const withdrawals = db.prepare(`
        SELECT
            id,
            amount,
            network,
            wallet_address,
            status,
            created_at
        FROM withdrawals
        WHERE user_id = ?
        ORDER BY id DESC
    `).all(req.session.userId);

    res.json({
        success: true,
        user,
        deposits,
        withdrawals
    });
});

/* ================= CREATE DEPOSIT ================= */

app.post("/api/deposits", requireLogin, (req, res) => {
    try {
        const amount = Number(req.body.amount);
        const network = String(
            req.body.network || ""
        ).trim();

        const txHash = String(
            req.body.txHash || ""
        ).trim();

        if (!validAmount(amount)) {
            return res.status(400).json({
                success: false,
                message: "Enter a valid amount."
            });
        }

        if (
            network !== "BEP20" &&
            network !== "TRC20"
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid network."
            });
        }

        if (!txHash) {
            return res.status(400).json({
                success: false,
                message: "Transaction reference is required."
            });
        }

        const existing = db.prepare(`
            SELECT id
            FROM deposits
            WHERE tx_hash = ?
        `).get(txHash);

        if (existing) {
            return res.status(409).json({
                success: false,
                message: "This reference already exists."
            });
        }

        const result = db.prepare(`
            INSERT INTO deposits
            (
                user_id,
                amount,
                network,
                tx_hash,
                status
            )
            VALUES (?, ?, ?, ?, 'pending')
        `).run(
            req.session.userId,
            amount,
            network,
            txHash
        );

        res.status(201).json({
            success: true,
            message: "Deposit request submitted.",
            depositId: Number(result.lastInsertRowid),
            status: "pending"
        });

    } catch (error) {
        console.error("DEPOSIT ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Unable to submit deposit."
        });
    }
});

/* ================= CREATE WITHDRAWAL ================= */

app.post("/api/withdrawals", requireLogin, (req, res) => {
    try {
        const amount = Number(req.body.amount);

        const network = String(
            req.body.network || ""
        ).trim();

        const walletAddress = String(
            req.body.walletAddress || ""
        ).trim();

        if (!validAmount(amount)) {
            return res.status(400).json({
                success: false,
                message: "Enter a valid amount."
            });
        }

        if (
            network !== "BEP20" &&
            network !== "TRC20"
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid network."
            });
        }

        if (!walletAddress) {
            return res.status(400).json({
                success: false,
                message: "Wallet address is required."
            });
        }

        const user = db.prepare(`
            SELECT balance
            FROM users
            WHERE id = ?
        `).get(req.session.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        if (Number(user.balance) < amount) {
            return res.status(400).json({
                success: false,
                message: "Insufficient demo balance."
            });
        }

        const result = db.transaction(() => {

            db.prepare(`
                UPDATE users
                SET balance = balance - ?
                WHERE id = ?
            `).run(
                amount,
                req.session.userId
            );

            return db.prepare(`
                INSERT INTO withdrawals
                (
                    user_id,
                    amount,
                    network,
                    wallet_address,
                    status
                )
                VALUES (?, ?, ?, ?, 'pending')
            `).run(
                req.session.userId,
                amount,
                network,
                walletAddress
            );

        })();

        res.status(201).json({
            success: true,
            message: "Demo withdrawal request submitted.",
            withdrawalId:
                Number(result.lastInsertRowid)
        });

    } catch (error) {
        console.error("WITHDRAW ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Unable to submit withdrawal."
        });
    }
});
/* ADMIN: APPROVE WITHDRAWAL */

app.post(
    "/api/admin/withdrawals/:id/approve",
    requireAdmin,
    (req, res) => {

        try {

            const withdrawalId =
                Number(req.params.id);

            if (!Number.isInteger(withdrawalId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid withdrawal ID."
                });
            }

            const withdrawal = db.prepare(`
                SELECT
                    id,
                    user_id,
                    amount,
                    status
                FROM withdrawals
                WHERE id = ?
            `).get(withdrawalId);

            if (!withdrawal) {
                return res.status(404).json({
                    success: false,
                    message: "Withdrawal request not found."
                });
            }

            if (withdrawal.status !== "pending") {
                return res.status(400).json({
                    success: false,
                    message:
                        "This withdrawal has already been processed."
                });
            }

            db.prepare(`
                UPDATE withdrawals
                SET status = 'approved'
                WHERE id = ?
            `).run(withdrawalId);

            res.json({
                success: true,
                message: "Demo withdrawal approved.",
                withdrawalId: withdrawal.id,
                amount: withdrawal.amount
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


/* ADMIN: REJECT WITHDRAWAL */

app.post(
    "/api/admin/withdrawals/:id/reject",
    requireAdmin,
    (req, res) => {

        try {

            const withdrawalId =
                Number(req.params.id);

            if (!Number.isInteger(withdrawalId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid withdrawal ID."
                });
            }

            const withdrawal = db.prepare(`
                SELECT
                    id,
                    user_id,
                    amount,
                    status
                FROM withdrawals
                WHERE id = ?
            `).get(withdrawalId);

            if (!withdrawal) {
                return res.status(404).json({
                    success: false,
                    message: "Withdrawal request not found."
                });
            }

            if (withdrawal.status !== "pending") {
                return res.status(400).json({
                    success: false,
                    message:
                        "This withdrawal has already been processed."
                });
            }

            db.transaction(() => {

                db.prepare(`
                    UPDATE withdrawals
                    SET status = 'rejected'
                    WHERE id = ?
                `).run(withdrawalId);

                db.prepare(`
                    UPDATE users
                    SET balance = balance + ?
                    WHERE id = ?
                `).run(
                    Number(withdrawal.amount),
                    withdrawal.user_id
                );

            })();

            res.json({
                success: true,
                message:
                    "Withdrawal rejected and amount returned to demo balance.",
                withdrawalId: withdrawal.id,
                amount: withdrawal.amount
            });

        } catch (error) {

            console.error(
                "REJECT WITHDRAWAL ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Unable to reject withdrawal."
            });
        }
    }
);
/* ================= RESERVATIONS ================= */

app.get("/api/reservations", requireLogin, (req, res) => {
    try {
        const reservations = db.prepare(`
            SELECT
                id,
                balance_before,
                profit_percent,
                profit_amount,
                balance_after,
                status,
                created_at
            FROM reservations
            WHERE user_id = ?
            ORDER BY id DESC
        `).all(req.session.userId);

        const last = db.prepare(`
            SELECT created_at
            FROM reservations
            WHERE user_id = ?
            ORDER BY id DESC
            LIMIT 1
        `).get(req.session.userId);

        let canReserve = true;
        let nextReservation = null;

        if (last) {
            const lastTime =
                new Date(
                    String(last.created_at).replace(" ", "T") + "Z"
                ).getTime();

            const nextTime =
                lastTime + 24 * 60 * 60 * 1000;

            if (Date.now() < nextTime) {
                canReserve = false;
                nextReservation =
                    new Date(nextTime).toISOString();
            }
        }

        res.json({
            success: true,
            demo: true,
            canReserve,
            nextReservation,
            reservations
        });

    } catch (error) {
        console.error("RESERVATION GET ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Unable to load reservations."
        });
    }
});

app.post("/api/reservations", requireLogin, (req, res) => {
    try {
        const user = db.prepare(`
            SELECT id, balance
            FROM users
            WHERE id = ?
        `).get(req.session.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        const last = db.prepare(`
            SELECT created_at
            FROM reservations
            WHERE user_id = ?
            ORDER BY id DESC
            LIMIT 1
        `).get(req.session.userId);

        if (last) {
            const lastTime =
                new Date(
                    String(last.created_at).replace(" ", "T") + "Z"
                ).getTime();

            const nextTime =
                lastTime + 24 * 60 * 60 * 1000;

            if (Date.now() < nextTime) {
                return res.status(429).json({
                    success: false,
                    message:
                        "Reservation is available once every 24 hours.",
                    nextReservation:
                        new Date(nextTime).toISOString()
                });
            }
        }

        const balanceBefore =
            Number(user.balance || 0);

        const percentages = [
            1.2,
            1.3,
            1.4,
            1.5
        ];

        const profitPercent =
            percentages[
                Math.floor(
                    Math.random() * percentages.length
                )
            ];

        const profitAmount =
            Number(
                (
                    balanceBefore *
                    profitPercent /
                    100
                ).toFixed(6)
            );

        const balanceAfter =
            Number(
                (
                    balanceBefore +
                    profitAmount
                ).toFixed(6)
            );

        const result = db.transaction(() => {

            db.prepare(`
                UPDATE users
                SET balance = ?
                WHERE id = ?
            `).run(
                balanceAfter,
                user.id
            );

            return db.prepare(`
                INSERT INTO reservations
                (
                    user_id,
                    balance_before,
                    profit_percent,
                    profit_amount,
                    balance_after,
                    status
                )
                VALUES (?, ?, ?, ?, ?, 'completed')
            `).run(
                user.id,
                balanceBefore,
                profitPercent,
                profitAmount,
                balanceAfter
            );

        })();

        res.status(201).json({
            success: true,
            demo: true,
            message: "Demo reservation completed.",
            reservationId:
                Number(result.lastInsertRowid),
            profitPercent,
            profitAmount,
            balanceBefore,
            balanceAfter,
            nextReservation:
                new Date(
                    Date.now() +
                    24 * 60 * 60 * 1000
                ).toISOString()
        });

    } catch (error) {
        console.error("RESERVATION ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Unable to process reservation."
        });
    }
});

/* =========================================================
   ADMIN
========================================================= */

/* ADMIN: USERS */

app.get(
    "/api/admin/users",
    requireAdmin,
    (req, res) => {

        try {

            const users = db.prepare(`
                SELECT
                    id,
                    name,
                    email,
                    balance,
                    created_at
                FROM users
                ORDER BY id DESC
            `).all();

            res.json({
                success: true,
                users
            });

        } catch (error) {

            console.error(
                "ADMIN USERS ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message: "Unable to load users."
            });
        }
    }
);

/* ADMIN: DEPOSITS */

app.get(
    "/api/admin/deposits",
    requireAdmin,
    (req, res) => {

        try {

            const deposits = db.prepare(`
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
                    ON deposits.user_id = users.id
                ORDER BY deposits.id DESC
            `).all();

            res.json({
                success: true,
                deposits
            });

        } catch (error) {

            console.error(
                "ADMIN DEPOSITS ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message: "Unable to load deposits."
            });
        }
    }
);

/* ADMIN: APPROVE DEPOSIT */

/* ADMIN: APPROVE DEPOSIT + REFERRAL REWARD */

app.post(
    "/api/admin/deposits/:id/approve",
    requireAdmin,
    (req, res) => {

        try {

            const depositId =
                Number(req.params.id);

            if (!Number.isInteger(depositId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid deposit ID."
                });
            }

            const result = db.transaction(() => {

                const deposit = db.prepare(`
                    SELECT
                        id,
                        user_id,
                        amount,
                        status
                    FROM deposits
                    WHERE id = ?
                `).get(depositId);

                if (!deposit) {
                    throw new Error(
                        "Deposit request not found."
                    );
                }

                if (deposit.status !== "pending") {
                    throw new Error(
                        "This deposit has already been processed."
                    );
                }

                /* Approve deposit */

                db.prepare(`
                    UPDATE deposits
                    SET status = 'approved'
                    WHERE id = ?
                `).run(depositId);

                /* Add deposit amount to user's balance */

                db.prepare(`
                    UPDATE users
                    SET balance = balance + ?
                    WHERE id = ?
                `).run(
                    Number(deposit.amount),
                    deposit.user_id
                );

                /*
                    Find the person who invited
                    this depositing user.
                */

                const user = db.prepare(`
                    SELECT
                        id,
                        referred_by
                    FROM users
                    WHERE id = ?
                `).get(deposit.user_id);

                let referralBonus = 0;
                let referrerId = null;

                if (
                    user &&
                    user.referred_by
                ) {

                    referrerId =
                        Number(
                            user.referred_by
                        );

                    /*
                        10% referral reward
                    */

                    referralBonus =
                        Number(
                            (
                                Number(deposit.amount) *
                                10 /
                                100
                            ).toFixed(6)
                        );

                    /*
                        Credit referral reward
                    */

                    db.prepare(`
                        UPDATE users
                        SET balance = balance + ?
                        WHERE id = ?
                    `).run(
                        referralBonus,
                        referrerId
                    );

                    /*
                        Record referral reward.
                        deposit_id is UNIQUE, so the same
                        deposit cannot receive the bonus twice.
                    */

                    db.prepare(`
                        INSERT INTO referral_bonuses
                        (
                            referrer_id,
                            referred_user_id,
                            deposit_id,
                            deposit_amount,
                            bonus_percent,
                            bonus_amount
                        )
                        VALUES (?, ?, ?, ?, 10, ?)
                    `).run(
                        referrerId,
                        deposit.user_id,
                        deposit.id,
                        Number(deposit.amount),
                        referralBonus
                    );
                }

                return {
                    depositId: deposit.id,
                    amount: Number(deposit.amount),
                    referralBonus,
                    referrerId
                };

            })();

            res.json({
                success: true,

                message:
                    "Deposit approved and balance updated.",

                depositId:
                    result.depositId,

                amount:
                    result.amount,

                referralBonus:
                    result.referralBonus
            });

        } catch (error) {

            console.error(
                "APPROVE DEPOSIT ERROR:",
                error
            );

            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
);

/* ADMIN: REJECT DEPOSIT */

app.post(
    "/api/admin/deposits/:id/reject",
    requireAdmin,
    (req, res) => {

        try {

            const depositId =
                Number(req.params.id);

            const deposit = db.prepare(`
                SELECT
                    id,
                    status
                FROM deposits
                WHERE id = ?
            `).get(depositId);

            if (!deposit) {
                return res.status(404).json({
                    success: false,
                    message: "Deposit not found."
                });
            }

            if (deposit.status !== "pending") {
                return res.status(400).json({
                    success: false,
                    message:
                        "This deposit has already been processed."
                });
            }

            db.prepare(`
                UPDATE deposits
                SET status = 'rejected'
                WHERE id = ?
            `).run(depositId);

            res.json({
                success: true,
                message: "Deposit rejected."
            });

        } catch (error) {

            console.error(
                "REJECT DEPOSIT ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message: "Unable to reject deposit."
            });
        }
    }
);

/* ADMIN: WITHDRAWALS */

app.get(
    "/api/admin/withdrawals",
    requireAdmin,
    (req, res) => {

        try {

            const withdrawals = db.prepare(`
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
                    ON withdrawals.user_id = users.id
                ORDER BY withdrawals.id DESC
            `).all();

            res.json({
                success: true,
                withdrawals
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

/* ADMIN: RESERVATIONS */

app.get(
    "/api/admin/reservations",
    requireAdmin,
    (req, res) => {

        try {

            const reservations = db.prepare(`
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
                    ON reservations.user_id = users.id
                ORDER BY reservations.id DESC
            `).all();

            res.json({
                success: true,
                reservations
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

/* ================= SERVER ================= */

app.listen(
    PORT,
    "0.0.0.0",
    () => {
       console.log("MyWallet Real server running on port " + PORT);
    }
);