const Discord = require("discord.js");
const { owners } = require("../config.json");
const { execSync } = require("child_process");

module.exports = {
    name: "pull",
    /** @param {Discord.Message} msg */
    isAllowed: msg => owners.includes(msg.author.id),
    /**
     * @param {Discord.Message} msg
     * @param {string} content
     * @param {string[]} args
     * @param {Discord.Client} client
     */
    execute: async (msg, content, args, client) => {
        const sent = await msg.channel.send("Pulling...");

        const result = execSync("git pull --ff-only", {
            encoding: "utf-8"
        });
        await sent.edit(result, { code: true });
    }
};
