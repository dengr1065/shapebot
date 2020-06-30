const Discord = require("discord.js");
const { owners } = require("../config.json");

module.exports = {
    name: "eval",
    /** @param {Discord.Message} msg */
    isAllowed: msg => owners.includes(msg.author.id),
    execute: (msg, content, args) => {
        eval(content.substr(5));
    }
};
