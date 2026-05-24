/* ── WebGL raycaster engine ────────────────────────────────────── *
 * GPU-accelerated DDA raycasting via fragment shader.             *
 * Replaces the software raycaster loop from engine.ts.             *
 * World data is uploaded as data textures; all 64×64 game         *
 * textures are packed into a single atlas.                        *
 * ────────────────────────────────────────────────────────────── */

import {
  W, Cell, TEX, Tex, MAX_DRAW, Feature, ContainerKind,
  type Entity, EntityType, ProjType, MonsterKind,
} from '../core/types';
import { World } from '../core/world';
import { getActiveSamosborVariant } from '../data/samosbor_variants';
import { entityUsesProceduralSprite, generateProceduralEntitySprite, proceduralEntitySpriteKey } from '../entities/procedural_visuals';
import type { TexData } from './textures';
import type { SpriteData } from './sprites';
import type { BloodParticle } from './blood';
import { containerSpr, featureSpr } from './sprite_index';
import { ENTITY_MASK_VISIBLE, getEntityIndex } from '../systems/entity_index';

export interface DynamicSkyTexture {
  readonly width: number;
  readonly height: number;
  readonly pixels: Uint32Array;
  readonly ambientTint?: { r: number; g: number; b: number };
  readonly fogTint?: { r: number; g: number; b: number };
  dirty: boolean;
}

/* ── Constants ─────────────────────────────────────────────────── */
export const SCR_W = 320;
export const SCR_H = 200;
const DEFAULT_FOV_RADIANS = Math.PI / 2;

/** Per-column depth buffer — unused (GPU depth test handles sprite clipping) */

/* ── Texture atlas layout ─────────────────────────────────────── *
 * All game textures (64×64 each) are packed into a single 2D     *
 * texture atlas. Layout: ATLAS_COLS textures per row.             */
const ATLAS_COLS = 8;             // 8 textures per row
const ATLAS_TEX_SIZE = TEX;       // 64px each texture
const PARTICLE_INSTANCE_CAP = 256;
const PROCEDURAL_SPRITE_CACHE_MAX = 384;
const PROCEDURAL_SPRITE_CACHE_TARGET = 288;
const VISIBLE_SPRITE_CAP = 1024;
const VISIBLE_ENTITY_QUERY_CAP = VISIBLE_SPRITE_CAP * 2;
const visibleEntityQuery: Entity[] = [];
const STATIC_OBJECT_RADIUS = MAX_DRAW;

/* ── GLSL Shaders ─────────────────────────────────────────────── */

const VERT_SRC = /* glsl */ `#version 300 es
precision highp float;
in vec2 aPos;
out vec2 vUV;
void main() {
  vUV = aPos * 0.5 + 0.5;        // 0..1
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

// The raycaster fragment shader — performs DDA per pixel column
const FRAG_SRC = /* glsl */ `#version 300 es
precision highp float;
precision highp int;

/* ── Uniforms ─────────────────────────────────────────────────── */
uniform vec2  uResolution;       // screen size (320, 200)
uniform vec2  uPos;              // player position
uniform float uAngle;            // player angle
uniform float uPitch;            // camera pitch (-1..1)
uniform float uFogDensity;
uniform float uGlitch;
uniform float uPlaneLen;
uniform float uCamHeight;        // 0..1 (0.5 = default)
uniform float uFlashlight;       // 0..1
uniform float uAmbient;          // floor ambient light
uniform float uTime;
uniform int   uPurpleFog;        // 1 if player is in fogged area
uniform vec3  uFogColor;         // active samosbor variant fog tint

/* ── Data textures ────────────────────────────────────────────── */
uniform highp usampler2D uCells;      // W×W: cell type (uint8)
uniform highp usampler2D uWallTex;    // W×W: wall texture id
uniform highp usampler2D uFloorTex;   // W×W: floor texture id
uniform highp usampler2D uFeatures;   // W×W: features
uniform sampler2D uLight;             // W×W: lightmap (float)
uniform highp usampler2D uFog;        // W×W: fog density
uniform highp usampler2D uDoorStates; // W×W: door states (0=open, 1=closed, 2=locked, 3=hopen, 4=hclosed)

/* ── Texture atlas ────────────────────────────────────────────── */
uniform sampler2D uAtlas;             // packed texture atlas
uniform vec2  uAtlasSize;             // atlas dimensions in pixels
uniform int   uUseDynamicSky;         // roof/open-air ceiling override
uniform sampler2D uDynamicSky;        // 1024×1024 dynamic sky/cloud texture
uniform vec3  uDynamicSkyTint;
uniform vec3  uBaseFogColor;

/* ── Surface marks overlay (blood, bullet holes, etc.) ────────── */
uniform sampler2D uSurfaceAtlas;      // 512×512 RGBA atlas of 16×16 cell overlays
uniform highp usampler2D uSurfaceIdx; // W×W: cell → atlas slot (0=none, 1+ = slot)

/* ── Depth output (for sprite clipping on CPU) ────────────────── */
// We write depth into a color attachment that gets read back
out vec4 fragColor;

const int W_SIZE = ${W};
const int MAX_STEPS = ${MAX_DRAW * 2};
const float MAX_DIST = ${MAX_DRAW.toFixed(1)};
const float TEX_F = ${TEX.toFixed(1)};
const int TEX_I = ${TEX};
const int ATLAS_COLS_I = ${ATLAS_COLS};
const float PI = 3.14159265;

/* ── Helpers ──────────────────────────────────────────────────── */
int wrapI(int v) {
  return ((v % W_SIZE) + W_SIZE) % W_SIZE;
}

vec2 wrapF(vec2 v) {
  return mod(mod(v, float(W_SIZE)) + float(W_SIZE), float(W_SIZE));
}

// Sample world data texture (W×W) — textures use NEAREST
uint sampleCell(ivec2 p) {
  ivec2 wp = ivec2(wrapI(p.x), wrapI(p.y));
  return texelFetch(uCells, wp, 0).r;
}

uint sampleWallTex(ivec2 p) {
  ivec2 wp = ivec2(wrapI(p.x), wrapI(p.y));
  return texelFetch(uWallTex, wp, 0).r;
}

uint sampleFloorTex(ivec2 p) {
  ivec2 wp = ivec2(wrapI(p.x), wrapI(p.y));
  return texelFetch(uFloorTex, wp, 0).r;
}

uint sampleFeature(ivec2 p) {
  ivec2 wp = ivec2(wrapI(p.x), wrapI(p.y));
  return texelFetch(uFeatures, wp, 0).r;
}

bool organicLightCell(ivec2 p) {
  ivec2 wp = ivec2(wrapI(p.x), wrapI(p.y));
  uint wallTex = texelFetch(uWallTex, wp, 0).r;
  uint floorTex = texelFetch(uFloorTex, wp, 0).r;
  return wallTex == ${Tex.MEAT}u || wallTex == ${Tex.GUT}u ||
         floorTex == ${Tex.F_MEAT}u || floorTex == ${Tex.F_GUT}u;
}

float organicLightPulse(ivec2 p) {
  if (!organicLightCell(p)) return 1.0;
  ivec2 wp = ivec2(wrapI(p.x), wrapI(p.y));
  float phase = float((wp.x * 13 + wp.y * 17) & 63) * 0.09817477;
  return 0.78 + 0.22 * (0.5 + 0.5 * sin(uTime * 0.72 + phase));
}

float sampleLight(ivec2 p) {
  ivec2 wp = ivec2(wrapI(p.x), wrapI(p.y));
  return texelFetch(uLight, wp, 0).r * organicLightPulse(wp);
}

uint sampleFog(ivec2 p) {
  ivec2 wp = ivec2(wrapI(p.x), wrapI(p.y));
  return texelFetch(uFog, wp, 0).r;
}

uint sampleDoor(ivec2 p) {
  ivec2 wp = ivec2(wrapI(p.x), wrapI(p.y));
  return texelFetch(uDoorStates, wp, 0).r;
}

// Sample from texture atlas by texture id and texel coordinates
vec4 sampleAtlas(uint texId, int tx, int ty) {
  int txi = int(texId);
  int atlasX = (txi % ATLAS_COLS_I) * TEX_I + (tx & (TEX_I - 1));
  int atlasY = (txi / ATLAS_COLS_I) * TEX_I + (ty & (TEX_I - 1));
  return texelFetch(uAtlas, ivec2(atlasX, atlasY), 0);
}

/* Surface overlay: blend mark on top of base color */
const int SURF_ATLAS_COLS = 32; // 32 slots per row in 512px atlas
vec3 blendSurface(vec3 base, ivec2 cell, int subX, int subY) {
  uint slot = texelFetch(uSurfaceIdx, cell, 0).r;
  if (slot == 0u) return base;
  int s = int(slot) - 1; // 0-based slot index
  int ax = (s % SURF_ATLAS_COLS) * 16 + (subX & 15);
  int ay = (s / SURF_ATLAS_COLS) * 16 + (subY & 15);
  vec4 m = texelFetch(uSurfaceAtlas, ivec2(ax, ay), 0);
  float a = m.a;
  if (a < 0.004) return base;
  return mix(base, m.rgb, a);
}

vec3 fogColor() {
  return uPurpleFog == 1 ? uFogColor
                         : uBaseFogColor;
}

vec3 applyFogV(vec3 c, float f) {
  vec3 fc = fogColor();
  return mix(c, fc, f);
}

vec3 applyCellFog(vec3 c, ivec2 p, float baseF) {
  vec3 outColor = applyFogV(c, baseF);
  float localFog = float(sampleFog(p)) / 255.0;
  if (localFog <= 0.02) return outColor;
  float phase = float((p.x * 11 + p.y * 7) & 63) * 0.0997331;
  float pulse = 0.82 + 0.18 * sin(uTime * 1.65 + phase);
  float f = clamp(localFog * 0.78 * pulse, 0.0, 0.88);
  return mix(outColor, uFogColor, f);
}

float flashlightBoost(float dist) {
  if (uFlashlight <= 0.0) return 0.0;
  float radius = 8.5;
  if (dist >= radius) return 0.0;
  float t = 1.0 - dist / radius;
  return uFlashlight * t * t * 0.95;
}

// Hash noise for hell eye overlay (matches pixutil.noise on CPU)
float noiseI(int x, int y, int s) {
  int n = x * 374761393 + y * 668265263 + s * 1274126177;
  n = (n ^ (n >> 13)) * 1103515245;
  n = n ^ (n >> 16);
  return float(n & 0x7fff) / 32767.0;
}

float clampSigned(float v, float lim) {
  return clamp(v, -lim, lim);
}

float toroidalDelta(float a, float b) {
  float d = b - a;
  if (d > float(W_SIZE) * 0.5) d -= float(W_SIZE);
  if (d < -float(W_SIZE) * 0.5) d += float(W_SIZE);
  return d;
}

