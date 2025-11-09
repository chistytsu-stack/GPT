/*
───────────────────────────────
💾 addfile.js | Create .js command file from chat
🧠 Author: ChatGPT (for AceGun)
📦 Requires: fs-extra
───────────────────────────────
*/

const fs = require("fs-extra");

module.exports = {
  config: {
    name: "addfile",
    aliases: ["createcmd", "savecmd"],
    version: "1.0",
    author: "ChatGPT",
    role: 2, // admin only (role 2 = bot admin)
    shortdescription: "Create new command file directly from Messenger",
    longdescription: "Allows bot admins to create .js command files directly from chat",
    category: "system",
    usages: "{pn} <filename> <reply with code or write inline>",
    cooldowns: 5
  },

  onStart: async function ({ api, event, args }) {
    const threadID = event.threadID;
    const senderID = event.senderID;

    // ✅ Admin check (replace with your admin ID if needed)
    const adminIDs = ["100023789902793"]; // <-- তোমার FB UID বসাও এখানে
    if (!adminIDs.includes(senderID)) {
      return api.sendMessage("⚠️ | You are not allowed to use this command.", threadID, event.messageID);
    }

    // 🧩 Command usage check
    const fileName = args[0];
    if (!fileName) {
      return api.sendMessage("📝 | Please provide a filename.\nExample: addfile sing", threadID, event.messageID);
    }

    // 🧾 Code from reply or inline
    let codeContent = "";
    if (event.type === "message_reply" && event.messageReply?.body) {
      codeContent = event.messageReply.body;
    } else {
      codeContent = args.slice(1).join(" ");
    }

    if (!codeContent) {
      return api.sendMessage("📩 | Please reply to a message containing the code or write it inline.", threadID, event.messageID);
    }

    // 🗂 Folder setup
    const folderPath = `${__dirname}/`;
    const filePath = `${folderPath}${fileName}.js`;

    try {
      // ✍️ Save code to file
      await fs.writeFile(filePath, codeContent, "utf8");

      api.sendMessage(`✅ | Command file created successfully!\n📁 Path: cmds/${fileName}.js`, threadID, event.messageID);

      // 🔄 Optional: auto reload if your bot supports dynamic reload
    } catch (error) {
      console.error("❌ Error creating file:", error);
      api.sendMessage("❌ | Failed to save file. Check console for details.", threadID, event.messageID);
    }
  }
};
