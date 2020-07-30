const Discord = require("discord.js");
const { fetchShapezRepo, srcExtract, srcPart } = require("../utils");
const { exec, insertInto } = require("../db");

let enumSubShape = {};
let enumSubShapeToShortcode = {};
let isCached = false;

const subCommands = {
    buildings: "buildings",
    upgrades: "upgrades",
    levels: "levels"
};

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
    execute: async (msg, content, args, client) => {
        const subcmd = args[0];

        switch (subcmd) {
            default:
                const formattedList = Object.values(subCommands)
                    .map(c => `\`${c}\``)
                    .join(", ");

                const text = `
                WORK IN PROGRESS!
                Available commands: ${formattedList}

                Examples:
                \`:show buildings belt\`
                \`:show upgrades 2\`
                \`:show levels 12\`
                `.trim();

                await msg.channel.send(text);
                break;
        }
    },
    sync: async () => {
        const srcShapeDef = await fetchShapezRepo(
            "master",
            "src/js/game/shape_definition.js"
        );

        const shapeDefEnums = srcExtract(
            srcPart(srcShapeDef, "const enum", "for ("),
            ["enumSubShape", "enumSubShapeToShortcode"]
        );

        enumSubShape = shapeDefEnums.enumSubShape;
        enumSubShapeToShortcode = shapeDefEnums.enumSubShapeToShortcode;
        isCached = true;

        await exec("TRUNCATE TABLE `subshapes`");

        const subShapesDBWait = Object.entries(enumSubShape)
            .map(e => {
                if (!enumSubShapeToShortcode[e[1]]) {
                    throw new Error(`No shortcode for shape \`${e[1]}\``);
                }
                return {
                    key: e[0],
                    name: e[1],
                    shortcode: enumSubShapeToShortcode[e[1]]
                };
            })
            .map(row => {
                insertInto("subshapes", row);
            });

        await Promise.all(subShapesDBWait);
    }
};
