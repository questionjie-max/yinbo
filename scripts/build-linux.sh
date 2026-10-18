#!/usr/bin/env bash
# 构建 yinbo 的 Linux 产物：fcitx5 注入插件（C++）→ 主程序 deb。
#
# 依赖（Debian/Ubuntu）：
#   build-essential cmake pkg-config libssl-dev libwebkit2gtk-4.1-dev libgtk-3-dev
#   libayatana-appindicator3-dev librsvg2-dev libxdo-dev
#   extra-cmake-modules libfcitx5core-dev libfcitx5utils-dev libfcitx5config-dev fcitx5-modules-dev
#   nodejs npm + rustup
#
# 内存提示：release 构建带 LTO，6-8G 内存的机器请保持 CARGO_BUILD_JOBS=2（默认已设）。
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PLUGIN="$ROOT/openless-all/scripts/linux-fcitx5-plugin"
APP="$ROOT/openless-all/app"
TAURI="$APP/src-tauri"
PKG_RES="$TAURI/linux-fcitx5-plugin"
JOBS="${CARGO_BUILD_JOBS:-2}"

echo "==> [1/3] 构建 fcitx5 插件（yinbo → libyinbo.so）"
cmake -S "$PLUGIN" -B "$PLUGIN/build" -DCMAKE_BUILD_TYPE=Release
cmake --build "$PLUGIN/build" -j"$(nproc)"
install -m 0644 "$PLUGIN/build/libyinbo.so" "$PKG_RES/libyinbo.so"
# 校验产物确实是我们这次的代码（无歧义标记：新日志串）
strings -a "$PKG_RES/libyinbo.so" | grep -q "bytes, program=" \
  && echo "    ✔ 插件含焦点 IC 路由标记(program=)" \
  || { echo "    ✘ 插件产物缺少预期标记，构建未生效"; exit 1; }

echo "==> [1b/3] 同步 GNOME 扩展（随 deb 打包进 /usr/share/gnome-shell/extensions）"
install -d "$TAURI/gnome-shell-extension"
cp -a "$ROOT/gnome-shell-extension/yinbo-capsule@yinbo" "$TAURI/gnome-shell-extension/"
glib-compile-schemas "$TAURI/gnome-shell-extension/yinbo-capsule@yinbo/schemas"

echo "==> [2/3] 前端依赖与构建"
(cd "$APP" && npm ci)

echo "==> [3/3] 构建 deb（含插件资源与依赖声明，CARGO_BUILD_JOBS=$JOBS）"
cd "$APP"
CARGO_BUILD_JOBS="$JOBS" npm run tauri build -- \
  --bundles deb \
  --config "$ROOT/packaging/tauri-linux-config.json"

echo "==> 完成。产物："
find "$APP/src-tauri/target/release/bundle/deb" -name '*.deb' -printf '    %p\n' 2>/dev/null
echo
echo "提示：胶囊扩展需单独安装（GNOME 49/50）："
echo "    cp -r \"$ROOT/gnome-shell-extension/yinbo-capsule@yinbo\" ~/.local/share/gnome-shell/extensions/"
echo "    gnome-extensions enable yinbo-capsule@yinbo   # 新 UUID 需重新登录一次"
