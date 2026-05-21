import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { projectsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { createHash } from "node:crypto";

const router: IRouter = Router();

function scoreColor(score: number | null): string {
  if (score == null) return "#4a5268";
  if (score >= 70) return "#34d399";
  if (score >= 40) return "#f59e0b";
  return "#f43f5e";
}

function scoreLabel(score: number | null): string {
  if (score == null) return "not scanned";
  if (score >= 70) return "launch ready";
  if (score >= 40) return "needs work";
  return "blocked";
}

function generateBadgeSVG(
  label: string,
  score: number | null,
  color: string,
  style: "flat" | "plastic" = "flat"
): string {
  const scoreStr = score != null ? `${score}/100` : "—";
  const labelWidth = label.length * 7 + 14;
  const scoreWidth = scoreStr.length * 8 + 14;
  const totalWidth = labelWidth + scoreWidth;
  const labelEnd = labelWidth;
  const scoreEnd = totalWidth;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="20" role="img" aria-label="${label}: ${scoreStr}">
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#fff" stop-opacity=".7"/>
    <stop offset=".1" stop-color="#aaa" stop-opacity=".1"/>
    <stop offset=".9" stop-color="#000" stop-opacity=".3"/>
    <stop offset="1" stop-color="#000" stop-opacity=".5"/>
  </linearGradient>
  <clipPath id="r">
    <rect width="${totalWidth}" height="20" rx="3" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#r)">
    <rect width="${labelEnd}" height="20" fill="#24292f"/>
    <rect x="${labelEnd}" width="${scoreWidth}" height="20" fill="${color}"/>
    <rect width="${totalWidth}" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11">
    <text x="${labelEnd / 2}" y="14">${label}</text>
    <text x="${labelEnd + scoreWidth / 2}" y="14">${scoreStr}</text>
  </g>
</svg>`;
}

router.get("/badge/:projectId", async (req, res) => {
  try {
    const projectId = req.params.projectId as string;
    const style = (req.query.style as string) || "flat";
    const [project] = await db
      .select({
        name: projectsTable.name,
        launchReadinessScore: projectsTable.launchReadinessScore,
        scanCount: projectsTable.scanCount,
      })
      .from(projectsTable)
      .where(eq(projectsTable.id, projectId))
      .limit(1);

    if (!project) {
      const svg = generateBadgeSVG("launch readiness", null, "#4a5268", style as "flat");
      res.setHeader("Content-Type", "image/svg+xml");
      res.setHeader("Cache-Control", "no-cache, max-age=0");
      res.send(svg);
      return;
    }

    const projectName = project.name.length > 20 ? project.name.slice(0, 17) + "..." : project.name;
    const svg = generateBadgeSVG(projectName, project.launchReadinessScore, scoreColor(project.launchReadinessScore), style as "flat");

    res.setHeader("Content-Type", "image/svg+xml");
    res.setHeader("Cache-Control", "public, max-age=300");
    res.setHeader("ETag", createHash("md5").update(JSON.stringify(project)).digest("hex"));
    res.send(svg);
  } catch (err) {
    req.log.error({ err }, "Badge generation failed");
    const svg = generateBadgeSVG("launch readiness", null, "#4a5268");
    res.setHeader("Content-Type", "image/svg+xml");
    res.send(svg);
  }
});

export default router;
