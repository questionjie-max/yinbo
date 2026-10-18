//! 胶囊状态桥：把听写胶囊状态以 JSON 行形式广播给本机 GUI 客户端
//! （GNOME Shell 扩展 yinbo-capsule@yinbo）。
//!
//! 协议：Unix 流式 socket `~/.cache/yinbo/capsule-state.sock`，
//! 每行一个 JSON 对象 `{"state":"recording","level":0.42}`。
//! 多客户端广播；无客户端时写入静默丢弃；对端断开自动剔除。
//! 线程安全：emit_capsule 可能来自 cpal 音频回调线程，本模块只做
//! 非阻塞 send 到内部通道，accept/广播都在独立线程。

use std::io::Write;
use std::os::unix::net::UnixListener;
use std::path::PathBuf;
use std::sync::mpsc::{self, Sender};
use std::sync::OnceLock;

static BRIDGE: OnceLock<Sender<String>> = OnceLock::new();
/// 当前连接的 GUI 客户端数（由 bridge 线程维护）。宿主据此决定是否
/// 抑制 fcitx 辅助区文字——扩展已接管状态显示时避免双重指示。
static CLIENT_COUNT: std::sync::atomic::AtomicUsize = std::sync::atomic::AtomicUsize::new(0);

/// 是否有 GUI 客户端订阅状态桥。
pub fn has_clients() -> bool {
    CLIENT_COUNT.load(std::sync::atomic::Ordering::Relaxed) > 0
}

fn socket_path() -> PathBuf {
    let cache = std::env::var("XDG_CACHE_HOME")
        .ok()
        .filter(|v| !v.is_empty())
        .map(PathBuf::from)
        .or_else(|| {
            std::env::var("HOME")
                .ok()
                .filter(|v| !v.is_empty())
                .map(|h| PathBuf::from(h).join(".cache"))
        })
        .unwrap_or_else(|| PathBuf::from("/tmp"));
    cache.join("yinbo").join("capsule-state.sock")
}

/// 广播一帧胶囊状态。state 用小写短名（idle/recording/transcribing/polishing/
/// done/cancelled/error），level 为 0.0–1.0 音量电平。任何失败都静默忽略——
/// 状态桥是纯增值功能，绝不能影响听写主链路。
fn sender() -> &'static Sender<String> {
    BRIDGE.get_or_init(|| {
        let (tx, rx) = mpsc::channel::<String>();
        let spawned = std::thread::Builder::new()
            .name("capsule-bridge".into())
            .spawn(move || bridge_thread(rx));
        if let Err(e) = spawned {
            log::warn!("[capsule-bridge] spawn thread failed: {e}");
        }
        tx
    })
}

/// 应用启动时预绑定状态桥：桥原本是「首次发送时才 spawn 线程并 bind」，于是应用刚启动后的
/// 第一段听写必然没有客户端（扩展要等下一次 2s 重连才连得上），应用会先发 fcitx 辅助区
/// 兜底文字、约 1 秒后才切成光球。启动即绑定后，扩展在用户按热键前就已连接。
pub fn capsule_bridge_init() {
    let _ = sender();
}

pub fn capsule_bridge_send(state: &str, level: f32) {
    // std mpsc 无界通道，send 不会阻塞音频线程；接收端死亡则静默丢弃
    let _ = sender().send(format!("{{\"state\":\"{state}\",\"level\":{level:.3}}}\n"));
}

fn bridge_thread(rx: mpsc::Receiver<String>) {
    let path = socket_path();
    if let Some(dir) = path.parent() {
        let _ = std::fs::create_dir_all(dir);
    }
    let _ = std::fs::remove_file(&path);
    let listener = match UnixListener::bind(&path) {
        Ok(l) => l,
        Err(e) => {
            log::warn!("[capsule-bridge] bind {:?} failed: {e}", path);
            return;
        }
    };
    if let Err(e) = listener.set_nonblocking(true) {
        log::warn!("[capsule-bridge] set_nonblocking failed: {e}");
    }
    log::info!("[capsule-bridge] listening at {:?}", path);

    let mut clients: Vec<std::os::unix::net::UnixStream> = Vec::new();
    loop {
        match listener.accept() {
            Ok((stream, _)) => {
                let _ = stream.set_nonblocking(true);
                log::info!("[capsule-bridge] client connected");
                clients.push(stream);
                CLIENT_COUNT.store(clients.len(), std::sync::atomic::Ordering::Relaxed);
            }
            Err(e) if e.kind() == std::io::ErrorKind::WouldBlock => {}
            Err(e) => log::warn!("[capsule-bridge] accept: {e}"),
        }

        while let Ok(line) = rx.try_recv() {
            let data = line.as_bytes();
            clients.retain_mut(|client| {
                match client.write(data).and_then(|_| client.flush()) {
                    Ok(_) => true,
                    Err(e) if e.kind() == std::io::ErrorKind::WouldBlock => true,
                    Err(_) => false,
                }
            });
        }
        // 写失败被剔除的客户端在这里反映为计数下降
        CLIENT_COUNT.store(clients.len(), std::sync::atomic::Ordering::Relaxed);

        std::thread::sleep(std::time::Duration::from_millis(16));
    }
}
