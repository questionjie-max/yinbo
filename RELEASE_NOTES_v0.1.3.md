# 音波 · Yinbo v0.1.3

**修复：应用启动后的第一次听写，会先闪一下 fcitx 的「🎤 收音中」文字，约 1 秒后才切换成光球。**

## 原因

胶囊状态桥的 socket 原本是**懒绑定**——应用启动时不建监听，直到第一帧要发出去（也就是你第一次按热键）才创建。于是：

1. 第一次听写开始的瞬间，应用检查"有没有客户端订阅" → 没有（监听还没建，扩展自然连不上）
2. 于是走降级路径，先往 fcitx 辅助区写「🎤 收音中...」
3. 扩展的重连周期是 2 秒，连上之后应用才清掉文字、切到光球

所以每次应用启动后的第一段听写都会有这个"文字先出现、光球后出现"的过程；同一进程内的后续听写不受影响。

## 修复

应用启动时**预绑定**状态桥 socket（`capsule_bridge_init()`）。这样扩展在你按下热键之前就已经连上，第一段听写直接出光球，不再经过文字兜底。

实测确认：启动日志里 `[capsule-bridge] listening at …` 现在紧跟在 `=== Yinbo 启动 ===` 之后出现，无需任何听写动作。

## 升级

```bash
sudo apt install ./Yinbo_0.1.3_amd64.deb
```

装完**重启应用即可**（扩展没有改动，不需要重新登录）。

## 系统要求

Ubuntu 26.04（glibc 2.43）· x86_64 · **fcitx5 必须是会话输入法** · 光球需 **GNOME Shell 49/50** · ASR 需自备凭据。

## 来源与许可

应用主体改编自 [OpenLess](https://github.com/Open-Less/openless) v1.3.18（MIT）；光球着色器移植自
[VoiceOrbs](https://github.com/amunozdev/voiceorbs)（MIT，© Alexis Munoz）。与 OpenLess 项目无从属关系，
本项目按 MIT 分发，逐项来源见 `NOTICE.md`。
