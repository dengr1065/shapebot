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
 * @returns {Promise<object[]>}
 */
async function query(sql) {
    const result = await conn.query(sql);
    delete result.meta;
    return result;
}

async function exec(sql) {
    return await conn.query(sql);
}

function formQuery(table, defs) {
    const eid = conn.escapeId;
    const esc = conn.escape;

    let q = ` FROM ${eid(table)}`;

    if (defs) {
        const sqlDefs = Object.entries(defs)
            .map(e => {
                if (Array.isArray(e[1])) {
                    const possible = e[1].map(v => {
                        return `${eid(e[0])} <=> ${esc(v)}`;
                    });
                    return "(" + possible.join(" OR ") + ")";
                }
                return `${eid(e[0])} <=> ${esc(e[1])}`;
            })
            .join(" AND ");
        q += ` WHERE ${sqlDefs};`;
    }

    return q;
}

async function getRows(table, defs, cols) {
    const q = formQuery(table, defs);
    const sqlCols = !cols ? "*" : cols.map(c => eid(c)).join(",");

    return await query(`SELECT ${sqlCols}` + q);
}

async function insertInto(table, set) {
    const sqlSet = Object.entries(set)
        .map(e => `${conn.escapeId(e[0])}=${conn.escape(e[1])}`)
        .join(",");

    const sql = `INSERT INTO ${conn.escapeId(table)} SET ${sqlSet}`;
    return await exec(sql);
}

async function deleteFrom(table, defs) {
    const sql = `DELETE` + formQuery(table, defs);
    return await exec(sql);
}

module.exports = {
    init,
    query,
    exec,
    formQuery,
    getRows,
    insertInto,
    deleteFrom
};
