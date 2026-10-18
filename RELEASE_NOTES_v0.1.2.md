# 音波 · Yinbo v0.1.2

**修复：全新安装后光球不显示。** 这是个只在"干净安装"上才会出现的老 bug。

## 修了什么

### 1. 光球不显示（重要）

录音时屏幕底部应该浮出随声音呼吸的光球，但全新安装后**什么都不显示**。

根因：扩展的内置着色器（`SHADER_BODY`）定义了却从未被使用——只有当
`~/.cache/yinbo/capsule-shader.frag` 这个"样式覆盖文件"存在时才会给效果设置着色器源。
而录音/忙碌状态由 GLSL 着色器接管、Cairo 绘制会被跳过，于是**没有着色器源 + 跳过 Cairo
= 屏幕上什么都没有**。开发者本机一直有这个覆盖文件，所以从未暴露；干净安装必现。

修法：没有覆盖文件时**回落内置着色器**；覆盖文件被删除时也回落内置。现在装完即可用，
想要换样式再把文件放进 `~/.cache/yinbo/capsule-shader.frag` 即可（2 秒生效）。

### 2. 每小时一条错误日志

`[updater] check failed: 此构建不提供自动更新检查`。本构建拆掉了更新器，但前端仍在按小时
调用检查。现在平台能力如实上报"不支持自动更新"，前端不再挂载该定时任务，"关于"页也不再
显示那个必然失败的检查按钮。

### 3. 其他

- 扩展描述里的多余空格（改名遗留）
- 内置的调试环境变量名统一为 `YINBO_CAPSULE_NO_SHADER`

## 升级方式

```bash
sudo apt install ./Yinbo_0.1.2_amd64.deb
```

装完**重新登录一次**（扩展 JS 变了，GNOME 需要重载扩展模块；新版扩展开机即生效）。
配置与凭据不变。

## 系统要求

| 项目 | 要求 |
|---|---|
| 发行版 | **Ubuntu 26.04**（glibc 2.43；旧发行版暂不支持） |
| 架构 | x86_64 |
| 输入法框架 | **fcitx5 必须是会话输入法**（GNOME 需 `im-config -n fcitx5` 后重新登录） |
| 桌面 | 胶囊光球需 **GNOME Shell 49/50** |
| ASR | 需自备凭据（如火山方舟"豆包流式语音识别"），润色可选配 LLM |

## 来源与许可

应用主体改编自 [OpenLess](https://github.com/Open-Less/openless) v1.3.18（MIT）；
光球着色器移植自 [VoiceOrbs](https://github.com/amunozdev/voiceorbs)（MIT，© Alexis Munoz）。
与 OpenLess 项目无从属关系，本项目按 MIT 分发，逐项来源见 `NOTICE.md`。
