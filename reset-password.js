require("dotenv").config();

const bcrypt = require("bcryptjs");
const db = require("./database");

(async () => {
    try {
        await db.ready;

        const email = "usamakingg034@gmail.com";

        // Yahan APNA NAYA PASSWORD likho.
        // Ye password mujhe mat bhejna.
        const newPassword = "Usama034@";

        if (newPassword === "CHANGE_THIS_PASSWORD") {
            console.log("ERROR: Please set your own new password first.");
            return;
        }

        const hash = await bcrypt.hash(newPassword, 12);

        const result = await db.query(
            `UPDATE users
             SET password = $1
             WHERE email = $2
             RETURNING id, name, email, balance, is_blocked`,
            [hash, email]
        );

        if (result.rows.length === 0) {
            console.log("ERROR: Account not found.");
            return;
        }

        console.log("\n===== PASSWORD RESET SUCCESSFUL =====");
        console.log(result.rows[0]);
        console.log("=====================================\n");

    } catch (error) {
        console.error("PASSWORD RESET ERROR:");
        console.error(error);
    } finally {
        await db.pool.end();
    }
})();