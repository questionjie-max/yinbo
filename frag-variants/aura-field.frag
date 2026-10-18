// ===== Aura Field —— 移植自 VoiceOrbs (MIT License, © 2026 Alexis Munoz)
//      https://github.com/amunozdev/voiceorbs  ·  移植到 OpenLess 胶囊 uniform 契约
// 形态：三层噪声能量环（空心），说话时半径呼吸+亮度轻增；thinking 态收敛+扫光

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

void main() {
    vec2 uv = cogl_tex_coord_in[0].xy;
    vec2 p = (uv - 0.5) * 2.0 * vec2(u_w / u_h, 1.0);
    float t = u_time;
    float vol = clamp(u_volume, 0.0, 1.0);
    float pk = clamp(u_peak, 0.0, 1.0);

    // listening / thinking 两套形态参数（VoiceOrbs 状态表）
    float speed, scale, thick, warp, brightLo, brightHi, shimmer, sweepRate, desat;
    float hear = 1.0;
    if (u_busy > 0.5) {
        speed = 30.0; scale = 0.27; thick = 0.05; warp = 0.14;
        brightLo = 1.2; brightHi = 1.6; shimmer = 0.6; sweepRate = 2.8; desat = 0.0;
    } else {
        speed = 20.0; scale = 0.34; thick = 0.058; warp = 0.1 + 0.06 * vol;
        brightLo = 1.5; brightHi = 2.0; shimmer = 0.0; sweepRate = 0.8; desat = 0.0;
    }

    vec3 uFrom = vec3(0.204, 0.827, 0.6);   // #34d399
    vec3 uTo   = vec3(0.376, 0.647, 0.98);  // #60a5fa

    float radius = scale * (1.0 + 0.15 * vol + 0.06 * pk) * hear;
    float sweep = t * sweepRate;

    float edge = 1.0 - smoothstep(0.8, 1.0, length(p));
    if (edge <= 0.0) {
        cogl_color_out = vec4(0.0);
        return;
    }
    float a = atan(p.y, p.x);

    vec3 acc = vec3(0.0);
    for (int i = 0; i < 3; i++) {
        float fi = float(i);
        float ph = t * (1.0 + 0.35 * fi) + fi * 2.1;
        float amp1 = 0.6 + 0.8 * vnoise(vec2(ph * 0.35, fi * 7.3));
        float amp2 = 0.4 + 0.8 * vnoise(vec2(fi * 3.9, ph * 0.28 + 4.0));
        float n = 0.5 * amp1 * sin(3.0 * a + ph * 1.3)
          + 0.32 * amp2 * sin(5.0 * a - ph * 1.7 + fi * 2.0)
          + 0.22 * sin(2.0 * a + ph * 0.8 + fi);
        n *= 0.5;
        float rr = radius * (1.0 + n * warp * 2.2) + (fi - 1.0) * thick * 0.9;
        float d = abs(length(p) - rr);
        float w = thick * (0.8 + 0.6 * abs(n));
        float band = exp(-(d * d) / (w * w));
        float bloom = exp(-d / (w * 2.6));
        float hue = 0.5 + 0.5 * sin(a + t * 0.3 + fi * 1.4 + n * 3.0);
        vec3 c = mix(uFrom, uTo, smoothstep(0.1, 0.9, hue));
        float layer = i == 1 ? 1.0 : 0.55;
        acc += c * (band * 1.0 + bloom * 0.28) * layer;
        acc += mix(c, vec3(1.0), 0.45) * pow(band, 6.0) * 0.35 * layer;
    }

    float hollow = smoothstep(radius * 0.25, radius * 0.95, length(p));
    acc *= mix(0.1, 1.0, hollow);

    float sweepA = pow(0.5 + 0.5 * cos(a - sweep), 6.0);
    float sweepB = pow(0.5 + 0.5 * cos(a - sweep * 0.7 + 2.6), 10.0);
    acc *= 1.0 + shimmer * (sweepA * 1.5 + sweepB * 0.8);

    // 音量 → 亮度轻增（≤+33%，振幅才是主通道）
    acc *= brightLo + (brightHi - brightLo) * vol * 0.5 + 0.08 * pk;

    float lum = dot(acc, vec3(0.299, 0.587, 0.114));
    acc = mix(acc, vec3(lum), desat);

    float peakV = max(max(acc.r, acc.g), acc.b);
    vec3 hueKeep = acc * ((1.0 - exp(-peakV * 1.3)) / max(peakV, 1e-4));
    vec3 col = mix(hueKeep, 1.0 - exp(-acc * 1.3), 0.45);
    col *= edge;
    float alpha = clamp(max(max(col.r, col.g), col.b) * 1.25, 0.0, 1.0);
    cogl_color_out = vec4(col, alpha);
}
