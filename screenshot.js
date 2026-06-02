const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');

const noctraDir = path.resolve(__dirname, 'artifacts/noctra');
const viteBin = path.resolve(__dirname, 'node_modules/.pnpm/vite@7.3.2/node_modules/vite/bin/vite.js');
const screenshotPath = path.resolve(__dirname, 'preview.png');

console.log('Starting Vite dev server...');
const server = spawn('node', [viteBin, '--config', path.join(noctraDir, 'vite.config.ts'), '--host', '0.0.0.0'], {
  cwd: noctraDir,
  stdio: ['ignore', 'pipe', 'pipe'],
  env: { ...process.env, PORT: '18565', NODE_PATH: process.env.APPDATA + '\\npm\\node_modules' }
});

let output = '';
server.stdout.on('data', d => { output += d.toString(); });
server.stderr.on('data', d => { output += d.toString(); });

setTimeout(async () => {
  if (output.includes('localhost:18565')) {
    console.log('Server is ready. Taking screenshot...');
    try {
      const browser = await chromium.launch({ headless: true });
      const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
      await page.goto('http://localhost:18565/', { waitUntil: 'networkidle', timeout: 30000 });
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log('Screenshot saved to preview.png');
      await browser.close();
    } catch(e) {
      console.error('Screenshot error:', e.message);
    }
  } else {
    console.log('Server output so far:', output.substring(0, 500));
  }
  server.kill();
  process.exit(0);
}, 15000);
