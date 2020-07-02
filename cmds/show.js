const Discord = require("discord.js");
const { fetchShapezRepo } = require("../utils");

function srcPart(src, beginStr, endStr, beginIncl = true, endIncl = false) {
    const begin = src.indexOf(beginStr);
    const end = src.indexOf(endStr, begin);

    const beginAdj = beginIncl ? begin : begin + beginStr.length;
    const endAdj = endIncl ? end + endStr.length : end;

    const part = src.substr(beginAdj, endAdj - beginAdj);
    return part.replace(/export const/g, "const");
}

/**
 * @param {string} src
 * @param {string[]} keys
 * @returns {object}
 */
function srcExtract(src, keys) {
    const extractor = keys.map(k => `${k}:${k}`).join(",");
    const result = eval(`${src}; ({${extractor}})`);

    const found = Object.keys(result);
    keys.forEach(k => {
        if (!found.includes(k)) {
            throw new Error(`Failed to extract ${k} key from source.`);
        }
    });

    return result;
}

let enumSubShape = {};
let enumSubShapeToShortcode = {};
let isCached = false;

module.exports = {
    name: "show",
    /** @param {Discord.Message} msg */
    isAllowed: msg => true,
    /**
     * @param {Discord.Message} msg
     * @param {string} content
     * @param {string[]} args
     * @param {Discord.Client} client
     */
    execute: async (msg, content, args, client) => {},
    sync: async () => {
        const srcShapeDef = await fetchShapezRepo(
            "master",
            "src/js/game/shape_definition.js"
        );

        const shapeDefEnums = srcExtract(
            srcPart(srcShapeDef, "export const enum", "for ("),
            ["enumSubShape", "enumSubShapeToShortcode", "thisShouldFail"]
        );

        enumSubShape = shapeDefEnums.enumSubShape;
        enumSubShapeToShortcode = shapeDefEnums.enumSubShapeToShortcode;
        isCached = true;
    }
};
