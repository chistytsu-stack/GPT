// ===========================
// ✅ WORKING INDEX.JS FILE ✅
// ===========================

const express = require("express");
const path = require("path");
const fs = require("fs");
const app = express();

// --- PORT Setup (Fix for Render / Replit timeout) ---
const PORT = process.env.PORT || 3000;

// Simple route to verify the bot is alive
app.get("/", (req, res) => {
  res.send("🎶 Bot is running successfully! [Working index.js ✅]");
});

// Start server (important for Render)
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});

// --- Command system loader (optional) ---
const COMMANDS_DIR = path.join(__dirname, "commands");

// Automatically load all .js files from commands folder
if (fs.existsSync(COMMANDS_DIR)) {
  const commandFiles = fs
    .readdirSync(COMMANDS_DIR)
    .filter((file) => file.endsWith(".js"));

  for (const file of commandFiles) {
    const commandPath = path.join(COMMANDS_DIR, file);
    try {
      require(commandPath);
      console.log(`⚡ Loaded command: ${file}`);
    } catch (err) {
      console.error(`❌ Failed to load ${file}:`, err.message);
    }
  }
} else {
  console.log("⚠️ No 'commands' folder found. Create one to add commands.");
}

// --- Optional: Keep alive ping (for uptime services like UptimeRobot) ---
setInterval(() => {
  console.log("🟢 Bot still alive at " + new Date().toLocaleTimeString());
}, 60000);
