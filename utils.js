const { name, version } = require("./package.json");
const { execSync } = require("child_process");
const Discord = require("discord.js");

function formattedVersion() {
    let commit = "unknown";
    try {
        commit = execSync("git rev-parse --short HEAD", {
            encoding: "utf-8"
        }).trim();
    } catch {}

    return `${name} ${version} @ ${commit}`;
}

async function fetchShapezRepo(file) {}

function makeEmbed(title, color = 0x606060, client) {
    const embed = new Discord.MessageEmbed();
    embed.setTitle(title);
    embed.setColor(color);

    if (client instanceof Discord.Client) {
        embed.setFooter(formattedVersion(), client.user.displayAvatarURL(128));
    }

    return embed;
}

module.exports = {
    formattedVersion,
    fetchShapezRepo,
    makeEmbed
};
