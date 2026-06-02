#!/usr/bin/env node
/**
 * Kimi K2.6 Free → Crucible Proxy — MAX RELIABILITY
 *
 * Forces every request through OpenRouter's Crucible provider.
 * Retries aggressively (8 attempts, up to 5 minutes between retries).
 * No dependencies beyond Node.js built-ins.
 *
 * Usage:
 *   $env:OPENROUTER_API_KEY = "sk-or-v1-..."
 *   node openrouter-kimi-crucible-proxy.js
 *
 * OpenCode config:
 *   "provider": { "openrouter": { "options": { "baseURL": "http://localhost:8787/api/v1" } } }
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');

// ─── Configuration ──────────────────────────────────────────────────────────

const PORT = 8787;
const HOST = '127.0.0.1';
const OPENROUTER_BASE = 'https://openrouter.ai';
const API_KEY = process.env.OPENROUTER_API_KEY || '';

// Retry delays in seconds. Attempt 1 is immediate (delay 0).
// Attempts 2-7 wait the listed delay. Attempt 8 is final (no retry after).
const RETRY_DELAYS = [0, 8, 20, 45, 90, 180, 300];
const MAX_ATTEMPTS = 8;

// ─── Startup guard ──────────────────────────────────────────────────────────

if (!API_KEY) {
  console.error('');
  console.error('  ╔══════════════════════════════════════════════════════════╗');
  console.error('  ║  FATAL: No API key found.                              ║');
  console.error('  ║  Set the OPENROUTER_API_KEY environment variable:      ║');
  console.error('  ║                                                        ║');
  console.error('  ║    $env:OPENROUTER_API_KEY = "sk-or-v1-..."            ║');
  console.error('  ║    node openrouter-kimi-crucible-proxy.js              ║');
  console.error('  ╚══════════════════════════════════════════════════════════╝');
  console.error('');
  process.exit(1);
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Format seconds as human readable (Xd Xh Xm Xs or just Xs).
 */
function fmtDuration(seconds) {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  return `${Math.floor(seconds / 86400)}d ${Math.floor((seconds % 86400) / 3600)}h`;
}

/**
 * Decide whether a failed response is worth retrying.
 * Retry list: 429, 500, 502, 503, 504, plus keywords.
 * Never retry: 400, 401, 402, 403, 404.
 */
function shouldRetry(statusCode, bodyText) {
  if ([400, 401, 402, 403, 404].includes(statusCode)) return false;
  if ([429, 500, 502, 503, 504].includes(statusCode)) return true;
  if (/rate\s*limited|temporarily\s*rate\s*limited|upstream|overloaded/i.test(bodyText)) return true;
  return false;
}

/**
 * Compute delay in ms. Respects Retry-After header.
 * Adds 10–25 % jitter to avoid thundering herd.
 */
function getDelayMs(retryAfterHeader, attemptIndex) {
  if (retryAfterHeader) {
    const sec = parseInt(retryAfterHeader, 10);
    if (!isNaN(sec) && sec > 0 && sec < 600) return sec * 1000;
  }
  const base = RETRY_DELAYS[attemptIndex] ?? RETRY_DELAYS[RETRY_DELAYS.length - 1];
  const jitterFactor = 1 + (Math.random() * 0.15 + 0.10); // 1.10 – 1.25
  return Math.round(base * jitterFactor * 1000);
}

/**
 * Collect full body from a readable stream.
 */
function collectBody(stream) {
  return new Promise((resolve) => {
    let data = '';
    stream.on('data', (chunk) => { data += chunk; });
    stream.on('end', () => resolve(data));
    stream.on('error', () => resolve(data));
  });
}

/**
 * Single HTTPS request to OpenRouter.
 * Returns { response: IncomingMessage | null, error: Error | null }
 * response stream is NOT consumed.
 */
function callOpenRouter(jsonBody) {
  return new Promise((resolve) => {
    const bodyStr = JSON.stringify(jsonBody);
    const url = new URL('/api/v1/chat/completions', OPENROUTER_BASE);

    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(bodyStr),
        'HTTP-Referer': 'http://localhost',
        'X-Title': 'OpenCode Kimi Crucible Proxy',
      },
    };

    const req = https.request(options, (res) => {
      resolve({ response: res, error: null });
    });

    req.on('error', (err) => {
      resolve({ response: null, error: err });
    });

    req.write(bodyStr);
    req.end();
  });
}

