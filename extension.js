// ─────────────────────────────────────────────
// Claude API Switch — VS Code / Cursor Extension
//
// Manage and switch Claude Code API endpoint
// profiles from a sidebar tree-view. Supports
// CRUD, API connectivity testing, usage stats,
// quick-switch, import/export, templates, and more.
// ─────────────────────────────────────────────
const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const os = require('os');
const https = require('https');
const http = require('http');

// ═══════════════════════════════════════════════
//  CONSTANTS
// ═══════════════════════════════════════════════

const STORAGE_KEY_PROFILES = 'claudeSwitch.profiles';
const STORAGE_KEY_ACTIVE_ID = 'claudeSwitch.appliedProfileId';
const STORAGE_KEY_USAGE    = 'claudeSwitch.usageStats';
const CONFIG_NAMESPACE = 'claudeCode';
const CONFIG_KEY = 'environmentVariables';

const LOG_PREFIX = '[Claude API Switch]';

/** Standard env-var names */
const STANDARD_VAR_NAMES = [
  'ANTHROPIC_BASE_URL', 'ANTHROPIC_AUTH_TOKEN', 'ANTHROPIC_MODEL',
  'ANTHROPIC_DEFAULT_OPUS_MODEL', 'ANTHROPIC_DEFAULT_SONNET_MODEL',
  'ANTHROPIC_DEFAULT_HAIKU_MODEL', 'CLAUDE_CODE_SUBAGENT_MODEL',
  'CLAUDE_CODE_EFFORT_LEVEL',
];

/** Pre-built templates for common providers */
const TEMPLATES = {
  'DeepSeek': [
    { name: 'ANTHROPIC_BASE_URL',              value: 'https://api.deepseek.com/anthropic' },
    { name: 'ANTHROPIC_AUTH_TOKEN',             value: '' },
    { name: 'ANTHROPIC_MODEL',                  value: 'deepseek-v4-pro[1m]' },
    { name: 'ANTHROPIC_DEFAULT_OPUS_MODEL',     value: 'deepseek-v4-pro[1m]' },
    { name: 'ANTHROPIC_DEFAULT_SONNET_MODEL',   value: 'deepseek-v4-pro[1m]' },
    { name: 'ANTHROPIC_DEFAULT_HAIKU_MODEL',    value: 'deepseek-v4-flash' },
    { name: 'CLAUDE_CODE_SUBAGENT_MODEL',       value: 'deepseek-v4-flash' },
    { name: 'CLAUDE_CODE_EFFORT_LEVEL',         value: 'max' },
  ],
  'Aliyun DashScope (Qwen)': [
    { name: 'ANTHROPIC_BASE_URL',              value: 'https://dashscope.aliyuncs.com/apps/anthropic' },
    { name: 'ANTHROPIC_AUTH_TOKEN',             value: '' },
    { name: 'ANTHROPIC_MODEL',                  value: 'qwen3.7-max' },
    { name: 'ANTHROPIC_DEFAULT_OPUS_MODEL',     value: 'qwen3.7-max' },
    { name: 'ANTHROPIC_DEFAULT_SONNET_MODEL',   value: 'qwen3.7-max' },
    { name: 'ANTHROPIC_DEFAULT_HAIKU_MODEL',    value: 'qwen3.7-max' },
    { name: 'CLAUDE_CODE_SUBAGENT_MODEL',       value: 'qwen3.7-max' },
    { name: 'CLAUDE_CODE_EFFORT_LEVEL',         value: 'max' },
  ],
  'Anthropic Official': [
    { name: 'ANTHROPIC_BASE_URL',              value: 'https://api.anthropic.com' },
    { name: 'ANTHROPIC_AUTH_TOKEN',             value: '' },
    { name: 'ANTHROPIC_MODEL',                  value: 'claude-sonnet-4-6' },
    { name: 'ANTHROPIC_DEFAULT_OPUS_MODEL',     value: 'claude-opus-4-8' },
    { name: 'ANTHROPIC_DEFAULT_SONNET_MODEL',   value: 'claude-sonnet-4-6' },
    { name: 'ANTHROPIC_DEFAULT_HAIKU_MODEL',    value: 'claude-haiku-4-5-20251001' },
    { name: 'CLAUDE_CODE_SUBAGENT_MODEL',       value: 'claude-sonnet-4-6' },
    { name: 'CLAUDE_CODE_EFFORT_LEVEL',         value: 'max' },
  ],
  'Local Proxy': [
    { name: 'ANTHROPIC_BASE_URL',              value: 'http://127.0.0.1:15722' },
    { name: 'ANTHROPIC_AUTH_TOKEN',             value: 'PROXY_MANAGED' },
    { name: 'ANTHROPIC_MODEL',                  value: '' },
    { name: 'ANTHROPIC_DEFAULT_OPUS_MODEL',     value: '' },
    { name: 'ANTHROPIC_DEFAULT_SONNET_MODEL',   value: '' },
    { name: 'ANTHROPIC_DEFAULT_HAIKU_MODEL',    value: '' },
    { name: 'CLAUDE_CODE_SUBAGENT_MODEL',       value: '' },
    { name: 'CLAUDE_CODE_EFFORT_LEVEL',         value: 'max' },
  ],
  'Empty': [
    { name: 'ANTHROPIC_BASE_URL',              value: '' },
    { name: 'ANTHROPIC_AUTH_TOKEN',             value: '' },
    { name: 'ANTHROPIC_MODEL',                  value: '' },
    { name: 'ANTHROPIC_DEFAULT_OPUS_MODEL',     value: '' },
    { name: 'ANTHROPIC_DEFAULT_SONNET_MODEL',   value: '' },
    { name: 'ANTHROPIC_DEFAULT_HAIKU_MODEL',    value: '' },
    { name: 'CLAUDE_CODE_SUBAGENT_MODEL',       value: '' },
    { name: 'CLAUDE_CODE_EFFORT_LEVEL',         value: 'max' },
  ],
};

// ═══════════════════════════════════════════════
//  LOGGING
// ═══════════════════════════════════════════════

function logInfo(msg)  { console.log(`${LOG_PREFIX} ${msg}`); }
function logError(msg, err) { console.error(`${LOG_PREFIX} ${msg}`, err || ''); }

// ═══════════════════════════════════════════════
//  PLATFORM-AWARE SETTINGS PATH DETECTION
// ═══════════════════════════════════════════════

function detectSettingsJsonPath() {
  const appName = vscode.env.appName || 'Visual Studio Code';
  const home = os.homedir();

  const platformPaths = {
    darwin: (name) => path.join(home, 'Library', 'Application Support', name, 'User', 'settings.json'),
    win32:  (name) => path.join(process.env.APPDATA || path.join(home, 'AppData', 'Roaming'), name, 'User', 'settings.json'),
    linux:  (name) => path.join(home, '.config', name, 'User', 'settings.json'),
  };
  const getPath = platformPaths[process.platform] || platformPaths.linux;

  let candidate = getPath(appName);
  if (fs.existsSync(candidate)) return candidate;

  const forks = ['Cursor', 'Code', 'Code - OSS', 'VSCodium', 'Windsurf', 'Code - Insiders', 'Cursor Nightly'];
  for (const fork of forks) {
    candidate = getPath(fork);
    if (fs.existsSync(candidate)) return candidate;
  }
  return getPath(appName);
}

