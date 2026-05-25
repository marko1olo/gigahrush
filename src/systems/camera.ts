/* ── Runtime camera controller ────────────────────────────────── */
/* Camera modes are visual runtime state. They resolve to a small
 * CameraView for render; they do not mutate gameplay ownership. */

import { W } from '../core/types';
import { World } from '../core/world';

export type CameraMode = 'player' | 'free' | 'death';

export interface CameraSubject {
  x: number;
  y: number;
  angle: number;
  pitch?: number;
}

export interface CameraPose {
  x: number;
  y: number;
  angle: number;
  pitch: number;
  height: number;
  fovRadians?: number;
}

export interface CameraView extends CameraPose {
  mode: CameraMode;
  fovRadians: number;
}

export interface RuntimeCamera {
  mode: CameraMode;
  free: CameraPose;
}

export interface FreeCameraMove {
  forward?: number;
  strafe?: number;
  vertical?: number;
  turn?: number;
  pitch?: number;
  speed?: number;
  turnSpeed?: number;
  pitchSpeed?: number;
  collide?: boolean;
}

interface DeathCameraState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  height: number;
  fx: number;
  fy: number;
  fz: number;
  prevYaw: number;
  timer: number;
  active: boolean;
}

export const CAMERA_STANDING_HEIGHT = 0.5;
export const CAMERA_DEATH_FLOOR_HEIGHT = 0.12;

const DEFAULT_CAMERA_FOV_RADIANS = Math.PI / 2;
const FREE_CAMERA_SPEED = 5.0;
const FREE_CAMERA_TURN_SPEED = 2.5;
const FREE_CAMERA_PITCH_SPEED = 1.6;
const FREE_CAMERA_MIN_HEIGHT = 0.08;
const FREE_CAMERA_MAX_HEIGHT = 8.0;

const DEATH_BALL_RADIUS = 0.2;
const DEATH_FRICTION = 0.65;
const DEATH_BOUNCE = 0.45;
const DEATH_DROP_SPEED = 4.0;
const deathCameraStates = new WeakMap<RuntimeCamera, DeathCameraState>();

function wrapCoord(value: number): number {
  return ((value % W) + W) % W;
}

function clampPitch(value: number): number {
  return Math.max(-1, Math.min(1, value));
}

function clampHeight(value: number): number {
  return Math.max(FREE_CAMERA_MIN_HEIGHT, Math.min(FREE_CAMERA_MAX_HEIGHT, value));
}

export function createRuntimeCamera(): RuntimeCamera {
  return {
    mode: 'player',
    free: { x: 0, y: 0, angle: 0, pitch: 0, height: CAMERA_STANDING_HEIGHT },
  };
}

export function resetRuntimeCamera(camera: RuntimeCamera): void {
  camera.mode = 'player';
  deathCameraStates.delete(camera);
}

export function followPlayerCamera(camera: RuntimeCamera): void {
  resetRuntimeCamera(camera);
}

export function setFreeCamera(camera: RuntimeCamera, pose: Partial<CameraPose> & Pick<CameraPose, 'x' | 'y'>): void {
  camera.mode = 'free';
  deathCameraStates.delete(camera);
  camera.free = {
    x: wrapCoord(pose.x),
    y: wrapCoord(pose.y),
    angle: pose.angle ?? camera.free.angle,
    pitch: clampPitch(pose.pitch ?? camera.free.pitch),
    height: clampHeight(pose.height ?? camera.free.height),
    fovRadians: pose.fovRadians ?? camera.free.fovRadians,
  };
}

export function setFreeCameraFromSubject(camera: RuntimeCamera, subject: CameraSubject, height = CAMERA_STANDING_HEIGHT): void {
  setFreeCamera(camera, {
    x: subject.x,
    y: subject.y,
    angle: subject.angle,
    pitch: subject.pitch ?? 0,
    height,
    fovRadians: camera.free.fovRadians,
  });
}

