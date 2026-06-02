#!/usr/bin/env node
/**
 * test-kimi-direct.js
 *
 * Sends 3 sequential test requests through the proxy at localhost:8787,
 * with 30-second pauses between attempts.
 *
 * Usage:
 *   node test-kimi-direct.js
 *
 * Requires the proxy to be running:
 *   $env:OPENROUTER_API_KEY="sk-or-v1-..."
 *   node openrouter-kimi-crucible-proxy.js
 */

const http = require('http');

const PROXY_HOST = '127.0.0.1';
const PROXY_PORT = 8787;
const MAX_ATTEMPTS = 3;
const PAUSE_BETWEEN_MS = 30_000;

const testBody = JSON.stringify({
  model: 'moonshotai/kimi-k2.6:free',
  messages: [{ role: 'user', content: 'hi' }],
  max_tokens: 64,
  temperature: 0.2,
  stream: false,
});

function sendTest() {
  return new Promise((resolve) => {
    const req = http.request(
      {
        hostname: PROXY_HOST,
        port: PROXY_PORT,
        path: '/api/v1/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(testBody),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => {
          resolve({ statusCode: res.statusCode, headers: res.headers, body });
        });
      },
    );
    req.on('error', (err) => {
      resolve({ statusCode: 0, headers: {}, body: JSON.stringify({ error: err.message }) });
    });
    req.write(testBody);
    req.end();
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

(async () => {
  const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  Kimi K2.6 Free → Crucible  —  Direct Proxy Test          ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log(`  Started : ${timestamp}`);
  console.log(`  Proxy   : http://${PROXY_HOST}:${PROXY_PORT}`);
  console.log(`  Model   : moonshotai/kimi-k2.6:free`);
  console.log(`  Body    : ${testBody}`);
  console.log('');

  let lastResult = null;

  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const label = `[Attempt ${i + 1}/${MAX_ATTEMPTS}]`;
    const now = new Date().toISOString().slice(11, 19);

    if (i > 0) {
      console.log(`${label} ⏳ Waiting 30 seconds before next attempt...`);
      await sleep(PAUSE_BETWEEN_MS);
    }

    console.log(`${label} ${now} — sending...`);
    lastResult = await sendTest();
    const result = lastResult;

    if (result.statusCode === 200) {
      console.log(`${label} ✅ SUCCESS (HTTP 200)`);
      try {
        const parsed = JSON.parse(result.body);
        const content = parsed.choices?.[0]?.message?.content || '(no content)';
        const model = parsed.model || '(unknown)';
        const usage = parsed.usage
          ? `prompt=${parsed.usage.prompt_tokens} completion=${parsed.usage.completion_tokens}`
          : 'usage not reported';
        console.log(`  Response model : ${model}`);
        console.log(`  Usage          : ${usage}`);
        console.log(`  Content        : ${content.slice(0, 200)}`);
      } catch (e) {
        console.log(`  Raw body       : ${result.body.slice(0, 500)}`);
      }
      console.log('');
      console.log('╔══════════════════════════════════════════════════════════════╗');
      console.log('║  ✅  TEST PASSED                                            ║');
      console.log('║  Now check OpenRouter Activity → Provider should = Crucible ║');
      console.log('╚══════════════════════════════════════════════════════════════╝');
      process.exit(0);
    }

    console.log(`${label} ❌ HTTP ${result.statusCode}`);
    try {
      const parsed = JSON.parse(result.body);
      console.log(`  Error : ${JSON.stringify(parsed.error || parsed).slice(0, 400)}`);
    } catch {
      console.log(`  Body  : ${result.body.slice(0, 400)}`);
    }
  }

  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  ❌  ALL 3 ATTEMPTS FAILED                                  ║');
  console.log('║                                                             ║');
  console.log('║  This means:                                                ║');
  console.log('║  1. Your config is correct.                                 ║');
  console.log('║  2. The proxy reached OpenRouter and Crucible.              ║');
  console.log('║  3. Crucible is REFUSING free upstream traffic right now.   ║');
  console.log('║                                                             ║');
  console.log('║  There is NO client-side fix that can guarantee success     ║');
  console.log('║  while keeping the same free Crucible route.                ║');
  console.log('║  You can either:                                            ║');
  console.log('║  - Wait and retry later (Crucible capacity may free up)     ║');
  console.log('║  - Use a paid OpenRouter credit balance for priority        ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  process.exit(1);
})();