function getEditorLabel() {
  const p = detectSettingsJsonPath();
  const parts = p.split(path.sep);
  const idx = parts.indexOf('User');
  return idx > 0 ? parts[idx - 1] : (vscode.env.appName || 'VS Code');
}

// ═══════════════════════════════════════════════
//  SETTINGS READ / WRITE
// ═══════════════════════════════════════════════

function readCurrentEnvVars() {
  try {
    const config = vscode.workspace.getConfiguration(CONFIG_NAMESPACE);
    const vars = config.get(CONFIG_KEY);
    if (Array.isArray(vars)) return vars;
  } catch (_) { /* fall through */ }
  try {
    const settingsPath = detectSettingsJsonPath();
    if (!fs.existsSync(settingsPath)) return [];
    const raw = fs.readFileSync(settingsPath, 'utf-8');
    const parsed = parseJsonc(raw);
    return parsed?.['claudeCode.environmentVariables'] || [];
  } catch (_) { return []; }
}

async function writeEnvVarsToSettings(variables) {
  try {
    const config = vscode.workspace.getConfiguration(CONFIG_NAMESPACE);
    await config.update(CONFIG_KEY, variables, vscode.ConfigurationTarget.Global);
    return { success: true, method: 'config-api' };
  } catch (_) { /* fall through */ }
  try {
    const settingsPath = detectSettingsJsonPath();
    const dir = path.dirname(settingsPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    let raw = fs.existsSync(settingsPath) ? fs.readFileSync(settingsPath, 'utf-8') : '{}';

    const newJson = JSON.stringify(variables, null, 2);
    const indented = newJson.split('\n').map((l, i) => i === 0 ? l : '  ' + l).join('\n');

    let updated;
    const key = `"claudeCode.environmentVariables"`;
    const keyIndex = raw.indexOf(key);

    if (keyIndex !== -1) {
      const colonIndex = raw.indexOf(':', keyIndex);
      let bracketStart = raw.indexOf('[', colonIndex);
      if (bracketStart === -1) {
        bracketStart = colonIndex + 1;
        while (bracketStart < raw.length && raw[bracketStart] !== '[') bracketStart++;
      }
      let depth = 0, bracketEnd = bracketStart;
      for (let i = bracketStart; i < raw.length; i++) {
        if (raw[i] === '[') depth++;
        else if (raw[i] === ']') { depth--; if (depth === 0) { bracketEnd = i; break; } }
      }
      updated = raw.slice(0, bracketStart) + indented + raw.slice(bracketEnd + 1);
    } else {
      const trimmed = raw.trimEnd();
      const needsComma = trimmed.endsWith('}') && trimmed.length > 2 && trimmed[trimmed.length - 2] !== '{';
      const insertion = `${needsComma ? ',' : ''}\n  ${key}: ${indented}\n`;
      const lastBrace = trimmed.lastIndexOf('}');
      updated = trimmed.slice(0, lastBrace) + insertion + '}';
    }

    fs.writeFileSync(settingsPath, updated, 'utf-8');
    return { success: true, method: 'file-write' };
  } catch (e) {
    return { success: false, method: 'file-write', error: e.message };
  }
}

function parseJsonc(raw) {
  let cleaned = '', inString = false, stringChar = '', inSLC = false, inBC = false;
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i], next = raw[i + 1];
    if (inSLC) { if (ch === '\n') { inSLC = false; cleaned += ch; } continue; }
    if (inBC)  { if (ch === '*' && next === '/') { inBC = false; i++; } continue; }
    if (inString) { cleaned += ch; if (ch === '\\') { cleaned += next; i++; } else if (ch === stringChar) { inString = false; stringChar = ''; } continue; }
    if (ch === '"' || ch === "'") { inString = true; stringChar = ch; cleaned += ch; continue; }
    if (ch === '/' && next === '/') { inSLC = true; i++; continue; }
    if (ch === '/' && next === '*') { inBC = true; i++; continue; }
    cleaned += ch;
  }
  cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');
  return JSON.parse(cleaned);
}

// ═══════════════════════════════════════════════
//  PROFILE STORAGE
// ═══════════════════════════════════════════════

function loadProfiles(context) {
  return context.globalState.get(STORAGE_KEY_PROFILES) || [];
}
function saveProfiles(context, profiles) {
  return context.globalState.update(STORAGE_KEY_PROFILES, profiles);
}
function getActiveProfileId(context) {
  return context.globalState.get(STORAGE_KEY_ACTIVE_ID) || null;
}
function setActiveProfileId(context, id) {
  return context.globalState.update(STORAGE_KEY_ACTIVE_ID, id);
}

function makeProfile(name, variables, notes) {
  const now = new Date().toISOString();
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    notes: notes || '',
    variables: variables.map(v => ({ name: v.name, value: v.value || '' })),
    createdAt: now,
    updatedAt: now,
  };
}

// ═══════════════════════════════════════════════
//  USAGE STATS TRACKING
// ═══════════════════════════════════════════════

function getUsageStats(context) {
  return context.globalState.get(STORAGE_KEY_USAGE) || {};
}

function recordUsage(context, profileId) {
  const stats = getUsageStats(context);
  const now = new Date().toISOString();
  if (!stats[profileId]) {
    stats[profileId] = { applyCount: 0, firstApplied: now, lastApplied: now, testResults: [] };
  }
  stats[profileId].applyCount++;
  stats[profileId].lastApplied = now;
  context.globalState.update(STORAGE_KEY_USAGE, stats);
}

function recordTestResult(context, profileId, result) {
  const stats = getUsageStats(context);
  if (!stats[profileId]) {
    stats[profileId] = { applyCount: 0, firstApplied: new Date().toISOString(), lastApplied: '', testResults: [] };
  }
  stats[profileId].testResults = stats[profileId].testResults || [];
  stats[profileId].testResults.push({
    timestamp: new Date().toISOString(),
    success: result.success,
    latency: result.latency,
    model: result.model || '',
    error: result.error || '',
  });
  // Keep last 20 results
  if (stats[profileId].testResults.length > 20) {
    stats[profileId].testResults = stats[profileId].testResults.slice(-20);
  }
  context.globalState.update(STORAGE_KEY_USAGE, stats);
}

function formatUsageSummary(context, profileId) {
  const stats = getUsageStats(context);
  const s = stats[profileId];
  if (!s) return '';
  const parts = [`Applied ${s.applyCount}×`];
  if (s.lastApplied) {
    const days = Math.floor((Date.now() - new Date(s.lastApplied).getTime()) / 86400000);
    parts.push(days === 0 ? 'Last: today' : `Last: ${days}d ago`);
  }
  return parts.join(' · ');
}

// ═══════════════════════════════════════════════
//  API ENDPOINT TESTING
// ═══════════════════════════════════════════════

/**
 * Test connectivity to an Anthropic-compatible API endpoint.
 * Sends a minimal message (10 tokens) and reports success/failure,
 * latency, model info, and token usage.
 *
 * @param {Array<{name:string,value:string}>} variables
 * @returns {Promise<Object>} structured test result
 */
