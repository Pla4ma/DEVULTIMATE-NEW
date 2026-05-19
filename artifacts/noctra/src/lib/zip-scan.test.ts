import { describe, it, expect, vi } from 'vitest';
import { scanZipFile, type ScanResult } from './zip-scan';

describe('zip-scan', () => {
  const mockZipData = new Uint8Array([1, 2, 3, 4, 5]);

  describe('scanZipFile', () => {
    it('should return scan result', async () => {
      const result = await scanZipFile(mockZipData);
      expect(result).toBeDefined();
      expect(result).toHaveProperty('files');
      expect(result).toHaveProperty('summary');
    });

    it('should extract file list', async () => {
      const result = await scanZipFile(mockZipData);
      expect(result.files).toBeDefined();
      expect(Array.isArray(result.files)).toBe(true);
    });

    it('should include file count', async () => {
      const result = await scanZipFile(mockZipData);
      expect(result.fileCount).toBeDefined();
      expect(typeof result.fileCount).toBe('number');
    });

    it('should detect language', async () => {
      const result = await scanZipFile(mockZipData);
      expect(result.languages).toBeDefined();
      expect(Array.isArray(result.languages)).toBe(true);
    });

    it('should detect framework', async () => {
      const result = await scanZipFile(mockZipData);
      expect(result.frameworks).toBeDefined();
      expect(Array.isArray(result.frameworks)).toBe(true);
    });

    it('should analyze structure', async () => {
      const result = await scanZipFile(mockZipData);
      expect(result.structure).toBeDefined();
      expect(result.structure).toHaveProperty('directories');
      expect(result.structure).toHaveProperty('depth');
    });

    it('should identify key files', async () => {
      const result = await scanZipFile(mockZipData);
      expect(result.keyFiles).toBeDefined();
      expect(Array.isArray(result.keyFiles)).toBe(true);
    });

    it('should calculate complexity score', async () => {
      const result = await scanZipFile(mockZipData);
      expect(result.complexity).toBeDefined();
      expect(typeof result.complexity).toBe('number');
    });

    it('should handle empty zip', async () => {
      const emptyZip = new Uint8Array(0);
      const result = await scanZipFile(emptyZip);
      expect(result).toBeDefined();
    });

    it('should handle corrupted zip', async () => {
      const corruptedZip = new Uint8Array([1, 2, 3]);
      await expect(scanZipFile(corruptedZip)).rejects.toThrow();
    });
  });
});