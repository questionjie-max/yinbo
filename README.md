# 音波 · Yinbo

[![CI](https://github.com/questionjie-max/yinbo/actions/workflows/ci.yml/badge.svg)](https://github.com/questionjie-max/yinbo/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-2f855a.svg)](LICENSE)

**Linux 语音输入，说话的时候看得见。**

按住热键说话，文字直接落在光标处；屏幕底部浮着一颗随你的声音呼吸的光球——
录音、思考、上屏，每个状态都看得见。

<p align="center">
  <img src="docs/images/orb-demo.gif" alt="音波悬浮光球：说话时随声音呼吸，静音时完全静止" width="520" />
  <br />
  <sub>真实录屏：光球的振幅、线宽与辉光都跟着音量走，静音时完全静止</sub>
</p>

> Yinbo is a Linux voice-input tool with a real-time visual capsule.
> Hold the hotkey, speak, and text appears at your cursor — with an orb that
> breathes with your voice. Based on OpenLess v1.3.18 (MIT); orb shaders adapted
> from VoiceOrbs (MIT). See [NOTICE.md](NOTICE.md).

---

## 它是什么

一个**独立的语音输入应用**，加一个**把文字送进焦点窗口的 fcitx5 插件**：

```
麦克风 → 你的 ASR 服务（火山方舟等）→ 可选 LLM 润色 → fcitx5 注入 → 当前窗口
                                  ↓
                        状态桥 → 悬浮光球（实时可见）
```

- **不修改 fcitx5**，也不替代它：fcitx5 仍是系统输入法框架，本项目的插件只是
  加载项（addon），负责把文字提交给焦点输入上下文。插件缺失时自动回退剪贴板粘贴。
- 语音链路的全部（录音、ASR、润色、状态机、历史、词典、光球）都在本应用内，
  与 fcitx5 无耦合。

## 它看起来什么样

静音时它收敛成一个安静的小环；你说话时，环的振幅、线宽与中心辉光全部跟着音量走。
它悬浮在屏幕底部、点击穿透、不抢焦点——你正常打字，它只在你说话时出现。

| 悬浮在桌面底部 | 与窗口共存，不挡操作 |
|---|---|
| ![桌面底部](docs/images/orb-desktop.png) | ![与窗口共存](docs/images/orb-with-window.png) |

想换别的样式？把仓库里 `frag-variants/` 的任一文件复制到
`~/.cache/yinbo/capsule-shader.frag` 即可（约 2 秒生效；删掉该文件则回到内置样式）。

## 与上游的关系（如实声明）

- 应用主体改编自 **[OpenLess](https://github.com/Open-Less/openless) v1.3.18**（MIT）。
- 光球着色器移植自 **[VoiceOrbs](https://github.com/amunozdev/voiceorbs)**（MIT，© Alexis Munoz）。
- 本项目与 OpenLess 项目**无从属或背书关系**；由第三方独立维护。
- 上游 2.0/beta 已改为 **AGPL-3.0** 并另起 egui 技术路线。**本项目不含其一字代码**，
  整体仍按 MIT 分发。逐项来源见 [NOTICE.md](NOTICE.md)。

## 相比上游 v1.3.18 的定制（都是 Linux 上原本缺的）

1. **悬浮光球胶囊**：GNOME Wayland 下的实时视觉反馈层，随电平呼吸、静音静止、
   状态切换（录音／思考／完成）。上游 Linux 版没有胶囊。
2. **合成器级全局热键**：由 GNOME Shell 扩展全局抓取（默认 `Alt_R`，可改），
   与焦点应用无关。上游方案在部分窗口会丢热键。
3. **fcitx5 插件修复**：`CommitText` 改为优先使用**实时焦点输入上下文**，
   修掉「说话在 A 窗口、文字落到 B 窗口」的错投问题。
4. **电平动态（LevelDynamics）**：噪声门 + 自适应基线 + 扩张 + 攻击/释放包络，
   静音时电平归零、说话时跟手，不再全程顶格。
5. **客户端韧性修复**：ASR 会话代数守卫（防止旧连接把过期帧灌进新会话）、
   录音首块削波丢弃、空转写回落为中性状态而非报错。
6. **脱钩上游服务**：不启用自动更新（不访问上游发布通道），不请求上游市场/云服务。

## 系统要求（请先读，别装完才发现）

| 项目 | 要求 | 说明 |
|---|---|---|
| 发行版 | **Ubuntu 26.04**（实测） | 二进制基于 glibc 2.43 构建；更旧的发行版暂不支持（后续会降低基线） |
| 架构 | x86_64 | |
| 输入法框架 | **fcitx5 必须是会话输入法** | KDE 默认即是；GNOME 需 `im-config -n fcitx5` 后重新登录。ibus 会话下插件不可用（仅剪贴板回退） |
| 胶囊光球 | **GNOME Shell 49 / 50** | 其他桌面（KDE/XFCE 等）听写可用，但**没有光球** |
| 麦克风 | PipeWire / PulseAudio | |
| ASR 服务 | 需自备凭据 | 火山方舟（豆包流式语音识别）等；润色可选 LLM 渠道 |

## 安装

```bash
# 1. 安装主程序（依赖自动包含 fcitx5 与 libxdo3）
sudo apt install ./Yinbo_0.1.3_amd64.deb

# 2. 确认会话输入法为 fcitx5（GNOME 需要；KDE 通常已是）
im-config -n fcitx5        # 然后注销重新登录

# 3. 启用胶囊扩展（已随包安装到 /usr/share/gnome-shell/extensions/）
gnome-extensions enable yinbo-capsule@yinbo   # 首次启用需重新登录一次

# 4. 启动 Yinbo → 设置 中填入你的 ASR 凭据（也可选配 LLM 润色渠道）
# 5. 按右 Alt 说话
```

> 若你之前装过上游 OpenLess：**请先停用它的扩展并退出它的进程**再启用本扩展，
> 否则两者会争抢同一个热键（`gnome-extensions disable openless-capsule@openless`）。

热键默认 `Alt_R`，可在扩展的 schema（`yinbo-dictation`）中修改。

## 凭据与隐私

- 凭据存放在 **GNOME 钥匙环**（条目 `credentials.v1.chunk.0@com.yinbo.app`），
  不写入配置文件明文。
- 音频**只**发送到你自行配置的 ASR 服务商；本项目不含遥测、不上报任何数据。
- 不连接上游服务：自动更新未启用，市场/云同步等上游服务相关界面未包含。

## 已知限制

- **无自动更新**：本版不提供更新检查，也不会访问上游发布通道。
- **只有 deb**：无 rpm / Flatpak / AUR 包。
- **glibc 2.43 门槛**：仅 Ubuntu 26.04 级系统可直接运行。
- 胶囊仅 GNOME 49/50；其他桌面的实时视觉反馈尚未实现。
- 上游 2.0 的功能（本地离线 ASR、云同步等）**不在**本项目内，也不在路线图上。

## 构建

```bash
./scripts/build-linux.sh      # 插件（C++/CMake）→ 前端（npm）→ deb
```

依赖清单与内存提示见脚本头部注释（release 构建带 LTO，建议 `CARGO_BUILD_JOBS=2`）。

## 致谢

这个项目站在别人的肩膀上，这一点不必含糊：

- **[OpenLess](https://github.com/Open-Less/openless)** —— 应用主体（录音、ASR 链路、fcitx5 注入、
  历史与词典）来自它的 v1.3.18 版本，作者与贡献者把一套完整可用的语音输入做成了 MIT 开源。
  感谢他们。**上游至今仍在活跃开发**，2.0 已换技术路线并新增本地离线 ASR、云同步等能力——
  如果你用 macOS / Windows，或想要那些功能，请直接去用上游版本。
- **[VoiceOrbs](https://github.com/amunozdev/voiceorbs)**，© Alexis Munoz —— 悬浮光球的着色器
  （metaball 软融合、光谱色带、波形环）移植自这个 MIT 素材库；本项目做的是把它们接到听写状态上，
  并补上 GNOME Wayland 下的渲染、收纳与热替换。感谢作者把动效做成可直接取用的形式。
- **[fcitx5](https://github.com/fcitx/fcitx5)** —— 文字注入依赖它的 addon 机制。我们没有修改它，
  只是以加载项的形式住进去；能在任意窗口落字，功劳在它。

本项目相对上游的增量见上文「相比上游 v1.3.18 的定制」；完整的出处与逐文件署名见 [NOTICE.md](NOTICE.md)。

## 许可

**MIT**（`LICENSE`，上游版权声明一并保留）。
第三方来源与逐文件署名见 [NOTICE.md](NOTICE.md)。
