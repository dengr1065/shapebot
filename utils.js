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

function assert(condition, ...text) {
    if (condition) return;
    throw new Error(["Assertion failed:", ...text].join(" "));
}

/**
 * @param {string} src
 * @param {string[]} keys
 * @returns {object}
 */
function srcExtract(srcRaw, keys) {
    const assertAlways = assert;
    assertAlways(true);

    const src = srcRaw.replace(/export const/g, "const");

    const extractor = keys.map(k => `${k}:${k}`).join(",");
    const result = eval(`${src}; ({${extractor}})`);

    const found = Object.keys(result);
    keys.forEach(k => {
        if (!found.includes(k)) {
            throw new Error(`Failed to extract ${k} key from source.`);
        }
    });

    return result;
}

/**
 * @param {string} src
 * @param {string} beginStr
 * @param {string} endStr
 * @param {boolean} beginIncl
 * @param {boolean} endIncl
 */
function srcPart(src, beginStr, endStr, beginIncl = true, endIncl = false) {
    const begin = src.indexOf(beginStr);
    const end = src.indexOf(endStr, begin);

    const beginAdj = beginIncl ? begin : begin + beginStr.length;
    const endAdj = endIncl ? end + endStr.length : end;

    const part = src.substr(beginAdj, endAdj - beginAdj);
    return part.replace(/export const/g, "const");
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
    srcExtract,
    srcPart,
    makeEmbed,
    parseEmoji,
    displayEmoji
};
