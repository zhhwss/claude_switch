# 🤖 Claude API Switch

> 管理和切换 Claude Code API 端点配置 — **无需登录 Claude Code，换上你的 API 即可直接使用。**

[![Version](https://img.shields.io/badge/version-1.1.1-blue)](https://github.com/zhhwss/claude_switch)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![VS Code](https://img.shields.io/badge/VS%20Code-1.74%2B-007acc)](https://code.visualstudio.com/)
[![Cursor](https://img.shields.io/badge/Cursor-compatible-8b5cf6)](https://cursor.sh/)

[English](README.md) | [中文](README_zh.md)

---

## ⚡ 这是什么？

Claude Code 通过 API 连接 AI 后端。当你使用 **DeepSeek**、**阿里千问**、本地代理等服务商时，需要在编辑器的 `settings.json` 中配置环境变量（`ANTHROPIC_BASE_URL`、`ANTHROPIC_AUTH_TOKEN` 等）。

这个扩展提供了一个**侧边栏界面**，让你以"配置方案"（Profile）的形式管理这些环境变量，一键即可切换。再也不用手动翻 JSON 文件了。

> **🚫 不需要 Claude Code 账号。** 这个扩展只做一件事：把环境变量写入 `settings.json`。你只需要自带任意兼容 Anthropic 协议的 API Key，填入端点和令牌后即刻生效。无需登录、无需注册、无需账号。

---

## 🚀 快速上手 — 添加你的第一个配置（3 步搞定）

最简单的操作：**添加配置 → 应用 → 完成。**

<p align="center">
  <img src="https://raw.githubusercontent.com/zhhwss/claude_switch/main/images/get_start.gif" alt="Claude API Switch 快速上手演示" width="800" />
</p>

### 第 ① 步 — 打开侧边栏

点击编辑器左侧活动栏中的 **服务器图标** <kbd>$(server-environment)</kbd>，**"API Profiles"** 面板就会展开。

### 第 ② 步 — 点击 **+** 号，填入你的 API Key

点击侧边栏工具栏的 **+** 按钮 → 输入名称（如 `我的 DeepSeek`）→ 选择一个模板（DeepSeek / 阿里千问 / Anthropic 官方 / 本地代理）。

一个网页表单会自动打开，大部分字段已预填好。**你只需要把 `ANTHROPIC_AUTH_TOKEN` 替换成你自己的 API Key**，然后点击 **Save**。

### 第 ③ 步 — 应用并测试

- 点击配置上的 **✓（Apply）** 按钮 → 配置写入 `settings.json`
- 点击 **▶（Test）** 按钮 → 验证端点连通性，显示延迟和模型信息

**搞定了。** Claude Code 现在已经在使用你配置的 API。整个过程不到 30 秒。

---

## 🖥️ 扩展界面 — 一看就懂

这个扩展的设计理念是：打开侧边栏，所有操作一目了然。

| 界面元素 | 位置 | 功能 |
|---|---|---|
| **侧边栏面板** | 左侧活动栏 | 列出所有配置，每个配置带有操作按钮 |
| **+ 按钮** | 侧边栏工具栏 | 添加新的 API 配置 |
| **↓ 按钮** | 侧边栏工具栏 | 将当前 `settings.json` 中的配置抓取为一个方案 |
| **🔄 按钮** | 侧边栏工具栏 | 快速切换配置 |
| **✓ Apply** | 每个配置上的按钮 | 一键写入 `settings.json` |
| **▶ Test** | 每个配置上的按钮 | 测试 API 端点（延迟、模型、错误诊断） |
| **✎ Edit** | 每个配置上的按钮 | 打开网页表单编辑 |
| **状态栏** | 编辑器底部 | 显示当前使用的配置 — 点击可快速切换 |
| **命令面板** | `Cmd+Shift+P` | 搜索 "Claude API Switch" 查看所有命令 |

每个配置在侧边栏中显示名称、备注预览和使用次数 — 当前激活的配置带有 **★** 标记。

---

## ✨ 功能特性

| 功能 | 说明 |
|---|---|
| 📋 **配置管理** | 通过直观的网页表单创建、编辑、复制、删除 API 配置 |
| ⚡ **一键应用** | 点击即可将配置写入 `claudeCode.environmentVariables` |
| 🧪 **API 测试** | 测试每个端点的连通性——报告延迟、模型信息、Token 用量和错误诊断 |
| 📊 **使用统计** | 跟踪每个配置的应用次数、时间戳和测试历史 |
| 🔄 **快速切换** | `Cmd+Shift+P` 或点击状态栏即刻切换配置 |
| 📝 **配置备注** | 为配置添加说明（账号信息、到期时间等） |
| 🎨 **内置模板** | 预置 DeepSeek、阿里千问、Anthropic 官方、本地代理等模板 |
| 📥 **从当前导入** | 将 `settings.json` 中现有配置一键抓取为方案 |
| 📤 **批量导出/导入** | 将所有配置备份或分享为单个 JSON 文件 |
| 🔧 **JSON 编辑器** | 在文本编辑器中以原始 JSON 形式编辑配置 |
| 🌐 **自动检测编辑器** | 兼容 Cursor、VS Code、VSCodium、Windsurf 等编辑器 |
| 🐛 **调试工具** | 内置调试命令，检查内部状态和存储管道 |

---

## 📸 演示

<p align="center">
  <img src="https://raw.githubusercontent.com/zhhwss/claude_switch/main/images/get_start.gif" alt="Claude API Switch 演示" width="800" />
</p>

---

## 🧩 为什么需要这个扩展？

| 场景 | 没有这个扩展 | 有了这个扩展 |
|---|---|---|
| 在 DeepSeek 和阿里千问之间切换 | 每次手动编辑 `settings.json` | 侧边栏点一下 |
| 测试新 API Key 是否能用 | 用 `curl` 命令或写脚本 | 点 ▶ Test 按钮 |
| 把配置分享给同事 | 复制粘贴 JSON 片段 | 导出为文件 → 发送 → 对方导入 |
| 尝试新的模型供应商 | 查文档、找 URL、手动编辑 JSON | 选模板、填 Key、完成 |
| 追踪哪个 Key 用得最多 | 手动记录 | 内置使用统计，含时间戳 |

---

## 🚀 安装

### 从 VSIX 安装

1. 从 [GitHub Releases](https://github.com/zhhwss/claude_switch/releases) 下载最新的 `.vsix` 文件
2. 打开 VS Code / Cursor
3. 进入扩展面板（`Cmd+Shift+X`）→ **…** 菜单 → **Install from VSIX…**
4. 选择下载的 `.vsix` 文件
5. 重新加载编辑器

或者通过命令行：

```bash
# VS Code
code --install-extension claude-switch-1.1.1.vsix

# Cursor
cursor --install-extension claude-switch-1.1.1.vsix
```

### 从源码运行（开发模式）

```bash
git clone https://github.com/zhhwss/claude_switch.git
cd claude-switch
# 在 VS Code / Cursor 中打开，按 F5 启动扩展开发宿主
```

---

## 📋 配置格式

### 单个配置（`.json`）

```json
{
  "name": "DeepSeek 生产环境",
  "notes": "主账号，2026-12-31 到期",
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

### 批量导出（`profiles.json`）

```json
[
  { "name": "DeepSeek", "notes": "...", "variables": [...] },
  { "name": "阿里千问", "notes": "...", "variables": [...] }
]
```

---

## 🔧 命令参考

| 命令 | 访问方式 | 说明 |
|---|---|---|
| `Add API Profile` | 侧边栏 **+** | 创建新配置 |
| `Edit Profile` | 行内 ✎ 按钮 | 在网页表单中编辑 |
| `Edit Profile as JSON` | 右键菜单 | 以原始 JSON 编辑 |
| `Apply Profile` | 行内 ✓ 按钮 | 写入 `settings.json` |
| `Test API Connection` | 行内 ▶ 按钮 | 测试端点连通性 |
| `Quick Switch Profile` | `Cmd+Shift+P` | 快速切换配置 |
| `Duplicate Profile` | 右键菜单 | 复制配置 |
| `Import Profile from Current Settings` | 侧边栏 ↓ 按钮 | 抓取当前配置 |
| `Export Profile as JSON` | 右键菜单 | 导出单个配置 |
| `Export All Profiles` | `Cmd+Shift+P` | 批量备份 |
| `Import Profile from JSON` | 侧边栏 | 导入单个配置 |
| `Import Profiles from JSON` | `Cmd+Shift+P` | 批量导入 |
| `Reload from JSON Editor` | `Cmd+Shift+P` | 应用 JSON 编辑器中的更改 |
| `View Current Config` | `Cmd+Shift+P` | 查看当前活动配置 |
| `Clear Usage Statistics` | `Cmd+Shift+P` | 重置使用统计 |
| `Refresh Profiles` | 侧边栏 ↻ | 刷新配置列表 |

---

## 🧩 支持的编辑器

扩展会自动检测当前运行在哪个编辑器中（通过定位 `settings.json`）：

| 编辑器 | 配置文件路径 (macOS) |
|---|---|
| **Cursor** | `~/Library/Application Support/Cursor/User/settings.json` |
| **VS Code** | `~/Library/Application Support/Code/User/settings.json` |
| **VSCodium** | `~/Library/Application Support/VSCodium/User/settings.json` |
| **Windsurf** | `~/Library/Application Support/Windsurf/User/settings.json` |
| **Code - OSS** | `~/Library/Application Support/Code - OSS/User/settings.json` |

同样支持 Windows 和 Linux 平台（自动适配路径）。

---

## 🛠 开发

```bash
git clone https://github.com/zhhwss/claude_switch.git
cd claude-switch
# 在 VS Code / Cursor 中打开
# 按 F5 启动扩展开发宿主
```

### 调试命令

- **`Debug: Show Extension State`** — 查看所有配置、活动 ID、settings 路径和当前环境变量
- **`Debug: Create Test Profile`** — 绕过 WebView 创建测试配置，验证存储管道

### 项目结构

```
claude_switch/
├── package.json           # 扩展清单
├── extension.js           # 所有扩展逻辑（单文件，零 npm 依赖）
├── .github/workflows/     # CI/CD 发布流程
├── images/                # 图标文件
├── LICENSE                # MIT 许可证
├── CHANGELOG.md           # 更新日志
├── CONTRIBUTING.md        # 贡献指南
├── README.md              # 英文文档
└── README_zh.md           # 中文文档
```

---

## 📦 发布

### VS Code / Cursor 扩展市场

```bash
# 安装 vsce
npm install -g @vscode/vsce

# 创建发布者（一次性操作）
# https://marketplace.visualstudio.com/manage/createpublisher

# 打包 & 发布
vsce package
vsce publish

# 或者发布到 Open VSX Registry
npm install -g ovsx
ovsx publish
```

### CI/CD（GitHub Actions）

1. 从 [Azure DevOps](https://dev.azure.com/) 创建 Personal Access Token
2. 添加为 GitHub secret：`VSCE_PAT`
3. （可选）添加 Open VSX token：`OVSX_PAT`
4. 推送版本标签：`git tag v1.0.0 && git push --tags`

---

## 🤝 贡献

欢迎贡献！详见 [CONTRIBUTING.md](CONTRIBUTING.md)。

贡献方向建议：
- 更多 API 供应商模板
- 基于 Token 用量的费用估算
- 工作区级别的配置自动切换
- 多语言国际化
- 更全面的 API 响应解析

---

## 📄 许可证

MIT © 2026 Claude API Switch Contributors。详见 [LICENSE](LICENSE)。
