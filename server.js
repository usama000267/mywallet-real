require("dotenv").config({
    path: require("path").join(__dirname, ".env")
});

const express = require("express");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const pgSession = require("connect-pg-simple")(session);
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
            "mywallet-change-this-secret",

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
        const code = generateReferralCode();

        const result = await db.query(
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


/* =====================================================
   HOME
===================================================== */

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
});

app.get("/admin", (req, res) => {
    res.sendFile(__dirname + "/admin.html");
});


/* =====================================================
   HEALTH
===================================================== */

app.get("/api/health", async (req, res) => {
    try {
        await db.query("SELECT 1");

        res.json({
            success: true,
            server: "running",
            database: "connected"
        });

    } catch (error) {
        console.error("HEALTH ERROR:", error);

        res.status(500).json({
            success: false,
            server: "running",
            database: "error"
        });
    }
});


/* =====================================================
   CONFIG
===================================================== */

app.get("/api/config", async (req, res) => {
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


/* =====================================================
   REGISTER
===================================================== */

app.post("/api/register", async (req, res) => {
    try {
        await db.ready;

        const name =
            String(req.body.name || "").trim();

        const email =
            normalizeEmail(req.body.email);

        const password =
            String(req.body.password || "");

        const referralCode =
            String(req.body.referralCode || "")
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
            await db.query(
                `
                SELECT id
                FROM users
                WHERE email = $1
                `,
                [email]
            );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message:
                    "This email is already registered."
            });
        }

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

            if (referrer.rows.length === 0) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid referral link."
                });
            }

            referrerId =
                referrer.rows[0].id;
        }

        const hash =
            await bcrypt.hash(password, 12);

        const newReferralCode =
            await createUniqueReferralCode();

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
                    referred_by
                )
                VALUES ($1, $2, $3, 0, $4, $5)
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

        req.session.userId =
            result.rows[0].id;

        req.session.isAdmin = false;

        res.status(201).json({
            success: true,
            message:
                "Account created successfully.",
            referralCode:
                newReferralCode
        });

    } catch (error) {
        console.error("REGISTER ERROR:", error);

        res.status(500).json({
            success: false,
            message:
                "Unable to create account."
        });
    }
});


/* =====================================================
   LOGIN
===================================================== */

app.post("/api/login", async (req, res) => {
    try {
        await db.ready;

        const email =
            normalizeEmail(req.body.email);

        const password =
            String(req.body.password || "");

        const result =
            await db.query(
                `
                SELECT *
                FROM users
                WHERE email = $1
                `,
                [email]
            );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message:
                    "Invalid email or password."
            });
        }

        const user =
            result.rows[0];

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

        req.session.regenerate(error => {
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

            req.session.userId = user.id;
            req.session.isAdmin = false;

            req.session.save(saveError => {
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
            });
        });

    } catch (error) {
        console.error("LOGIN ERROR:", error);

        res.status(500).json({
            success: false,
            message:
                "Unable to login."
        });
    }
});


/* =====================================================
   LOGOUT
===================================================== */

app.post("/api/logout", (req, res) => {
    req.session.destroy(error => {
        if (error) {
            return res.status(500).json({
                success: false,
                message:
                    "Unable to logout."
            });
        }

        res.clearCookie("connect.sid");

        res.json({
            success: true
        });
    });
});


/* =====================================================
   CURRENT USER
===================================================== */

