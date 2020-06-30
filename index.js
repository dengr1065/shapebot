const Discord = require("discord.js");
const fs = require("fs");
const db = require("./db");
const { makeEmbed } = require("./utils");

/** @type {{name: string, isAllowed: Function, execute: Function}[]} */
const commands = [];
loadCommands();

function loadCommands() {
    fs.readdirSync("./cmds")
        .filter(c => c.endsWith(".js"))
        .map(c => "./cmds/" + c.substr(0, c.length - 3))
        .forEach(c => commands.push(require(c)));
}

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

client.on("messageReactionAdd", async (reaction, usr) => {
    console.log(
        await db.getRow("react_roles", {
            msg_id: reaction.message.id,
            reaction: (await reaction.fetch()).emoji.identifier
        })
    );
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
        }
        await cmd.execute(msg, content, args);
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

client.login(process.env.SB2_TOKEN);