/**
 * Send JSON response to client with CORS headers.
 */
function sendJson(res, statusCode, data) {
  const body = JSON.stringify(data);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(body);
}

/**
 * Rewrite incoming request — force model + Crucible provider + safe defaults.
 */
function rewriteBody(parsed) {
  const rewritten = {
    model: 'moonshotai/kimi-k2.6:free',
    messages: parsed.messages,
    provider: {
      only: ['crucible'],
      allow_fallbacks: false,
    },
    max_tokens: parsed.max_tokens ?? 1024,
    temperature: parsed.temperature ?? 0.2,
  };

  // Preserve optional fields — only pass through if explicitly provided
  if (parsed.stream === true) rewritten.stream = true;
  if (parsed.tools) rewritten.tools = parsed.tools;
  if (parsed.tool_choice) rewritten.tool_choice = parsed.tool_choice;
  if (parsed.response_format) rewritten.response_format = parsed.response_format;
  if (parsed.stop) rewritten.stop = parsed.stop;
  if (parsed.top_p != null) rewritten.top_p = parsed.top_p;
  if (parsed.frequency_penalty != null) rewritten.frequency_penalty = parsed.frequency_penalty;
  if (parsed.presence_penalty != null) rewritten.presence_penalty = parsed.presence_penalty;

  return rewritten;
}

// ─── Request handler ────────────────────────────────────────────────────────

async function handleRequest(clientReq, clientRes) {
  let bodyRaw = '';
  clientReq.on('data', (chunk) => { bodyRaw += chunk; });
  clientReq.on('end', async () => {
    // ── Parse ──────────────────────────────────────────────────────────
    let parsed;
    try {
      parsed = JSON.parse(bodyRaw);
    } catch (e) {
      sendJson(clientRes, 400, { error: 'Invalid JSON in request body' });
      return;
    }

    const rewritten = rewriteBody(parsed);
    const isStream = rewritten.stream === true;
    const msgCount = parsed.messages?.length || 0;

    // ── Diagnostic banner ──────────────────────────────────────────────
    console.log('');
    console.log('┌─────────────────────────────────────────────────────────────');
    console.log(`│  Incoming model : ${parsed.model || '(none, will force)'}`);
    console.log(`│  Final model    : ${rewritten.model}`);
    console.log(`│  Provider       : ${JSON.stringify(rewritten.provider)}`);
    console.log(`│  Stream         : ${isStream}`);
    console.log(`│  max_tokens     : ${rewritten.max_tokens}`);
    console.log(`│  temperature    : ${rewritten.temperature}`);
    console.log(`│  Messages       : ${msgCount}`);
    if (parsed.tools) console.log(`│  Tools          : ${parsed.tools.length}`);
    console.log('└─────────────────────────────────────────────────────────────');

    // ── Retry loop ──────────────────────────────────────────────────────
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const label = `[${attempt + 1}/${MAX_ATTEMPTS}]`;
      const isFirst = attempt === 0;

      if (!isFirst) {
        const delay = getDelayMs(null, attempt - 1);
        console.log(`  ${label} ⏳ waiting ${fmtDuration(Math.round(delay / 1000))}...`);
        await sleep(delay);
      }

      console.log(`  ${label} → sending to OpenRouter...`);

      const { response, error } = await callOpenRouter(rewritten);

      // Network-level error
      if (error) {
        console.error(`  ${label} ❌ Network error: ${error.message}`);
        if (attempt < MAX_ATTEMPTS - 1) continue;
        sendJson(clientRes, 503, {
          error: 'Upstream connection failed after all retries',
          detail: error.message,
        });
        return;
      }

      const statusCode = response.statusCode;
      const retryAfter = response.headers['retry-after'];
      const retryAfterStr = retryAfter ? ` Retry-After: ${retryAfter}s` : '';

      // ── Success: 200 ─────────────────────────────────────────────────
      if (statusCode === 200) {
        if (isStream) {
          console.log(`  ${label} ✅ Streaming 200 — piping to client`);
          clientRes.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
            'Access-Control-Allow-Origin': '*',
          });
          response.pipe(clientRes);
          response.on('end', () => console.log(`  ${label} ✅ Stream finished`));
          response.on('error', (e) =>
            console.error(`  ${label} ⚠ Mid-stream error: ${e?.message || 'unknown'}`),
          );
          return;
        }

        const responseBody = await collectBody(response);
        const sizeKb = (Buffer.byteLength(responseBody) / 1024).toFixed(1);
        console.log(`  ${label} ✅ 200 OK (${sizeKb} KB)`);

        try {
          sendJson(clientRes, 200, JSON.parse(responseBody));
        } catch {
          // If response isn't valid JSON, forward raw
          clientRes.writeHead(200, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          });
          clientRes.end(responseBody);
        }
        return;
      }

      // ── Error ────────────────────────────────────────────────────────
      const errorBody = await collectBody(response);
      const preview = errorBody.length > 300 ? errorBody.slice(0, 300) + '...' : errorBody;
      console.error(`  ${label} ❌ HTTP ${statusCode}${retryAfterStr}`);
      console.error(`  ${label}    ${preview}`);

      if (shouldRetry(statusCode, errorBody) && attempt < MAX_ATTEMPTS - 1) {
        console.log(`  ${label} ↻ Will retry`);
        continue;
      }

      // Final failure
      const isRetryable = shouldRetry(statusCode, errorBody);
      const reason = isRetryable
        ? 'All 8 retries exhausted'
        : 'Non-retryable error (auth / bad request / model not found)';
      console.error(`  ${label} ⛔ ${reason}`);

      try {
        sendJson(clientRes, statusCode, JSON.parse(errorBody));
      } catch {
        sendJson(clientRes, statusCode, { error: errorBody });
      }
      return;
    }
  });
}