app.get(
    "/api/me",
    requireLogin,
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
                        created_at
                    FROM users
                    WHERE id = $1
                    `,
                    [req.session.userId]
                );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message:
                        "User not found."
                });
            }

            res.json({
                success: true,
                user: result.rows[0]
            });

        } catch (error) {
            console.error("ME ERROR:", error);

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
   TODAY EARNING INCLUDED
===================================================== */

app.get(
    "/api/dashboard",
    requireLogin,
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
                        created_at
                    FROM users
                    WHERE id = $1
                    `,
                    [req.session.userId]
                );

            if (userResult.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message:
                        "User not found."
                });
            }


            const depositsResult =
                await db.query(
                    `
                    SELECT
                        id,
                        amount,
                        network,
                        tx_hash,
                        status,
                        created_at
                    FROM deposits
                    WHERE user_id = $1
                    ORDER BY id DESC
                    `,
                    [req.session.userId]
                );


            const withdrawalsResult =
                await db.query(
                    `
                    SELECT
                        id,
                        amount,
                        network,
                        wallet_address,
                        status,
                        created_at
                    FROM withdrawals
                    WHERE user_id = $1
                    ORDER BY id DESC
                    `,
                    [req.session.userId]
                );


            /* ==============================
               TODAY EARNING
            ============================== */

            const todayEarningsResult =
                await db.query(
                    `
                    SELECT
                        COALESCE(
                            SUM(profit_amount),
                            0
                        ) AS today_earnings
                    FROM reservations
                    WHERE user_id = $1
                    AND status = 'completed'
                    AND created_at >= CURRENT_DATE
                    AND created_at < CURRENT_DATE + INTERVAL '1 day'
                    `,
                    [req.session.userId]
                );


            const todayEarnings =
                Number(
                    todayEarningsResult
                        .rows[0]
                        .today_earnings || 0
                );


            res.json({
                success: true,

                user:
                    userResult.rows[0],

                deposits:
                    depositsResult.rows,

                withdrawals:
                    withdrawalsResult.rows,

                todayEarnings:
                    todayEarnings
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
   CREATE DEPOSIT
===================================================== */

app.post(
    "/api/deposits",
    requireLogin,
    async (req, res) => {
        try {

            const amount =
                Number(req.body.amount);

            const network =
                String(
                    req.body.network || ""
                ).trim();

            const txHash =
                String(
                    req.body.txHash || ""
                ).trim();


            if (!validAmount(amount)) {
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


            if (existing.rows.length > 0) {
                return res.status(409).json({
                    success: false,
                    message:
                        "This reference already exists."
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
                    ($1, $2, $3, $4, 'pending')
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
   CREATE WITHDRAWAL
===================================================== */

app.post(
    "/api/withdrawals",
    requireLogin,
    async (req, res) => {

        const client =
            await db.pool.connect();

        try {

            const amount =
                Number(req.body.amount);

            const network =
                String(
                    req.body.network || ""
                ).trim();

            const walletAddress =
                String(
                    req.body.walletAddress || ""
                ).trim();


            if (!validAmount(amount)) {
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


            await client.query("BEGIN");


            const userResult =
                await client.query(
                    `
                    SELECT balance
                    FROM users
                    WHERE id = $1
                    FOR UPDATE
                    `,
                    [req.session.userId]
                );


            if (userResult.rows.length === 0) {
                await client.query("ROLLBACK");

                return res.status(404).json({
                    success: false,
                    message:
                        "User not found."
                });
            }


            const balance =
                Number(
                    userResult.rows[0].balance
                );


            if (balance < amount) {
                await client.query("ROLLBACK");

                return res.status(400).json({
                    success: false,
                    message:
                        "Insufficient balance."
                });
            }


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
                    ($1, $2, $3, $4, 'pending')
                    RETURNING id
                    `,
                    [
                        req.session.userId,
                        amount,
                        network,
                        walletAddress
                    ]
                );


            await client.query("COMMIT");


            res.status(201).json({
                success: true,
                message:
                    "Withdrawal request submitted.",
                withdrawalId:
                    result.rows[0].id
            });

        } catch (error) {

            await client.query("ROLLBACK");

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
   RESERVATIONS GET
===================================================== */

app.get(
    "/api/reservations",
    requireLogin,
    async (req, res) => {
        try {

            const reservationsResult =
                await db.query(
                    `
                    SELECT
                        id,
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


            const lastResult =
                await db.query(
                    `
                    SELECT created_at
                    FROM reservations
                    WHERE user_id = $1
                    ORDER BY id DESC
                    LIMIT 1
                    `,
                    [req.session.userId]
                );


            let canReserve = true;
            let nextReservation = null;


            if (lastResult.rows.length > 0) {

                const lastTime =
                    new Date(
                        lastResult.rows[0].created_at
                    ).getTime();


                const nextTime =
                    lastTime +
                    24 * 60 * 60 * 1000;


                if (Date.now() < nextTime) {

                    canReserve = false;

                    nextReservation =
                        new Date(
                            nextTime
                        ).toISOString();
                }
            }


            res.json({
                success: true,
                canReserve,
                nextReservation,
                reservations:
                    reservationsResult.rows
            });

        } catch (error) {

            console.error(
                "RESERVATION GET ERROR:",
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
   CREATE RESERVATION
===================================================== */

app.post(
    "/api/reservations",
    requireLogin,
    async (req, res) => {

        const client =
            await db.pool.connect();

        try {

            await client.query("BEGIN");


            const userResult =
                await client.query(
                    `
                    SELECT
                        id,
                        balance
                    FROM users
                    WHERE id = $1
                    FOR UPDATE
                    `,
                    [req.session.userId]
                );


            if (userResult.rows.length === 0) {

                await client.query("ROLLBACK");

                return res.status(404).json({
                    success: false,
                    message:
                        "User not found."
                });
            }


            const user =
                userResult.rows[0];


            const lastResult =
                await client.query(
                    `
                    SELECT created_at
                    FROM reservations
                    WHERE user_id = $1
                    ORDER BY id DESC
                    LIMIT 1
                    `,
                    [req.session.userId]
                );


            if (lastResult.rows.length > 0) {

                const lastTime =
                    new Date(
                        lastResult.rows[0].created_at
                    ).getTime();


                const nextTime =
                    lastTime +
                    24 * 60 * 60 * 1000;


                if (Date.now() < nextTime) {

                    await client.query("ROLLBACK");

                    return res.status(429).json({
                        success: false,
                        message:
                            "Reservation is available once every 24 hours.",
                        nextReservation:
                            new Date(
                                nextTime
                            ).toISOString()
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
                        Math.random() *
                        percentages.length
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


            const result =
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
                    ($1, $2, $3, $4, $5, 'completed')
                    RETURNING id
                    `,
                    [
                        user.id,
                        balanceBefore,
                        profitPercent,
                        profitAmount,
                        balanceAfter
                    ]
                );


            await client.query("COMMIT");


            res.status(201).json({
                success: true,
                message:
                    "Reservation completed.",
                reservationId:
                    result.rows[0].id,
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

            await client.query("ROLLBACK");

            console.error(
                "RESERVATION ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Unable to process reservation."
            });

        } finally {
            client.release();
        }
    }
);


/* =====================================================
   REFERRAL
===================================================== */

app.get(
    "/api/referral",
    requireLogin,
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


            if (userResult.rows.length === 0) {
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


            const referralsResult =
                await db.query(
                    `
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
                    WHERE rb.referrer_id = $1
                    ORDER BY rb.id DESC
                    `,
                    [req.session.userId]
                );


            const referrals =
                referralsResult.rows;


            const totalBonus =
                referrals.reduce(
                    (sum, item) =>
                        sum +
                        Number(
                            item.bonus_amount || 0
                        ),
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
            normalizeEmail(req.body.email);

        const password =
            String(req.body.password || "");


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


        req.session.regenerate(error => {

            if (error) {

                return res.status(500).json({
                    success: false,
                    message:
                        "Unable to create admin session."
                });
            }


            req.session.isAdmin = true;
            req.session.userId = null;


            req.session.save(saveError => {

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
            });
        });
    }
);


/* =====================================================
   ADMIN LOGOUT
===================================================== */

app.post(
    "/api/admin/logout",
    (req, res) => {

        req.session.destroy(error => {

            if (error) {

                return res.status(500).json({
                    success: false,
                    message:
                        "Unable to logout."
                });
            }


            res.clearCookie("connect.sid");


            res.json({
                success: true
            });
        });
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
            email: ADMIN_EMAIL
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
                        ON deposits.user_id = users.id
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


            if (!Number.isInteger(depositId)) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid deposit ID."
                });
            }


            await client.query("BEGIN");


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


            if (depositResult.rows.length === 0) {

                await client.query("ROLLBACK");

                return res.status(404).json({
                    success: false,
                    message:
                        "Deposit request not found."
                });
            }


            const deposit =
                depositResult.rows[0];


            if (deposit.status !== "pending") {

                await client.query("ROLLBACK");

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
                    Number(deposit.amount),
                    deposit.user_id
                ]
            );


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
                        userResult.rows[0].referred_by
                    );


                referralBonus =
                    Number(
                        (
                            Number(deposit.amount) *
                            10 /
                            100
                        ).toFixed(6)
                    );


                await client.query(
                    `
                    UPDATE users
                    SET balance = balance + $1
                    WHERE id = $2
                    `,
                    [
                        referralBonus,
                        referrerId
                    ]
                );


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
                    ($1, $2, $3, $4, 10, $5)
                    `,
                    [
                        referrerId,
                        deposit.user_id,
                        deposit.id,
                        Number(deposit.amount),
                        referralBonus
                    ]
                );
            }


            await client.query("COMMIT");


            res.json({
                success: true,
                message:
                    "Deposit approved and balance updated.",
                depositId:
                    deposit.id,
                amount:
                    Number(deposit.amount),
                referralBonus
            });

        } catch (error) {

            await client.query("ROLLBACK");

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


            if (result.rows.length === 0) {

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
                        ON withdrawals.user_id = users.id
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


            if (result.rows.length === 0) {

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
                    Number(withdrawal.amount)
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


            await client.query("BEGIN");


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


            if (result.rows.length === 0) {

                await client.query("ROLLBACK");

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

                await client.query("ROLLBACK");

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
                SET balance = balance + $1
                WHERE id = $2
                `,
                [
                    Number(withdrawal.amount),
                    withdrawal.user_id
                ]
            );


            await client.query("COMMIT");


            res.json({
                success: true,
                message:
                    "Withdrawal rejected and amount returned.",
                withdrawalId:
                    withdrawal.id,
                amount:
                    Number(withdrawal.amount)
            });

        } catch (error) {

            await client.query("ROLLBACK");

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
                        ON reservations.user_id = users.id
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
   SERVER START
   ONLY ONE startServer()
===================================================== */

async function startServer() {

    try {

        await db.ready;


        app.listen(
            PORT,
            "0.0.0.0",
            () => {

                console.log(
                    "MyWallet Real server running at http://localhost:" +
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


/* =====================================================
   START
===================================================== */

startServer();