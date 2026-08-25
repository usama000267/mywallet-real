const Database = require("better-sqlite3");

const db = new Database("mywallet.db");

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        balance REAL NOT NULL DEFAULT 0,
        referral_code TEXT UNIQUE,
        referred_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (referred_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS deposits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        network TEXT NOT NULL,
        tx_hash TEXT UNIQUE,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS withdrawals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        network TEXT NOT NULL,
        wallet_address TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS reservations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        balance_before REAL NOT NULL,
        profit_percent REAL NOT NULL,
        profit_amount REAL NOT NULL,
        balance_after REAL NOT NULL,
        status TEXT NOT NULL DEFAULT 'completed',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS referral_bonuses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        referrer_id INTEGER NOT NULL,
        referred_user_id INTEGER NOT NULL,
        deposit_id INTEGER NOT NULL UNIQUE,
        deposit_amount REAL NOT NULL,
        bonus_percent REAL NOT NULL DEFAULT 10,
        bonus_amount REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (referrer_id) REFERENCES users(id),
        FOREIGN KEY (referred_user_id) REFERENCES users(id),
        FOREIGN KEY (deposit_id) REFERENCES deposits(id)
    );
`);

/*
    Existing databases may already have the users table
    without the new referral columns.

    Add them safely if they do not exist.
*/

function addColumnIfMissing(table, column, definition) {
    const columns = db
        .prepare(`PRAGMA table_info(${table})`)
        .all();

    const exists = columns.some(
        item => item.name === column
    );

    if (!exists) {
        db.exec(
            `ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`
        );
    }
}

addColumnIfMissing(
    "users",
    "referral_code",
    "TEXT"
);

addColumnIfMissing(
    "users",
    "referred_by",
    "INTEGER"
);

/*
    Generate referral codes for existing users.
*/

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

const usersWithoutCode = db.prepare(`
    SELECT id
    FROM users
    WHERE referral_code IS NULL
       OR referral_code = ''
`).all();

const updateReferralCode = db.prepare(`
    UPDATE users
    SET referral_code = ?
    WHERE id = ?
`);

const assignCodes = db.transaction(() => {

    for (const user of usersWithoutCode) {

        let code;

        do {
            code = generateReferralCode();

            const existing = db.prepare(`
                SELECT id
                FROM users
                WHERE referral_code = ?
            `).get(code);

            if (!existing) {
                break;
            }

        } while (true);

        updateReferralCode.run(
            code,
            user.id
        );
    }
});

assignCodes();

db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS
    idx_users_referral_code
    ON users(referral_code);

    CREATE INDEX IF NOT EXISTS
    idx_users_referred_by
    ON users(referred_by);

    CREATE INDEX IF NOT EXISTS
    idx_referral_bonuses_referrer
    ON referral_bonuses(referrer_id);
`);

console.log("MyWalletReal database is ready.");

module.exports = db;