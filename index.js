// =======================
// 🤖 GoatBot / FCA / Mirai Bot Runner
// =======================

// ✅ Core Modules
const fs = require("fs");
const path = require("path");

// =======================
// 🧠 BOT MAIN STARTER
// =======================
(async () => {
  try {
    console.log("🚀 Starting bot...");

    // 🔹 Try loading the main bot file
    if (fs.existsSync(path.join(__dirname, "bot.js"))) {
      require("./bot");
      console.log("✅ Bot started successfully from bot.js");
    } 
    else if (fs.existsSync(path.join(__dirname, "main.js"))) {
      require("./main");
      console.log("✅ Bot started successfully from main.js");
    } 
    else {
      console.warn("⚠️ No bot entry file found (bot.js or main.js missing)");
    }

  } catch (err) {
    console.error("❌ Failed to start bot:", err);
  }
})();

// =======================
// ⚙️ Render Keep Alive Server
// =======================
try {
  const express = require("express");
  const app = express();
  const PORT = process.env.PORT || 10000; // 10000 recommended by Render

  app.get("/", (req, res) => {
    res.send("🤖 Your bot is alive on Render!");
  });

  app.listen(PORT, () => {
    console.log(`🌐 HTTP server started on port ${PORT} to keep Render alive`);
  });
} catch (err) {
  console.warn("⚠️ Express not installed — skipping HTTP keep-alive.");
}

// =======================
// 🪄 Facebook Login Loader (Optional)
// =======================
try {
  const login = require("./includes/facebook");
  if (login && typeof login.start === "function") {
    login.start();
    console.log("🔐 Facebook login started!");
  } else {
    console.log("⚠️ includes/facebook.js found but no start() function.");
  }
} catch (err) {
  console.warn("⚠️ Facebook login module not found or failed:", err.message);
}