function testApiEndpoint(variables) {
  const getVar = (name) => (variables.find(v => v.name === name) || {}).value || '';

  const baseUrl = getVar('ANTHROPIC_BASE_URL');
  const authToken = getVar('ANTHROPIC_AUTH_TOKEN');
  const model = getVar('ANTHROPIC_MODEL');

  if (!baseUrl)  return Promise.resolve({ success: false, error: 'ANTHROPIC_BASE_URL is not set' });
  if (!authToken) return Promise.resolve({ success: false, error: 'ANTHROPIC_AUTH_TOKEN is not set' });
  if (!model)    return Promise.resolve({ success: false, error: 'ANTHROPIC_MODEL is not set' });

  let url;
  try {
    url = new URL(baseUrl);
    // Append /v1/messages to the existing path (do NOT replace it —
    // baseUrl may already have a path prefix like /apps/anthropic)
    url.pathname = url.pathname.replace(/\/$/, '') + '/v1/messages';
  } catch (_) { return Promise.resolve({ success: false, error: `Invalid BASE_URL: "${baseUrl}"` }); }

  const isHttps = url.protocol === 'https:';
  const transport = isHttps ? https : http;

  const requestBody = JSON.stringify({
    model: model,
    max_tokens: 10,
    messages: [{ role: 'user', content: 'Say "ok"' }],
  });

  const options = {
    hostname: url.hostname,
    port: url.port || (isHttps ? 443 : 80),
    path: url.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': authToken,
      'anthropic-version': '2023-06-01',
      'Content-Length': Buffer.byteLength(requestBody),
    },
    timeout: 15000,
    rejectUnauthorized: !baseUrl.includes('127.0.0.1') && !baseUrl.includes('localhost'),
  };

  return new Promise((resolve) => {
    const startTime = Date.now();
    const req = transport.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const latency = Date.now() - startTime;
        try {
          const json = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({
              success: true,
              latency,
              statusCode: res.statusCode,
              model: json.model || model,
              responseId: json.id || '',
              usage: json.usage || null,
              stopReason: json.stop_reason || '',
              content: (json.content || [])[0]?.text?.slice(0, 200) || '',
            });
          } else {
            resolve({
              success: false,
              latency,
              statusCode: res.statusCode,
              error: json.error?.message || json.error?.type || `HTTP ${res.statusCode}`,
              detail: data.slice(0, 800),
            });
          }
        } catch (_) {
          resolve({
            success: false,
            latency,
            statusCode: res.statusCode,
            error: 'Invalid JSON in response',
            detail: data.slice(0, 500),
          });
        }
      });
    });

    req.on('error', (err) => {
      resolve({
        success: false,
        latency: Date.now() - startTime,
        error: err.code === 'ECONNREFUSED' ? 'Connection refused — is the server running?'
             : err.code === 'ENOTFOUND'    ? 'DNS lookup failed — check the URL'
             : err.code === 'ECONNRESET'   ? 'Connection reset by server'
             : err.code === 'ETIMEDOUT'    ? 'Connection timed out'
             : err.message,
        errorCode: err.code,
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ success: false, latency: Date.now() - startTime, error: 'Request timed out (15s)' });
    });

    req.write(requestBody);
    req.end();
  });
}

/**
 * Returns a rich formatted string with the test result.
 */
function formatTestResult(variables, result) {
  const model = (variables.find(v => v.name === 'ANTHROPIC_MODEL') || {}).value || '?';
  const baseUrl = (variables.find(v => v.name === 'ANTHROPIC_BASE_URL') || {}).value || '?';

  // Reconstruct the exact URL for display
  let testUrl = baseUrl;
  try {
    const u = new URL(baseUrl);
    u.pathname = u.pathname.replace(/\/$/, '') + '/v1/messages';
    testUrl = u.toString();
  } catch (_) { /* use baseUrl as-is */ }

  const lines = [
    `API Connection Test`,
    `──────────────────`,
    `Request:   POST ${testUrl}`,
    `Model:     ${model}`,
    `Status:    ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`,
    `Latency:   ${result.latency != null ? result.latency + 'ms' : '?'}`,
  ];

  if (result.success) {
    lines.push(`Response:  ${result.model || model}`);
    lines.push(`Stop:      ${result.stopReason || '?'}`);
    if (result.usage) {
      lines.push(`Tokens:    input=${result.usage.input_tokens || 0} output=${result.usage.output_tokens || 0}`);
    }
    if (result.content) {
      lines.push(`Preview:   "${result.content}"`);
    }
    if (result.responseId) {
      lines.push(`ID:        ${result.responseId}`);
    }
  } else {
    lines.push(`Error:     ${result.error || 'Unknown error'}`);
    if (result.statusCode) lines.push(`HTTP:      ${result.statusCode}`);
    if (result.detail) {
      lines.push(`Detail:    ${result.detail.slice(0, 300)}`);
    }
  }

  return lines.join('\n');
}

// ═══════════════════════════════════════════════
//  HTML ESCAPE (server-side)
// ═══════════════════════════════════════════════

