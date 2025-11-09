const axios = require("axios");
const https = require("https");
const fs = require("fs");
const path = require("path");
const { pipeline } = require("stream");
const { promisify } = require("util");
const streamPipeline = promisify(pipeline);

module.exports = {
  config: {
    name: "sing",
    aliases: ["sing"],
    version: "7.1",
    author: "Lord Denish (Fixed by GPT-5)",
    countDown: 20,
    role: 0,
    shortDescription: { en: "Download full songs from YouTube as MP3" },
    description: "Type or reply with a song name to download audio.",
    category: "🎶 Media",
    guide: { en: "{pn} <song name>\nOr reply to a message to auto-detect audio." }
  },

  onStart: async function ({ api, message, args, event }) {
    const safeReply = async (text) => {
      try {
        await message.reply(text);
      } catch (e) {
        console.error("Reply failed:", e);
      }
    };

    if (api.setMessageReaction)
      api.setMessageReaction("⏳", event.messageID, () => {}, true);

    try {
      // Step 1: Validate input
      if (!args.length) {
        if (api.setMessageReaction)
          api.setMessageReaction("⚠️", event.messageID, () => {}, true);
        return safeReply("⚠️ | Please provide a song name.");
      }

      const songName = args.join(" ");
      const startTime = Date.now();

      // Step 2: Search YouTube
      let searchResults;
      try {
        const { data } = await axios.get(
          `https://dns-ruby.vercel.app/search?query=${encodeURIComponent(songName)}`
        );
        searchResults = data;
      } catch (err) {
        console.error("Search API failed:", err.message);
        if (api.setMessageReaction)
          api.setMessageReaction("❌", event.messageID, () => {}, true);
        return safeReply("❌ | Failed to search for the song.");
      }

      if (!Array.isArray(searchResults) || searchResults.length === 0) {
        if (api.setMessageReaction)
          api.setMessageReaction("❌", event.messageID, () => {}, true);
        return safeReply("❌ | No results found.");
      }

      // Step 3: Pick the first result
      const song = searchResults[0];
      const youtubeUrl = song.url?.split("&")[0];

      if (!youtubeUrl) {
        if (api.setMessageReaction)
          api.setMessageReaction("❌", event.messageID, () => {}, true);
        return safeReply("❌ | Invalid YouTube URL.");
      }

      // Step 4: Get MP3 download link
      let audioData;
      try {
        const { data } = await axios.get(
          `https://dens-audio.vercel.app/api/ytmp3?url=${encodeURIComponent(youtubeUrl)}`
        );
        audioData = data;
      } catch (err) {
        console.error("Audio API failed:", err.message);
        if (api.setMessageReaction)
          api.setMessageReaction("❌", event.messageID, () => {}, true);
        return safeReply("❌ | Audio download API failed.");
      }

      const downloadUrl = audioData.download_url || audioData.url;
      const title = audioData.title || song.title || songName;

      if (!downloadUrl) {
        console.error("Invalid audio data:", audioData);
        if (api.setMessageReaction)
          api.setMessageReaction("❌", event.messageID, () => {}, true);
        return safeReply("❌ | Could not retrieve MP3 link.");
      }

      // Step 5: Download MP3 temporarily
      const tempFile = path.join(__dirname, `temp_${Date.now()}.mp3`);
      try {
        const response = await axios({
          url: downloadUrl,
          method: "GET",
          responseType: "stream",
          httpsAgent: new https.Agent({ rejectUnauthorized: false }),
          headers: { "User-Agent": "Mozilla/5.0" },
          timeout: 300000
        });
        await streamPipeline(response.data, fs.createWriteStream(tempFile));
      } catch (err) {
        console.error("Stream download failed:", err.message);
        if (api.setMessageReaction)
          api.setMessageReaction("❌", event.messageID, () => {}, true);
        return safeReply("❌ | Failed to download the MP3.");
      }

      // Step 6: Send the file
      try {
        await message.reply({
          body: `🎵 *Title:* ${title}\n🔗 *Source:* YouTube\n⚡ *Fetched in:* ${(
            (Date.now() - startTime) /
            1000
          ).toFixed(2)}s`,
          attachment: fs.createReadStream(tempFile)
        });
      } catch (err) {
        console.error("Send message failed:", err.message);
        if (api.setMessageReaction)
          api.setMessageReaction("❌", event.messageID, () => {}, true);
        return safeReply("❌ | Failed to send the audio file.");
      }

      // Step 7: Cleanup
      fs.unlink(tempFile, (e) => e && console.error("Cleanup failed:", e));
      if (api.setMessageReaction)
        api.setMessageReaction("✅", event.messageID, () => {}, true);

    } catch (err) {
      console.error("General error in sing command:", err.message);
      if (api.setMessageReaction)
        api.setMessageReaction("❌", event.messageID, () => {}, true);
      return safeReply("❌ | Something went wrong while processing your request.");
    }
  }
};
