const Discord = require("discord.js");
const { owners } = require("../config.json");
const { reloadVersion, setStatus } = require("../utils");

module.exports = {
    name: "reload",
    /** @param {Discord.Message} msg */
    isAllowed: msg => owners.includes(msg.author.id),
    /**
     * @param {Discord.Message} msg
     * @param {string} content
     * @param {string[]} args
     * @param {Discord.Client} client
     */
    execute: async (msg, content, args, client) => {
        const oldActivity = client.user.presence.activities[0];
        await setStatus(client, "WATCHING", "loading...");
        reloadCommands();
        reloadVersion();
        if (oldActivity && oldActivity.name) {
            await client.user.setActivity({
                name: oldActivity.name,
                type: oldActivity.type,
                url: oldActivity.url
            });
        }
    }
};
