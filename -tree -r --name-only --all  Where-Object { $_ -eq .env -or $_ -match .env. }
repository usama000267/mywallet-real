const { Pool } = require("pg");

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function query(text, params = []) {
    return pool.query(text, params);
}

async function initDatabase() {

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

        CREATE TABLE IF NOT EXISTS deposits (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL,
            amount NUMERIC NOT NULL,
            network TEXT NOT NULL,
            tx_hash TEXT UNIQUE,
            status TEXT NOT NULL DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS withdrawals (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL,
            amount NUMERIC NOT NULL,
            network TEXT NOT NULL,
            wallet_address TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

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

    console.log("Neon PostgreSQL database is ready.");
}

/*
    IMPORTANT:
    server.js uses db.ready,
    so we must export the database initialization promise.
*/

const ready = initDatabase();

ready.catch(error => {
    console.error("DATABASE ERROR:", error);
});

module.exports = {
    query,
    pool,
    ready
};