export function moveFreeCamera(camera: RuntimeCamera, world: World, move: FreeCameraMove, dt: number): void {
  if (camera.mode !== 'free') return;
  const pose = camera.free;
  const turnSpeed = move.turnSpeed ?? FREE_CAMERA_TURN_SPEED;
  const pitchSpeed = move.pitchSpeed ?? FREE_CAMERA_PITCH_SPEED;
  pose.angle += (move.turn ?? 0) * turnSpeed * dt;
  pose.pitch = clampPitch(pose.pitch + (move.pitch ?? 0) * pitchSpeed * dt);
  pose.height = clampHeight(pose.height + (move.vertical ?? 0) * (move.speed ?? FREE_CAMERA_SPEED) * dt);

  const forward = Math.max(-1, Math.min(1, move.forward ?? 0));
  const strafe = Math.max(-1, Math.min(1, move.strafe ?? 0));
  if (forward === 0 && strafe === 0) return;

  const len = Math.sqrt(forward * forward + strafe * strafe);
  const mag = len > 1 ? 1 / len : 1;
  const speed = (move.speed ?? FREE_CAMERA_SPEED) * dt;
  const cos = Math.cos(pose.angle);
  const sin = Math.sin(pose.angle);
  const nx = wrapCoord(pose.x + (cos * forward - sin * strafe) * mag * speed);
  const ny = wrapCoord(pose.y + (sin * forward + cos * strafe) * mag * speed);
  if (move.collide === true && world.solid(Math.floor(nx), Math.floor(ny))) return;
  pose.x = nx;
  pose.y = ny;
}

export function startDeathCamera(
  camera: RuntimeCamera,
  px: number,
  py: number,
  pAngle: number,
  random: () => number = Math.random,
): void {
  camera.mode = 'death';
  camera.free = {
    x: wrapCoord(px),
    y: wrapCoord(py),
    angle: pAngle,
    pitch: 0,
    height: CAMERA_STANDING_HEIGHT,
    fovRadians: camera.free.fovRadians,
  };
  deathCameraStates.set(camera, createDeathCameraState(px, py, pAngle, random));
}

export function updateRuntimeCamera(camera: RuntimeCamera, world: World, dt: number): void {
  const deathCamera = deathCameraStates.get(camera);
  if (camera.mode === 'death' && deathCamera) updateDeathCamera(deathCamera, world, dt);
}

export function runtimeCameraView(camera: RuntimeCamera, subject: CameraSubject, fovRadians = DEFAULT_CAMERA_FOV_RADIANS): CameraView {
  const deathCamera = deathCameraStates.get(camera);
  if (camera.mode === 'death' && deathCamera) {
    return {
      mode: 'death',
      x: deathCamera.x,
      y: deathCamera.y,
      angle: deathCameraAngle(deathCamera),
      pitch: deathCameraPitch(deathCamera),
      height: deathCamera.height,
      fovRadians,
    };
  }
  if (camera.mode === 'free') {
    return { mode: 'free', ...camera.free, fovRadians: camera.free.fovRadians ?? fovRadians };
  }
  return {
    mode: 'player',
    x: subject.x,
    y: subject.y,
    angle: subject.angle,
    pitch: subject.pitch ?? 0,
    height: CAMERA_STANDING_HEIGHT,
    fovRadians,
  };
}

function createDeathCameraState(px: number, py: number, pAngle: number, random: () => number): DeathCameraState {
  const spreadAngle = pAngle + (random() - 0.5) * Math.PI * 0.8;
  const launchSpeed = 2.0 + random() * 2.5;
  const tilt = -0.3;
  const h = Math.sqrt(1 - tilt * tilt);

  return {
    x: wrapCoord(px),
    y: wrapCoord(py),
    vx: Math.cos(spreadAngle) * launchSpeed,
    vy: Math.sin(spreadAngle) * launchSpeed,
    height: CAMERA_STANDING_HEIGHT,
    fx: Math.cos(pAngle) * h,
    fy: Math.sin(pAngle) * h,
    fz: tilt,
    prevYaw: pAngle,
    timer: 0,
    active: true,
  };
}

