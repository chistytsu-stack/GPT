// =======================
// 🧠 GoatBot / Discord / Telegram Bot Runner
// =======================

// ✅ Core modules
const fs = require("fs");
const path = require("path");

// ✅ Main bot file load
try {
  require("./bot"); // তোমার মূল bot entry file (যেমন bot.js / main.js)
  console.log("✅ Bot started successfully!");
} catch (err) {
  console.error("❌ Failed to start bot:", err);
}

// =======================
// ⚙️ Render-specific fallback (Fake HTTP Server)
// =======================
try {
  const express = require("express");
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.get("/", (req, res) => {
    res.send("🤖 Bot is running successfully on Render!");
  });

  app.listen(PORT, () => {
    console.log(`🌐 HTTP server started on port ${PORT} to keep Render alive`);
  });
} catch (err) {
  console.warn("⚠️ Express not installed. Skipping web server part.");
}