function escHtml(s) {
  return (s || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// ═══════════════════════════════════════════════
//  WEBVIEW — Profile Editor
// ═══════════════════════════════════════════════

function getWebviewHtml(profile, isNew) {
  const title = isNew ? 'New API Profile' : `Edit: ${profile?.name || ''}`;
  const nameVal = profile?.name || '';
  const notesVal = profile?.notes || '';
  const vars = profile?.variables || [];

  const varRows = vars.map((v, i) => `
    <tr class="var-row" data-index="${i}">
      <td><input class="var-name" type="text" value="${escHtml(v.name)}" placeholder="e.g. ANTHROPIC_BASE_URL" /></td>
      <td><input class="var-value" type="text" value="${escHtml(v.value)}" placeholder="value" /></td>
      <td><button class="btn-icon btn-del-row" title="Remove" type="button">✕</button></td>
    </tr>`).join('');

  const templateBtns = Object.keys(TEMPLATES).map(t =>
    `<button class="tmpl-btn" data-template="${escHtml(t)}" type="button">${escHtml(t)}</button>`
  ).join('');

  return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escHtml(title)}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: var(--vscode-font-family, -apple-system, sans-serif);
    font-size: var(--vscode-font-size, 13px);
    color: var(--vscode-editor-foreground);
    background: var(--vscode-editor-background);
    padding: 16px;
  }
  h2 { font-size: 16px; font-weight: 600; margin-bottom: 12px; }
  .section { margin-bottom: 16px; }
  label {
    display: block; font-size: 12px; font-weight: 500; margin-bottom: 4px;
    color: var(--vscode-descriptionForeground); text-transform: uppercase; letter-spacing: 0.5px;
  }
  input[type="text"], textarea {
    width: 100%; padding: 5px 8px; border: 1px solid var(--vscode-input-border, #ccc);
    background: var(--vscode-input-background); color: var(--vscode-input-foreground);
    border-radius: 2px; font-family: inherit; font-size: inherit; resize: vertical;
  }
  textarea { min-height: 40px; }
  input[type="text"]:focus, textarea:focus {
    outline: none; border-color: var(--vscode-focusBorder, #007acc);
  }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: var(--vscode-descriptionForeground); padding: 4px 4px; }
  .var-row td { padding: 3px 4px; }
  .var-name { width: 40%; } .var-value { width: 52%; }
  .btn-icon { background: none; border: none; cursor: pointer; color: var(--vscode-descriptionForeground); font-size: 14px; padding: 2px 6px; border-radius: 3px; }
  .btn-icon:hover { background: var(--vscode-toolbar-hoverBackground); color: var(--vscode-errorForeground); }
  .btn-row { display: flex; gap: 8px; align-items: center; margin-top: 8px; }
  button { padding: 5px 12px; border-radius: 2px; border: 1px solid var(--vscode-button-secondaryBackground, #555); background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); cursor: pointer; font-family: inherit; font-size: inherit; }
  button:hover { background: var(--vscode-button-secondaryHoverBackground); }
  button.primary { background: var(--vscode-button-background); color: var(--vscode-button-foreground); border-color: var(--vscode-button-background); }
  button.primary:hover { background: var(--vscode-button-hoverBackground); }
  button.test-btn { background: var(--vscode-button-secondaryBackground); color: var(--vscode-terminal-ansiGreen, #4ec9b0); border-color: var(--vscode-terminal-ansiGreen, #4ec9b0); }
  .templates { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 8px; }
  .tmpl-btn { font-size: 11px; padding: 3px 8px; }
  #status { font-size: 12px; margin-top: 8px; min-height: 18px; }
  #testResult { font-size: 12px; margin-top: 8px; padding: 8px; border-radius: 4px; white-space: pre-wrap; font-family: monospace; display: none; }
  #testResult.success { display: block; background: #1a3a1a; color: #4ec9b0; border: 1px solid #4ec9b0; }
  #testResult.error { display: block; background: #3a1a1a; color: #f44747; border: 1px solid #f44747; }
  .success-text { color: var(--vscode-terminal-ansiGreen, #4ec9b0); }
  .error-text { color: var(--vscode-errorForeground, #f44747); }
  hr { border: none; border-top: 1px solid var(--vscode-widget-border, #333); margin: 12px 0; }
</style>
</head>
<body>

<h2>${escHtml(title)}</h2>

<div class="section">
  <label>Profile Name</label>
  <input id="profileName" type="text" value="${escHtml(nameVal)}" placeholder="My API Profile" />
</div>

<div class="section">
  <label>Notes (optional)</label>
  <textarea id="profileNotes" placeholder="e.g. DeepSeek production account, expires 2026-12-31...">${escHtml(notesVal)}</textarea>
</div>

<div class="section">
  <label>Quick Template</label>
  <div class="templates">${templateBtns}</div>
</div>

<div class="section">
  <label>Environment Variables</label>
  <table id="varTable">
    <thead><tr><th>Name</th><th>Value</th><th></th></tr></thead>
    <tbody>${varRows || '<tr><td colspan="3" style="color:var(--vscode-descriptionForeground);padding:12px 4px;">No variables — add one below or pick a template.</td></tr>'}</tbody>
  </table>
  <div class="btn-row">
    <button id="btnAddRow" type="button">+ Add Variable</button>
    <span style="font-size:11px;color:var(--vscode-descriptionForeground);">Add a custom env variable</span>
  </div>
</div>

<hr />

<div class="btn-row">
  <button id="btnSave" class="primary" type="button">💾 Save Profile</button>
  <button id="btnCancel" type="button">Cancel</button>
</div>
<div id="status"></div>
<div id="testResult"></div>

<script>
  const vscodeApi = acquireVsCodeApi();

  document.querySelectorAll('.tmpl-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      vscodeApi.postMessage({ type: 'getTemplate', templateName: btn.dataset.template });
    });
  });

  window.addEventListener('message', ev => {
    const msg = ev.data;
    if (msg.type === 'setTemplate') {
      fillTable(msg.variables);
    }
  });

  function fillTable(vars) {
    const tbody = document.querySelector('#varTable tbody');
    tbody.innerHTML = vars.map((v, i) => \`
      <tr class="var-row" data-index="\${i}">
        <td><input class="var-name" type="text" value="\${escHtml(v.name)}" placeholder="e.g. ANTHROPIC_BASE_URL" /></td>
        <td><input class="var-value" type="text" value="\${escHtml(v.value)}" placeholder="value" /></td>
        <td><button class="btn-icon btn-del-row" title="Remove" type="button">✕</button></td>
      </tr>\`).join('');
    bindRowEvents();
  }

  function bindRowEvents() {
    document.querySelectorAll('.btn-del-row').forEach(btn => {
      btn.addEventListener('click', () => { btn.closest('tr').remove(); updateIndices(); });
    });
  }

  function updateIndices() {
    document.querySelectorAll('.var-row').forEach((row, i) => { row.dataset.index = i; });
  }

  document.getElementById('btnAddRow').addEventListener('click', () => {
    const tbody = document.querySelector('#varTable tbody');
    const i = tbody.querySelectorAll('.var-row').length;
    const row = document.createElement('tr');
    row.className = 'var-row'; row.dataset.index = i;
    row.innerHTML = \`<td><input class="var-name" type="text" value="" placeholder="e.g. CUSTOM_VAR" /></td><td><input class="var-value" type="text" value="" placeholder="value" /></td><td><button class="btn-icon btn-del-row" title="Remove" type="button">✕</button></td>\`;
    tbody.appendChild(row);
    bindRowEvents();
  });

  function collectProfile() {
    const name = document.getElementById('profileName').value.trim();
    const notes = document.getElementById('profileNotes').value.trim();
    const rows = document.querySelectorAll('.var-row');
    const variables = [];
    rows.forEach(row => {
      const nameEl = row.querySelector('.var-name');
      const valueEl = row.querySelector('.var-value');
      if (nameEl && nameEl.value.trim()) {
        variables.push({ name: nameEl.value.trim(), value: valueEl ? valueEl.value : '' });
      }
    });
    return { name, notes, variables };
  }

  document.getElementById('btnSave').addEventListener('click', () => {
    const profile = collectProfile();
    if (!profile.name) { setStatus('Please enter a profile name.', 'error'); return; }
    if (profile.variables.length === 0) { setStatus('Please add at least one environment variable.', 'error'); return; }
    vscodeApi.postMessage({ type: 'save', profile });
  });

  document.getElementById('btnCancel').addEventListener('click', () => {
    vscodeApi.postMessage({ type: 'cancel' });
  });

  function setStatus(msg, cls) {
    const el = document.getElementById('status');
    el.textContent = msg;
    el.className = cls || '';
  }

  function escHtml(s) {
    const d = document.createElement('div');
    d.textContent = s || '';
    return d.innerHTML;
  }

  bindRowEvents();
</script>
</body>
</html>`;
}

// ═══════════════════════════════════════════════
//  TREE ITEM CLASSES
// ═══════════════════════════════════════════════

class ProfileItem extends vscode.TreeItem {
  constructor(profile, isActive, usageSummary) {
    const label = isActive ? `★ ${profile.name}` : profile.name;
    super(label, vscode.TreeItemCollapsibleState.Collapsed);
    this.id = profile.id;
    this.contextValue = 'profile';
    const usage = usageSummary ? ` · ${usageSummary}` : '';
    this.description = isActive
      ? `$(pass-filled) Active · ${profile.variables.length} vars${usage}`
      : `${profile.variables.length} vars${usage}`;
    const notesLine = profile.notes ? `\n\n📝 ${profile.notes}` : '';
    this.tooltip = new vscode.MarkdownString(
      profile.variables.map(v => `- **${v.name}**: \`${v.value || '(empty)'}\``).join('\n\n') +
      `\n\n---\n*Created: ${profile.createdAt}*${notesLine}\n*ID: ${profile.id}*`
    );
    this.iconPath = new vscode.ThemeIcon(isActive ? 'star-full' : 'server');
    this._profile = profile;
    this._isActive = isActive;
  }
}

class VariableItem extends vscode.TreeItem {
  constructor(variable) {
    super(variable.name, vscode.TreeItemCollapsibleState.None);
    this.description = variable.value || '(empty)';
    this.tooltip = `${variable.name} = ${variable.value || '(not set)'}`;
    this.iconPath = new vscode.ThemeIcon('symbol-variable');
    this.contextValue = 'variable';
  }
}

// ═══════════════════════════════════════════════
//  TREE DATA PROVIDER
// ═══════════════════════════════════════════════

class ApiProfilesProvider {
  constructor(context) {
    this._context = context;
    this._onDidChangeTreeData = new vscode.EventEmitter();
    this.onDidChangeTreeData = this._onDidChangeTreeData.event;
  }

  refresh() { this._onDidChangeTreeData.fire(); }

  getTreeItem(element) { return element; }

  async getChildren(element) {
    if (element) {
      if (element instanceof ProfileItem) {
        return element._profile.variables.map(v => new VariableItem(v));
      }
      return [];
    }

    const profiles = loadProfiles(this._context);
    const activeId = getActiveProfileId(this._context);

    if (profiles.length === 0) {
      const empty = new vscode.TreeItem('No profiles yet', vscode.TreeItemCollapsibleState.None);
      empty.description = 'Click + to add one';
      empty.iconPath = new vscode.ThemeIcon('info');
      empty.command = { command: 'claudeSwitch.addProfile', title: 'Add Profile' };
      return [empty];
    }

    return profiles.map(p => new ProfileItem(p, p.id === activeId, formatUsageSummary(this._context, p.id)));
  }

  getParent() { return null; }
}

// ═══════════════════════════════════════════════
//  WEBVIEW PANEL MANAGER
// ═══════════════════════════════════════════════

class ProfileEditorManager {
  constructor() {
    this._panel = null;
    this._resolve = null;
    this._reject = null;
  }

  async open(profile) {
    const isNew = !profile;

    if (this._panel) {
      this._panel.dispose();
      this._panel = null;
      this._resolve = null;
      this._reject = null;
    }

    return new Promise((resolve, reject) => {
      this._resolve = resolve;
      this._reject = reject;

      this._panel = vscode.window.createWebviewPanel(
        'claudeSwitch.profileEditor',
        isNew ? 'New API Profile' : `Edit: ${profile.name}`,
        vscode.ViewColumn.One,
        { enableScripts: true, retainContextWhenHidden: true }
      );
      this._panel.webview.html = getWebviewHtml(profile, isNew);

      this._panel.onDidDispose(() => {
        this._panel = null;
        if (this._reject) { this._reject(new Error('Panel closed')); this._reject = null; this._resolve = null; }
      });

      this._panel.webview.onDidReceiveMessage(async (msg) => {
        switch (msg.type) {
          case 'getTemplate': {
            const tpl = TEMPLATES[msg.templateName];
            if (tpl) this._panel.webview.postMessage({ type: 'setTemplate', variables: tpl });
            break;
          }
          case 'save': {
            const result = msg.profile;
            const r = this._resolve;
            this._resolve = null; this._reject = null;
            this._panel.dispose(); this._panel = null;
            if (r) r(result);
            break;
          }
          case 'cancel': {
            const rej = this._reject;
            this._resolve = null; this._reject = null;
            this._panel.dispose(); this._panel = null;
            if (rej) rej(new Error('Cancelled'));
            break;
          }
        }
      });
    });
  }
}

// ═══════════════════════════════════════════════
//  COMMAND HANDLERS
// ═══════════════════════════════════════════════

let _editorManager = new ProfileEditorManager();

// ── Add Profile ──
async function cmdAddProfile(context, profilesProvider) {
  try {
    const name = await vscode.window.showInputBox({
      prompt: 'Enter a name for the new API profile',
      placeHolder: 'e.g. DeepSeek, Aliyun Qwen, My Custom API',
      validateInput: (value) => {
        if (!value?.trim()) return 'Name is required';
        if (loadProfiles(context).some(p => p.name === value.trim())) return 'A profile with this name already exists';
        return null;
      },
    });
    if (!name) return;

    const templateChoice = await vscode.window.showQuickPick(
      ['Start from template', 'Start empty'],
      { placeHolder: 'How would you like to create this profile?' }
    );
    if (!templateChoice) return;

    let initialVars = [];
    if (templateChoice === 'Start from template') {
      const tplName = await vscode.window.showQuickPick(Object.keys(TEMPLATES), { placeHolder: 'Choose a template' });
      if (!tplName) return;
      initialVars = TEMPLATES[tplName] || [];
    } else {
      initialVars = [{ name: 'ANTHROPIC_BASE_URL', value: '' }];
    }

    const profile = makeProfile(name, initialVars);
    logInfo(`Opening editor for new profile: ${name}`);

    try {
      const result = await _editorManager.open(profile);
      if (result) {
        const profiles = loadProfiles(context);
        profiles.push({
          ...profile,
          name: result.name,
          notes: result.notes || '',
          variables: result.variables,
          updatedAt: new Date().toISOString(),
        });
        saveProfiles(context, profiles);
        profilesProvider.refresh();
        vscode.window.showInformationMessage(`✅ Profile "${result.name}" created. Apply it to activate.`);
      }
    } catch (err) {
      if (err?.message !== 'Panel closed' && err?.message !== 'Cancelled') {
        logError('Editor save failed', err);
        vscode.window.showErrorMessage(`Failed to save: ${err?.message || err}`);
      }
    }
  } catch (err) { logError('cmdAddProfile', err); vscode.window.showErrorMessage(`Error: ${err.message}`); }
}

// ── Edit Profile ──
async function cmdEditProfile(context, profilesProvider, profileItem) {
  try {
    if (!profileItem) { vscode.window.showErrorMessage('No profile selected.'); return; }
    const profiles = loadProfiles(context);
    const profile = profiles.find(p => p.id === profileItem.id);
    if (!profile) { vscode.window.showErrorMessage('Profile not found.'); return; }

    logInfo(`Opening editor for: ${profile.name}`);
    try {
      const result = await _editorManager.open(profile);
      if (result) {
        profile.name = result.name;
        profile.notes = result.notes || '';
        profile.variables = result.variables;
        profile.updatedAt = new Date().toISOString();
        saveProfiles(context, profiles);
        profilesProvider.refresh();
        vscode.window.showInformationMessage(`✅ Profile "${profile.name}" updated.`);
      }
    } catch (err) {
      if (err?.message !== 'Panel closed' && err?.message !== 'Cancelled') {
        logError('Editor open failed', err);
        vscode.window.showErrorMessage(`Failed to save: ${err?.message || err}`);
      }
    }
  } catch (err) { logError('cmdEditProfile', err); vscode.window.showErrorMessage(`Error: ${err.message}`); }
}

// ── Delete Profile ──
async function cmdDeleteProfile(context, profilesProvider, profileItem) {
  if (!profileItem) return;
  const profiles = loadProfiles(context);
  const profile = profiles.find(p => p.id === profileItem.id);
  if (!profile) return;

  const confirm = await vscode.window.showWarningMessage(
    `Delete profile "${profile.name}"? This cannot be undone.`,
    { modal: true }, 'Delete'
  );
  if (confirm !== 'Delete') return;

  saveProfiles(context, profiles.filter(p => p.id !== profile.id));
  if (getActiveProfileId(context) === profile.id) setActiveProfileId(context, null);
  profilesProvider.refresh();
  vscode.window.showInformationMessage(`Profile "${profile.name}" deleted.`);
}

// ── Apply Profile ──
async function cmdApplyProfile(context, profilesProvider, profileItem) {
  if (!profileItem) return;
  const profiles = loadProfiles(context);
  const profile = profiles.find(p => p.id === profileItem.id);
  if (!profile) { vscode.window.showErrorMessage('Profile not found.'); return; }

  const editorLabel = getEditorLabel();
  const confirm = await vscode.window.showInformationMessage(
    `Apply profile "${profile.name}" to ${editorLabel} settings?\n\n` +
    `This will update \`claudeCode.environmentVariables\` with ${profile.variables.length} variables.`,
    { modal: true }, 'Apply'
  );
  if (confirm !== 'Apply') return;

  const result = await writeEnvVarsToSettings(profile.variables);
  if (result.success) {
    setActiveProfileId(context, profile.id);
    recordUsage(context, profile.id);
    profilesProvider.refresh();
    vscode.window.showInformationMessage(
      `✅ Profile "${profile.name}" applied to ${editorLabel} settings (${result.method}).`
    );
  } else {
    vscode.window.showErrorMessage(`Failed to write settings: ${result.error || 'Unknown error'}`);
  }
}

// ── Duplicate Profile ──
async function cmdDuplicateProfile(context, profilesProvider, profileItem) {
  if (!profileItem) return;
  const profiles = loadProfiles(context);
  const source = profiles.find(p => p.id === profileItem.id);
  if (!source) return;

  const name = await vscode.window.showInputBox({
    prompt: 'Enter a name for the duplicate',
    placeHolder: `${source.name} (Copy)`,
    value: `${source.name} (Copy)`,
    validateInput: (v) => {
      if (!v?.trim()) return 'Name is required';
      if (profiles.some(p => p.name === v.trim())) return 'A profile with this name already exists';
      return null;
    },
  });
  if (!name) return;

  profiles.push(makeProfile(name, source.variables, source.notes));
  saveProfiles(context, profiles);
  profilesProvider.refresh();
  vscode.window.showInformationMessage(`Profile "${name}" duplicated.`);
}

// ── Export Profile ──
async function cmdExportProfile(profileItem) {
  if (!profileItem?._profile) return;
  const p = profileItem._profile;
  const uri = await vscode.window.showSaveDialog({
    defaultUri: vscode.Uri.file(`${p.name.replace(/\s+/g, '_')}.json`),
    filters: { 'JSON Files': ['json'] },
  });
  if (uri) {
    fs.writeFileSync(uri.fsPath, JSON.stringify({ name: p.name, notes: p.notes, variables: p.variables }, null, 2), 'utf-8');
    vscode.window.showInformationMessage(`Profile exported to ${uri.fsPath}`);
  }
}

// ── Import Profile ──
async function cmdImportProfile(context, profilesProvider) {
  const uris = await vscode.window.showOpenDialog({
    canSelectMany: false, filters: { 'JSON Files': ['json'] }, openLabel: 'Import',
  });
  if (!uris?.length) return;
  try {
    const raw = fs.readFileSync(uris[0].fsPath, 'utf-8');
    const data = JSON.parse(raw);
    if (!data.name || !Array.isArray(data.variables)) {
      throw new Error('Invalid format: expected { name, variables[] }');
    }
    for (const v of data.variables) {
      if (!v.name || typeof v.name !== 'string') throw new Error('Each variable must have a "name" field');
    }
    const profiles = loadProfiles(context);
    let name = data.name, suffix = 1;
    while (profiles.some(p => p.name === name)) name = `${data.name} (${suffix++})`;
    profiles.push(makeProfile(name, data.variables, data.notes || ''));
    saveProfiles(context, profiles);
    profilesProvider.refresh();
    vscode.window.showInformationMessage(`Profile "${name}" imported.`);
  } catch (e) {
    vscode.window.showErrorMessage(`Import failed: ${e.message}`);
  }
}

// ── Export All Profiles ──
async function cmdExportAll(context) {
  const profiles = loadProfiles(context);
  if (profiles.length === 0) {
    vscode.window.showInformationMessage('No profiles to export.');
    return;
  }
  const uri = await vscode.window.showSaveDialog({
    defaultUri: vscode.Uri.file('claude-api-switch-profiles.json'),
    filters: { 'JSON Files': ['json'] },
  });
  if (uri) {
    const data = profiles.map(p => ({ name: p.name, notes: p.notes, variables: p.variables }));
    fs.writeFileSync(uri.fsPath, JSON.stringify(data, null, 2), 'utf-8');
    vscode.window.showInformationMessage(`${profiles.length} profiles exported to ${uri.fsPath}`);
  }
}

// ── Import All Profiles ──
async function cmdImportAll(context, profilesProvider) {
  const uris = await vscode.window.showOpenDialog({
    canSelectMany: false, filters: { 'JSON Files': ['json'] }, openLabel: 'Import All',
  });
  if (!uris?.length) return;
  try {
    const raw = fs.readFileSync(uris[0].fsPath, 'utf-8');
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) throw new Error('Expected an array of profiles');

    const profiles = loadProfiles(context);
    let imported = 0;
    for (const item of data) {
      if (!item.name || !Array.isArray(item.variables)) continue;
      let name = item.name, suffix = 1;
      while (profiles.some(p => p.name === name)) name = `${item.name} (${suffix++})`;
      profiles.push(makeProfile(name, item.variables, item.notes || ''));
      imported++;
    }
    saveProfiles(context, profiles);
    profilesProvider.refresh();
    vscode.window.showInformationMessage(`${imported} profiles imported.`);
  } catch (e) {
    vscode.window.showErrorMessage(`Import failed: ${e.message}`);
  }
}

// ── Import from Current Settings ──
async function cmdImportFromCurrent(context, profilesProvider) {
  const vars = readCurrentEnvVars();
  if (!Array.isArray(vars) || vars.length === 0) {
    vscode.window.showErrorMessage('No claudeCode.environmentVariables found in current settings.');
    return;
  }
  const name = await vscode.window.showInputBox({
    prompt: 'Enter a name for the imported profile',
    placeHolder: 'e.g. My Current Config',
    validateInput: (v) => {
      if (!v?.trim()) return 'Name is required';
      if (loadProfiles(context).some(p => p.name === v.trim())) return 'Name already exists';
      return null;
    },
  });
  if (!name) return;

  const profiles = loadProfiles(context);
  profiles.push(makeProfile(name, vars));
  saveProfiles(context, profiles);
  profilesProvider.refresh();
  vscode.window.showInformationMessage(`Profile "${name}" created from current settings (${vars.length} vars).`);
}

// ── Edit Profile as JSON ──
async function cmdEditAsJson(context, profilesProvider, profileItem) {
  if (!profileItem?._profile) {
    vscode.window.showErrorMessage('No profile selected.');
    return;
  }
  const profiles = loadProfiles(context);
  const profile = profiles.find(p => p.id === profileItem.id);
  if (!profile) return;

  const json = JSON.stringify({ name: profile.name, notes: profile.notes, variables: profile.variables }, null, 2);
  const doc = await vscode.workspace.openTextDocument({
    content: `// Edit this JSON, then save and close.\n` +
             `// Use "Claude API Switch: Reload from JSON Editor" (Cmd+Shift+P) to apply changes.\n\n` +
             json,
    language: 'jsonc',
  });
  const editor = await vscode.window.showTextDocument(doc);

  // Store pending edit info
  const editKey = `claudeSwitch.pendingEdit-${profile.id}`;
  context.globalState.update(editKey, { docUri: doc.uri.toString(), profileId: profile.id });

  vscode.window.showInformationMessage(
    `Editing "${profile.name}" as JSON. Run "Claude API Switch: Reload from JSON Editor" when done.`
  );
}

// ── Reload from JSON Editor ──
async function cmdReloadFromJson(context, profilesProvider) {
  const prefix = 'claudeSwitch.pendingEdit-';
  const allKeys = context.globalState.keys();
  const editKeys = allKeys.filter(k => k.startsWith(prefix));

  if (editKeys.length === 0) {
    vscode.window.showInformationMessage('No pending JSON edits.');
    return;
  }

  // Find the first active text editor with matching content
  let matchedKey = null;
  let matchedData = null;

  for (const key of editKeys) {
    const data = context.globalState.get(key);
    if (!data) continue;
    // Check if document is still open
    try {
      const doc = await vscode.workspace.openTextDocument(vscode.Uri.parse(data.docUri));
      const content = doc.getText();
      // Strip the leading comments
      const jsonText = content.replace(/^\/\/.*\n/gm, '').trim();
      const parsed = JSON.parse(jsonText);
      if (parsed.name && Array.isArray(parsed.variables)) {
        matchedKey = key;
        matchedData = { ...data, parsed };
        break;
      }
    } catch (_) { continue; }
  }

  if (!matchedKey) {
    vscode.window.showErrorMessage('Could not find a valid JSON editor with profile data.');
    return;
  }

  const profiles = loadProfiles(context);
  const profile = profiles.find(p => p.id === matchedData.profileId);
  if (!profile) {
    vscode.window.showErrorMessage('Original profile no longer exists.');
    context.globalState.update(matchedKey, undefined);
    return;
  }

  profile.name = matchedData.parsed.name;
  profile.notes = matchedData.parsed.notes || '';
  profile.variables = matchedData.parsed.variables;
  profile.updatedAt = new Date().toISOString();
  saveProfiles(context, profiles);
  context.globalState.update(matchedKey, undefined);
  profilesProvider.refresh();
  vscode.window.showInformationMessage(`✅ Profile "${profile.name}" updated from JSON editor.`);
}

// ── API Test ──
async function cmdTestProfile(context, profilesProvider, profileItem) {
  if (!profileItem?._profile) {
    vscode.window.showErrorMessage('No profile selected.');
    return;
  }
  const profiles = loadProfiles(context);
  const profile = profiles.find(p => p.id === profileItem.id);
  if (!profile) return;

  const testMsg = vscode.window.setStatusBarMessage(`$(sync~spin) Testing API for "${profile.name}"...`);
  try {
    const result = await testApiEndpoint(profile.variables);
    testMsg.dispose();
    recordTestResult(context, profile.id, result);
    profilesProvider.refresh();

    const text = formatTestResult(profile.variables, result);
    const doc = await vscode.workspace.openTextDocument({ content: text, language: 'text' });
    await vscode.window.showTextDocument(doc, { preview: true });

    if (result.success) {
      vscode.window.showInformationMessage(
        `✅ "${profile.name}" API test passed — ${result.latency}ms (${result.model || '?'})`
      );
    } else {
      vscode.window.showWarningMessage(
        `❌ "${profile.name}" API test failed — ${result.error || 'Unknown error'}`
      );
    }
  } catch (err) {
    testMsg.dispose();
    logError('API test error', err);
    vscode.window.showErrorMessage(`API test error: ${err.message}`);
  }
}

// ── Quick Switch ──
async function cmdQuickSwitch(context, profilesProvider) {
  const profiles = loadProfiles(context);
  if (profiles.length === 0) {
    vscode.window.showInformationMessage('No profiles yet. Add one first.');
    return;
  }

  const activeId = getActiveProfileId(context);
  const items = profiles.map(p => ({
    label: p.id === activeId ? `★ ${p.name}` : p.name,
    description: p.id === activeId
      ? `$(star-full) Active · ${p.variables.length} vars`
      : `${p.variables.length} vars`,
    detail: p.notes || formatUsageSummary(context, p.id),
    profile: p,
  }));

  const selected = await vscode.window.showQuickPick(items, {
    placeHolder: 'Select a profile to apply...',
    matchOnDescription: true,
    matchOnDetail: true,
  });
  if (!selected) return;

  const editorLabel = getEditorLabel();
  const result = await writeEnvVarsToSettings(selected.profile.variables);
  if (result.success) {
    setActiveProfileId(context, selected.profile.id);
    recordUsage(context, selected.profile.id);
    profilesProvider.refresh();
    vscode.window.showInformationMessage(
      `✅ Switched to "${selected.profile.name}" (${editorLabel})`
    );
  } else {
    vscode.window.showErrorMessage(`Failed to apply: ${result.error || 'Unknown error'}`);
  }
}

// ── Clear Usage Stats ──
async function cmdClearUsageStats(context, profilesProvider) {
  const confirm = await vscode.window.showWarningMessage(
    'Clear all usage statistics?', { modal: true }, 'Clear'
  );
  if (confirm !== 'Clear') return;
  context.globalState.update(STORAGE_KEY_USAGE, {});
  profilesProvider.refresh();
  vscode.window.showInformationMessage('Usage statistics cleared.');
}

// ── View Current Config ──
async function cmdViewCurrentConfig() {
  const editorLabel = getEditorLabel();
  const vars = readCurrentEnvVars();
  const settingsPath = detectSettingsJsonPath();

  if (!Array.isArray(vars) || vars.length === 0) {
    const result = await vscode.window.showInformationMessage(
      `No \`claudeCode.environmentVariables\` found in ${editorLabel} settings.`,
      'Open Settings', 'OK'
    );
    if (result === 'Open Settings') {
      if (fs.existsSync(settingsPath)) {
        vscode.window.showTextDocument(await vscode.workspace.openTextDocument(settingsPath));
      }
    }
    return;
  }

  const content = vars.map(v => `${v.name}=${v.value || ''}`).join('\n');
  const doc = await vscode.workspace.openTextDocument({
    content: `# Current claudeCode.environmentVariables in ${editorLabel}\n# File: ${settingsPath}\n\n${content}`,
    language: 'properties',
  });
  await vscode.window.showTextDocument(doc, { preview: true });
}

// ── Debug: Create Test Profile (no webview) ──
async function cmdDebugTestProfile(context, profilesProvider) {
  try {
    const testProfile = makeProfile(`Test-${Date.now()}`, TEMPLATES['DeepSeek']);
    const profiles = loadProfiles(context);
    profiles.push(testProfile);
    saveProfiles(context, profiles);
    profilesProvider.refresh();
    vscode.window.showInformationMessage(
      `Debug test profile "${testProfile.name}" created (${profiles.length} total). Check sidebar.`
    );
  } catch (err) {
    vscode.window.showErrorMessage(`Debug test failed: ${err.message}`);
  }
}

// ── Debug: Show Extension State ──
function cmdDebugShowState(context) {
  try {
    const profiles = loadProfiles(context);
    const activeId = getActiveProfileId(context);
    const editorLabel = getEditorLabel();
    const settingsPath = detectSettingsJsonPath();
    const currentVars = readCurrentEnvVars();

    const lines = [
      `Editor: ${editorLabel}`, `Settings path: ${settingsPath}`,
      `Settings exists: ${fs.existsSync(settingsPath)}`,
      `Profiles stored: ${profiles.length}`,
      `Active profile ID: ${activeId || '(none)'}`,
      `Current env vars: ${currentVars.length}`,
      ``, `--- Profiles ---`,
    ];
    for (const p of profiles) {
      lines.push(`  - ${p.name} (id=${p.id}, ${p.variables.length} vars)${p.notes ? ' 📝' : ''}`);
    }
    lines.push(``, `--- Current settings.json ---`);
    for (const v of currentVars) {
      const dv = v.name.includes('TOKEN') || v.name.includes('AUTH')
        ? (v.value ? v.value.slice(0, 12) + '...' : '(empty)')
        : (v.value || '(empty)');
      lines.push(`  ${v.name}=${dv}`);
    }
    const content = lines.join('\n');
    vscode.workspace.openTextDocument({ content, language: 'text' }).then(doc => {
      vscode.window.showTextDocument(doc, { preview: true });
    });
  } catch (err) {
    vscode.window.showErrorMessage(`Debug show state failed: ${err.message}`);
  }
}

// ═══════════════════════════════════════════════
//  EXTENSION LIFECYCLE
// ═══════════════════════════════════════════════

function activate(context) {
  const editorLabel = getEditorLabel();
  const settingsPath = detectSettingsJsonPath();
  const remoteName = vscode.env.remoteName;  // e.g. 'ssh-remote', 'wsl', 'dev-container', or undefined (local)

  logInfo(`Detected editor: ${editorLabel}`);
  logInfo(`Remote context: ${remoteName || 'local (none)'}`);
  logInfo(`Target settings: ${settingsPath}`);
  logInfo(`Extension kind: ${vscode.env.uiKind === vscode.UIKind.Web ? 'web' : 'desktop'}`);

  const profilesProvider = new ApiProfilesProvider(context);

  const treeView = vscode.window.createTreeView('claudeSwitch.profilesView', {
    treeDataProvider: profilesProvider,
    showCollapseAll: false,
  });
  context.subscriptions.push(treeView);

  const register = (cmd, handler) => {
    context.subscriptions.push(vscode.commands.registerCommand(cmd, handler));
  };

  register('claudeSwitch.addProfile',         () => cmdAddProfile(context, profilesProvider));
  register('claudeSwitch.editProfile',        (item) => cmdEditProfile(context, profilesProvider, item));
  register('claudeSwitch.deleteProfile',      (item) => cmdDeleteProfile(context, profilesProvider, item));
  register('claudeSwitch.applyProfile',       (item) => cmdApplyProfile(context, profilesProvider, item));
  register('claudeSwitch.duplicateProfile',   (item) => cmdDuplicateProfile(context, profilesProvider, item));
  register('claudeSwitch.exportProfile',      (item) => cmdExportProfile(item));
  register('claudeSwitch.importProfile',      () => cmdImportProfile(context, profilesProvider));
  register('claudeSwitch.exportAll',          () => cmdExportAll(context));
  register('claudeSwitch.importAll',          () => cmdImportAll(context, profilesProvider));
  register('claudeSwitch.importFromCurrent',  () => cmdImportFromCurrent(context, profilesProvider));
  register('claudeSwitch.editAsJson',         (item) => cmdEditAsJson(context, profilesProvider, item));
  register('claudeSwitch.reloadFromJson',     () => cmdReloadFromJson(context, profilesProvider));
  register('claudeSwitch.testProfile',        (item) => cmdTestProfile(context, profilesProvider, item));
  register('claudeSwitch.quickSwitch',        () => cmdQuickSwitch(context, profilesProvider));
  register('claudeSwitch.clearUsageStats',    () => cmdClearUsageStats(context, profilesProvider));
  register('claudeSwitch.refreshProfiles',    () => profilesProvider.refresh());
  register('claudeSwitch.viewCurrentConfig',  () => cmdViewCurrentConfig());
  register('claudeSwitch.debugTestProfile',   () => cmdDebugTestProfile(context, profilesProvider));
  register('claudeSwitch.debugShowState',     () => cmdDebugShowState(context));

  // ── Status bar item — click to quick-switch, shows active profile ──
  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.command = 'claudeSwitch.quickSwitch';
  statusBarItem.tooltip = 'Claude API Switch — Click to switch profile';
  context.subscriptions.push(statusBarItem);

  function updateStatusBar() {
    const activeId = getActiveProfileId(context);
    if (activeId) {
      const profiles = loadProfiles(context);
      const active = profiles.find(p => p.id === activeId);
      if (active) {
        statusBarItem.text = `$(star-full) ${active.name}`;
        statusBarItem.tooltip = `Active: ${active.name} — Click to switch`;
      } else {
        statusBarItem.text = '$(server-environment) Claude API';
        statusBarItem.tooltip = 'Claude API Switch — Click to switch profile';
      }
    } else {
      statusBarItem.text = '$(server-environment) Claude API';
      statusBarItem.tooltip = 'Claude API Switch — Click to switch profile';
    }
  }
  updateStatusBar();
  statusBarItem.show();

  // Refresh status bar when tree view refreshes
  profilesProvider.onDidChangeTreeData(() => updateStatusBar());

  logInfo('Extension activated.');
}

function deactivate() {
  if (_editorManager._panel) _editorManager._panel.dispose();
  logInfo('Extension deactivated.');
}

module.exports = { activate, deactivate };
