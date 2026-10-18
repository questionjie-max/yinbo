# 音波 · Yinbo v0.1.0

**Linux 语音输入，说话的时候看得见。** 首个公开版本。

按住热键说话，文字落在光标处；屏幕底部一颗光球随你的声音呼吸——
录音、思考、上屏，每个状态都看得见。

## 这个版本有什么

- **悬浮光球胶囊**：GNOME Wayland 下的实时视觉反馈（GNOME Shell 49/50）。
  上游 Linux 版没有胶囊，这是本项目最主要的新增。
- **合成器级全局热键**：默认 `Alt_R`（可改），由 GNOME Shell 扩展全局抓取，
  与焦点应用无关——不再出现"某些窗口里热键失效"。
- **fcitx5 注入修复**：`CommitText` 改为优先使用实时焦点输入上下文，
  修掉"说话在 A 窗口、文字落到 B 窗口"的错投。
- **电平动态**：噪声门 + 自适应基线 + 扩张 + 攻击/释放包络，静音时完全静止、说话时跟手。
- **客户端韧性**：ASR 会话代数守卫、录音首块削波丢弃、空转写回落为中性状态。
- **打包与依赖修正**：补上漏标的 `libxdo3`（上游包在干净系统首次启动会失败）；
  不再包含自动更新（不访问上游发布通道）。

## 来源与许可

- 应用主体改编自 **[OpenLess](https://github.com/Open-Less/openless) v1.3.18**（MIT）。
- 光球着色器移植自 **[VoiceOrbs](https://github.com/amunozdev/voiceorbs)**（MIT，© Alexis Munoz）。
- 与 OpenLess 项目无从属或背书关系；本项目由第三方独立维护，按 **MIT** 分发。
- 上游 2.0/beta 为 AGPL-3.0 且另起技术路线，**本项目不含其一字代码**。
- 逐项来源与署名见仓库内 `NOTICE.md`。

## 系统要求（请先确认，否则装了也用不了）

| 项目 | 要求 |
|---|---|
| 发行版 | **Ubuntu 26.04**（二进制基于 glibc 2.43 构建；旧发行版暂不支持） |
| 架构 | x86_64 |
| 输入法框架 | **fcitx5 必须是会话输入法**（GNOME 需 `im-config -n fcitx5` 后重新登录） |
| 桌面 | 胶囊光球需 **GNOME Shell 49/50**；其他桌面可听写但无光球 |
| ASR | 需自备凭据（如火山方舟"豆包流式语音识别"）；润色可选配 LLM 渠道 |

## 安装

```bash
sudo apt install ./Yinbo_0.1.0_amd64.deb     # 依赖自动包含 fcitx5 与 libxdo3
im-config -n fcitx5                          # GNOME 用户需要；KDE 通常已是
# 胶囊扩展随包安装到 /usr/share/gnome-shell/extensions/，启用它：
gnome-extensions enable yinbo-capsule@yinbo  # 首次启用需重新登录一次
```

> 若此前装过上游 OpenLess：启用本扩展前请先停用它的扩展并退出其进程，两者会争抢同一热键。

然后启动 Yinbo，在设置里填入你的 ASR 凭据，按右 Alt 说话。

## 已知限制（如实列出）

- 仅支持 Ubuntu 26.04 级系统（glibc 2.43）；降低基线的工作在后续版本。
- 只有 deb 包，无 rpm / Flatpak / AUR。
- 无自动更新：本版不检查也不下载更新。
- 胶囊仅 GNOME 49/50；KDE/XFCE 等桌面暂无实时视觉反馈。
- 上游 2.0 的功能（本地离线 ASR、云同步等）不在本项目内，也不在路线图上。

## 反馈

问题与建议请提到本仓库 Issues。请附上：发行版版本、桌面环境与版本、
`fcitx5 --version`、以及是否需要补充日志。