vec3 applyHellEye(vec3 base, int texXi, int texYi, int cellX, int cellY) {
  float marker = noiseI(cellX, cellY, 901);
  if (marker < 0.84) return base;

  int eyeCount = marker > 0.97 ? 3 : (marker > 0.915 ? 2 : 1);
  float blinkSpeed = 0.25 + noiseI(cellX, cellY, 902) * 0.9;
  float cycle = fract(uTime * blinkSpeed + noiseI(cellX, cellY, 903) * 5.0);
  float eyelid = cycle < 0.16 ? max(0.04, abs(cycle - 0.08) / 0.08) : 1.0;
  float toPlayerX = toroidalDelta(float(cellX) + 0.5, uPos.x);
  float toPlayerY = toroidalDelta(float(cellY) + 0.5, uPos.y);
  float playerDist = sqrt(toPlayerX * toPlayerX + toPlayerY * toPlayerY);
  float track = playerDist < 7.5 ? (1.0 - playerDist / 7.5) : 0.0;

  float tx = float(texXi);
  float ty = float(texYi);
  vec3 color = base;

  for (int ei = 0; ei < 3; ei++) {
    if (ei >= eyeCount) break;
    float ox = 12.0 + noiseI(cellX + ei * 17, cellY, 904) * 40.0;
    float oy = 14.0 + noiseI(cellX, cellY + ei * 23, 905) * 36.0;
    float rx = 6.0 + noiseI(cellX + ei * 31, cellY, 906) * 7.0;
    float ry = max(1.2, rx * (0.12 + eyelid * 0.42));
    float dx = tx - ox;
    float dy = ty - oy;
    float norm = (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry);
    if (norm > 1.0) continue;

    // Sclera
    color = mix(color, vec3(230.0/255.0, 216.0/255.0, 182.0/255.0), 0.78);

    float idleShiftX = (noiseI(cellX, cellY, 907 + ei) - 0.5) * 1.4;
    float idleShiftY = (noiseI(cellX, cellY, 909 + ei) - 0.5) * 1.1;
    float irisShiftX = idleShiftX + clampSigned(toPlayerX * 0.55 * track, rx * 0.24);
    float irisShiftY = idleShiftY + clampSigned(toPlayerY * 0.55 * track, ry * 0.28);
    float irisR = rx * 0.42;
    float pupilR = rx * 0.18;
    float ix = tx - (ox + irisShiftX);
    float iy = ty - (oy + irisShiftY);
    float irisNorm = (ix * ix + iy * iy) / (irisR * irisR);
    if (irisNorm < 1.0 && eyelid > 0.18) {
      color = mix(color, vec3(186.0/255.0, 46.0/255.0, 28.0/255.0), 0.82);
    }
    float pupilNorm = (ix * ix + iy * iy) / (pupilR * pupilR);
    if (pupilNorm < 1.0 && eyelid > 0.22) {
      color = mix(color, vec3(18.0/255.0, 8.0/255.0, 6.0/255.0), 0.92);
    }
    float glintDx = tx - (ox - rx * 0.18);
    float glintDy = ty - (oy - ry * 0.22);
    float glint = glintDx * glintDx + glintDy * glintDy;
    if (glint < 3.5 && eyelid > 0.35) {
      color = mix(color, vec3(1.0, 248.0/255.0, 238.0/255.0), 0.85);
    }
  }
  return color;
}

vec3 applyHellLamp(vec3 base, int texXi, int texYi, int cellX, int cellY, float dist) {
  float tx = (float(texXi) - 31.5) / 32.0;
  float ty = (float(texYi) - 31.5) / 32.0;
  float r = sqrt(tx * tx + ty * ty);
  float a = atan(ty, tx);
  float seed = noiseI(cellX, cellY, 941);
  float breathe = 0.5 + 0.5 * sin(uTime * 0.72 + seed * 6.2831853);
  float aperture = 0.16 + breathe * 0.075;
  float fold = sin(a * 9.0 + seed * 11.0 + uTime * 0.26) * 0.026 +
               sin(a * 17.0 - seed * 7.0) * 0.012;
  float edge = aperture + fold;
  float hole = 1.0 - smoothstep(edge * 0.72, edge, r);
  float rim = 1.0 - smoothstep(0.018, 0.074, abs(r - edge));
  float flesh = 1.0 - smoothstep(0.31, 0.66, r);
  float wet = noiseI(cellX + texXi, cellY + texYi, 947) * 0.18;
  vec3 meat = vec3(95.0/255.0 + wet, 23.0/255.0 + wet * 0.35, 18.0/255.0 + wet * 0.22);
  vec3 ring = vec3(154.0/255.0 + wet, 42.0/255.0 + wet * 0.4, 25.0/255.0 + wet * 0.25);
  vec3 light = vec3(1.0, 172.0/255.0, 42.0/255.0);
  float distGlow = max(0.0, 1.0 - dist * 0.14);
  vec3 color = mix(base, meat, flesh * 0.82);
  color = mix(color, ring, rim * 0.78);
  color += light * distGlow * (hole * 1.25 + rim * 0.34);
  return min(color, vec3(1.0));
}

/* ── Main fragment shader ─────────────────────────────────────── */
void main() {
  vec2 fragCoord = gl_FragCoord.xy;
  // Flip Y: WebGL has origin at bottom-left, our screen has origin at top-left
  float col = fragCoord.x;
  float row = uResolution.y - 1.0 - fragCoord.y;
  float pixelDepth = 1.0; // per-pixel depth for gl_FragDepth (0=near, 1=far)

  float horizonShift = floor(uPitch * uResolution.y);
  float HALF_H = floor(uResolution.y * 0.5) + horizonShift;

  float dirX = cos(uAngle);
  float dirY = sin(uAngle);
  float planeLen = uPlaneLen;
  float planeX = -dirY * planeLen;
  float planeY =  dirX * planeLen;

  float camX = 2.0 * col / uResolution.x - 1.0;
  float rayDX = dirX + planeX * camX;
  float rayDY = dirY + planeY * camX;

  int mapX = int(floor(uPos.x));
  int mapY = int(floor(uPos.y));
  float ddx = abs(1.0 / rayDX);
  float ddy = abs(1.0 / rayDY);
  int stepX = rayDX < 0.0 ? -1 : 1;
  int stepY = rayDY < 0.0 ? -1 : 1;
  float sdx = rayDX < 0.0 ? (uPos.x - float(mapX)) * ddx : (float(mapX) + 1.0 - uPos.x) * ddx;
  float sdy = rayDY < 0.0 ? (uPos.y - float(mapY)) * ddy : (float(mapY) + 1.0 - uPos.y) * ddy;

  int side = 0;
  bool hit = false;
  float dist = MAX_DIST;
  uint wallTexId = 0u;

  /* ── DDA loop ───────────────────────────────────────────── */
  for (int step = 0; step < MAX_STEPS; step++) {
    if (sdx < sdy) { sdx += ddx; mapX += stepX; side = 0; }
    else            { sdy += ddy; mapY += stepY; side = 1; }

    float stepDist = side == 0 ? sdx - ddx : sdy - ddy;
    if (stepDist > MAX_DIST) break;

    ivec2 wp = ivec2(wrapI(mapX), wrapI(mapY));
    uint cell = texelFetch(uCells, wp, 0).r;

    if (cell == ${Cell.WALL}u) {
      dist = stepDist;
      wallTexId = texelFetch(uWallTex, wp, 0).r;
      if (wallTexId == 0u) wallTexId = ${Tex.CONCRETE}u;
      hit = true;
      break;
    }
    if (cell == ${Cell.LIFT}u) {
      dist = stepDist;
      wallTexId = ${Tex.LIFT_DOOR}u;
      hit = true;
      break;
    }
    if (cell == ${Cell.ABYSS}u) {
      dist = stepDist;
      wallTexId = ${Tex.DARK}u;
      hit = true;
      break;
    }
    if (cell == ${Cell.DOOR}u) {
      uint doorState = texelFetch(uDoorStates, wp, 0).r;
      // 0=OPEN, 3=HERMETIC_OPEN — these are passable
      if (doorState != 0u && doorState != 3u) {
        dist = stepDist;
        wallTexId = doorState == 2u ? ${Tex.DOOR_METAL}u : ${Tex.DOOR_WOOD}u;
        hit = true;
        break;
      }
    }
  }

  if (!hit) dist = MAX_DIST;
  if (dist < 0.001) dist = 0.001;

  float lineH = uResolution.y / dist;
  float drawStart = max(0.0, HALF_H - lineH * (1.0 - uCamHeight));
  float drawEnd   = min(uResolution.y - 1.0, HALF_H + lineH * uCamHeight);

  // Texture X coordinate
  float wallHitX;
  if (side == 0) wallHitX = uPos.y + dist * rayDY;
  else           wallHitX = uPos.x + dist * rayDX;
  wallHitX -= floor(wallHitX);
  int texXi = int(floor(wallHitX * TEX_F)) & (TEX_I - 1);
  if (side == 0 && rayDX < 0.0) texXi = TEX_I - 1 - texXi;
  if (side == 1 && rayDY > 0.0) texXi = TEX_I - 1 - texXi;

  float fogF = min(1.0, dist * uFogDensity);

  vec3 pixel = fogColor(); // default = fog
  if (hit && row >= drawStart && row <= drawEnd) {
      // ── Wall ──
      ivec2 hitCell = ivec2(wrapI(mapX), wrapI(mapY));
      float cellLit = min(1.0, uAmbient + sampleLight(hitCell) * (1.0 - uAmbient) + flashlightBoost(dist));
      float d = row - (HALF_H - lineH * (1.0 - uCamHeight));
      int texYi = int(floor(d / lineH * TEX_F)) & (TEX_I - 1);
      vec3 c = sampleAtlas(wallTexId, texXi, texYi).rgb;
      if (texelFetch(uCells, hitCell, 0).r == ${Cell.ABYSS}u) {
        float glitch = noiseI(hitCell.x + texYi, hitCell.y + texXi, int(floor(uTime * 18.0)) + 1337);
        float scan = step(0.72, fract((float(texYi) + uTime * 38.0) * 0.19 + glitch));
        vec3 dark = vec3(3.0/255.0, 5.0/255.0, 8.0/255.0);
        vec3 cut = vec3(30.0/255.0, 8.0/255.0, 46.0/255.0);
        c = mix(dark, cut, scan * (0.35 + glitch * 0.45));
      }
      // Surface overlay (blood, bullet holes)
      c = blendSurface(c, hitCell, texXi >> 2, texYi >> 2);
      // Hell eye overlay on organic walls
      if (wallTexId == ${Tex.MEAT}u || wallTexId == ${Tex.GUT}u) {
        c = applyHellEye(c, texXi, texYi, hitCell.x, hitCell.y);
      }
      if (side == 1) c *= 0.7;
      c *= cellLit;
      pixel = applyCellFog(c, hitCell, fogF);
      pixelDepth = min(1.0, dist / MAX_DIST);
  } else if (row > (hit ? drawEnd : HALF_H)) {
      // ── Floor ──
      float rowDist = row - HALF_H;
      if (rowDist > 0.0) {
        float currentDist = (uResolution.y * uCamHeight) / rowDist;
        if (currentDist <= MAX_DIST) {
          float floorX = uPos.x + rayDX * currentDist;
          float floorY = uPos.y + rayDY * currentDist;

          ivec2 fCell = ivec2(wrapI(int(floor(floorX))), wrapI(int(floor(floorY))));
          int ftx = int(floor(floorX * TEX_F)) & (TEX_I - 1);
          int fty = int(floor(floorY * TEX_F)) & (TEX_I - 1);
          float ff = min(1.0, currentDist * uFogDensity);
          float fLit = min(1.0, uAmbient + sampleLight(fCell) * (1.0 - uAmbient) + flashlightBoost(currentDist));

          uint fCellType = texelFetch(uCells, fCell, 0).r;
          if (fCellType == ${Cell.ABYSS}u) {
            vec3 fc = sampleAtlas(${Tex.F_ABYSS}u, ftx, fty).rgb;
            float scan = step(0.78, fract((float(fty) + uTime * 26.0) * 0.23));
            fc = mix(fc * 0.35, vec3(22.0/255.0, 6.0/255.0, 34.0/255.0), scan * 0.45);
            pixel = applyCellFog(fc, fCell, ff);
            pixelDepth = min(1.0, currentDist / MAX_DIST);
          } else {
            uint floorTexId = fCellType == ${Cell.WATER}u
              ? ${Tex.F_WATER}u
              : texelFetch(uFloorTex, fCell, 0).r;
            if (floorTexId == 0u) floorTexId = ${Tex.F_CONCRETE}u;
            vec3 fc = sampleAtlas(floorTexId, ftx, fty).rgb;
            // Surface overlay (blood, urine, etc.)
            fc = blendSurface(fc, fCell, ftx >> 2, fty >> 2);
            fc *= fLit;
            pixel = applyCellFog(fc, fCell, ff);
            pixelDepth = min(1.0, currentDist / MAX_DIST);
          }
        }
      }
  } else if (row < (hit ? drawStart : HALF_H)) {
      // ── Ceiling ──
      float rowDist = HALF_H - row;
      if (rowDist > 0.0) {
        float currentDist = (uResolution.y * (1.0 - uCamHeight)) / rowDist;
        if (currentDist <= MAX_DIST) {
          float floorX = uPos.x + rayDX * currentDist;
          float floorY = uPos.y + rayDY * currentDist;

          ivec2 cCell = ivec2(wrapI(int(floor(floorX))), wrapI(int(floor(floorY))));
          int ftx = int(floor(floorX * TEX_F)) & (TEX_I - 1);
          int fty = int(floor(floorY * TEX_F)) & (TEX_I - 1);
          float ff = min(1.0, currentDist * uFogDensity);
          float cLit = min(1.0, uAmbient + sampleLight(cCell) * (1.0 - uAmbient) + flashlightBoost(currentDist));

          uint cCellType = texelFetch(uCells, cCell, 0).r;
          if (cCellType == ${Cell.ABYSS}u) {
            vec3 cc = sampleAtlas(${Tex.DARK}u, ftx, fty).rgb * 0.22;
            float scan = step(0.8, fract((float(ftx) + uTime * 21.0) * 0.21));
            cc = mix(cc, vec3(18.0/255.0, 5.0/255.0, 28.0/255.0), scan * 0.42);
            pixel = applyCellFog(cc, cCell, ff);
            pixelDepth = min(1.0, currentDist / MAX_DIST);
          } else {
            uint feat = texelFetch(uFeatures, cCell, 0).r;
            if (feat == ${Feature.LAMP}u) {
              float glow = max(0.0, 1.0 - currentDist * 0.15);
              if (organicLightCell(cCell)) {
                vec3 cc = sampleAtlas(${Tex.CEIL}u, ftx, fty).rgb * (0.25 + cLit * 0.35);
                pixel = applyCellFog(applyHellLamp(cc, ftx, fty, cCell.x, cCell.y, currentDist), cCell, ff);
              } else {
                pixel = applyCellFog(vec3(220.0/255.0 * glow, 180.0/255.0 * glow, 80.0/255.0 * glow), cCell, ff);
              }
              pixelDepth = min(1.0, currentDist / MAX_DIST);
            } else if (feat == ${Feature.CANDLE}u) {
              float glow = max(0.0, 1.0 - currentDist * 0.18);
              pixel = applyCellFog(vec3(240.0/255.0 * glow, 180.0/255.0 * glow, 50.0/255.0 * glow), cCell, ff);
              pixelDepth = min(1.0, currentDist / MAX_DIST);
            } else {
              vec3 cc;
              if (uUseDynamicSky == 1) {
                vec2 skyUv = wrapF(vec2(floorX, floorY)) / float(W_SIZE);
                cc = texture(uDynamicSky, skyUv).rgb * uDynamicSkyTint;
                cc *= 0.45 + cLit * 0.55;
              } else {
                cc = sampleAtlas(${Tex.CEIL}u, ftx, fty).rgb;
                cc *= cLit;
              }
              pixel = applyCellFog(cc, cCell, ff);
              pixelDepth = min(1.0, currentDist / MAX_DIST);
            }
          }
        }
      }
  }

  // Encode depth into alpha for CPU readback (sprite clipping)
  float normDist = dist / MAX_DIST;
  fragColor = vec4(pixel, normDist);
  gl_FragDepth = pixelDepth;
}
`;

/* ── Sprite vertex/fragment shaders ───────────────────────────── */
const SPRITE_VERT_SRC = /* glsl */ `#version 300 es
precision highp float;
in vec2 aPos;       // quad corner (-0.5..0.5)
in vec2 aTexCoord;  // 0..1

