# 音波 · Yinbo v0.1.1

**界面内的旧品牌与 logo 全部替换为本项目自己的。** 功能与 v0.1.0 一致。

## 本版改了什么

v0.1.0 的改名只到"安装后能跑"这一层，界面内部还有残留——打开软件看到的仍是旧名字和旧图标。本版补齐：

- **窗口标题**：`OpenLess` → `音波 Yinbo`（`index.html` 标题，决定窗口/任务栏显示名）
- **界面 logo**：`AppIcon.png` 换成自有光球图标（侧栏、关于页、欢迎页共用）
- **侧栏品牌行 / 关于页名称 / 自制标题栏**：改为随语言切换的应用名（中文「音波」、其他语言 Yinbo）
- **内置风格提示词**：「你是音波的润色助手…」
- **录音下载文件名**：`yinbo-recording-*.wav`
- 其他小残留：内部 URL 占位、样式注释、mock 数据中的旧名

## 来源与许可

- 应用主体改编自 **[OpenLess](https://github.com/Open-Less/openless) v1.3.18**（MIT）。
- 光球着色器移植自 **[VoiceOrbs](https://github.com/amunozdev/voiceorbs)**（MIT，© Alexis Munoz）。
- 与 OpenLess 项目无从属或背书关系；本项目按 **MIT** 分发。逐项来源见 `NOTICE.md`。

## 系统要求

| 项目 | 要求 |
|---|---|
| 发行版 | **Ubuntu 26.04**（二进制基于 glibc 2.43 构建；旧发行版暂不支持） |
| 架构 | x86_64 |
| 输入法框架 | **fcitx5 必须是会话输入法**（GNOME 需 `im-config -n fcitx5` 后重新登录） |
| 桌面 | 胶囊光球需 **GNOME Shell 49/50**；其他桌面可听写但无光球 |
| ASR | 需自备凭据（如火山方舟"豆包流式语音识别"）；润色可选配 LLM 渠道 |

## 安装 / 升级

```bash
sudo apt install ./Yinbo_0.1.1_amd64.deb      # 依赖自动包含 fcitx5 与 libxdo3
im-config -n fcitx5                           # GNOME 用户需要；KDE 通常已是
gnome-extensions enable yinbo-capsule@yinbo   # 胶囊扩展随包安装；首次启用需重新登录一次
```

从 v0.1.0 升级直接覆盖安装即可，配置与凭据（钥匙环条目）不变。

## 已知限制

- 仅支持 Ubuntu 26.04 级系统（glibc 2.43）；降低基线在后续版本。
- 只有 deb 包，无 rpm / Flatpak / AUR。
- 无自动更新（不检查、不下载；也不会请求上游发布通道）。
- 胶囊仅 GNOME 49/50；其他桌面暂无实时视觉反馈。
- 若此前装过上游 OpenLess：启用本扩展前请停用它的扩展并退出其进程，两者会争抢同一热键。
