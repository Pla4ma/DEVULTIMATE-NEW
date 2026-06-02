import type { Server } from "node:http";
import app from "./app";
import { logger } from "./lib/logger";
import { validateConfig } from "./config";
import { pruneMemory } from "./lib/usage-store";

try {
  validateConfig();
} catch (error) {
  logger.error(error, "Configuration error");
  process.exit(1);
}

const rawPort = Number(process.env["PORT"] || 8080);
const listenPort = Number.isNaN(rawPort) || rawPort <= 0 ? 8080 : rawPort;
if (rawPort !== listenPort) {
  logger.error({ port: process.env["PORT"] }, "Invalid PORT value, defaulting to 8080");
}

const server: Server = app.listen(listenPort, () => {
  logger.info({ port: listenPort }, "Server listening");
});

server.on("error", (err) => {
  logger.error({ err }, "Server failed to start");
  process.exit(1);
});

const pruneTimer = setInterval(pruneMemory, 60 * 60 * 1000);
pruneTimer.unref();

let shuttingDown = false;
function shutdown(signal: string): void {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ signal }, "Shutting down gracefully");

  const forceExit = setTimeout(() => {
    logger.error("Forced shutdown after timeout — closing with open connections");
    process.exit(1);
  }, 10_000);
  forceExit.unref();

  server.close((err) => {
    clearTimeout(forceExit);
    if (err) {
      logger.error({ err }, "Error during server close");
      process.exit(1);
    }
    logger.info("Closed remaining connections — exiting");
    process.exit(0);
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

process.on("unhandledRejection", (reason) => {
  logger.error({ reason }, "Unhandled promise rejection");
});
process.on("uncaughtException", (err) => {
  logger.error({ err }, "Uncaught exception — shutting down");
  shutdown("uncaughtException");
});
