const MAX_UNCOMPRESSED_TOTAL = 500 * 1024 * 1024;
const MAX_COMPRESSION_RATIO = 100;
const MAX_ENTRIES = 10000;
const MAX_SINGLE_FILE_SIZE = 100 * 1024 * 1024;

export const ZIP_SECURITY = {
  MAX_UNCOMPRESSED_TOTAL,
  MAX_COMPRESSION_RATIO,
  MAX_ENTRIES,
  MAX_SINGLE_FILE_SIZE,
};

export type ZipEntry = {
  compressedSize: number;
  uncompressedSize: number;
  fileName: string;
};

export function validateZipEntry(entry: ZipEntry): void {
  if (entry.compressedSize > 0) {
    const ratio = entry.uncompressedSize / entry.compressedSize;
    if (ratio > MAX_COMPRESSION_RATIO) {
      throw new Error(`Zip bomb detected: compression ratio ${Math.round(ratio)}:1 exceeds ${MAX_COMPRESSION_RATIO}:1 limit for ${entry.fileName}`);
    }
  }

  if (entry.uncompressedSize > MAX_SINGLE_FILE_SIZE) {
    throw new Error(`File ${entry.fileName} exceeds ${MAX_SINGLE_FILE_SIZE / 1024 / 1024}MB limit`);
  }
}

export function validateZipTotal(totalUncompressed: number, entryCount: number): void {
  if (totalUncompressed > MAX_UNCOMPRESSED_TOTAL) {
    throw new Error(`ZIP exceeds uncompressed size limit of ${MAX_UNCOMPRESSED_TOTAL / 1024 / 1024}MB`);
  }

  if (entryCount > MAX_ENTRIES) {
    throw new Error(`ZIP contains ${entryCount} entries, exceeding limit of ${MAX_ENTRIES}`);
  }
}