uniform vec2  uResolution;
uniform float uScreenX;     // sprite center X on screen
uniform float uSpriteW;     // sprite width in pixels
uniform float uSpriteH;     // sprite height in pixels
uniform float uStartY;      // top Y in pixels
uniform float uDepth;       // normalized depth for z-test

out vec2 vTexCoord;
out float vDepth;

void main() {
  float px = uScreenX + aPos.x * uSpriteW;
  float py = uStartY + (0.5 - aPos.y) * uSpriteH;

  // Convert to NDC: x: [0, res.x] → [-1, 1], y: [0, res.y] → [-1, 1] (flipped)
  float ndcX = (px / uResolution.x) * 2.0 - 1.0;
  float ndcY = 1.0 - (py / uResolution.y) * 2.0;

  gl_Position = vec4(ndcX, ndcY, 0.0, 1.0);
  vTexCoord = aTexCoord;
  vDepth = uDepth;
}
`;

const SPRITE_FRAG_SRC = /* glsl */ `#version 300 es
precision highp float;

in vec2 vTexCoord;
in float vDepth;
uniform sampler2D uSpriteTex;
uniform float uFogF;
uniform vec3  uFogColor;
uniform int   uIsProjectile;
uniform float uTime;
uniform float uSeed;

out vec4 fragColor;

/* ── procedural flame noise ── */
float fHash(float n) { return fract(sin(n) * 43758.5453123); }
float fNoise(vec2 p, float s) {
  vec2 ip = floor(p), fp = fract(p);
  fp = fp * fp * (3.0 - 2.0 * fp);
  float n = ip.x + ip.y * 157.0 + s * 113.0;
  return mix(mix(fHash(n), fHash(n+1.0), fp.x),
             mix(fHash(n+157.0), fHash(n+158.0), fp.x), fp.y);
}
float fFbm(vec2 p, float s) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += fNoise(p, s) * a; p *= 2.13; a *= 0.48; s += 137.0;
  }
  return v;
}

