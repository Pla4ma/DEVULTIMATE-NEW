import { Router, type IRouter } from "express";
import multer from "multer";
import { scanZip } from "../lib/repo-scanner";
import { evaluateLaunchGates } from "../lib/launch-gates";

const router: IRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/zip" ||
        file.mimetype === "application/x-zip-compressed" ||
        file.originalname.toLowerCase().endsWith(".zip")) {
      cb(null, true);
    } else {
      cb(new Error("Only .zip files are accepted"));
    }
  },
});

// POST /api/projects/scan-upload
router.post("/scan-upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "ZIP invalid. Please upload a .zip file." });
    return;
  }

  const file = req.file;

  if (!file.originalname.toLowerCase().endsWith(".zip")) {
    res.status(400).json({ error: "ZIP invalid. Only .zip files are accepted." });
    return;
  }

  if (file.size > 50 * 1024 * 1024) {
    res.status(413).json({ error: "ZIP too large. Maximum size is 50MB." });
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
      warnings: [...warnings, ...scan.warnings],
    });
  } catch (err) {
    req.log.error({ err }, "ZIP scan error");
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("Invalid ZIP") || msg.includes("Bad local file")) {
      res.status(400).json({ error: "ZIP invalid. The file could not be read as a ZIP archive." });
    } else {
      res.status(500).json({ error: "Scan failed: " + msg });
    }
  }
});

export default router;
