const Discord = require("discord.js");
const { owners } = require("../config.json");
const { getRows, deleteFrom, insertInto } = require("../db");
const { makeEmbed } = require("../utils");

/**
 * @param {Discord.MessageEmbed} embed
 * @param {Discord.Role|string} role
 * @param {string} reaction
 */
function autoFields(embed, role, reaction) {
    const isCustom = reaction.length != 1;
    const emojiSpec = isCustom ? `<:unknown:${reaction}>` : reaction;

    embed.addField("Role", role.toString(), true);
    embed.addField("Emoji", emojiSpec, true);
}

module.exports = {
    name: "role",
    /** @param {Discord.Message} msg */
    isAllowed: msg => true,
    /**
     * @param {Discord.Message} msg
     * @param {string} content
     * @param {string[]} args
     * @param {Discord.Client} client
     */
    execute: async (msg, content, args, client) => {
        if (args.length <= 1) {
            const defs = args.length == 0 ? undefined : { msg_id: args[0] };
            const entries = await getRows("react_roles", defs);

            const ready = await Promise.all(
                entries.map(async e => {
                    const role = await msg.guild.roles.fetch(e.role_id);
                    if (!role) return;

                    return {
                        msg_id: e.msg_id,
                        role: role,
                        reaction:
                            e.reaction.length == 1
                                ? e.reaction
                                : `<:unknown:${e.reaction}>`
                    };
                })
            );

            const embed = makeEmbed("Auto-assigned roles:", 0x34ec42, client);

            ready
                .filter(e => e)
                .forEach(e => {
                    embed.addField(
                        e.msg_id.toString(),
                        `${e.role}: ${e.reaction}`
                    );
                });

            await msg.channel.send(embed);
            return;
        }

        if (!owners.includes(msg.author.id)) {
            const err = new Error("You are not allowed to manage roles.");
            err.perms = true;
            throw err;
        }

        if (args.length < 3) {
            const err = new Error("Not enough arguments.");
            err.perms = true;
            throw err;
        }

        const target = {
            msg_id: args[0],
            role_id: args[1],
            reaction: args[2]
        };

        const foundRole = await msg.guild.roles.fetch(target.role_id);
        const extRows = await getRows("react_roles", target);

        if (extRows.length > 0) {
            const meta = await deleteFrom("react_roles", target);

            const embed = makeEmbed(
                "Removed auto-assigned role",
                0xef30d2,
                client
            );

            embed.setDescription(
                `Message ID: ${target.msg_id}\n` +
                    `Affected rows: ${meta.affectedRows}`
            );
            autoFields(embed, foundRole, target.reaction);

            await msg.channel.send(embed);
            return;
        }

        if (!foundRole) {
            const err = new Error("Invalid role ID.");
            err.perms = true;
            throw err;
        }

        const meta = await insertInto("react_roles", target);

        const embed = makeEmbed("Added auto-assigned role", 0xd2ef30, client);

        embed.setDescription(
            `Message ID: ${target.msg_id}\n` +
                `Affected rows: ${meta.affectedRows}`
        );
        autoFields(embed, foundRole, target.reaction);

        await msg.channel.send(embed);
    }
};
