require("dotenv").config();

const db = require("./database");

async function check() {

    try {

        const result =
            await db.query(`
                SELECT
                    column_name,
                    data_type
                FROM information_schema.columns
                WHERE table_name = 'users'
                ORDER BY ordinal_position
            `);

        console.table(result.rows);

    } catch (error) {

        console.error(
            "DATABASE ERROR:",
            error
        );

    } finally {

        await db.pool.end();

    }

}

check();