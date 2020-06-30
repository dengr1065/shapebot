const Discord = require("discord.js");
const fs = require("fs");
const db = require("./db");
const { makeEmbed, fetchShapezRepo, setStatus } = require("./utils");

/** @type {{name: string, isAllowed: Function, execute: Function}[]} */
const commands = [];
/** @type {string[]} */
const commandFiles = [];

function loadCommands() {
    const cmdfiles = fs
        .readdirSync("./cmds")
        .filter(c => c.endsWith(".js"))
        .map(c => "./cmds/" + c.substr(0, c.length - 3));

    commandFiles.push(...cmdfiles);
    commandFiles.forEach(c => commands.push(require(c)));
}

global.reloadCommands = () => {
    // Unloading commands if possible
    commands.forEach(c => {
        if (c.unload) c.unload();
    });

    // Clearing command store
    commands.splice(0);

    // Updating caches
    commandFiles.forEach(f => {
        delete require.cache[require.resolve(f)];
    });
    commandFiles.splice(0);

    // Loading commands again
    loadCommands();
};

const client = new Discord.Client({
    disableMentions: "everyone",
    partials: ["REACTION", "USER", "MESSAGE"],
    presence: {
        activity: {
            name: "loading...",
            type: "WATCHING"
        }
    }
});

client.on("ready", async () => {
    loadCommands();

    const version = await fetchShapezRepo("master", "version");
    await setStatus(client, "PLAYING", "shapez.io " + version);
});

client.on("messageReactionAdd", async (reaction, usr) => {
    const fetched = await reaction.fetch();

    const matching = await db.getRows("react_roles", {
        msg_id: fetched.message.id,
        reaction: fetched.emoji.id || fetched.emoji.name
    });

    if (matching.length == 0) return;

    const user = await usr.fetch();
    const member = await fetched.message.guild.members.fetch(user);

    matching.forEach(async reactRole => {
        try {
            await member.roles.add(reactRole.role_id);
        } catch (err) {
            console.warn("Failed to add role", reactRole.role_id);
            console.warn(err);
        }
    });
});

client.on("messageReactionRemove", async (reaction, usr) => {
    const fetched = await reaction.fetch();

    const matching = await db.getRows("react_roles", {
        msg_id: fetched.message.id,
        reaction: fetched.emoji.id || fetched.emoji.name
    });

    if (matching.length == 0) return;

    const user = await usr.fetch();
    const member = await fetched.message.guild.members.fetch(user);

    matching.forEach(async reactRole => {
        try {
            await member.roles.remove(reactRole.role_id);
        } catch (err) {
            console.warn("Failed to remove role", reactRole.role_id);
            console.warn(err);
        }
    });
});

client.on("message", async msg => {
    if (msg.author.bot) return;
    if (!msg.content.startsWith(":")) return;

    const content = msg.content.substr(1).trim();
    const args = content.replace(/\s+/g, " ").split(" ");
    const cmdname = args.shift().toLowerCase();

    const cmd = commands.find(c => c.name == cmdname);

    if (!cmd) return;

    try {
        if (!cmd.isAllowed(msg)) {
            const e = new Error("Execution of this command is restricted.");
            e.perms = true;
            throw e;
        }
        await cmd.execute(msg, content, args, client);
    } catch (err) {
        console.error(err);
        if (!err.constructor) return;

        const r = `./reports/Err-${err.constructor.name}-${Date.now()}.log`;
        if (!err.perms) {
            fs.writeFileSync(r, err.toString(), "utf-8");
        }

        const isGeneric = err.constructor.name == "Error";
        const embed = makeEmbed(
            isGeneric ? "Error:" : `Error (${err.constructor.name}):`,
            err.perms ? 0xdfe033 : 0xef2222,
            client
        );

        embed.setDescription(err.message);
        if (!err.perms) {
            embed.addField("Report", `\`${r}\``);
        }
        await msg.channel.send(embed);
    }
});

db.init(client, process.env.SB2_TOKEN);
