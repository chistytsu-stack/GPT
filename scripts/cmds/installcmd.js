/**
 * installCommand.js
 *
 * Robust command installer for GoatBot-like frameworks.
 * - Safe terminal operations (no crash if clearLine/cursorTo missing)
 * - Validates file, copies to scripts/cmds, clears require cache, and logs results
 *
 * Usage:
 *   const installer = require('./installCommand');
 *   installer.install(pathToUploadedFile, { cmdsDir, logger })
 *
 * Where logger can be console or your custom logger with .log/.error
 */

const fs = require("fs");
const path = require("path");
const util = require("util");
const fse = require("fs-extra");

const rename = util.promisify(fs.rename);
const copyFile = util.promisify(fs.copyFile);
const unlink = util.promisify(fs.unlink);
const stat = util.promisify(fs.stat);

/** Safe terminal helpers */
function safeClearLine() {
  try {
    if (process && process.stderr) {
      if (typeof process.stderr.clearLine === "function") process.stderr.clearLine();
      if (typeof process.stderr.cursorTo === "function") process.stderr.cursorTo(0);
    }
  } catch (e) {
    // ignore - don't crash in environments without tty support
  }
}

/** Utility: safe require (clears cache for module) */
function safeRequire(filePath) {
  try {
    delete require.cache[require.resolve(filePath)];
  } catch (e) {
    // ignore if not in cache
  }
  try {
    return require(filePath);
  } catch (e) {
    // return null on failure
    return null;
  }
}

/** Validate that the file looks like a command (basic checks) */
async function validateCommandFile(srcPath) {
  // must exist
  try {
    const s = await stat(srcPath);
    if (!s.isFile()) return { ok: false, reason: "Not a file" };
  } catch (e) {
    return { ok: false, reason: "File does not exist" };
  }

  // quick content check: must be JS and export module
  try {
    const content = await fse.readFile(srcPath, "utf8");
    if (!content.includes("module.exports")) {
      return { ok: false, reason: "File does not export module.exports" };
    }
  } catch (e) {
    return { ok: false, reason: "Cannot read file content" };
  }

  return { ok: true };
}

/**
 * Install a command JS file to target commands directory
 * @param {string} uploadedPath - path to uploaded file (tmp)
 * @param {object} options - { cmdsDir: absolute path to commands dir, logger: console-like }
 */
async function install(uploadedPath, options = {}) {
  const logger = options.logger || console;
  const cmdsDir = options.cmdsDir || path.join(__dirname, "..", "cmds"); // default fallback

  safeClearLine();
  logger.log("[install] Starting install process...");

  // ensure cmdsDir exists
  try {
    await fse.ensureDir(cmdsDir);
  } catch (e) {
    logger.error("[install] Failed to ensure commands directory:", e && e.message);
    return { success: false, reason: "Cannot create commands directory", error: e };
  }

  // validate uploaded file
  const validate = await validateCommandFile(uploadedPath);
  if (!validate.ok) {
    logger.error("[install] Validation failed:", validate.reason);
    return { success: false, reason: validate.reason };
  }

  // determine file name and destination
  const baseName = path.basename(uploadedPath);
  // if the uploaded file has extension .tmp or random, try to infer from first line or force .js
  const ext = path.extname(baseName) || ".js";
  const destName = baseName.endsWith(".js") ? baseName : baseName + ".js";
  const destPath = path.join(cmdsDir, destName);

  // if dest exists, back it up (timestamp)
  try {
    if (fs.existsSync(destPath)) {
      const bakName = `${destName}.bak_${Date.now()}`;
      const bakPath = path.join(cmdsDir, bakName);
      await copyFile(destPath, bakPath);
      logger.log(`[install] Existing command backed up to ${bakName}`);
    }
  } catch (e) {
    logger.error("[install] Backup failed:", e && e.message);
    // not a fatal error; continue
  }

  // Move/copy uploaded file to destination
  try {
    // prefer move/rename if same filesystem, otherwise copy
    try {
      await rename(uploadedPath, destPath);
    } catch (renameErr) {
      // fallback to copy then unlink
      await copyFile(uploadedPath, destPath);
      try { await unlink(uploadedPath); } catch (u) { /* ignore */ }
    }
    logger.log(`[install] Installed file to ${destPath}`);
  } catch (e) {
    logger.error("[install] Failed to move/copy file:", e && e.message);
    return { success: false, reason: "Failed to place file into cmds directory", error: e };
  }

  // attempt to require & validate exported shape
  let required = null;
  try {
    required = safeRequire(destPath);
    if (!required || typeof required !== "object" || !required.config) {
      logger.log("[install] Warning: installed file did not export expected shape (config).");
      // Not fatal — command might still work depending on framework
    } else {
      logger.log(`[install] Command meta: name=${required.config.name || "unknown"} version=${required.config.version || "?"}`);
    }
  } catch (e) {
    logger.error("[install] Require failed (non-fatal):", e && e.message);
  }

  // final message
  safeClearLine();
  logger.log("[install] Installation completed.");

  return { success: true, path: destPath, meta: required && required.config ? required.config : null };
}

module.exports = { install, safeClearLine, safeRequire };
