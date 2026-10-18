// ===== Siri Sheet —— 移植自 VoiceOrbs (MIT License, © 2026 Alexis Munoz)
//      https://github.com/amunozdev/voiceorbs  ·  移植到 OpenLess 胶囊 uniform 契约
// 预设：listening（u_busy=0）/ thinking（u_busy=1，收敛暗态）

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}

float fbm(vec2 p) {
  float s = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    s += a * vnoise(p);
    p = mat2(0.8, 0.6, -0.6, 0.8) * p * 2.03;
    a *= 0.5;
  }
  return s / 0.9375;
}

vec2 band(vec2 q2, float drift, float offset, float amp, float mainY, float env, float soft) {
  float y = amp * env * sin(q2.x * 1.0 + drift + offset);
  float d = abs(q2.y - y);
  float line = 0.018 / (sqrt(d * d + soft * soft) + 0.026);
  float bd = max(0.0, max(q2.y - max(mainY, y), min(mainY, y) - q2.y));
  float fillB = 0.014 / (bd * bd * 5.0 + 0.06);
  return vec2(line, fillB);
}

vec3 sheet(vec2 p2, float t, float warp, float ridge, float sharp, float zoom) {
  float scale = 0.74 + zoom * 0.34;
  vec2 q2 = p2 / scale;
  vec2 w = vec2(fbm(q2 * 1.1 + vec2(0.0, t * 0.09)), fbm(q2 * 1.1 + vec2(7.7, -t * 0.07))) - 0.5;
  q2 += warp * 0.075 * w;
  float xn = q2.x;
  float envB = cos(1.57079633 * min(abs(0.9 * xn), 1.0));
  float env = envB * envB;
  float low = 0.5 + 0.5 * cos(t * 0.37);
  float mid = 0.5 + 0.5 * sin(t * 0.51 + 1.2);
  float high = 0.5 + 0.5 * cos(t * 0.73 + 2.1);
  float drift = t * 2.4;
  float mainAmp = 0.1 + ridge * 0.17 + low * 0.018;
  float bandAmp = mainAmp + mid * 0.025 + high * 0.018;
  float mainY = mainAmp * env * sin(q2.x * 1.1 + drift);
  float sep = 1.85 + warp * 0.12 + mid * 0.28;
  float soft = 0.03 / max(sharp, 0.2) + mid * 0.006;

  vec2 b0 = band(q2, drift, -sep, bandAmp, mainY, env, soft);
  vec2 b1 = band(q2, drift, -sep * 0.34, bandAmp, mainY, env, soft);
  vec2 b2 = band(q2, drift, sep * 0.34, bandAmp, mainY, env, soft);
  vec2 b3 = band(q2, drift, sep, bandAmp, mainY, env, soft);
  float total = b0.x + b1.x + b2.x + b3.x;
  float d0 = b0.x * b0.x;
  float d1 = b1.x * b1.x;
  float d2 = b2.x * b2.x;
  float d3 = b3.x * b3.x;
  vec3 uColA = vec3(0.5098, 0.9569, 1.0);
  vec3 uColB = vec3(0.5569, 0.4235, 1.0);
  vec3 uColC = vec3(0.5263, 1.0, 0.9298);
  vec3 uColD = vec3(0.7923, 0.5404, 1.0);
  vec3 uHi   = vec3(0.916, 0.9442, 1.0);
  vec3 spectral = (uColA * d0 + uColC * d1 + uColB * d2 + uColD * d3) / max(d0 + d1 + d2 + d3, 0.0001);
  float energy = (1.0 - exp(-max(total - 0.12, 0.0) * 0.75)) * env;
  float md = abs(q2.y - mainY);
  float core = exp(-md * md / (0.0028 / max(sharp, 0.2))) * env;

  float haze = fbm(q2 * 1.6 + vec2(t * 0.05, -t * 0.03));
  vec3 atmos = mix(uColD, uColB, smoothstep(-0.7, 0.7, q2.y)) * (0.012 + 0.022 * haze);
  atmos += mix(uColA, uColC, haze) * 0.035 * exp(-q2.y * q2.y * 7.0) * haze;

  vec3 col = atmos + spectral * energy * 1.14;
  col += uHi * core * (0.2 + 0.1 * low);
  col = col / (1.0 + col * 0.18);
  col = mix(col, uHi, 0.06 * smoothstep(0.15, 1.15, dot(p2, vec2(-0.32, 0.78))));
  col *= 1.0 - 0.3 * smoothstep(-0.1, 1.2, dot(p2, vec2(0.45, -0.62)));
  return col;
}

float profileF(float t) {
  float d = clamp(t, 0.0, 1.0);
  return 1.0 - sqrt(max(1.0 - (1.0 - d) * (1.0 - d), 0.0));
}

float lobe(vec2 n, vec2 dir, float cut, float power) {
  return pow(clamp((dot(n, dir) - cut) / max(1.0 - cut, 0.001), 0.0, 1.0), power);
}

vec3 over(vec3 dst, vec3 src, float a) {
  float k = clamp(a, 0.0, 1.0);
  return src * k + dst * (1.0 - k);
}

