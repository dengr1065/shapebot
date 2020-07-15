const Discord = require("discord.js");
const { fetchShapezRepo, srcExtract, makeEmbed } = require("../utils");
const { getRows } = require("../db");

async function colorInfo(name) {
    const color = (
        await getRows("colors", [{ name: name }, { shortcode: name }])
    )[0];

    if (!color) {
        const err = new Error("No such color: " + name);
        err.perms = true;
        throw err;
    }

    return color;
}

async function colorMix(colorA, colorB) {
    const mixRow = await getRows("color_mixing", {
        color_a: colorA,
        color_b: colorB
    });

    if (!mixRow[0]) {
        const err = new Error(`Failed to mix ${colorA} and ${colorB}`);
        err.perms = true;
        throw err;
    }

    return await colorInfo(mixRow[0].result);
}

module.exports = {
    name: "color",
    /** @param {Discord.Message} msg */
    isAllowed: msg => true,
    /**
     * @param {Discord.Message} msg
     * @param {string} content
     * @param {string[]} args
     * @param {Discord.Client} client
     */
    execute: async (msg, content, args, client) => {
        if (args.length > 10) return;
        if (args.length < 1) {
            const err = new Error("Please specify 1 or more colors!");
            err.perms = true;
            throw err;
        }

        let color = await colorInfo(args.shift());

        if (args.length > 1) {
            color = await args.reduce(async (current, next) => {
                const colorB = await colorInfo(next).name;
                return await colorMix((await current).name, colorB);
            }, color);
        }

        const embed = makeEmbed(
            color.name.substr(0, 1).toUpperCase() + color.name.substr(1),
            Number.parseInt(color.hex.substr(1), 16),
            client
        );

        embed.setDescription(color.hex);

        return await msg.channel.send(embed);
    },
    sync: async () => {
        const code = await fetchShapezRepo("master", "src/js/game/colors.js");
        const enums = srcExtract(code, [
            "enumColors",
            "enumColorToShortcode",
            "enumColorsToHexCode",
            "enumInvertedColors",
            "enumColorMixingResults"
        ]);
    }
};
