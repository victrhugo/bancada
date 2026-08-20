import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Metadata and OpenGraph Validation', () => {
  describe('Global Metadata Files', () => {
    it('should have site.webmanifest', () => {
      const manifestPath = path.join(process.cwd(), 'public/site.webmanifest');
      expect(fs.existsSync(manifestPath)).toBe(true);
      
      if (fs.existsSync(manifestPath)) {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
        expect(manifest.name).toBeDefined();
        expect(manifest.short_name).toBeDefined();
      }
    });

    it('should have favicon files', () => {
      const publicDir = path.join(process.cwd(), 'public');
      
      expect(fs.existsSync(path.join(publicDir, 'favicon.ico'))).toBe(true);
      expect(fs.existsSync(path.join(publicDir, 'favicon-32x32.png'))).toBe(true);
      expect(fs.existsSync(path.join(publicDir, 'apple-touch-icon.png'))).toBe(true);
    });

    it('should have OpenGraph image', () => {
      const ogImagePath = path.join(process.cwd(), 'public/og-image.png');
      expect(fs.existsSync(ogImagePath)).toBe(true);
    });
  });
});
