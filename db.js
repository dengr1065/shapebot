const mariadb = require("mariadb");

/** @type {mariadb.Connection} */
let conn;

function init(client, token) {
    mariadb
        .createConnection({
            bigNumberStrings: true,
            connectTimeout: 5000,
            database: "shapebot",
            password: process.env.SB2_DB_PASSWD,
            user: "shapebot"
        })
        .then(c => {
            conn = c;
            client.login(token);
        });
}

/**
 * @param {string} sql
 * @returns {object[]}
 */
async function query(sql) {
    const result = await conn.query(sql);
    delete result.meta;
    return result;
}

async function exec(sql) {
    return await conn.query(sql);
}

async function getRows(table, defs, cols) {
    const sqlCols = !cols ? "*" : cols.map(c => conn.escapeId(c)).join(",");

    let q = `SELECT ${sqlCols} FROM ${conn.escapeId(table)}`;
    if (defs) {
        const sqlDefs = Object.entries(defs)
            .map(e => `${conn.escapeId(e[0])} <=> ${conn.escape(e[1])}`)
            .join(" AND ");
        q += ` WHERE ${sqlDefs};`;
    }

    return await query(q);
}

async function insertInto(table, set) {
    const sqlSet = Object.entries(set)
        .map(e => `${conn.escapeId(e[0])}=${conn.escape(e[1])}`)
        .join(",");

    const sql = `INSERT INTO ${conn.escapeId(table)} SET ${sqlSet}`;
    return await exec(sql);
}

async function deleteFrom(table, defs) {
    const sqlDefs = Object.entries(defs)
        .map(e => `${conn.escapeId(e[0])} <=> ${conn.escape(e[1])}`)
        .join(" AND ");

    const sql = `DELETE FROM ${conn.escapeId(table)} WHERE ${sqlDefs}`;
    return await exec(sql);
}

module.exports = {
    init,
    query,
    exec,
    getRows,
    insertInto,
    deleteFrom
};
