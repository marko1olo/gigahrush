import { glState, SCR_W, SCR_H } from './webgl';
import type { Fly } from '../systems/critters';

const MAX_FLIES_RENDER = 30; // Max allowed to be visible
const FLY_MIN_SCREEN_SIZE = 1.0;
const FLY_MAX_SCREEN_SIZE = 8.0;
const FLY_WORLD_SCREEN_SCALE = 0.05;
const FLY_CULL_DIST = 16.0;

export function renderFliesGL(
  flies: Fly[],
  px: number,
  py: number,
  pAngle: number,
  pPitch: number,
  _fogDensity: number,
  planeLen: number,
): void {
  if (!glState || flies.length === 0) return;
  const { gl } = glState;

  const dirX = Math.cos(pAngle);
  const dirY = Math.sin(pAngle);
  const planeX = -dirY * planeLen;
  const planeY = dirX * planeLen;
  const horizonShift = Math.floor(pPitch * SCR_H);
  const halfH = Math.floor(SCR_H / 2) + horizonShift;
  const invDet = 1.0 / (planeX * dirY - dirX * planeY);
  const W = 1024; // World width

  let visibleCount = 0;
  const instanceData = glState.particleInstanceData;
  const colorData = glState.particleColorData;

  for (const f of flies) {
    if (visibleCount >= MAX_FLIES_RENDER) break;

    let dx = f.x - px;
    let dy = f.y - py;
    if (dx > W / 2) dx -= W;
    if (dx < -W / 2) dx += W;
    if (dy > W / 2) dy -= W;
    if (dy < -W / 2) dy += W;

    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist >= FLY_CULL_DIST) continue;

    const txf = invDet * (dirY * dx - dirX * dy);
    const tyf = invDet * (-planeY * dx + planeX * dy);
    if (tyf <= 0.1) continue;

    const sx = Math.floor((SCR_W / 2) * (1 + txf / tyf));
    const screenSize = Math.min(
      FLY_MAX_SCREEN_SIZE,
      (SCR_H / tyf) * FLY_WORLD_SCREEN_SCALE
    );
    if (screenSize < FLY_MIN_SCREEN_SIZE) continue;

    const pad = Math.ceil(screenSize + 1);
    if (sx < -pad || sx >= SCR_W + pad) continue;

    const sy = Math.floor(halfH + SCR_H / (tyf * 2) - f.z * SCR_H / tyf);
    if (sy < -pad || sy >= SCR_H + pad) continue;

    // Flies are black dots
    const r = 0;
    const g = 0;
    const b = 0;

    // Fade out with distance
    const distFade = dist <= FLY_CULL_DIST * 0.7
      ? 1
      : Math.max(0, (FLY_CULL_DIST - dist) / (FLY_CULL_DIST * 0.3));

    const alpha = distFade * 0.8; // 80% opacity for slightly better blending
    if (alpha <= 0.05) continue;

    const normDepth = Math.max(0.0, Math.min(0.999, 1.0 - 0.1 / Math.max(0.1, tyf)));
    const di = visibleCount << 2;

    instanceData[di] = sx;
    instanceData[di + 1] = sy;
    instanceData[di + 2] = screenSize;
    instanceData[di + 3] = normDepth;

    colorData[di] = r;
    colorData[di + 1] = g;
    colorData[di + 2] = b;
    colorData[di + 3] = alpha;

    visibleCount++;
  }

  if (visibleCount === 0) return;

  gl.useProgram(glState.particleProgram);

  // Depth test is on, blend is on
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.depthMask(false);

  const pu = glState.particleUniforms;
  gl.uniform2f(pu['uResolution']!, SCR_W, SCR_H);
  gl.bindVertexArray(glState.particleVAO);

  const uploadFloats = visibleCount * 4;
  gl.bindBuffer(gl.ARRAY_BUFFER, glState.particleInstanceBuffer);
  gl.bufferSubData(gl.ARRAY_BUFFER, 0, instanceData, 0, uploadFloats);
  gl.bindBuffer(gl.ARRAY_BUFFER, glState.particleColorBuffer);
  gl.bufferSubData(gl.ARRAY_BUFFER, 0, colorData, 0, uploadFloats);

  gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, visibleCount);

  gl.depthMask(true);
  gl.disable(gl.BLEND);
}
