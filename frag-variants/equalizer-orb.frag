// ===== Equalizer Orb —— 移植自 VoiceOrbs equalizer-orb (MIT, © Alexis Munoz)
// 圆盘内 7 根圆角竖条：包络中间高两端低，level 驱动振幅、时间驱动节奏
void main() {
    vec2 uv = cogl_tex_coord_in[0].xy;
    vec2 p = (uv - 0.5) * 2.0 * vec2(u_w / u_h, 1.0);
    float t = u_time;
    float vol = clamp(u_volume, 0.0, 1.0);

    float r = length(p);
    float disc = 1.0 - smoothstep(0.40, 0.46, r);

    // 深色圆盘底
    vec3 base = vec3(0.09, 0.09, 0.11) * disc * 0.92;

    // 7 根条：包络（中间 1.0 → 两端 0.55）+ 每根独立伪频段节奏
    vec3 barCol = mix(vec3(0.22, 0.74, 0.98), vec3(0.51, 0.55, 0.97),
                      0.5 + 0.5 * sin(t * 0.8));
    float acc = 0.0;
    for (int i = 0; i < 7; i++) {
        float fi = float(i) - 3.0;
        float gain = 1.0 - 0.45 * pow(abs(fi) / 3.0, 1.5);
        float x = fi * 0.115;
        float bw = 0.045;
        float band = 0.35 + 0.65 * (0.5 + 0.5 * sin(t * (2.1 + fi * 0.37) + fi * 1.7));
        float hNorm = 0.015 + gain * band * (0.20 + 0.80 * vol);
        float dx = abs(p.x - x);
        float bar = (1.0 - smoothstep(bw * 0.8, bw, dx)) *
                    (1.0 - smoothstep(hNorm * 0.85, hNorm, abs(p.y)));
        acc += bar;
    }

    vec3 outc = base + barCol * acc * 0.95;
    float alpha = clamp(max(max(outc.r, outc.g), outc.b), 0.0, 1.0);
    cogl_color_out = vec4(outc, alpha);
}
