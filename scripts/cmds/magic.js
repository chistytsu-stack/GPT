const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "magic",
    aliases: ["magic", "✨"],
    version: "1.0",
    author: "MEHERAZ",
    countDown: 5,
    role: 0,
    shortDescription: { en: "Cast a magic spell ✨" },
    category: "fun",
    guide: { en: "{pn} <your wish>" }
  },

  onStart: async function ({ api, event, args }) {
    try {
      const wish = args.join(" ") || "a little surprise 🌟";
      const name = event.senderID;

      // Random magic image API (unsplash/random)
      const imgUrl = `https://source.unsplash.com/800x600/?magic,stars,galaxy`;

      const imgPath = path.join(__dirname, "cache", `magic_${Date.now()}.jpg`);

      // Ensure cache folder exists
      fs.mkdirSync(path.join(__dirname, "cache"), { recursive: true });

      const response = await axios({
        url: imgUrl,
        responseType: "arraybuffer",
      });
      fs.writeFileSync(imgPath, Buffer.from(response.data));

      const msg = `🪄✨ *Magical Energy Detected!* ✨🪄\n\n💫 You wished for: “${wish}”\n🔮 The universe is working on it...`;

      await api.sendMessage(
        { body: msg, attachment: fs.createReadStream(imgPath) },
        event.threadID,
        () => fs.unlinkSync(imgPath),
        event.messageID
      );
    } catch (err) {
      console.error(err);
      api.sendMessage("❌ Something went wrong with the magic spell.", event.threadID);
    }
  }
};