function rotateVec(
  vx: number, vy: number, vz: number,
  kx: number, ky: number, kz: number,
  theta: number,
): [number, number, number] {
  const c = Math.cos(theta);
  const s = Math.sin(theta);
  const dot = kx * vx + ky * vy + kz * vz;
  const cx = ky * vz - kz * vy;
  const cy = kz * vx - kx * vz;
  const cz = kx * vy - ky * vx;
  return [
    vx * c + cx * s + kx * dot * (1 - c),
    vy * c + cy * s + ky * dot * (1 - c),
    vz * c + cz * s + kz * dot * (1 - c),
  ];
}

function updateDeathCamera(dc: DeathCameraState, world: World, dt: number): void {
  if (!dc.active) return;
  dc.timer += dt;

  if (dc.height > CAMERA_DEATH_FLOOR_HEIGHT) {
    dc.height = Math.max(CAMERA_DEATH_FLOOR_HEIGHT, dc.height - DEATH_DROP_SPEED * dt);
  }

  const speed = Math.sqrt(dc.vx * dc.vx + dc.vy * dc.vy);
  if (speed < 0.04 && dc.timer > 0.5) {
    dc.vx = 0;
    dc.vy = 0;
    return;
  }

  const decay = Math.pow(DEATH_FRICTION, dt);
  dc.vx *= decay;
  dc.vy *= decay;

  if (speed > 0.01) {
    const ax = -dc.vy / speed;
    const ay = dc.vx / speed;
    const theta = (speed * dt) / DEATH_BALL_RADIUS;
    const [nx, ny, nz] = rotateVec(dc.fx, dc.fy, dc.fz, ax, ay, 0, theta);
    const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
    dc.fx = nx / len;
    dc.fy = ny / len;
    dc.fz = nz / len;
  }

  const wxO = Math.floor(wrapCoord(dc.x));
  const wyO = Math.floor(wrapCoord(dc.y));
  let hitX = false;
  let hitY = false;

  const offX = dc.vx > 0 ? DEATH_BALL_RADIUS : -DEATH_BALL_RADIUS;
  const offY = dc.vy > 0 ? DEATH_BALL_RADIUS : -DEATH_BALL_RADIUS;
  const nxPos = dc.x + dc.vx * dt;
  const nyPos = dc.y + dc.vy * dt;

  const cxCheck = Math.floor(wrapCoord(nxPos + offX));
  if (world.solid(cxCheck, wyO)) {
    dc.vx = -dc.vx * DEATH_BOUNCE;
    hitX = true;
  }

  const cyCheck = Math.floor(wrapCoord(nyPos + offY));
  if (world.solid(wxO, cyCheck)) {
    dc.vy = -dc.vy * DEATH_BOUNCE;
    hitY = true;
  }

  if (!hitX && !hitY) {
    const cxD = Math.floor(wrapCoord(nxPos + offX));
    const cyD = Math.floor(wrapCoord(nyPos + offY));
    if (world.solid(cxD, cyD)) {
      dc.vx = -dc.vx * DEATH_BOUNCE;
      dc.vy = -dc.vy * DEATH_BOUNCE;
    }
  }

  dc.x = wrapCoord(dc.x + dc.vx * dt);
  dc.y = wrapCoord(dc.y + dc.vy * dt);
}

function deathCameraAngle(dc: DeathCameraState): number {
  const raw = Math.atan2(dc.fy, dc.fx);
  const xyLen = Math.sqrt(dc.fx * dc.fx + dc.fy * dc.fy);
  const t = Math.min(1, xyLen / 0.4);
  let diff = raw - dc.prevYaw;
  if (diff > Math.PI) diff -= 2 * Math.PI;
  if (diff < -Math.PI) diff += 2 * Math.PI;
  dc.prevYaw += diff * t;
  return dc.prevYaw;
}

function deathCameraPitch(dc: DeathCameraState): number {
  return clampPitch(dc.fz);
}