void main() {
  /* ── Procedural flame tongue (uIsProjectile == 2) ── */
  if (uIsProjectile == 2) {
    vec2 uv = vTexCoord - 0.5;

    // Quick circular discard to avoid wasting fragments on corners
    float rawR = length(uv);
    if (rawR > 0.48) discard;

    // Flame widens at base (uv.y<0), tapers at top (uv.y>0)
    float taper = 1.0 + uv.y * 0.8;
    float dist = length(uv * vec2(2.5 * taper, 1.6));

    // Animated noise scrolling upward — unique per projectile
    float t = uTime * 7.0;
    float sd = uSeed;
    vec2 nUV = uv * 6.0 + vec2(sin(sd * 7.13) * 10.0, -t);

    float n1 = fFbm(nUV, sd);
    float n2 = fFbm(nUV * 1.7 + 3.7, sd + 77.0);
    float n3 = fNoise(nUV * 4.5 + 1.3, sd + 200.0);

    // Core + noise − strong radial falloff
    float core = max(0.0, 1.0 - dist * 1.3);
    float flame = core * 1.2 + n1 * 0.45 + n2 * 0.25 - dist * 0.65;
    flame += n3 * 0.1;

    // Aggressive discard — anything dim gets tossed
    if (flame < 0.15) discard;

    // Temperature → color: hot white → yellow → orange → dark red
    float heat = clamp(flame * 1.5, 0.0, 1.0);
    vec3 col;
    if (heat > 0.75) {
      col = mix(vec3(1.0, 0.9, 0.4), vec3(1.0, 1.0, 0.9), (heat - 0.75) * 4.0);
    } else if (heat > 0.42) {
      col = mix(vec3(1.0, 0.45, 0.05), vec3(1.0, 0.9, 0.4), (heat - 0.42) / 0.33);
    } else {
      col = mix(vec3(0.6, 0.08, 0.0), vec3(1.0, 0.45, 0.05), heat / 0.42);
    }

    float alpha = smoothstep(0.15, 0.4, flame);
    float glow = 1.0 - uFogF * 0.15;  // flames punch through fog hard
    gl_FragDepth = vDepth;
    fragColor = vec4(col * alpha * glow * 2.2, 1.0);
    return;
  }

  vec4 c = texture(uSpriteTex, vec2(vTexCoord.x, 1.0 - vTexCoord.y));
  if (c.a < 0.5) discard;
  gl_FragDepth = vDepth;

  vec3 rgb = c.rgb;
  if (uIsProjectile == 1) {
    // Additive glow: boost brightness, resist fog heavily
    float glow = 1.0 - uFogF * 0.3;
    rgb *= glow * 1.5;
    // Pre-multiplied additive: write bright color with full alpha
    fragColor = vec4(rgb, 1.0);
  } else {
    rgb = mix(rgb, uFogColor, uFogF);
    fragColor = vec4(rgb, c.a);
  }
}
`;

/* ── Blit shader (render low-res FBO to screen) ───────────────── */
const BLIT_VERT_SRC = /* glsl */ `#version 300 es
precision highp float;
in vec2 aPos;
out vec2 vUV;
void main() {
  vUV = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

const BLIT_FRAG_SRC = /* glsl */ `#version 300 es
precision highp float;
in vec2 vUV;
uniform sampler2D uTex;
uniform float uGlitch;
uniform float uTime;
uniform float uSamosborActive; // 1.0 during samosbor
uniform int uSamosborStyle; // 3 = Veretar dry overexposure
out vec4 fragColor;

/* ── Noise helpers ────────────────────────────────────────────── */
float hash11(float p) {
  p = fract(p * 0.1031);
  p *= p + 33.33;
  p *= p + p;
  return fract(p);
}
float hash21(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

void main() {
  vec2 uv = vUV;
  float t = uTime;

  /* ── VHS tracking distortion (always-on, subtle) ────────────── */
  float slowWave = sin(uv.y * 2.7 + t * 0.5) * 0.0008;
  float fastWiggle = sin(uv.y * 23.0 + t * 3.1) * 0.0004;
  uv.x += slowWave + fastWiggle;

  /* ── Samosbor glitch: heavy horizontal shift ────────────────── */
  if (uGlitch > 0.0) {
    float scanline = floor(uv.y * 200.0);
    float h = fract(sin(scanline * 12.9898 + t * 43758.5453) * 43758.5453);
    if (h < uGlitch * 0.35) {
      uv.x += (h - 0.5) * uGlitch * 0.08;
    }
    // Block glitch: shift entire horizontal bands
    float blockY = floor(uv.y * 25.0);
    float blockH = hash21(vec2(blockY, floor(t * 4.0)));
    if (blockH > 1.0 - uGlitch * 0.12) {
      uv.x += (blockH - 0.5) * 0.05 * uGlitch;
      uv.y += (hash21(vec2(blockY + 100.0, floor(t * 6.0))) - 0.5) * 0.008 * uGlitch;
    }
  }

  /* ── Random sporadic glitch bars ────────────────────────────── */
  if (uGlitch > 0.02) {
    float barSeed = floor(t * 2.5);
    float barY = floor(uv.y * 200.0);
    float barH = hash21(vec2(barY * 0.37, barSeed));
    float threshold = 0.997 - uGlitch * 0.05;
    if (barH > threshold) {
      uv.x += (hash21(vec2(barY, t * 1.7)) - 0.5) * 0.025;
    }
  }

  /* ── Chromatic aberration + VHS color bleed (combined for fewer texture reads) ── */
  float caBase = 0.0008;
  float caGlitch = uGlitch * 0.004;
  float caPulse = sin(t * 1.3) * 0.0002;
  float ca = caBase + caGlitch + caPulse;
  vec2 caOff = vec2(ca, ca * 0.3);
  vec2 sampleUv = clamp(uv, vec2(0.001), vec2(0.999));
  vec4 cL = texture(uTex, clamp(sampleUv + caOff, vec2(0.001), vec2(0.999)));
  vec4 cC = texture(uTex, sampleUv);
  vec4 cR = texture(uTex, clamp(sampleUv - caOff, vec2(0.001), vec2(0.999)));
  vec3 color = vec3(cL.r, cC.g, cR.b);

  /* VHS color bleed: approximate horizontal chroma smear using same 3 samples */
  float bleedStr = 0.12 + uGlitch * 0.1;
  vec3 bleed = (cL.rgb + cC.rgb + cR.rgb) / 3.0;
  color = mix(color, bleed, bleedStr);

  /* ── Scanlines (subtle CRT) ─────────────────────────────────── */
  float scanY = gl_FragCoord.y;
  float scanPhase = mod(scanY, 3.0);
  float scanDark = 0.0;
  if (scanPhase < 1.0) scanDark = 0.06;
  else if (scanPhase < 2.0) scanDark = 0.02;
  scanDark += uGlitch * 0.04;
  color *= 1.0 - scanDark;

  /* ── Interlace jitter (odd/even frame shift) ────────────────── */
  float framePhase = mod(floor(t * 30.0), 2.0); // ~30fps flicker
  float interlace = mod(scanY + framePhase, 2.0) < 1.0 ? 0.97 : 1.0;
  color *= interlace;

  /* ── Film grain / sensor noise ──────────────────────────────── */
  float grain = hash21(vUV * 800.0 + fract(t * 11.3)) * 0.07 - 0.035;
  grain += (hash21(vUV * 400.0 + fract(t * 7.7 + 1.0)) - 0.5) * 0.02;
  color += grain;

  /* ── Procedural glitch bursts (rare pixel displacement) ─────── */
  if (uGlitch > 0.02) {
    // Spawn rare glitch events — each has a random position and short lifetime
    float glitchTick = floor(t * 1.8);
    for (int i = 0; i < 3; i++) {
      float seed = float(i) * 137.0 + glitchTick * 31.7;
      float chance = hash11(seed);
      if (chance > 0.65) continue; // ~35% chance each slot is active

      // Glitch band position & size
      float gy = hash11(seed + 1.0);                  // vertical pos 0..1
      float gx = hash11(seed + 2.0);                  // horizontal center 0..1
      float gw = 0.06 + hash11(seed + 3.0) * 0.18;    // width
      float gh = 0.004 + hash11(seed + 4.0) * 0.012;  // height (thin band)

      // Animate: slide quickly across in sub-frame
      float life = fract(t * 1.8);  // 0..1 within tick
      float slideDir = hash11(seed + 5.0) > 0.5 ? 1.0 : -1.0;
      float slideOff = slideDir * life * 0.3;
      gy = fract(gy + slideOff);

      float dy = abs(uv.y - gy);
      float dx = abs(uv.x - gx);
      if (dy < gh && dx < gw * 0.5) {
        // Inside glitch band — shift pixels
        float intensity = (1.0 - dy / gh) * (1.0 - dx / (gw * 0.5));
        intensity *= intensity;
        float shift = (hash11(seed + 6.0 + floor(uv.y * 200.0)) - 0.5) * 0.04 * intensity;
        vec2 displaced = clamp(uv + vec2(shift, (hash11(seed + 7.0) - 0.5) * 0.006 * intensity), vec2(0.001), vec2(0.999));
        vec3 glitchCol = texture(uTex, displaced).rgb;
        // Chromatic split in glitch region
        float csplit = 0.003 * intensity;
        glitchCol.r = texture(uTex, clamp(displaced + vec2(csplit, 0.0), vec2(0.001), vec2(0.999))).r;
        glitchCol.b = texture(uTex, clamp(displaced - vec2(csplit, 0.0), vec2(0.001), vec2(0.999))).b;
        color = mix(color, glitchCol, intensity * 0.85);
      }
    }
  }

  /* ── Subtle vignette ────────────────────────────────────────── */
  vec2 vc = uv - 0.5;
  float vig = 1.0 - dot(vc, vc) * 0.6;
  color *= vig;

  /* ── Phosphor glow tint (slight cyan-green shift like old CRT) ─ */
  color.g *= 1.02;
  color.b *= 0.98;

  /* ── Samosbor: variant-shaped post noise ────────────────────── */
  if (uSamosborActive > 0.5) {
    float noiseBurst = hash21(floor(vUV * 60.0 + t * 5.0)) * 0.06;
    if (uSamosborStyle == 3) {
      float luma = dot(color, vec3(0.299, 0.587, 0.114));
      color = mix(color, vec3(luma), 0.58);
      color = mix(color, vec3(0.96, 0.94, 0.84), 0.12);
      color += (hash21(vUV * 500.0 + floor(t * 9.0)) - 0.5) * 0.045;
      float whiteLine = hash21(vec2(floor(uv.y * 120.0), floor(t * 5.0)));
      if (whiteLine > 0.985) color += vec3(0.08, 0.075, 0.055);
    } else {
      color.r += noiseBurst * 0.5;
      color.b += noiseBurst;
      // Occasional white flash lines
      float flashLine = hash21(vec2(floor(uv.y * 100.0), floor(t * 8.0)));
      if (flashLine > 0.993) {
        color += 0.15;
      }
    }
  }

  fragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`;

/* ── Blood particle shaders (flat-color quads in screen space) ── */
const PARTICLE_VERT_SRC = /* glsl */ `#version 300 es
precision highp float;
in vec2 aPos;       // quad corner (-0.5..0.5)
in vec4 aParticle;  // screenX, screenY, size, depth
in vec4 aColor;
uniform vec2  uResolution;
out float vDepth;
out vec4 vColor;
void main() {
  float px = aParticle.x + aPos.x * aParticle.z;
  float py = aParticle.y + aPos.y * aParticle.z;
  float ndcX = (px / uResolution.x) * 2.0 - 1.0;
  float ndcY = 1.0 - (py / uResolution.y) * 2.0;
  gl_Position = vec4(ndcX, ndcY, 0.0, 1.0);
  vDepth = aParticle.w;
  vColor = aColor;
}
`;

const PARTICLE_FRAG_SRC = /* glsl */ `#version 300 es
precision highp float;
in float vDepth;
in vec4 vColor;
out vec4 fragColor;
void main() {
  gl_FragDepth = vDepth;
  fragColor = vColor;
}
`;

/* ── WebGL State ──────────────────────────────────────────────── */
interface GLState {
  gl: WebGL2RenderingContext;
  // Raycaster
  rayProgram: WebGLProgram;
  rayVAO: WebGLVertexArrayObject;
  rayFBO: WebGLFramebuffer;
  rayColorTex: WebGLTexture;
  rayDepthBuf: WebGLRenderbuffer;
  // Blit
  blitProgram: WebGLProgram;
  blitVAO: WebGLVertexArrayObject;
  // Particle rendering
  particleProgram: WebGLProgram;
  particleVAO: WebGLVertexArrayObject;
  particleInstanceBuffer: WebGLBuffer;
  particleColorBuffer: WebGLBuffer;
  particleInstanceData: Float32Array;
  particleColorData: Float32Array;
  particleUniforms: Record<string, WebGLUniformLocation | null>;
  // Data textures
  cellsTex: WebGLTexture;
  wallTexTex: WebGLTexture;
  floorTexTex: WebGLTexture;
  featuresTex: WebGLTexture;
  lightTex: WebGLTexture;
  fogTex: WebGLTexture;
  doorStatesTex: WebGLTexture;
  atlasTex: WebGLTexture;
  dynamicSkyTex: WebGLTexture;
  dynamicSkyW: number;
  dynamicSkyH: number;
  // Sprite rendering
  spriteProgram: WebGLProgram;
  spriteVAO: WebGLVertexArrayObject;
  spriteTextures: WebGLTexture[];   // individual sprite textures
  proceduralSpriteTextures: Map<number, ProceduralSpriteCacheEntry>;
  proceduralSpriteUseTick: number;
  // Surface marks
  surfaceAtlasTex: WebGLTexture;    // 512×512 RGBA atlas of 16×16 overlays
  surfaceIdxTex: WebGLTexture;      // W×W R16UI cell→slot mapping
  surfacePixels: Uint8Array;
  surfaceIndex: Uint16Array;
  surfaceVersion: number;
  surfaceCamTileX: number;
  surfaceCamTileY: number;
  cellVersion: number;
  wallTexVersion: number;
  floorTexVersion: number;
  featureVersion: number;
  fogVersion: number;
  doorStatesData: Uint8Array;
  // Uniforms cache
  rayUniforms: Record<string, WebGLUniformLocation | null>;
  blitUniforms: Record<string, WebGLUniformLocation | null>;
  spriteUniforms: Record<string, WebGLUniformLocation | null>;
}

interface ProceduralSpriteCacheEntry {
  texture: WebGLTexture;
  usedAt: number;
}

let glState: GLState | null = null;
let activeDynamicSky: DynamicSkyTexture | null = null;
const visibleEntities: (Entity | null)[] = [];
const visibleDx: number[] = [];
const visibleDy: number[] = [];
const visibleDist: number[] = [];
const visibleOrder: number[] = [];
const visibleSpriteIdx: number[] = [];
const visibleSpriteScale: number[] = [];
const visibleSpriteZ: number[] = [];
const visibleProjectile: number[] = [];
const visibleSeed: number[] = [];

/* ── Shader compilation helpers ───────────────────────────────── */
function compileShader(gl: WebGL2RenderingContext, type: number, src: string): WebGLShader {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader compile error: ${log}`);
  }
  return shader;
}

function linkProgram(gl: WebGL2RenderingContext, vs: WebGLShader, fs: WebGLShader): WebGLProgram {
  const prog = gl.createProgram()!;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(prog);
    gl.deleteProgram(prog);
    throw new Error(`Program link error: ${log}`);
  }
  return prog;
}

function createProgram(gl: WebGL2RenderingContext, vSrc: string, fSrc: string): WebGLProgram {
  const vs = compileShader(gl, gl.VERTEX_SHADER, vSrc);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fSrc);
  const prog = linkProgram(gl, vs, fs);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  return prog;
}

function getUniforms(gl: WebGL2RenderingContext, prog: WebGLProgram, names: string[]): Record<string, WebGLUniformLocation | null> {
  const u: Record<string, WebGLUniformLocation | null> = {};
  for (const n of names) u[n] = gl.getUniformLocation(prog, n);
  return u;
}

function planeLenForFov(fovRadians: number): number {
  const fov = Number.isFinite(fovRadians) ? fovRadians : DEFAULT_FOV_RADIANS;
  const clamped = Math.max(Math.PI / 3, Math.min((110 * Math.PI) / 180, fov));
  return Math.tan(clamped * 0.5);
}

/* ── Create fullscreen quad VAO ───────────────────────────────── */
function createQuadVAO(gl: WebGL2RenderingContext, prog: WebGLProgram): WebGLVertexArrayObject {
  const vao = gl.createVertexArray()!;
  gl.bindVertexArray(vao);
  const buf = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  // Two triangles covering [-1,1]
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1, -1,  1, -1,  -1, 1,
    -1,  1,  1, -1,   1, 1,
  ]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'aPos');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null);
  return vao;
}

/* ── Create data texture (R8UI or R32F) ───────────────────────── */
function createDataTexR8UI(gl: WebGL2RenderingContext, w: number, h: number, data: Uint8Array): WebGLTexture {
  const tex = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8UI, w, h, 0, gl.RED_INTEGER, gl.UNSIGNED_BYTE, data);
  return tex;
}

function createDataTexR32F(gl: WebGL2RenderingContext, w: number, h: number, data: Float32Array): WebGLTexture {
  const tex = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.R32F, w, h, 0, gl.RED, gl.FLOAT, data);
  return tex;
}

function bindTextureUnit(gl: WebGL2RenderingContext, tex: WebGLTexture, loc: WebGLUniformLocation | null, unit: number): void {
  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.uniform1i(loc, unit);
}

function createDynamicSkyTex(gl: WebGL2RenderingContext): WebGLTexture {
  const tex = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([9, 12, 20, 255]));
  return tex;
}

function uploadDynamicSkyTexture(): void {
  if (!glState) return;
  const { gl } = glState;
  gl.bindTexture(gl.TEXTURE_2D, glState.dynamicSkyTex);
  const sky = activeDynamicSky;
  if (!sky) {
    if (glState.dynamicSkyW !== 1 || glState.dynamicSkyH !== 1) {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([9, 12, 20, 255]));
      glState.dynamicSkyW = 1;
      glState.dynamicSkyH = 1;
    }
    return;
  }

  const pixels = new Uint8Array(sky.pixels.buffer, sky.pixels.byteOffset, sky.pixels.byteLength);
  if (glState.dynamicSkyW !== sky.width || glState.dynamicSkyH !== sky.height) {
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, sky.width, sky.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    glState.dynamicSkyW = sky.width;
    glState.dynamicSkyH = sky.height;
  } else {
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, sky.width, sky.height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
  }
  sky.dirty = false;
}

export function setDynamicSkyTexture(sky: DynamicSkyTexture | null): void {
  activeDynamicSky = sky;
  uploadDynamicSkyTexture();
}

/* ── Build texture atlas from TexData[] ───────────────────────── */
function buildAtlas(gl: WebGL2RenderingContext, textures: TexData[]): WebGLTexture {
  const count = textures.length;
  const rows = Math.ceil(count / ATLAS_COLS);
  const atlasW = ATLAS_COLS * ATLAS_TEX_SIZE;
  const atlasH = rows * ATLAS_TEX_SIZE;
  // TexData is Uint32Array in 0xAABBGGRR format — need to convert to RGBA8
  const pixels = new Uint8Array(atlasW * atlasH * 4);

  for (let i = 0; i < count; i++) {
    const td = textures[i];
    const ax = (i % ATLAS_COLS) * ATLAS_TEX_SIZE;
    const ay = Math.floor(i / ATLAS_COLS) * ATLAS_TEX_SIZE;
    for (let y = 0; y < ATLAS_TEX_SIZE; y++) {
      for (let x = 0; x < ATLAS_TEX_SIZE; x++) {
        const c = td[y * ATLAS_TEX_SIZE + x];
        const dstIdx = ((ay + y) * atlasW + (ax + x)) * 4;
        pixels[dstIdx + 0] = c & 0xFF;            // R
        pixels[dstIdx + 1] = (c >> 8) & 0xFF;     // G
        pixels[dstIdx + 2] = (c >> 16) & 0xFF;    // B
        pixels[dstIdx + 3] = 255;                  // A
      }
    }
  }

  const tex = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, atlasW, atlasH, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
  return tex;
}

function createSpriteTexture(gl: WebGL2RenderingContext, spr: SpriteData): WebGLTexture {
  const pixels = new Uint8Array(ATLAS_TEX_SIZE * ATLAS_TEX_SIZE * 4);
  for (let i = 0; i < ATLAS_TEX_SIZE * ATLAS_TEX_SIZE; i++) {
    const c = spr[i];
    pixels[i * 4 + 0] = c & 0xFF;
    pixels[i * 4 + 1] = (c >> 8) & 0xFF;
    pixels[i * 4 + 2] = (c >> 16) & 0xFF;
    pixels[i * 4 + 3] = (c >>> 24) & 0xFF;
  }
  const tex = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, ATLAS_TEX_SIZE, ATLAS_TEX_SIZE, 0,
    gl.RGBA, gl.UNSIGNED_BYTE, pixels);
  return tex;
}

/* ── Build individual sprite textures ─────────────────────────── */
function buildSpriteTextures(gl: WebGL2RenderingContext, sprites: SpriteData[]): WebGLTexture[] {
  const result: WebGLTexture[] = [];
  for (const spr of sprites) result.push(createSpriteTexture(gl, spr));
  return result;
}

function trimProceduralSpriteCache(): void {
  if (!glState || glState.proceduralSpriteTextures.size <= PROCEDURAL_SPRITE_CACHE_MAX) return;
  const { gl, proceduralSpriteTextures } = glState;
  while (proceduralSpriteTextures.size > PROCEDURAL_SPRITE_CACHE_TARGET) {
    let oldestKey = 0;
    let oldestUse = Number.MAX_SAFE_INTEGER;
    for (const [key, entry] of proceduralSpriteTextures) {
      if (entry.usedAt < oldestUse) {
        oldestUse = entry.usedAt;
        oldestKey = key;
      }
    }
    const oldest = proceduralSpriteTextures.get(oldestKey);
    if (!oldest) break;
    gl.deleteTexture(oldest.texture);
    proceduralSpriteTextures.delete(oldestKey);
  }
}

function proceduralEntityTexture(e: Entity): WebGLTexture | null {
  if (!glState || !entityUsesProceduralSprite(e)) return null;
  const key = proceduralEntitySpriteKey(e);
  const cached = glState.proceduralSpriteTextures.get(key);
  glState.proceduralSpriteUseTick++;
  if (cached) {
    cached.usedAt = glState.proceduralSpriteUseTick;
    return cached.texture;
  }
  const sprite = generateProceduralEntitySprite(e);
  if (!sprite) return null;
  const texture = createSpriteTexture(glState.gl, sprite);
  glState.proceduralSpriteTextures.set(key, { texture, usedAt: glState.proceduralSpriteUseTick });
  trimProceduralSpriteCache();
  return texture;
}

/* ── Build door state map from World ──────────────────────────── */
function rebuildDoorStates(world: World, out?: Uint8Array): Uint8Array {
  // Default: 0 = OPEN (passable). Cells without doors stay 0.
  const ds = out ?? new Uint8Array(W * W);
  ds.fill(0);
  for (const [ci, door] of world.doors) {
    ds[ci] = door.state;
  }
  return ds;
}

function syncDoorStates(world: World, out: Uint8Array): boolean {
  let dirty = false;
  for (const [ci, door] of world.doors) {
    const state = door.state;
    if (out[ci] !== state) {
      out[ci] = state;
      dirty = true;
    }
  }
  return dirty;
}

/* ── Surface marks atlas ─────────────────────────────────────── *
 * Pack surfaceMap entries into a 512×512 RGBA atlas (32×32 grid   *
 * of 16×16 tiles = max 1024 cells). Returns atlas pixels + index. */
const SURF_ATLAS_SIZE = 512;         // 512×512 total
const SURF_ATLAS_COLS = 32;          // 32 tiles per row
const SURF_MAX_SLOTS = SURF_ATLAS_COLS * SURF_ATLAS_COLS; // 1024

interface SurfaceUploadData {
  pixels: Uint8Array;
  index: Uint16Array;
}

function buildSurfaceData(world: World, camX: number, camY: number, out?: SurfaceUploadData): SurfaceUploadData {
  const pixels = out?.pixels ?? new Uint8Array(SURF_ATLAS_SIZE * SURF_ATLAS_SIZE * 4);
  const index = out?.index ?? new Uint16Array(W * W); // 0 = no mark
  pixels.fill(0);
  index.fill(0);

  // Sort cells by toroidal distance to camera — nearest 1024 get atlas slots
  const entries = Array.from(world.surfaceMap.entries());
  if (entries.length > SURF_MAX_SLOTS) {
    const camCX = Math.floor(camX), camCY = Math.floor(camY);
    entries.sort((a, b) => {
      const ax = a[0] % W, ay = (a[0] / W) | 0;
      const bx = b[0] % W, by = (b[0] / W) | 0;
      let dax = ax - camCX; if (dax > W / 2) dax -= W; else if (dax < -W / 2) dax += W;
      let day = ay - camCY; if (day > W / 2) day -= W; else if (day < -W / 2) day += W;
      let dbx = bx - camCX; if (dbx > W / 2) dbx -= W; else if (dbx < -W / 2) dbx += W;
      let dby = by - camCY; if (dby > W / 2) dby -= W; else if (dby < -W / 2) dby += W;
      return (dax * dax + day * day) - (dbx * dbx + dby * dby);
    });
  }

  let slot = 0;
  for (const [ci, cellData] of entries) {
    if (slot >= SURF_MAX_SLOTS) break;
    slot++; // 1-based slot numbers (0 = "no mark")
    index[ci] = slot;
    const s = slot - 1;
    const ax = (s % SURF_ATLAS_COLS) * 16;
    const ay = Math.floor(s / SURF_ATLAS_COLS) * 16;
    for (let py = 0; py < 16; py++) {
      for (let px = 0; px < 16; px++) {
        const si = (py * 16 + px) << 2;
        const di = ((ay + py) * SURF_ATLAS_SIZE + (ax + px)) * 4;
        pixels[di]     = cellData[si];
        pixels[di + 1] = cellData[si + 1];
        pixels[di + 2] = cellData[si + 2];
        pixels[di + 3] = cellData[si + 3];
      }
    }
  }
  return { pixels, index };
}

function createDataTexR16UI(gl: WebGL2RenderingContext, w: number, h: number, data: Uint16Array): WebGLTexture {
  const tex = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.R16UI, w, h, 0, gl.RED_INTEGER, gl.UNSIGNED_SHORT, data);
  return tex;
}

function createParticleVAO(
  gl: WebGL2RenderingContext,
  prog: WebGLProgram,
  capacity: number,
): {
  vao: WebGLVertexArrayObject;
  instanceBuffer: WebGLBuffer;
  colorBuffer: WebGLBuffer;
  instanceData: Float32Array;
  colorData: Float32Array;
} {
  const vao = gl.createVertexArray()!;
  gl.bindVertexArray(vao);

  const quadBuffer = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -0.5, -0.5,
     0.5, -0.5,
    -0.5,  0.5,
    -0.5,  0.5,
     0.5, -0.5,
     0.5,  0.5,
  ]), gl.STATIC_DRAW);
  const posLoc = gl.getAttribLocation(prog, 'aPos');
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

  const instanceData = new Float32Array(capacity * 4);
  const instanceBuffer = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, instanceBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, instanceData.byteLength, gl.DYNAMIC_DRAW);
  const particleLoc = gl.getAttribLocation(prog, 'aParticle');
  gl.enableVertexAttribArray(particleLoc);
  gl.vertexAttribPointer(particleLoc, 4, gl.FLOAT, false, 0, 0);
  gl.vertexAttribDivisor(particleLoc, 1);

  const colorData = new Float32Array(capacity * 4);
  const colorBuffer = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, colorData.byteLength, gl.DYNAMIC_DRAW);
  const colorLoc = gl.getAttribLocation(prog, 'aColor');
  gl.enableVertexAttribArray(colorLoc);
  gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 0, 0);
  gl.vertexAttribDivisor(colorLoc, 1);

  gl.bindVertexArray(null);
  return { vao, instanceBuffer, colorBuffer, instanceData, colorData };
}

/* ── Initialize WebGL ─────────────────────────────────────────── */
export function initWebGL(
  canvas: HTMLCanvasElement,
  textures: TexData[],
  sprites: SpriteData[],
  world: World,
): WebGL2RenderingContext {
  const gl = canvas.getContext('webgl2', {
    alpha: false,
    antialias: false,
    premultipliedAlpha: false,
    preserveDrawingBuffer: false,
  })!;
  if (!gl) throw new Error('WebGL2 not supported');

  // Enable float textures
  const floatExt = gl.getExtension('EXT_color_buffer_float');
  if (!floatExt) {
    // Fallback: we can still work without it, will use RGBA8 readback
    console.warn('EXT_color_buffer_float not available — depth readback via RGBA');
  }

  // ── Raycaster program ──
  const rayProgram = createProgram(gl, VERT_SRC, FRAG_SRC);
  const rayVAO = createQuadVAO(gl, rayProgram);
  const rayUniforms = getUniforms(gl, rayProgram, [
    'uResolution', 'uPos', 'uAngle', 'uPitch', 'uFogDensity',
    'uGlitch', 'uPlaneLen', 'uCamHeight', 'uFlashlight', 'uAmbient', 'uTime', 'uPurpleFog', 'uFogColor',
    'uCells', 'uWallTex', 'uFloorTex', 'uFeatures', 'uLight', 'uFog',
    'uDoorStates', 'uAtlas', 'uAtlasSize', 'uUseDynamicSky', 'uDynamicSky',
    'uDynamicSkyTint', 'uBaseFogColor', 'uSurfaceAtlas', 'uSurfaceIdx',
  ]);

  // ── Blit program ──
  const blitProgram = createProgram(gl, BLIT_VERT_SRC, BLIT_FRAG_SRC);
  const blitVAO = createQuadVAO(gl, blitProgram);
  const blitUniforms = getUniforms(gl, blitProgram, ['uTex', 'uGlitch', 'uTime', 'uSamosborActive', 'uSamosborStyle']);

  // ── Sprite program ──
  const spriteProgram = createProgram(gl, SPRITE_VERT_SRC, SPRITE_FRAG_SRC);
  const spriteVAO = createSpriteVAO(gl, spriteProgram);
  const spriteUniforms = getUniforms(gl, spriteProgram, [
    'uResolution', 'uScreenX', 'uSpriteW', 'uSpriteH', 'uStartY', 'uDepth',
    'uSpriteTex', 'uFogF', 'uFogColor', 'uIsProjectile', 'uTime', 'uSeed',
  ]);

  // ── Particle program ──
  const particleProgram = createProgram(gl, PARTICLE_VERT_SRC, PARTICLE_FRAG_SRC);
  const particleBuffers = createParticleVAO(gl, particleProgram, PARTICLE_INSTANCE_CAP);
  const particleUniforms = getUniforms(gl, particleProgram, ['uResolution']);

  // ── FBO for low-res raycaster output ──
  const rayColorTex = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, rayColorTex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, SCR_W, SCR_H, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

  const rayDepthBuf = gl.createRenderbuffer()!;
  gl.bindRenderbuffer(gl.RENDERBUFFER, rayDepthBuf);
  gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, SCR_W, SCR_H);

  const rayFBO = gl.createFramebuffer()!;
  gl.bindFramebuffer(gl.FRAMEBUFFER, rayFBO);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, rayColorTex, 0);
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, rayDepthBuf);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  // ── Data textures ──
  const cellsTex = createDataTexR8UI(gl, W, W, world.cells);
  const wallTexTex = createDataTexR8UI(gl, W, W, world.wallTex);
  const floorTexTex = createDataTexR8UI(gl, W, W, world.floorTex);
  const featuresTex = createDataTexR8UI(gl, W, W, world.features);
  const lightTex = createDataTexR32F(gl, W, W, world.light);
  const fogTex = createDataTexR8UI(gl, W, W, world.fog);
  const doorStatesData = rebuildDoorStates(world);
  const doorStatesTex = createDataTexR8UI(gl, W, W, doorStatesData);

  // ── Surface marks atlas & index ──
  const surfData = buildSurfaceData(world, 0, 0);
  const surfaceAtlasTex = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, surfaceAtlasTex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, SURF_ATLAS_SIZE, SURF_ATLAS_SIZE, 0,
    gl.RGBA, gl.UNSIGNED_BYTE, surfData.pixels);
  const surfaceIdxTex = createDataTexR16UI(gl, W, W, surfData.index);

  // ── Texture atlas ──
  const atlasTex = buildAtlas(gl, textures);
  const dynamicSkyTex = createDynamicSkyTex(gl);

  // ── Sprite textures ──
  const spriteTextures = buildSpriteTextures(gl, sprites);

  glState = {
    gl,
    rayProgram, rayVAO, rayFBO, rayColorTex, rayDepthBuf,
    blitProgram, blitVAO,
    particleProgram,
    particleVAO: particleBuffers.vao,
    particleInstanceBuffer: particleBuffers.instanceBuffer,
    particleColorBuffer: particleBuffers.colorBuffer,
    particleInstanceData: particleBuffers.instanceData,
    particleColorData: particleBuffers.colorData,
    particleUniforms,
    cellsTex, wallTexTex, floorTexTex, featuresTex, lightTex, fogTex,
    doorStatesTex, atlasTex,
    dynamicSkyTex,
    dynamicSkyW: 1,
    dynamicSkyH: 1,
    spriteProgram, spriteVAO, spriteTextures,
    proceduralSpriteTextures: new Map(),
    proceduralSpriteUseTick: 0,
    surfaceAtlasTex, surfaceIdxTex,
    surfacePixels: surfData.pixels,
    surfaceIndex: surfData.index,
    surfaceVersion: world.surfaceVersion,
    surfaceCamTileX: 0,
    surfaceCamTileY: 0,
    cellVersion: world.cellVersion,
    wallTexVersion: world.wallTexVersion,
    floorTexVersion: world.floorTexVersion,
    featureVersion: world.featureVersion,
    fogVersion: world.fogVersion,
    doorStatesData,
    rayUniforms, blitUniforms, spriteUniforms,
  };
  uploadDynamicSkyTexture();

  return gl;
}

/* ── Create sprite quad VAO ───────────────────────────────────── */
function createSpriteVAO(gl: WebGL2RenderingContext, prog: WebGLProgram): WebGLVertexArrayObject {
  const vao = gl.createVertexArray()!;
  gl.bindVertexArray(vao);
  const buf = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  // Quad: position + texcoord
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    // pos.x, pos.y, uv.x, uv.y
    -0.5, -0.5, 0, 0,
     0.5, -0.5, 1, 0,
    -0.5,  0.5, 0, 1,
    -0.5,  0.5, 0, 1,
     0.5, -0.5, 1, 0,
     0.5,  0.5, 1, 1,
  ]), gl.STATIC_DRAW);
  const posLoc = gl.getAttribLocation(prog, 'aPos');
  const texLoc = gl.getAttribLocation(prog, 'aTexCoord');
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 16, 0);
  if (texLoc >= 0) {
    gl.enableVertexAttribArray(texLoc);
    gl.vertexAttribPointer(texLoc, 2, gl.FLOAT, false, 16, 8);
  }
  gl.bindVertexArray(null);
  return vao;
}

/* ── Update world data textures (call after world changes) ────── */
export function updateWorldData(world: World): void {
  if (!glState) return;
  const { gl } = glState;

  gl.bindTexture(gl.TEXTURE_2D, glState.cellsTex);
  gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, W, W, gl.RED_INTEGER, gl.UNSIGNED_BYTE, world.cells);
  glState.cellVersion = world.cellVersion;

  gl.bindTexture(gl.TEXTURE_2D, glState.wallTexTex);
  gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, W, W, gl.RED_INTEGER, gl.UNSIGNED_BYTE, world.wallTex);
  glState.wallTexVersion = world.wallTexVersion;

  gl.bindTexture(gl.TEXTURE_2D, glState.floorTexTex);
  gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, W, W, gl.RED_INTEGER, gl.UNSIGNED_BYTE, world.floorTex);
  glState.floorTexVersion = world.floorTexVersion;

  gl.bindTexture(gl.TEXTURE_2D, glState.featuresTex);
  gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, W, W, gl.RED_INTEGER, gl.UNSIGNED_BYTE, world.features);
  glState.featureVersion = world.featureVersion;

  gl.bindTexture(gl.TEXTURE_2D, glState.lightTex);
  gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, W, W, gl.RED, gl.FLOAT, world.light);

  gl.bindTexture(gl.TEXTURE_2D, glState.fogTex);
  gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, W, W, gl.RED_INTEGER, gl.UNSIGNED_BYTE, world.fog);
  glState.fogVersion = world.fogVersion;

  gl.bindTexture(gl.TEXTURE_2D, glState.doorStatesTex);
  gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, W, W, gl.RED_INTEGER, gl.UNSIGNED_BYTE, rebuildDoorStates(world, glState.doorStatesData));

  glState.surfaceVersion = -1;
  glState.surfaceCamTileX = Number.NaN;
  glState.surfaceCamTileY = Number.NaN;

  // Also update dynamic data
  updateDynamicData(world);
}

/** Lightweight per-frame update: fog, door states, wallTex (for slides) */
export function updateDynamicData(world: World, camX = 0, camY = 0): void {
  if (!glState) return;
  const { gl } = glState;

  if (world.cellVersion !== glState.cellVersion) {
    gl.bindTexture(gl.TEXTURE_2D, glState.cellsTex);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, W, W, gl.RED_INTEGER, gl.UNSIGNED_BYTE, world.cells);
    gl.bindTexture(gl.TEXTURE_2D, glState.featuresTex);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, W, W, gl.RED_INTEGER, gl.UNSIGNED_BYTE, world.features);
    glState.cellVersion = world.cellVersion;
  }

  if (world.featureVersion !== glState.featureVersion) {
    gl.bindTexture(gl.TEXTURE_2D, glState.featuresTex);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, W, W, gl.RED_INTEGER, gl.UNSIGNED_BYTE, world.features);
    gl.bindTexture(gl.TEXTURE_2D, glState.lightTex);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, W, W, gl.RED, gl.FLOAT, world.light);
    glState.featureVersion = world.featureVersion;
  }

  if (world.wallTexVersion !== glState.wallTexVersion) {
    gl.bindTexture(gl.TEXTURE_2D, glState.wallTexTex);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, W, W, gl.RED_INTEGER, gl.UNSIGNED_BYTE, world.wallTex);
    glState.wallTexVersion = world.wallTexVersion;
  }

  if (world.floorTexVersion !== glState.floorTexVersion) {
    gl.bindTexture(gl.TEXTURE_2D, glState.floorTexTex);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, W, W, gl.RED_INTEGER, gl.UNSIGNED_BYTE, world.floorTex);
    glState.floorTexVersion = world.floorTexVersion;
  }

  if (world.fogVersion !== glState.fogVersion) {
    gl.bindTexture(gl.TEXTURE_2D, glState.fogTex);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, W, W, gl.RED_INTEGER, gl.UNSIGNED_BYTE, world.fog);
    glState.fogVersion = world.fogVersion;
  }

  // Door states
  if (syncDoorStates(world, glState.doorStatesData)) {
    gl.bindTexture(gl.TEXTURE_2D, glState.doorStatesTex);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, W, W, gl.RED_INTEGER, gl.UNSIGNED_BYTE, glState.doorStatesData);
  }

  // Surface marks (blood, bullet holes, etc.)
  const surfaceCamTileX = Math.floor(camX / 4);
  const surfaceCamTileY = Math.floor(camY / 4);
  const surfaceCameraDirty = world.surfaceMap.size > SURF_MAX_SLOTS
    && (surfaceCamTileX !== glState.surfaceCamTileX || surfaceCamTileY !== glState.surfaceCamTileY);
  if (world.surfaceVersion !== glState.surfaceVersion || surfaceCameraDirty) {
    const surfData = buildSurfaceData(world, camX, camY, {
      pixels: glState.surfacePixels,
      index: glState.surfaceIndex,
    });
    gl.bindTexture(gl.TEXTURE_2D, glState.surfaceAtlasTex);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, SURF_ATLAS_SIZE, SURF_ATLAS_SIZE, gl.RGBA, gl.UNSIGNED_BYTE, surfData.pixels);
    gl.bindTexture(gl.TEXTURE_2D, glState.surfaceIdxTex);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, W, W, gl.RED_INTEGER, gl.UNSIGNED_SHORT, surfData.index);
    glState.surfaceVersion = world.surfaceVersion;
    glState.surfaceCamTileX = surfaceCamTileX;
    glState.surfaceCamTileY = surfaceCamTileY;
  }
}

/* ── Render scene via WebGL ───────────────────────────────────── */
export function renderSceneGL(
  world: World,
  textures: TexData[],
  sprites: SpriteData[],
  entities: Entity[],
  px: number, py: number, pAngle: number, pPitch: number,
  fogDensity: number,
  glitch: number,
  camHeight = 0.5,
  flashlight = 0,
  time = 0,
  bloodParticles: BloodParticle[] = [],
  samosborActive = false,
  ambientLight = 0.12,
  fovRadians = DEFAULT_FOV_RADIANS,
): void {
  if (!glState) return;
  const { gl } = glState;
  const planeLen = planeLenForFov(fovRadians);

  // Check if player is in purple fog
  const pci = world.idx(Math.floor(px), Math.floor(py));
  const purpleFog = world.fog[pci] > 50 ? 1 : 0;
  const activeVariant = getActiveSamosborVariant();
  const defaultFogRgb: [number, number, number] = [80, 20, 120];
  const fogRgb: readonly [number, number, number] = activeVariant?.fogColor ?? defaultFogRgb;
  const samosborStyle = activeVariant?.def.id === 'veretar' ? 3 : 0;

  // ── Pass 1: Raycaster into FBO ──
  gl.bindFramebuffer(gl.FRAMEBUFFER, glState.rayFBO);
  gl.viewport(0, 0, SCR_W, SCR_H);
  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.useProgram(glState.rayProgram);
  const ru = glState.rayUniforms;
  gl.uniform2f(ru['uResolution']!, SCR_W, SCR_H);
  gl.uniform2f(ru['uPos']!, px, py);
  gl.uniform1f(ru['uAngle']!, pAngle);
  gl.uniform1f(ru['uPitch']!, pPitch);
  gl.uniform1f(ru['uFogDensity']!, fogDensity);
  gl.uniform1f(ru['uGlitch']!, glitch);
  gl.uniform1f(ru['uPlaneLen']!, planeLen);
  gl.uniform1f(ru['uCamHeight']!, camHeight);
  gl.uniform1f(ru['uFlashlight']!, flashlight);
  gl.uniform1f(ru['uAmbient']!, ambientLight);
  gl.uniform1f(ru['uTime']!, time);
  gl.uniform1i(ru['uPurpleFog']!, purpleFog);
  gl.uniform3f(ru['uFogColor']!, fogRgb[0] / 255, fogRgb[1] / 255, fogRgb[2] / 255);
  const skyTint = activeDynamicSky?.ambientTint;
  const skyR = skyTint ? Math.max(0.65, Math.min(1.25, skyTint.r / 112)) : 1;
  const skyG = skyTint ? Math.max(0.65, Math.min(1.25, skyTint.g / 120)) : 1;
  const skyB = skyTint ? Math.max(0.65, Math.min(1.25, skyTint.b / 136)) : 1;
  const skyFog = activeDynamicSky?.fogTint;
  gl.uniform1i(ru['uUseDynamicSky']!, activeDynamicSky ? 1 : 0);
  gl.uniform3f(ru['uDynamicSkyTint']!, skyR, skyG, skyB);
  gl.uniform3f(
    ru['uBaseFogColor']!,
    skyFog ? skyFog.r / 255 : 5 / 255,
    skyFog ? skyFog.g / 255 : 5 / 255,
    skyFog ? skyFog.b / 255 : 8 / 255,
  );

  // Bind data textures to texture units.
  bindTextureUnit(gl, glState.cellsTex, ru['uCells']!, 0);
  bindTextureUnit(gl, glState.wallTexTex, ru['uWallTex']!, 1);
  bindTextureUnit(gl, glState.floorTexTex, ru['uFloorTex']!, 2);
  bindTextureUnit(gl, glState.featuresTex, ru['uFeatures']!, 3);
  bindTextureUnit(gl, glState.lightTex, ru['uLight']!, 4);
  bindTextureUnit(gl, glState.fogTex, ru['uFog']!, 5);
  bindTextureUnit(gl, glState.doorStatesTex, ru['uDoorStates']!, 6);
  bindTextureUnit(gl, glState.atlasTex, ru['uAtlas']!, 7);
  bindTextureUnit(gl, glState.surfaceAtlasTex, ru['uSurfaceAtlas']!, 8);
  bindTextureUnit(gl, glState.surfaceIdxTex, ru['uSurfaceIdx']!, 9);
  bindTextureUnit(gl, glState.dynamicSkyTex, ru['uDynamicSky']!, 10);

  // Atlas size
  const atlasRows = Math.ceil(textures.length / ATLAS_COLS);
  gl.uniform2f(ru['uAtlasSize']!, ATLAS_COLS * ATLAS_TEX_SIZE, atlasRows * ATLAS_TEX_SIZE);

  // Draw fullscreen quad — enable depth write via gl_FragDepth
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.ALWAYS);
  gl.bindVertexArray(glState.rayVAO);
  gl.drawArrays(gl.TRIANGLES, 0, 6);

  // ── Render sprites into FBO (with depth test against raycaster) ──
  gl.depthFunc(gl.LESS);
  renderSpritesGL(world, sprites, entities, px, py, pAngle, pPitch, fogDensity, purpleFog, camHeight, time, fogRgb, planeLen);

  // ── Render blood particles into FBO ──
  if (bloodParticles.length > 0) {
    renderParticlesGL(bloodParticles, px, py, pAngle, pPitch, camHeight, planeLen);
  }

  gl.disable(gl.DEPTH_TEST);

  // ── Pass 2: Blit FBO to screen with glitch ──
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  gl.useProgram(glState.blitProgram);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, glState.rayColorTex);
  gl.uniform1i(glState.blitUniforms['uTex']!, 0);
  gl.uniform1f(glState.blitUniforms['uGlitch']!, glitch);
  gl.uniform1f(glState.blitUniforms['uTime']!, time);
  gl.uniform1f(glState.blitUniforms['uSamosborActive']!, samosborActive ? 1.0 : 0.0);
  gl.uniform1i(glState.blitUniforms['uSamosborStyle']!, samosborStyle);

  gl.bindVertexArray(glState.blitVAO);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
}

function toroidalDelta(a: number, b: number): number {
  let d = a - b;
  if (d > W / 2) d -= W;
  if (d < -W / 2) d += W;
  return d;
}

function wrapWorldFloat(v: number): number {
  return ((v % W) + W) % W;
}

function hasTumannikRenderOffset(e: Entity): boolean {
  if (e.monsterKind !== MonsterKind.TUMANNIK) return false;
  const ai = e.ai;
  return Math.abs(ai?.fogOffsetX ?? 0) > 0.05 || Math.abs(ai?.fogOffsetY ?? 0) > 0.05;
}

function pushVisibleSprite(
  count: number,
  entity: Entity | null,
  dx: number,
  dy: number,
  dist: number,
  spriteIdx: number,
  scale: number,
  spriteZ: number,
  projectile: number,
  seed: number,
): number {
  if (count >= VISIBLE_SPRITE_CAP || spriteIdx < 0) return count;
  visibleEntities[count] = entity;
  visibleDx[count] = dx;
  visibleDy[count] = dy;
  visibleDist[count] = dist;
  visibleSpriteIdx[count] = spriteIdx;
  visibleSpriteScale[count] = scale;
  visibleSpriteZ[count] = spriteZ;
  visibleProjectile[count] = projectile;
  visibleSeed[count] = seed;
  visibleOrder[count] = count;
  return count + 1;
}

function featureSpriteScale(feature: Feature): number {
  switch (feature) {
    case Feature.CANDLE: return 0.34;
    case Feature.LAMP: return 0.48;
    case Feature.CHAIR: return 0.42;
    case Feature.TABLE:
    case Feature.DESK: return 0.55;
    case Feature.BED: return 0.75;
    case Feature.STOVE:
    case Feature.SINK:
    case Feature.TOILET: return 0.58;
    case Feature.SHELF:
    case Feature.MACHINE:
    case Feature.APPARATUS: return 0.7;
    case Feature.LIFT_BUTTON:
    case Feature.SCREEN:
    case Feature.SLIDE: return 0.52;
    default: return 0.5;
  }
}

function featureSpriteZ(feature: Feature): number {
  switch (feature) {
    case Feature.LIFT_BUTTON:
    case Feature.SCREEN:
    case Feature.SLIDE: return 0.22;
    case Feature.LAMP: return 0.12;
    default: return 0;
  }
}

function featureOffset(feature: Feature, x: number, y: number): { ox: number; oy: number } {
  const h = ((x * 73856093) ^ (y * 19349663) ^ (feature * 83492791)) >>> 0;
  return {
    ox: (((h & 3) - 1.5) * 0.035),
    oy: ((((h >>> 2) & 3) - 1.5) * 0.035),
  };
}

function containerSpriteScale(kind: ContainerKind): number {
  switch (kind) {
    case ContainerKind.CASHBOX: return 0.42;
    case ContainerKind.SECRET_STASH: return 0.45;
    case ContainerKind.TRASH_BIN: return 0.52;
    case ContainerKind.WOODEN_CHEST:
    case ContainerKind.WEAPON_CRATE:
    case ContainerKind.EMERGENCY_BOX: return 0.58;
    case ContainerKind.MEDICAL_CABINET:
    case ContainerKind.METAL_CABINET:
    case ContainerKind.FILING_CABINET:
    case ContainerKind.TOOL_LOCKER:
    case ContainerKind.FRIDGE:
    case ContainerKind.SAFE: return 0.68;
    default: return 0.58;
  }
}

function collectStaticObjectSprites(world: World, px: number, py: number, count: number): number {
  const maxDist2 = MAX_DRAW * MAX_DRAW;
  for (const container of world.containers) {
    if (container.access === 'secret' && !container.discovered) continue;
    const ox = container.x + 0.55;
    const oy = container.y + 0.5;
    const dx = toroidalDelta(ox, px);
    const dy = toroidalDelta(oy, py);
    const dist = dx * dx + dy * dy;
    if (dist >= maxDist2) continue;
    count = pushVisibleSprite(
      count,
      null,
      dx,
      dy,
      dist,
      containerSpr(container.kind),
      containerSpriteScale(container.kind),
      0,
      0,
      container.id,
    );
    if (count >= VISIBLE_SPRITE_CAP) return count;
  }

  const cx = Math.floor(px);
  const cy = Math.floor(py);
  for (let oy = -STATIC_OBJECT_RADIUS; oy <= STATIC_OBJECT_RADIUS; oy++) {
    const y = world.wrap(cy + oy);
    for (let ox = -STATIC_OBJECT_RADIUS; ox <= STATIC_OBJECT_RADIUS; ox++) {
      const x = world.wrap(cx + ox);
      const idx = world.idx(x, y);
      const feature = world.features[idx] as Feature;
      if (feature === Feature.NONE || feature === Feature.LAMP || feature === Feature.CANDLE) continue;
      const cell = world.cells[idx];
      if (cell !== Cell.FLOOR && cell !== Cell.WATER) continue;
      const off = featureOffset(feature, x, y);
      const sx = x + 0.5 + off.ox;
      const sy = y + 0.5 + off.oy;
      const dx = toroidalDelta(sx, px);
      const dy = toroidalDelta(sy, py);
      const dist = dx * dx + dy * dy;
      if (dist >= maxDist2) continue;
      count = pushVisibleSprite(
        count,
        null,
        dx,
        dy,
        dist,
        featureSpr(feature),
        featureSpriteScale(feature),
        featureSpriteZ(feature),
        0,
        idx,
      );
      if (count >= VISIBLE_SPRITE_CAP) return count;
    }
  }
  return count;
}

/* ── Sprite rendering (GL) ────────────────────────────────────── */
function renderSpritesGL(
  world: World,
  _sprites: SpriteData[],
  _entities: Entity[],
  px: number, py: number, pAngle: number, pPitch: number,
  fogDensity: number, purpleFog: number,
  camHeight: number,
  time: number,
  activeFogRgb: readonly [number, number, number],
  planeLen: number,
): void {
  if (!glState) return;
  const { gl } = glState;

  const dirX = Math.cos(pAngle);
  const dirY = Math.sin(pAngle);
  const planeX = -dirY * planeLen;
  const planeY = dirX * planeLen;
  const horizonShift = Math.floor(pPitch * SCR_H);
  const halfH = Math.floor(SCR_H / 2) + horizonShift;
  const invDet = 1.0 / (planeX * dirY - dirX * planeY);

  // Fog color
  const skyFog = activeDynamicSky?.fogTint;
  const fogR = purpleFog ? activeFogRgb[0] / 255 : skyFog ? skyFog.r / 255 : 5 / 255;
  const fogG = purpleFog ? activeFogRgb[1] / 255 : skyFog ? skyFog.g / 255 : 5 / 255;
  const fogB = purpleFog ? activeFogRgb[2] / 255 : skyFog ? skyFog.b / 255 : 8 / 255;

  // Collect visible entities without per-frame record allocation.
  let visibleCount = 0;
  getEntityIndex().queryRadiusCapped(px, py, MAX_DRAW, visibleEntityQuery, ENTITY_MASK_VISIBLE, VISIBLE_ENTITY_QUERY_CAP);
  for (const e of visibleEntityQuery) {
    if (!e.alive || e.type === EntityType.PLAYER) continue;
    const renderX = hasTumannikRenderOffset(e) ? wrapWorldFloat(e.x + (e.ai?.fogOffsetX ?? 0)) : e.x;
    const renderY = hasTumannikRenderOffset(e) ? wrapWorldFloat(e.y + (e.ai?.fogOffsetY ?? 0)) : e.y;
    const dx = toroidalDelta(renderX, px);
    const dy = toroidalDelta(renderY, py);
    const dist = dx * dx + dy * dy;
    if (dist < MAX_DRAW * MAX_DRAW) {
      const isProjectile = e.type === EntityType.PROJECTILE
        ? (e.projType === ProjType.FLAME ? 2 : 1)
        : 0;
      visibleCount = pushVisibleSprite(
        visibleCount,
        e,
        dx,
        dy,
        dist,
        e.sprite ?? 0,
        e.spriteScale ?? 1.0,
        e.spriteZ ?? 0,
        isProjectile,
        (e.id % 997) * 0.137,
      );
      if (visibleCount >= VISIBLE_SPRITE_CAP) break;
    }
    if (hasTumannikRenderOffset(e)) {
      const realDx = toroidalDelta(e.x, px);
      const realDy = toroidalDelta(e.y, py);
      const realDist = realDx * realDx + realDy * realDy;
      const realLight = world.light[world.idx(Math.floor(e.x), Math.floor(e.y))] ?? 0;
      if (realDist < 4.2 * 4.2 || realLight >= 0.28) {
        visibleCount = pushVisibleSprite(
          visibleCount,
          e,
          realDx,
          realDy,
          realDist,
          e.sprite ?? 0,
          Math.min(0.7, e.spriteScale ?? 0.7),
          e.spriteZ ?? 0,
          0,
          (e.id % 997) * 0.137 + 19,
        );
        if (visibleCount >= VISIBLE_SPRITE_CAP) break;
      }
    }
  }
  visibleCount = collectStaticObjectSprites(world, px, py, visibleCount);
  visibleEntities.length = visibleCount;
  visibleDx.length = visibleCount;
  visibleDy.length = visibleCount;
  visibleDist.length = visibleCount;
  visibleOrder.length = visibleCount;
  visibleSpriteIdx.length = visibleCount;
  visibleSpriteScale.length = visibleCount;
  visibleSpriteZ.length = visibleCount;
  visibleProjectile.length = visibleCount;
  visibleSeed.length = visibleCount;
  // Sort far to near
  visibleOrder.sort((a, b) => visibleDist[b] - visibleDist[a]);

  gl.useProgram(glState.spriteProgram);
  // Depth test is already enabled by caller with LESS func
  // Enable blending for alpha-tested sprites
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  const su = glState.spriteUniforms;
  gl.uniform2f(su['uResolution']!, SCR_W, SCR_H);
  gl.uniform3f(su['uFogColor']!, fogR, fogG, fogB);
  gl.uniform1f(su['uTime']!, time);
  gl.bindVertexArray(glState.spriteVAO);

  for (let oi = 0; oi < visibleCount; oi++) {
    const vi = visibleOrder[oi];
    const e = visibleEntities[vi];
    const dx = visibleDx[vi];
    const dy = visibleDy[vi];
    const dist = visibleDist[vi];
    const txf = invDet * (dirY * dx - dirX * dy);
    const tyf = invDet * (-planeY * dx + planeX * dy);
    if (tyf <= 0.1) continue;

    const spriteScreenX = Math.floor((SCR_W / 2) * (1 + txf / tyf));
    const rawH = Math.abs(Math.floor(SCR_H / tyf));
    const scale = visibleSpriteScale[vi];
    const spriteH = Math.floor(rawH * scale);
    const spriteW = spriteH;

    const spriteZ = visibleSpriteZ[vi];
    const footY = halfH + Math.floor(rawH * camHeight) - Math.floor(rawH * spriteZ);
    const startY = footY - spriteH;

    const ff = Math.min(1, Math.sqrt(dist) * fogDensity);
    const isProjectile = visibleProjectile[vi];
    const normDepth = Math.min(1.0, tyf / MAX_DRAW);

    // Set uniforms
    gl.uniform1f(su['uScreenX']!, spriteScreenX);
    gl.uniform1f(su['uSpriteW']!, spriteW);
    gl.uniform1f(su['uSpriteH']!, spriteH);
    gl.uniform1f(su['uStartY']!, startY);
    gl.uniform1f(su['uDepth']!, normDepth);
    gl.uniform1f(su['uFogF']!, ff);
    gl.uniform1i(su['uIsProjectile']!, isProjectile);
    if (isProjectile === 2) {
      gl.uniform1f(su['uSeed']!, visibleSeed[vi]);
    }

    // Switch blend mode: additive for projectiles (incl. flame), alpha for everything else
    if (isProjectile) {
      gl.blendFunc(gl.ONE, gl.ONE);
      // Flame: disable depth write — purely additive visual, should not occlude
      if (isProjectile === 2) gl.depthMask(false);
    } else {
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    }

    // Bind sprite texture. NPCs and monsters use per-entity procedural
    // textures keyed by their seed; atlas sprites remain for drops/projectiles.
    let spriteTex = e ? proceduralEntityTexture(e) : null;
    const sprIdx = visibleSpriteIdx[vi];
    if (!spriteTex && sprIdx >= 0 && sprIdx < glState.spriteTextures.length) {
      spriteTex = glState.spriteTextures[sprIdx];
    }
    if (!spriteTex) continue;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, spriteTex);
    gl.uniform1i(su['uSpriteTex']!, 0);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // Restore depth mask if it was disabled for flame
    if (isProjectile === 2) gl.depthMask(true);
  }

  gl.disable(gl.BLEND);
}

/* ── Blood particle rendering ─────────────────────────────────── */
function renderParticlesGL(
  particles: BloodParticle[],
  px: number, py: number, pAngle: number, pPitch: number,
  _camHeight: number,
  planeLen: number,
): void {
  if (!glState || particles.length === 0) return;
  const { gl } = glState;

  const dirX = Math.cos(pAngle);
  const dirY = Math.sin(pAngle);
  const planeX = -dirY * planeLen;
  const planeY = dirX * planeLen;
  const horizonShift = Math.floor(pPitch * SCR_H);
  const halfH = Math.floor(SCR_H / 2) + horizonShift;
  const invDet = 1.0 / (planeX * dirY - dirX * planeY);

  let visibleCount = 0;
  const instanceData = glState.particleInstanceData;
  const colorData = glState.particleColorData;
  for (const p of particles) {
    if (visibleCount >= PARTICLE_INSTANCE_CAP) break;
    let dx = p.x - px;
    let dy = p.y - py;
    if (dx > W / 2) dx -= W;
    if (dx < -W / 2) dx += W;
    if (dy > W / 2) dy -= W;
    if (dy < -W / 2) dy += W;

    const txf = invDet * (dirY * dx - dirX * dy);
    const tyf = invDet * (-planeY * dx + planeX * dy);
    if (tyf <= 0.1) continue;

    const sx = Math.floor((SCR_W / 2) * (1 + txf / tyf));
    if (sx < -4 || sx >= SCR_W + 4) continue;

    const sy = Math.floor(halfH + SCR_H / (tyf * 2) - p.z * SCR_H / tyf); // at impact height
    if (sy < -4 || sy >= SCR_H + 4) continue;

    const alpha = Math.min(1, p.life * 5);
    const normDepth = Math.min(0.999, tyf / MAX_DRAW);
    const di = visibleCount << 2;
    instanceData[di] = sx;
    instanceData[di + 1] = sy;
    instanceData[di + 2] = p.size * 2;
    instanceData[di + 3] = normDepth;
    colorData[di] = p.r / 255;
    colorData[di + 1] = p.g / 255;
    colorData[di + 2] = p.b / 255;
    colorData[di + 3] = alpha;
    visibleCount++;
  }

  if (visibleCount === 0) return;

  gl.useProgram(glState.particleProgram);
  // Depth test already enabled by caller
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  const pu = glState.particleUniforms;
  gl.uniform2f(pu['uResolution']!, SCR_W, SCR_H);
  gl.bindVertexArray(glState.particleVAO);

  const uploadFloats = visibleCount * 4;
  gl.bindBuffer(gl.ARRAY_BUFFER, glState.particleInstanceBuffer);
  gl.bufferSubData(gl.ARRAY_BUFFER, 0, instanceData, 0, uploadFloats);
  gl.bindBuffer(gl.ARRAY_BUFFER, glState.particleColorBuffer);
  gl.bufferSubData(gl.ARRAY_BUFFER, 0, colorData, 0, uploadFloats);

  gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, visibleCount);

  gl.disable(gl.BLEND);
}

/* ── Dispose all GL resources ─────────────────────────────────── */
export function disposeWebGL(): void {
  if (!glState) return;
  const { gl } = glState;
  gl.deleteProgram(glState.rayProgram);
  gl.deleteProgram(glState.blitProgram);
  gl.deleteProgram(glState.spriteProgram);
  gl.deleteProgram(glState.particleProgram);
  gl.deleteFramebuffer(glState.rayFBO);
  gl.deleteRenderbuffer(glState.rayDepthBuf);
  gl.deleteTexture(glState.rayColorTex);
  gl.deleteTexture(glState.cellsTex);
  gl.deleteTexture(glState.wallTexTex);
  gl.deleteTexture(glState.floorTexTex);
  gl.deleteTexture(glState.featuresTex);
  gl.deleteTexture(glState.lightTex);
  gl.deleteTexture(glState.fogTex);
  gl.deleteTexture(glState.doorStatesTex);
  gl.deleteTexture(glState.atlasTex);
  gl.deleteTexture(glState.dynamicSkyTex);
  gl.deleteTexture(glState.surfaceAtlasTex);
  gl.deleteTexture(glState.surfaceIdxTex);
  for (const t of glState.spriteTextures) gl.deleteTexture(t);
  for (const entry of glState.proceduralSpriteTextures.values()) gl.deleteTexture(entry.texture);
  glState = null;
}
