const mariadb = require("mariadb");

/** @type {mariadb.Connection} */
let conn;

mariadb
    .createConnection({
        bigNumberStrings: true,
        connectTimeout: 5000,
        database: "shapebot",
        password: process.env.SB2_DB_PASSWD,
        user: "shapebot"
    })
    .then(c => (conn = c));

async function query(sql) {
    const result = await conn.query(sql);
    delete result.meta;
    return result;
}

async function exec(sql) {
    return await conn.query(sql);
}

async function getRow(table, defs, cols) {
    const sqlCols = !cols ? "*" : cols.map(c => conn.escapeId(c)).join(",");
    const sqlDefs = Object.entries(defs)
        .map(e => `${conn.escapeId(e[0])} <=> ${conn.escape(e[1])}`)
        .join(" AND ");

    const q = `SELECT ${sqlCols} FROM ${conn.escapeId(table)} WHERE ${sqlDefs}`;
    console.log(q);
    return await query(q);
}

module.exports = {
    query,
    exec,
    getRow
};
