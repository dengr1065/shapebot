let { name, version } = require("./package.json");

const { execSync } = require("child_process");
const Discord = require("discord.js");
const fetch = require("node-fetch");

function formattedVersion() {
    let commit = "unknown";
    try {
        commit = execSync("git rev-parse --short HEAD", {
            encoding: "utf-8"
        }).trim();
    } catch {}

    return `${name} ${version} @ ${commit}`;
}

function reloadVersion() {
    delete require.cache[require.resolve("./package.json")];

    pkg = require("./package.json");
    name = pkg.name;
    version = pkg.version;
}

/**
 *
 * @param {Discord.Client} client
 * @param {"PLAYING"|"WATCHING"|"STREAMING"} type
 * @param {string} name
 * @param {string?} url
 */
async function setStatus(client, type, name, url) {
    await client.user.setActivity({
        name: name,
        type: type,
        url: url
    });
}

/**
 * @param {string?} branch
 * @param {string} file
 * @returns {Promise<string>}
 */
async function fetchShapezRepo(branch = "master", file) {
    const base = `https://raw.githubusercontent.com/tobspr/shapez.io/${branch}/`;
    const fullurl = base + encodeURIComponent(file);

    return (await (await fetch(fullurl)).text()).trim();
}

function makeEmbed(title, color = 0x606060, client) {
    const embed = new Discord.MessageEmbed();
    embed.setTitle(title);
    embed.setColor(color);

    if (client instanceof Discord.Client) {
        embed.setFooter(formattedVersion(), client.user.displayAvatarURL(128));
    }

    return embed;
}

function parseEmoji(txt) {
    if (!txt) return;
    if (txt.length <= 4) return txt;
    return txt.match(/<\:.*?\:(\d{18,19})>/)[1];
}

function displayEmoji(id) {
    if (!id) return "";
    if (id.length <= 4) return id;
    return `<:unknown:${id}>`;
}

module.exports = {
    formattedVersion,
    reloadVersion,
    setStatus,
    fetchShapezRepo,
    makeEmbed,
    parseEmoji,
    displayEmoji
};
