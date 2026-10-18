// ===== Waveform Ring —— 移植自 VoiceOrbs waveform-ring (MIT, © Alexis Munoz)
// 极坐标波形环：合成谐波（官方回退式）+ 整流偏置；level 驱动振幅/线宽/中心辉光
void main() {
    vec2 uv = cogl_tex_coord_in[0].xy;
    vec2 p = (uv - 0.5) * 2.0 * vec2(u_w / u_h, 1.0);
    float t = u_time;
    float vol = clamp(u_volume, 0.0, 1.0);
    float pk = clamp(u_peak, 0.0, 1.0);

    float ang = atan(p.y, p.x);
    float r = length(p);

    // 合成波形（VoiceOrbs listening 回退式）+ 说话时高频细节档
    float shape = 0.62 * sin(6.0 * ang + 7.2 * t)
                + 0.38 * sin(11.0 * ang - 9.6 * t);
    shape = mix(shape, abs(shape), 0.85);              // 整流：只往外凸
    shape += (0.30 + 0.7 * vol) * 0.42 * sin(17.0 * ang + 4.4 * t);

    // 振幅主通道：level 驱动起伏，静音时收敛为纯净圆环
    float amp = 0.22 * (0.35 + 0.65 * vol) + 0.07 * pk;
    float R0 = 0.32;
    float rr = R0 * (1.0 + amp * shape + 0.05 * vol);

    // 双层描边：宽辉光 + 细主线（线宽随音量）
    float d = abs(r - rr);
    float lineWidth = 0.012 + 0.010 * vol;
    float core = exp(-(d * d) / (lineWidth * lineWidth));
    float glow = exp(-d / (lineWidth * 3.2)) * 0.6;

    // 颜色：沿角度蓝→紫→青流转
    vec3 cA = vec3(0.506, 0.549, 0.973);
    vec3 cB = vec3(0.655, 0.545, 0.980);
    vec3 cC = vec3(0.133, 0.827, 0.933);
    float cm = 0.5 + 0.5 * sin(ang * 2.0 + t * 0.7);
    vec3 col = mix(cA, cB, cm);
    col = mix(col, cC, 0.25 + 0.25 * vol);

    vec3 outc = col * (core * 1.1 + glow * 0.8);
    outc += col * exp(-r * r * 24.0) * (0.10 + 0.25 * vol);   // 中心辉光

    // 范围保险 + 输出
    float alpha = clamp(max(max(outc.r, outc.g), outc.b), 0.0, 1.0);
    alpha *= 1.0 - smoothstep(0.46, 0.52, r);
    cogl_color_out = vec4(outc, alpha);
}
