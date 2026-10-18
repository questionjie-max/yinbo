# 署名与来源声明 / Attribution & Provenance

本项目是开源衍生作品。以下逐项说明来源，**不含任何未标明的第三方代码**。

## 1. 上游基础：OpenLess v1.3.18（MIT）

本项目的应用主体（Tauri 桌面程序、录音与 ASR 链路、fcitx5 文字注入插件、
历史/词典/润色等）改编自 **OpenLess v1.3.18-tauri**（tag `v1.3.18-tauri`）。

- 上游仓库：https://github.com/Open-Less/openless
- 上游许可证：MIT License，`Copyright (c) 2026 OpenLess contributors`
- 上游当时的发行说明亦为 “OpenLess is released under the MIT License.”

我们据此保留了上游版权声明，并在 `LICENSE` 中并列加入本方版权声明。

> **与上游当前版本的关系**：上游 `beta`/2.0 分支已重新授权为 **AGPL-3.0** 并另起
> egui 技术路线。**本项目不包含、也不引用 2.0/beta 分支的任何代码**，因此本项目
> 整体仍按 MIT 分发。若日后需要引入 2.0 代码，须重新评估许可证并整体转为 AGPL。

## 2. 视觉素材：VoiceOrbs（MIT）

胶囊光球的着色器（GLSL）移植自 **VoiceOrbs**：

- 上游仓库：https://github.com/amunozdev/voiceorbs
- 作者与许可证：`Copyright (c) 2026 Alexis Munoz`，MIT License
- VoiceOrbs 的定位是可供复用的动效素材库（“copy-paste animated orbs”）

本项目中改编自该库的文件（每个文件的头部均保留了原始署名注释）：

| 文件 | 改编自 |
|---|---|
| `gnome-shell-extension/yinbo-capsule@yinbo/extension.js`（内置着色器 `SHADER_BODY`） | VoiceOrbs `waveform-ring` |
| `frag-variants/waveform-ring.frag` | VoiceOrbs `waveform-ring` |
| `frag-variants/equalizer-orb.frag` | VoiceOrbs `equalizer-orb` |
| `frag-variants/aura-field.frag` | VoiceOrbs `aura-field` |
| `frag-variants/siri-sheet.frag` | VoiceOrbs `siri-sheet` |

移植工作（WebGL → Cogl/Clutter 着色器、uniform 契约、状态参数化）为本项目所写。
**注意**：`frag-variants/fluid-orb.frag` 为早期实验文件，其来源许可证尚未核实，
**不随发行物提供**，仅作本地留档。

## 3. 本项目原创部分

以下为本项目自行编写，非移植：

- GNOME Shell 扩展（`extension.js`，约 600 行）：Wayland 下悬浮层的渲染、
  `Clutter.ShaderEffect` 生命周期、合成器级全局热键（Mutter keybinding）、
  撕裂/竞态守卫、着色器热替换机制
- 状态桥 `capsule_bridge.rs`（Unix socket JSON lines，状态与电平广播）
- 电平动态 `LevelDynamics`（噪声门 + 自适应基线 + 扩张 + 攻击/释放包络）
- fcitx5 插件的焦点输入上下文路由修复（`CommitText` 优先实时焦点 IC）
- 客户端韧性修复（ASR 会话代数守卫、首块削波丢弃、空转写中性态）

## 4. 其他第三方组件

`openless-all/app/src-tauri/vendor/` 下为上游随附的依赖，各自保留其原始许可证文件：
`tauri-nspanel`（Apache-2.0 / MIT）、`wayland-scanner`、`qwen-asr` 等。
本项目的 Linux 构建不涉及 macOS/Windows 专用组件。
