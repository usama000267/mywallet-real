require("dotenv").config({
    path: require("path").join(__dirname, ".env")
});

const { Pool } = require("pg");

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function check() {
    try {
        const result = await pool.query(`
            SELECT 'users' AS table_name, COUNT(*) AS count FROM users
            UNION ALL
            SELECT 'deposits', COUNT(*) FROM deposits
            UNION ALL
            SELECT 'withdrawals', COUNT(*) FROM withdrawals
            UNION ALL
            SELECT 'reservations', COUNT(*) FROM reservations
            UNION ALL
            SELECT 'referral_bonuses', COUNT(*) FROM referral_bonuses
            UNION ALL
            SELECT 'nfts', COUNT(*) FROM nfts
            UNION ALL
            SELECT 'user_nfts', COUNT(*) FROM user_nfts
            UNION ALL
            SELECT 'nft_sales', COUNT(*) FROM nft_sales
            UNION ALL
            SELECT 'earnings', COUNT(*) FROM earnings
            UNION ALL
            SELECT 'landing_nfts', COUNT(*) FROM landing_nfts;
        `);

        console.table(result.rows);
    } catch (error) {
        console.error("ERROR:", error.message);
    } finally {
        await pool.end();
    }
}

check();