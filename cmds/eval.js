const Discord = require("discord.js");
const { owners } = require("../config.json");
const { makeEmbed } = require("../utils");

const s = {
    utils: require("../utils"),
    db: require("../db")
};

function getCleanStack(err) {
    if (err instanceof Error) {
        const lines = (err.stack || "").split("\n");
        lines.shift();

        return lines
            .filter(l => !l.includes("/node_modules/"))
            .map(l => l.trim())
            .join("\n");
    }
    return err.toString();
}

function inspect(obj) {
    return require("util").inspect(obj);
}

module.exports = {
    name: "eval",
    /** @param {Discord.Message} msg */
    isAllowed: msg => owners.includes(msg.author.id),
    /**
     * @param {Discord.Message} msg
     * @param {string} content
     * @param {string[]} args
     * @param {Discord.Client} client
     */
    execute: async (msg, content, args, client) => {
        try {
            const result = await eval(content.substr(5));
            if (result instanceof Error) {
                throw result;
            }

            if (["string", "number", "boolean"].includes(typeof result)) {
                await msg.channel.send(result.toString().substr(0, 1800), {
                    code: true
                });
                return;
            }

            if (result instanceof Function) {
                await msg.channel.send(result.toString().substr(0, 1800), {
                    code: "js"
                });
                return;
            }

            await msg.channel.send(inspect(result).substr(0, 1800), {
                code: true
            });
        } catch (err) {
            const isGeneric =
                !err.constructor || err.constructor.name == "Error";

            const embed = makeEmbed(
                isGeneric ? "Error:" : `Error (${err.constructor.name}):`,
                0xef22af,
                client
            );

            embed.setDescription(
                !err.constructor
                    ? err
                    : `${err.message}\`\`\`\n${getCleanStack(err)}\n\`\`\``
            );
            await msg.channel.send(embed);
        }
    }
};
