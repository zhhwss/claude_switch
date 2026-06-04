# 🤖 Claude API Switch

> A VS Code / Cursor extension to manage and switch Claude Code API endpoint profiles.

[![Version](https://img.shields.io/badge/version-1.1.0-blue)](https://github.com/blackzhou/claude-switch)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![VS Code](https://img.shields.io/badge/VS%20Code-1.74%2B-007acc)](https://code.visualstudio.com/)
[![Cursor](https://img.shields.io/badge/Cursor-compatible-8b5cf6)](https://cursor.sh/)

---

## ✨ Features

| Feature | Description |
|---|---|
| 📋 **Profile CRUD** | Create, edit, duplicate, and delete API profiles with an intuitive web form |
| ⚡ **One-Click Apply** | Apply any profile to instantly update `claudeCode.environmentVariables` |
| 🧪 **API Testing** | Test connectivity to each endpoint — reports latency, model info, token usage, and error diagnostics |
| 📊 **Usage Tracking** | Tracks how many times each profile was applied, with timestamps and test history |
| 🔄 **Quick Switch** | `Cmd+Shift+P` or click the status bar to swap profiles instantly |
| 📝 **Profile Notes** | Add descriptions to profiles (account info, expiry dates, etc.) |
| 🎨 **Templates** | Pre-built templates for DeepSeek, Aliyun Qwen, Anthropic, Local Proxy, and more |
| 📥 **Import from Current** | Capture whatever is in `settings.json` right now as a profile |
| 📤 **Bulk Export/Import** | Backup or share all profiles as a single JSON file |
| 🔧 **JSON Editor** | Edit profile variables as raw JSON in a text editor |
| 🌐 **Auto-Detect Editor** | Works with Cursor, VS Code, VSCodium, Windsurf, and other VS Code-based editors |
| 🐛 **Debug Tools** | Built-in debug commands to inspect state and test the storage pipeline |

---

## 📸 Screenshots

<!-- TODO: add real screenshots -->
<p align="center">
  <em>Sidebar with profile list, inline actions, and usage stats</em><br/>
  <em>Webview editor with template quick-fill and notes</em><br/>
  <em>API test results with latency and token usage</em><br/>
  <em>Quick Switch palette</em>
</p>

---

## 🚀 Installation

### Install from VSIX

1. Download the latest `.vsix` file from [GitHub Releases](https://github.com/blackzhou/claude-switch/releases)
2. Open VS Code / Cursor
3. Go to Extensions (`Cmd+Shift+X`) → **…** menu → **Install from VSIX…**
4. Select the downloaded `.vsix` file
5. Reload the editor

Or from the command line:

```bash
# VS Code
code --install-extension claude-switch-1.1.0.vsix

# Cursor
cursor --install-extension claude-switch-1.1.0.vsix
```

### From Source (Development)

```bash
git clone https://github.com/blackzhou/claude-switch.git
cd claude-switch
# Open in VS Code / Cursor and press F5 to launch Extension Development Host
```

---

## 🎯 Usage

### 1. Open the Sidebar

Click the **server icon** <kbd>$(server-environment)</kbd> in the activity bar to open the **API Profiles** panel.

### 2. Create a Profile

Click **+** → Enter a name → Choose a template (DeepSeek, Aliyun, etc.) or start empty → Fill in your API keys → **Save**.

### 3. Apply & Switch

- Click the **✓ (Apply)** inline button on any profile to write it to settings.json
- Use `Cmd+Shift+P` → **"Quick Switch Profile"** to swap without opening the sidebar
- Click the **"Claude API"** status bar button for instant switching

### 4. Test Connectivity

Click the **▶ (Test)** inline button on any profile to verify the API endpoint is working. Results show:
- ✅/❌ Connection status
- Latency in ms
- Model returned by the server
- Token usage for the test request
- Detailed error message if something's wrong

### 5. Manage Profiles

- **Edit** — Modify variables, name, or notes in the web form
- **Edit as JSON** — Quick raw editing in a text editor
- **Duplicate** — Clone a profile as a starting point for a new one
- **Export/Import** — Share individual profiles or bulk backup all profiles

---

## 📋 Profile Format

### Single Profile (`.json`)

```json
{
  "name": "DeepSeek Production",
  "notes": "Main production account, expires 2026-12-31",
  "variables": [
    { "name": "ANTHROPIC_BASE_URL", "value": "https://api.deepseek.com/anthropic" },
    { "name": "ANTHROPIC_AUTH_TOKEN", "value": "sk-..." },
    { "name": "ANTHROPIC_MODEL", "value": "deepseek-v4-pro[1m]" },
    { "name": "ANTHROPIC_DEFAULT_OPUS_MODEL", "value": "deepseek-v4-pro[1m]" },
    { "name": "ANTHROPIC_DEFAULT_SONNET_MODEL", "value": "deepseek-v4-pro[1m]" },
    { "name": "ANTHROPIC_DEFAULT_HAIKU_MODEL", "value": "deepseek-v4-flash" },
    { "name": "CLAUDE_CODE_SUBAGENT_MODEL", "value": "deepseek-v4-flash" },
    { "name": "CLAUDE_CODE_EFFORT_LEVEL", "value": "max" }
  ]
}
```

### Bulk Export (`profiles.json`)

```json
[
  { "name": "DeepSeek", "notes": "...", "variables": [...] },
  { "name": "Aliyun Qwen", "notes": "...", "variables": [...] }
]
```

---

## 🔧 Commands Reference

| Command | Shortcut | Description |
|---|---|---|
| `Add API Profile` | Sidebar **+** | Create a new profile |
| `Edit Profile` | Inline ✎ | Edit profile in web form |
| `Edit Profile as JSON` | Right-click | Edit variables as raw JSON |
| `Apply Profile` | Inline ✓ | Write to settings.json |
| `Test API Connection` | Inline ▶ | Test endpoint connectivity |
| `Quick Switch Profile` | Cmd+Shift+P | Fast profile switching |
| `Duplicate Profile` | Right-click | Clone a profile |
| `Import Profile from Current Settings` | Sidebar ↓ | Capture current config |
| `Export Profile as JSON` | Right-click | Export single profile |
| `Export All Profiles` | Cmd+Shift+P | Bulk backup |
| `Import Profile from JSON` | Sidebar | Import single profile |
| `Import Profiles from JSON` | Cmd+Shift+P | Bulk import |
| `Reload from JSON Editor` | Cmd+Shift+P | Apply JSON editor changes |
| `View Current Config` | Cmd+Shift+P | Inspect active settings |
| `Clear Usage Statistics` | Cmd+Shift+P | Reset usage counters |
| `Refresh Profiles` | Sidebar ↻ | Refresh the tree view |

---

## 🧩 Supported Environments

The extension automatically detects which editor it's running in by locating `settings.json`:

| Editor | Settings Path (macOS) |
|---|---|
| **Cursor** | `~/Library/Application Support/Cursor/User/settings.json` |
| **VS Code** | `~/Library/Application Support/Code/User/settings.json` |
| **VSCodium** | `~/Library/Application Support/VSCodium/User/settings.json` |
| **Windsurf** | `~/Library/Application Support/Windsurf/User/settings.json` |
| **Code - OSS** | `~/Library/Application Support/Code - OSS/User/settings.json` |

Should also work with other VS Code-based editors and on Windows / Linux, though these have not been extensively tested.

---

## 🛠 Development

```bash
git clone https://github.com/blackzhou/claude-switch.git
cd claude-switch
# Open in VS Code / Cursor
# Press F5 to launch Extension Development Host
```

### Debug Commands

- **`Debug: Show Extension State`** — Inspect all profiles, active ID, settings path, and current config
- **`Debug: Create Test Profile`** — Create a test profile bypassing the webview to verify the storage pipeline

### Project Structure

```
claude_switch/
├── package.json           # Extension manifest
├── extension.js           # All extension logic
├── .github/workflows/     # CI/CD for publishing
├── images/                # Icon files
├── LICENSE                # MIT
├── CHANGELOG.md
├── CONTRIBUTING.md
└── README.md
```

---

## 📦 Publishing

### VS Code / Cursor Marketplace

```bash
# Install vsce
npm install -g @vscode/vsce

# Create a publisher (one-time)
# https://marketplace.visualstudio.com/manage/createpublisher

# Package & publish
vsce package
vsce publish

# Or publish to Open VSX Registry
npm install -g ovsx
ovsx publish
```

### CI/CD (GitHub Actions)

1. Create a Personal Access Token from [Azure DevOps](https://dev.azure.com/)
2. Add it as a GitHub secret: `VSCE_PAT`
3. (Optional) Add an Open VSX token as `OVSX_PAT`
4. Push a version tag: `git tag v1.0.0 && git push --tags`

---

## 🤝 Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

Ideas for contributions:
- Additional API provider templates
- Cost estimation based on token usage
- Workspace-specific profile auto-switching
- i18n / localization
- More comprehensive API response parsing

---

## 📄 License

MIT © 2026 Claude API Switch Contributors. See [LICENSE](LICENSE) for details.
