const Discord = require("discord.js");
const { owners } = require("../config.json");

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
        await eval(content.substr(5));
    }
};
