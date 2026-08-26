import dotenv from "dotenv";
import path from "node:path";

// Load the root .env BEFORE importing the application.
// Root:
// Instagram-Business-Intelligence/.env
dotenv.config({
  path: path.resolve(process.cwd(), "../../.env"),
});

const rawPort = process.env["PORT"] ?? "5000";

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

if (process.env["GEMINI_API_KEY"]) {
  console.log("[Gemini] API key loaded successfully");
} else {
  console.error(
    "[Gemini] API key is MISSING. Check the root .env file.",
  );
}

// IMPORTANT:
// Dynamic imports happen AFTER dotenv.config(),
// so instagram.ts receives GEMINI_API_KEY correctly.
const { default: app } = await import("./app");
const { logger } = await import("./lib/logger");

app.listen(port, (err) => {
  if (err) {
    logger.error(
      { err },
      "Error listening on port",
    );

    process.exit(1);
  }

  logger.info(
    { port },
    "Server listening",
  );
});