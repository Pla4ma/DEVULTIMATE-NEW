import { doScan } from "./scanner";
import type { ScanResult } from "./types";
export type { ScanResult, EvidenceItem, SampleFile } from "./types";

let activeScanCount = 0;
const MAX_CONCURRENT_SCANS = 3;
const MAX_SCAN_TIME_MS = 30_000;

export async function scanZip(buffer: Buffer, fileName: string): Promise<ScanResult> {
  if (activeScanCount >= MAX_CONCURRENT_SCANS) {
    throw new Error("Server is busy processing other scans. Please try again in a moment.");
  }

  activeScanCount++;
  const scanTimeout = setTimeout(() => {
    activeScanCount = Math.max(0, activeScanCount - 1);
  }, MAX_SCAN_TIME_MS * 2);

  try {
    return await doScan(buffer, fileName);
  } finally {
    clearTimeout(scanTimeout);
    activeScanCount = Math.max(0, activeScanCount - 1);
  }
}
