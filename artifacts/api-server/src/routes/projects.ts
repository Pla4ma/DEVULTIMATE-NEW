import { Router, type IRouter } from "express";
import multer from "multer";
import { scanZip } from "../lib/repo-scanner";
import { evaluateLaunchGates } from "../lib/launch-gates";
import { requireUploadQuota, requireQuota } from "../lib/usage-quota";

const router: IRouter = Router();

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ["application/zip", "application/x-zip-compressed", "application/x-zip"];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    const isZipMime = ALLOWED_MIME_TYPES.includes(file.mimetype) || file.mimetype.startsWith("application/");
    const isZipName = file.originalname.toLowerCase().endsWith(".zip");
    if (isZipName || isZipMime) {
      cb(null, true);
    } else {
      cb(new Error("Only .zip files are accepted"));
    }
  },
});

router.post("/scan-upload",
  requireUploadQuota(),
  (req, res, next) => {
    upload.single("file")(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          res.status(413).json({ error: "FILE_TOO_LARGE", message: "File exceeds 50MB limit" });
          return;
        }
        res.status(400).json({ error: "UPLOAD_ERROR", message: err.message });
        return;
      }
      if (err) {
        res.status(400).json({ error: "UPLOAD_ERROR", message: err.message });
        return;
      }
      next();
    });
  },
  async (req, res) => {
    if (!req.file) {
      res.status(400).json({ error: "ZIP invalid", message: "Please upload a .zip file." });
      return;
    }

    const file = req.file;

    if (!file.originalname.toLowerCase().endsWith(".zip")) {
      res.status(400).json({ error: "ZIP invalid", message: "Only .zip files are accepted." });
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      res.status(413).json({ error: "FILE_TOO_LARGE", message: "File exceeds 50MB limit." });
      return;
    }

    if (file.size === 0) {
      res.status(400).json({ error: "ZIP invalid", message: "File is empty." });
      return;
    }

    const warnings: string[] = [];

    try {
      const scan = await scanZip(file.buffer, file.originalname);
      const launchGates = evaluateLaunchGates(scan.staticSignals);

      res.json({
        scan: {
          ...scan,
          launchGates,
        },
        summaryMarkdown: scan.summaryMarkdown,
        launchGates,
        evidenceIndex: scan.evidenceIndex,
        repoMap: scan.repoMap,
        warnings: [...warnings, ...scan.warnings],
        trimmed: scan.trimmed,
      });
    } catch (err) {
      req.log.error({ err }, "ZIP scan error");
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("Invalid ZIP") || msg.includes("Bad local file") || msg.includes("is not a zip")) {
        res.status(400).json({ error: "ZIP invalid", message: "The file could not be read as a ZIP archive. Please upload a valid .zip file." });
      } else if (msg.includes("busy processing")) {
        res.status(503).json({ error: "SCAN_BUSY", message: msg });
      } else {
        res.status(500).json({ error: "Scan failed", message: msg });
      }
    }
  },
);

export default router;
