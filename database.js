const { Pool } = require("pg");

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});


/* =========================================================
   DATABASE QUERY
========================================================= */

async function query(text, params = []) {
    return pool.query(text, params);
}


/* =========================================================
   SAFE DATABASE INITIALIZATION
   IMPORTANT:
   - Existing data is NOT deleted
   - Existing users are NOT deleted
   - Existing balances are NOT reset
   - Existing deposits/withdrawals are NOT deleted
========================================================= */

async function initDatabase() {

    /* -----------------------------------------------------
       EXISTING TABLES
    ----------------------------------------------------- */

    await query(`
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            balance NUMERIC NOT NULL DEFAULT 0,
            referral_code TEXT UNIQUE,
            referred_by INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `);


    await query(`
        CREATE TABLE IF NOT EXISTS deposits (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL,
            amount NUMERIC NOT NULL,
            network TEXT NOT NULL,
            tx_hash TEXT UNIQUE,
            status TEXT NOT NULL DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `);


    await query(`
        CREATE TABLE IF NOT EXISTS withdrawals (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL,
            amount NUMERIC NOT NULL,
            network TEXT NOT NULL,
            wallet_address TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `);


    await query(`
        CREATE TABLE IF NOT EXISTS reservations (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL,
            balance_before NUMERIC NOT NULL,
            profit_percent NUMERIC NOT NULL,
            profit_amount NUMERIC NOT NULL,
            balance_after NUMERIC NOT NULL,
            status TEXT NOT NULL DEFAULT 'completed',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `);


    await query(`
        CREATE TABLE IF NOT EXISTS referral_bonuses (
            id SERIAL PRIMARY KEY,
            referrer_id INTEGER NOT NULL,
            referred_user_id INTEGER NOT NULL,
            deposit_id INTEGER UNIQUE NOT NULL,
            deposit_amount NUMERIC NOT NULL,
            bonus_percent NUMERIC NOT NULL DEFAULT 10,
            bonus_amount NUMERIC NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `);


    /* =====================================================
       USERS — SAFE NEW COLUMNS
    ===================================================== */

    await query(`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN NOT NULL DEFAULT FALSE;
    `);
await query(`
    CREATE TABLE IF NOT EXISTS site_settings (
        id SERIAL PRIMARY KEY,
        setting_key TEXT UNIQUE NOT NULL,
        setting_value TEXT NOT NULL DEFAULT '',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
`);
await query(`
        CREATE TABLE IF NOT EXISTS email_otps (
            id SERIAL PRIMARY KEY,
            user_id INTEGER,
            email TEXT NOT NULL,
            purpose TEXT NOT NULL,
            otp_hash TEXT NOT NULL,
            expires_at TIMESTAMP NOT NULL,
            resend_available_at TIMESTAMP NOT NULL,
            attempts INTEGER NOT NULL DEFAULT 0,
            used BOOLEAN NOT NULL DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `);

    await query(`
        CREATE INDEX IF NOT EXISTS idx_email_otps_email_purpose
        ON email_otps(email, purpose);
    `);

    await query(`
        CREATE INDEX IF NOT EXISTS idx_email_otps_user_purpose
        ON email_otps(user_id, purpose);
    `);

    /* =====================================================
       NFT COLLECTION
       Admin-created NFTs will live here.
    ===================================================== */

    await query(`
        CREATE TABLE IF NOT EXISTS nfts (
            id SERIAL PRIMARY KEY,

            name TEXT NOT NULL,

            description TEXT,

            image_url TEXT,

            price NUMERIC NOT NULL DEFAULT 0,

            profit_percent NUMERIC NOT NULL DEFAULT 0,

            status TEXT NOT NULL DEFAULT 'active',

            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `);


    /* =====================================================
       USER NFT OWNERSHIP / PURCHASES

       Every reservation/purchase creates one record here.

       This does NOT alter existing user balances until the
       server-side purchase logic explicitly performs it.
    ===================================================== */

    await query(`
        CREATE TABLE IF NOT EXISTS user_nfts (
            id SERIAL PRIMARY KEY,

            user_id INTEGER NOT NULL,

            nft_id INTEGER NOT NULL,

            purchase_price NUMERIC NOT NULL DEFAULT 0,

            expected_profit_percent NUMERIC NOT NULL DEFAULT 0,

            expected_profit_amount NUMERIC NOT NULL DEFAULT 0,

            purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

            sold_at TIMESTAMP,

            sale_price NUMERIC,

            profit_amount NUMERIC,

            status TEXT NOT NULL DEFAULT 'owned'
        );
    `);


    /* =====================================================
       NFT SALES
    ===================================================== */

    await query(`
        CREATE TABLE IF NOT EXISTS nft_sales (
            id SERIAL PRIMARY KEY,

            user_nft_id INTEGER NOT NULL,

            user_id INTEGER NOT NULL,

            purchase_price NUMERIC NOT NULL DEFAULT 0,

            sale_price NUMERIC NOT NULL DEFAULT 0,

            profit_amount NUMERIC NOT NULL DEFAULT 0,

            status TEXT NOT NULL DEFAULT 'completed',

            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `);


    /* =====================================================
       EARNINGS HISTORY

       Central place for ALL genuine earnings:

       - NFT / Reservation Profit
       - Team Referral Bonus
       - Other future bonuses

       Deposits are NOT earnings.
       Withdrawals are NOT earnings.
    ===================================================== */

    await query(`
        CREATE TABLE IF NOT EXISTS earnings (
            id SERIAL PRIMARY KEY,

            user_id INTEGER NOT NULL,

            type TEXT NOT NULL,

            source_id INTEGER,

            description TEXT,

            amount NUMERIC NOT NULL DEFAULT 0,

            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `);


    /* =====================================================
       INDEXES
       These improve performance without deleting data.
    ===================================================== */

    await query(`
        CREATE INDEX IF NOT EXISTS idx_users_referred_by
        ON users(referred_by);
    `);


    await query(`
        CREATE INDEX IF NOT EXISTS idx_deposits_user_id
        ON deposits(user_id);
    `);


    await query(`
        CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id
        ON withdrawals(user_id);
    `);


    await query(`
        CREATE INDEX IF NOT EXISTS idx_reservations_user_id
        ON reservations(user_id);
    `);


    await query(`
        CREATE INDEX IF NOT EXISTS idx_referral_bonuses_referrer_id
        ON referral_bonuses(referrer_id);
    `);


    await query(`
        CREATE INDEX IF NOT EXISTS idx_nfts_status
        ON nfts(status);
    `);


    await query(`
        CREATE INDEX IF NOT EXISTS idx_user_nfts_user_id
        ON user_nfts(user_id);
    `);


    await query(`
        CREATE INDEX IF NOT EXISTS idx_user_nfts_status
        ON user_nfts(status);
    `);


    await query(`
        CREATE INDEX IF NOT EXISTS idx_nft_sales_user_id
        ON nft_sales(user_id);
    `);


    await query(`
        CREATE INDEX IF NOT EXISTS idx_earnings_user_id
        ON earnings(user_id);
    `);


    await query(`
        CREATE INDEX IF NOT EXISTS idx_earnings_type
        ON earnings(type);
    `);


    console.log("Meta NFT PostgreSQL database is ready.");
    console.log("Existing user data has been preserved.");
}


/* =========================================================
   START DATABASE
========================================================= */

const ready = initDatabase();

ready.catch(error => {
    console.error("DATABASE ERROR:", error);
});


/* =========================================================
   EXPORTS
========================================================= */

module.exports = {
    query,
    pool,
    ready
};