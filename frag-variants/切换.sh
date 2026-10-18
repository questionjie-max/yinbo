#!/usr/bin/env bash
# 光球样式切换器：挑一个 frag 覆盖到运行时路径，约 2 秒生效（无需注销）。
# 仅列出发行物中已核实来源许可证的样式（VoiceOrbs, MIT）。
cd "$(dirname "$0")"
echo "可用样式："
i=1; for f in *.frag; do echo "  $i) ${f%.frag}"; i=$((i+1)); done
read -p "选择编号: " n
f=$(ls *.frag | sed -n "${n}p")
[ -z "$f" ] && echo "无效选择" && exit 1
mkdir -p ~/.cache/yinbo
cp "$f" ~/.cache/yinbo/capsule-shader.frag && echo "✓ 已切换为 ${f%.frag}（约 2 秒生效；删除该文件可回到内置样式）"
