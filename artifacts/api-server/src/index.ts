import app from "./app";
import { logger } from "./lib/logger";
import { validateConfig } from "./config";

try {
  validateConfig();
} catch (error) {
  logger.error(error, "Configuration error");
  process.exit(1);
}

const port = Number(process.env["PORT"] || 8080);

if (Number.isNaN(port) || port <= 0) {
  logger.error({ port: process.env["PORT"] }, "Invalid PORT value, defaulting to 8080");
}

const listenPort = Number.isNaN(port) || port <= 0 ? 8080 : port;

app.listen(listenPort, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }
  logger.info({ port: listenPort }, "Server listening");
});
