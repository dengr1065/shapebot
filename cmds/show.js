const Discord = require("discord.js");

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
    }
};
