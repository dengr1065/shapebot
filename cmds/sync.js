const Discord = require("discord.js");
const { owners } = require("../config.json");
const { setStatus, fetchShapezRepo } = require("../utils");

module.exports = {
    name: "sync",
    /** @param {Discord.Message} msg */
    isAllowed: msg => owners.includes(msg.author.id),
    /**
     * @param {Discord.Message} msg
     * @param {string} content
     * @param {string[]} args
     * @param {Discord.Client} client
     */
    execute: async (msg, content, args, client) => {
        let text = "Synchronization in progress...\n";
        await setStatus(client, "WATCHING", "loading...");

        text += "Fetching latest version...";
        const sent = await msg.channel.send(text);
        const version = await fetchShapezRepo("master", "version");
        text += " done: " + version + "\n";
        await sent.edit(text);

        const hookWait = client.commands
            .filter(c => c.sync)
            .map(async c => {
                text += `Processing \`:${c.name}\` hook...\n`;
                await sent.edit(text);
                await c.sync();
            });

        await Promise.all(hookWait);
        await setStatus(client, "PLAYING", "shapez.io " + version);

        text += "\nSYNC COMPLETE";
        await sent.edit(text);
    }
};
