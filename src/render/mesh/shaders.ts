export const MESH_VERT_SRC = /* glsl */ `#version 300 es
precision highp float;

in vec3 aWorld;
in vec3 aNormal;
in vec3 aColor;

uniform vec2 uCam;
uniform vec2 uDir;
uniform vec2 uPlane;
uniform vec2 uPitchHeight;
uniform vec2 uResolution;
uniform float uInvDet;
uniform float uWorldSize;
uniform float uMaxDraw;
uniform float uMeshRadius;

out vec3 vColor;
out vec3 vNormal;
out float vForward;
out float vDistance;
out vec2 vWorldXY;

float torusDelta(float value, float origin) {
  float d = value - origin;
  float halfSize = uWorldSize * 0.5;
  if (d > halfSize) d -= uWorldSize;
  if (d < -halfSize) d += uWorldSize;
  return d;
}

void main() {
  float dx = torusDelta(aWorld.x, uCam.x);
  float dy = torusDelta(aWorld.y, uCam.y);
  float tx = uInvDet * (uDir.y * dx - uDir.x * dy);
  float ty = uInvDet * (-uPlane.y * dx + uPlane.x * dy);
  float depth = clamp(ty / uMaxDraw, 0.0, 1.0);
  float clipY = 2.0 * (aWorld.z - uPitchHeight.y) - 2.0 * uPitchHeight.x * ty;
  gl_Position = vec4(tx, clipY, (depth * 2.0 - 1.0) * ty, ty);
  vColor = aColor;
  vNormal = normalize(aNormal);
  vForward = ty;
  vDistance = length(vec2(dx, dy));
  vWorldXY = aWorld.xy;
}
`;

export const MESH_FRAG_SRC = /* glsl */ `#version 300 es
precision highp float;

in vec3 vColor;
in vec3 vNormal;
in float vForward;
in float vDistance;
in vec2 vWorldXY;

uniform vec3 uFogColor;
uniform float uFogDensity;
uniform float uAmbient;
uniform float uTime;
uniform float uMaxDraw;
uniform float uMeshRadius;
uniform float uWorldSize;
uniform sampler2D uLight;
uniform float uLightOn;     // 1.0 when the baked lightmap is bound

out vec4 fragColor;

const float MESH_NEAR = 0.1;
const float MESH_DEPTH_BIAS = 0.015;

float bakedLightAt(int x, int y, int wmask) {
  return texelFetch(uLight, ivec2(x & wmask, y & wmask), 0).r;
}

void main() {
  if (vForward <= MESH_NEAR) discard;
  vec3 nrm = normalize(vNormal);
  float fakeDiffuse = max(0.0, dot(nrm, normalize(vec3(-0.42, 0.58, 0.72))));

  float shade;
  if (uLightOn > 0.5) {
    // Same baked lightmap the raycaster uses: meshes sit in the real lamp light,
    // so an object in an unlit cell stays dark (grounded contact shadow).
    int wmask = int(uWorldSize) - 1;
    int cx = int(floor(vWorldXY.x));
    int cy = int(floor(vWorldXY.y));
    float baked = bakedLightAt(cx, cy, wmask);
    // Light gradient -> direction toward the nearest lamp for self-shadowing:
    // the mesh side facing the lamp is lit, the far side falls into shadow.
    float lxp = bakedLightAt(cx + 1, cy, wmask);
    float lxm = bakedLightAt(cx - 1, cy, wmask);
    float lyp = bakedLightAt(cx, cy + 1, wmask);
    float lym = bakedLightAt(cx, cy - 1, wmask);
    vec2 grad = vec2(lxp - lxm, lyp - lym);
    float ndl = 0.0;
    if (dot(grad, grad) > 1e-6) ndl = max(dot(nrm.xy, normalize(grad)), 0.0);
    float eye = (1.0 - smoothstep(0.5, 11.0, vDistance)) * 0.22;
    float litBase = clamp(uAmbient + baked * (1.0 - uAmbient) + eye, 0.0, 1.2);
    litBase = pow(clamp(litBase, 0.0, 1.0), 1.32);
    float dirShade = 0.6 + 0.4 * ndl;
    shade = clamp(litBase * dirShade + fakeDiffuse * 0.08, 0.05, 1.25);
  } else {
    float side = 0.78 + 0.08 * sin(uTime * 0.7 + vColor.r * 6.2831);
    shade = clamp(uAmbient + fakeDiffuse * 0.58 + side * 0.18, 0.12, 1.0);
  }

  float fogBase = max(0.0, vForward * max(0.02, uFogDensity));
  float fog = clamp(1.0 - exp(-fogBase * fogBase * 1.15), 0.0, 0.92);
  float fadeWidth = clamp(uMeshRadius * 0.22, 1.0, 3.0);
  float edgeFade = smoothstep(max(0.0, uMeshRadius - fadeWidth), uMeshRadius, vDistance);
  vec3 color = mix(vColor * shade, uFogColor, max(fog, edgeFade * 0.86));
  fragColor = vec4(color, 1.0);
  gl_FragDepth = clamp((vForward - MESH_DEPTH_BIAS) / max(1.0, uMaxDraw), 0.0, 1.0);
}
`;

function compileShader(gl: WebGL2RenderingContext, type: number, src: string): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('mesh shader allocation failed');
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader) ?? 'unknown error';
    gl.deleteShader(shader);
    throw new Error(`mesh shader compile error: ${log}`);
  }
  return shader;
}

export function createMeshProgram(gl: WebGL2RenderingContext): WebGLProgram {
  const vertex = compileShader(gl, gl.VERTEX_SHADER, MESH_VERT_SRC);
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, MESH_FRAG_SRC);
  const program = gl.createProgram();
  if (!program) {
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    throw new Error('mesh program allocation failed');
  }
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program) ?? 'unknown error';
    gl.deleteProgram(program);
    throw new Error(`mesh program link error: ${log}`);
  }
  return program;
}
