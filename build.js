// ============================================
// Build Script for Bundling WebLLM
// Uses esbuild to bundle ES modules for Chrome extension
// ============================================

import * as esbuild from 'esbuild';
import { copyFile, mkdir, cp } from 'fs/promises';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log("[Build] Starting build process...");

try {
  // Create dist directory if it doesn't exist
  if (!existsSync('dist')) {
    await mkdir('dist', { recursive: true });
  }

  // Bundle background-webllm.js with WebLLM dependencies
  await esbuild.build({
    entryPoints: ['background-webllm.js'],
    bundle: true,
    outfile: 'dist/background.bundle.js',
    format: 'esm',
    platform: 'browser',
    target: 'chrome96',
    sourcemap: true,
    minify: false, // Keep readable for debugging
    external: [], // Bundle everything
    loader: {
      '.wasm': 'file',
    },
    logLevel: 'info',
  });

  console.log("[Build] ✓ Background script bundled successfully");

  // Copy necessary files to dist
  console.log("[Build] Copying extension files...");

  await copyFile('content.js', 'dist/content.js');
  await copyFile('tooltip.css', 'dist/tooltip.css');
  await copyFile('manifest.json', 'dist/manifest.json');

  // Copy popup directory
  await cp('popup', 'dist/popup', { recursive: true });

  // Copy icons directory
  await cp('icons', 'dist/icons', { recursive: true });

  console.log("[Build] ✓ Extension files copied");
  console.log("[Build] Output: dist/");
  console.log("[Build] Build complete!");
  console.log("\n[Build] To load the extension:");
  console.log("[Build] 1. Open Chrome and go to chrome://extensions/");
  console.log("[Build] 2. Enable 'Developer mode'");
  console.log("[Build] 3. Click 'Load unpacked' and select the 'dist' folder");

} catch (error) {
  console.error("[Build] Build failed:", error);
  process.exit(1);
}
