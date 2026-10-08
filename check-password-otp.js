require("dotenv").config();

const db = require("./database");

async function check() {

    try {

        const result = await db.query(`
            SELECT
                column_name,
                data_type
            FROM information_schema.columns
            WHERE table_name = 'email_otps'
            ORDER BY ordinal_position
        `);

        console.log(
            "EMAIL_OTPS COLUMNS:"
        );

        console.table(
            result.rows
        );

    } catch (error) {

        console.error(
            "CHECK ERROR:",
            error
        );

    } finally {

        await db.pool.end();

    }

}

check();