void main() {
    vec2 uv = (cogl_tex_coord_in[0].xy - 0.5) * 2.0 * vec2(u_w / u_h, 1.0);
    float t = u_time;
    float uLevel = clamp(u_volume, 0.0, 1.0);

    // listening / thinking 两套形态参数（VoiceOrbs 状态表）
    float hear, warp, ridge, sharp, zoom, expo, glowAmt, rim;
    if (u_busy > 0.5) {
        hear = 0.0; warp = 3.2;  ridge = 1.0; sharp = 2.2; zoom = 1.0;
        expo = 1.9;  glowAmt = 0.126; rim = 0.8;
    } else {
        hear = 1.0; warp = 2.11 + 0.85 * uLevel; ridge = 0.7 + 0.6 * uLevel;
        sharp = 2.2; zoom = 1.0; expo = 1.98 * (1.0 + 0.12 * uLevel);
        glowAmt = 0.135; rim = 0.85;
    }
    float uFade = 1.0;
    const float RAD = 0.86;
    const float SOFT = 0.005;
    vec3 uGlowCol = vec3(0.5333, 0.6902, 1.0);
    vec3 uCool = vec3(0.5833, 0.9633, 1.0);
    vec3 uWarm = vec3(0.8131, 0.5864, 1.0);
    vec3 uHi = vec3(0.916, 0.9442, 1.0);
    vec3 uColA = vec3(0.5098, 0.9569, 1.0);
    vec3 uColB = vec3(0.5569, 0.4235, 1.0);
    vec3 uColC = vec3(0.5263, 1.0, 0.9298);

    float r = length(uv);
    float ang = atan(uv.y, uv.x);

    float contour = hear * uLevel * (0.011 * sin(ang * 3.0 + t * 1.9) + 0.006 * sin(ang * 5.0 - t * 1.3 + 1.7));
    float rad = RAD * (1.0 + contour);
    vec3 glowCol = uGlowCol * (0.6 + 0.4 * hear * uLevel);
    float glowK = glowAmt * (1.0 + 0.9 * hear * uLevel);

    if (r > rad * (1.01 + SOFT)) {
        vec3 halo = glowCol * glowK * exp(-(r - rad) * 11.0) * (1.0 - smoothstep(rad, 0.995, r));
        halo = clamp(halo, 0.0, 1.0);
        cogl_color_out = vec4(halo, max(halo.r, max(halo.g, halo.b)));
        return;
    }

    vec2 p2 = uv / rad;
    float pd = length(p2);
    vec2 n = pd > 0.0001 ? p2 / pd : vec2(0.0);
    float edge = max(1.0 - pd, 0.0);
    float prof = pow(profileF(edge / 0.3), 0.68);
    vec2 rp = p2 - n * prof * 0.5;

    vec3 fcol;
    if (prof > 0.002) {
        float split = 0.12 * prof;
        fcol = vec3(sheet(rp - n * split, t, warp, ridge, sharp, zoom).r,
                    sheet(rp, t, warp, ridge, sharp, zoom).g,
                    sheet(rp + n * split, t, warp, ridge, sharp, zoom).b);
    } else {
        fcol = sheet(p2, t, warp, ridge, sharp, zoom);
    }

    float lum = dot(fcol, vec3(0.213, 0.715, 0.072));
    vec3 col = clamp(vec3(lum) + (fcol - vec3(lum)) * 1.18, 0.0, 1.0);

    float rimReact = rim * (1.0 + 0.45 * hear * uLevel);
    float surfW = 0.035 + 0.03 * hear * uLevel;
    float surf = 1.0 - smoothstep(0.0, surfW, edge);
    float optical = pow(surf, 1.8);
    col = over(col, mix(uColA, uHi, 0.5) * 0.35, optical * 0.1 * rimReact);

    float coolS = lobe(n, normalize(vec2(0.84, 0.54)), 0.05, 1.6);
    float warmS = lobe(n, normalize(vec2(-0.62, -0.78)), 0.05, 1.8);
    float disp = optical * 0.5 * rimReact;
    col = over(col, uCool, disp * coolS);
    col = over(col, uWarm, disp * warmS);

    col *= 1.0 - optical * 0.12 * (0.15 + 0.85 * max(dot(n, vec2(0.45, -0.89)), 0.0));

    float key = optical * lobe(n, normalize(vec2(-0.68, 0.73)), 0.2, 2.8) * 0.6 * rimReact;
    float fillL = optical * lobe(n, normalize(vec2(0.74, -0.67)), 0.4, 3.6) * 0.4 * rimReact;
    col = over(col, mix(uHi, vec3(1.0), 0.35), key);
    col = over(col, mix(uColC, uHi, 0.55), fillL);

    col *= 1.0 - 0.4 * smoothstep(0.95, 1.0, pd);
    col += mix(uColA, uColB, 0.3 + 0.3 * sin(ang + t * 0.6)) * optical * 0.3 * hear * uLevel;

    vec2 sp = p2 - vec2(-0.38, 0.46);
    float spec = exp(-dot(sp, sp) * 22.0);
    col += uHi * spec * 0.07 * rim;

    float ballA = 1.0 - smoothstep(0.99 - SOFT, 1.01 + SOFT, pd);
    col = clamp(col * max(expo, 0.0), 0.0, 1.0) * ballA;
    float outside = smoothstep(rad - SOFT, rad + SOFT, r);
    col += glowCol * glowK * exp(-max(r - rad, 0.0) * 11.0) * (1.0 - smoothstep(rad, 0.995, r)) * outside;
    col = clamp(col, 0.0, 1.0);
    float a = clamp(max(ballA, max(col.r, max(col.g, col.b))), 0.0, 1.0);
    cogl_color_out = vec4(col, a);
}
