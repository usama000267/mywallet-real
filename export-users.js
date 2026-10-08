require("dotenv").config({
    path: require("path").join(__dirname, ".env")
});

const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function exportUsers() {
    try {
        const result = await pool.query(`
            SELECT
                id,
                name,
                email,
                password,
                balance,
                referral_code,
                referred_by,
                created_at,
                is_blocked
            FROM users
            ORDER BY id
        `);

        const output = path.join(__dirname, "database-backup", "users-migration.json");

        fs.writeFileSync(
            output,
            JSON.stringify(result.rows, null, 2),
            "utf8"
        );

        console.log("USERS EXPORT COMPLETED");
        console.log("Users:", result.rows.length);
        console.log("File:", output);
    } catch (error) {
        console.error("EXPORT ERROR:", error.message);
    } finally {
        await pool.end();
    }
}

exportUsers();