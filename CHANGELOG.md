# Changelog

All notable changes to this project will be documented in this file.

## [1.1.4] — 2026-08-08

### Added
- **Form / JSON toggle in the editor** — the Edit page now has a **Form ⇄ JSON** mode switch. "Edit Profile as JSON" opens the same editor directly in JSON view. Switching views is lossless: Form state is serialized into JSON, and JSON is parsed and validated before switching back
- **Save validates JSON syntax** — clicking **Save Profile** in JSON mode checks the JSON syntax first and shows the exact error inline; the profile is only updated if the JSON is valid (name is a non-empty string, `variables` is an array of `{ name, value }` entries)
- **Flexible import** — "Import Profile from JSON" and "Import Profiles from JSON" both accept a single profile object *or* an array of profiles (an Export-All file), with proper validation
- **Sidebar menus** — Export All / Import Profile / Import Profiles are now exposed in the sidebar's "..." menu (previously only available from the command palette)

### Removed
- The standalone JSON text-document editor and the "Reload from JSON Editor" command — the old flow could not reliably apply changes (untitled documents can't be reopened by URI), so it's replaced entirely by the in-editor JSON mode

## [1.1.1] — 2026-06-05

### Changed
- **Bilingual README** — README now available in English ([README.md](README.md)) and Chinese ([README_zh.md](README_zh.md)), with language switch badges
- **Quick Start section** — Added step-by-step "3-step quick start" guide for adding the first profile, prominently featured at the top of the README
- **Extension UI explainer** — Added a table mapping every UI element (sidebar buttons, status bar, command palette) to its function

## [1.1.0] — 2026-06-04

### Added
- **API Connectivity Testing** — Test any profile's API endpoint with one click; reports latency, model info, token usage, and error diagnostics
- **Usage Tracking** — Records how many times each profile has been applied, first/last-used dates, and test history
- **Quick Switch** — `Cmd+Shift+P` → "Quick Switch Profile" or click the status bar to instantly swap between API configs
- **Import from Current Settings** — Capture whatever is in `settings.json` right now as a new profile
- **Export All / Import All** — Bulk export/import all profiles as a single JSON file for backup or sharing
- **Edit as JSON** — Open a profile's variables in a text editor for quick raw editing
- **Profile Notes** — Add optional description/notes to each profile (account info, expiry dates, etc.)
- **Status Bar Quick Switch** — Click "Claude API" in the status bar to switch profiles
- Open-source infrastructure: LICENSE, CHANGELOG, CONTRIBUTING, CI/CD workflow

### Fixed
- Race condition in webview panel dispose → save flow (saves now work reliably)
- JSONC parser now correctly handles `//` inside URL strings

## [1.0.0] — 2026-06-03

### Added
- Initial release
- Sidebar TreeView for managing API profiles
- CRUD operations (create, read, update, delete) for profiles
- Webview-based profile editor with template quick-fill
- Apply profiles to `claudeCode.environmentVariables` in settings.json
- Auto-detection of editor platform (Cursor, VS Code, VSCodium, Windsurf)
- Import/export individual profiles as JSON
- Pre-built templates: DeepSeek, Aliyun Qwen, Anthropic Official, Local Proxy
