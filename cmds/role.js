const Discord = require("discord.js");
const { owners } = require("../config.json");
const { getRows } = require("../db");
const { makeEmbed } = require("../utils");

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

        await msg.channel.send("to be done!");
    }
};
