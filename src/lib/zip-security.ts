export const ZIP_SECURITY = {
  MAX_UNCOMPRESSED_TOTAL: 500 * 1024 * 1024, // 500MB
  MAX_COMPRESSION_RATIO: 100,
  MAX_ENTRIES: 10000,
  MAX_SINGLE_FILE_SIZE: 100 * 1024 * 1024, // 100MB
};

export function validateZipSecurity(entry: { compressedSize: number; uncompressedSize: number }): void {
  // Check compression ratio
  if (entry.compressedSize > 0) {
    const ratio = entry.uncompressedSize / entry.compressedSize;
    if (ratio > ZIP_SECURITY.MAX_COMPRESSION_RATIO) {
      throw new Error(`Zip bomb detected: compression ratio ${ratio}:1 exceeds limit`);
    }
  }
  // Check single file size
  if (entry.uncompressedSize > ZIP_SECURITY.MAX_SINGLE_FILE_SIZE) {
    throw new Error(`Single file exceeds ${ZIP_SECURITY.MAX_SINGLE_FILE_SIZE / 1024 / 1024}MB limit`);
  }
}