// ─── Server ─────────────────────────────────────────────────────────────────

const server = http.createServer((req, res) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    });
    res.end();
    return;
  }

  // Chat completions — accept both /v1/chat/completions and /api/v1/chat/completions
  if (
    req.method === 'POST' &&
    (req.url === '/api/v1/chat/completions' || req.url === '/v1/chat/completions')
  ) {
    handleRequest(req, res);
    return;
  }

  // Health check
  if (req.url === '/' || req.url === '/health') {
    sendJson(res, 200, {
      status: 'ok',
      model: 'moonshotai/kimi-k2.6:free',
      provider_pinned: 'crucible',
      retry_policy: `${MAX_ATTEMPTS} attempts, backoff up to 5m + jitter`,
    });
    return;
  }

  sendJson(res, 404, {
    error: 'Not found. Use POST /api/v1/chat/completions, /v1/chat/completions, /health',
  });
});

server.listen(PORT, HOST, () => {
  console.log('');
  console.log('  ╔══════════════════════════════════════════════════════════╗');
  console.log('  ║   Kimi K2.6 Free → Crucible Proxy  (MAX RELIABILITY)   ║');
  console.log('  ║                                                        ║');
  console.log(`  ║  Listening : http://${HOST}:${PORT}                        ║`);
  console.log(`  ║  Upstream  : ${OPENROUTER_BASE}  ║`);
  console.log(`  ║  Model     : moonshotai/kimi-k2.6:free                  ║`);
  console.log(`  ║  Provider  : crucible (pinned, no fallbacks)            ║`);
  console.log(`  ║  Retries   : ${MAX_ATTEMPTS} attempts                     ║`);
  console.log('  ║  Backoff   : 0s → 8s → 20s → 45s → 90s → 3m → 5m      ║');
  console.log('  ║  Jitter    : 10–25 % per attempt                       ║');
  console.log('  ║                                                        ║');
  console.log('  ║  Endpoints:                                             ║');
  console.log('  ║    POST /api/v1/chat/completions                       ║');
  console.log('  ║    POST /v1/chat/completions                           ║');
  console.log('  ║    GET  /health                                        ║');
  console.log('  ║                                                        ║');
  console.log('  ║  Set OPENROUTER_API_KEY before starting.                ║');
  console.log('  ╚══════════════════════════════════════════════════════════╝');
  console.log('');
});
