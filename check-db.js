const Database = require("better-sqlite3");

const db = new Database("./my wallet.db", {
    readonly: true
});

const tables = db.prepare(`
    SELECT name
    FROM sqlite_master
    WHERE type = 'table'
    ORDER BY name
`).all();

console.log("DATABASE TABLES:");
console.log(tables);

db.close();