require("dotenv").config({
    path: require("path").join(__dirname, ".env")
});

const { spawn } = require("child_process");
const path = require("path");

const output = path.join(
    __dirname,
    "database-backup",
    "metanft-neon-backup.dump"
);

const pgDump = "C:\\Program Files\\PostgreSQL\\18\\bin\\pg_dump.exe";

const child = spawn(
    pgDump,
    [
        process.env.DATABASE_URL,
        "--format=custom",
        `--file=${output}`
    ],
    {
        stdio: ["ignore", "inherit", "inherit"]
    }
);

child.on("close", code => {
    if (code === 0) {
        console.log("NEON BACKUP COMPLETED:");
        console.log(output);
    } else {
        console.log("BACKUP FAILED. Exit code:", code);
    }
});