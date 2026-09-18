require("dotenv").config();

const bcrypt = require("bcryptjs");
const db = require("./database");

(async () => {
    try {
        await db.ready;

        const email = "usamakingg034@gmail.com";

        const result = await db.query(
            `SELECT password
             FROM users
             WHERE email = $1`,
            [email]
        );

        if (result.rows.length === 0) {
            console.log("ACCOUNT NOT FOUND");
            return;
        }

        const password = "YOUR_PASSWORD_HERE";

        const match = await bcrypt.compare(
            password,
            result.rows[0].password
        );

        console.log("\n===== PASSWORD TEST =====");
        console.log("Password matches:", match);
        console.log("=========================\n");

    } catch (error) {
        console.error("PASSWORD TEST ERROR:", error);
    } finally {
        await db.pool.end();
    }
})();