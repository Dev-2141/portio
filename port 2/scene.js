import * as THREE from 'three';

// Five tilted planes stacked down the page, each crossed by one huge dark letter of DEVAN.
// The camera travels down with scroll progress (window.DEVAN.progress, eased in app.js).
const D = window.DEVAN;
const canvas = document.getElementById('scene');
const LETTERS = 'DEVAN';

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
} catch (e) {
  canvas.remove();
  throw e;
}
renderer.setClearColor(0x050506, 1);
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x050506, 9, 26);
const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);

const SPACING = 5.2;
let W = 9.6, H = 3.9, OFFSET_X = 1.45;

// ---------- letter mask textures ----------
function letterTexture(letter, side) {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = Math.round(1024 * H / W);
  const g = c.getContext('2d');
  g.fillStyle = '#000';
  g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = '#fff';
  const size = c.height * 1.62;
  g.font = `900 ${size}px "Arial Black", Arial, sans-serif`;
  g.textBaseline = 'middle';
  const m = g.measureText(letter).width;
  const x = side < 0 ? c.width * 0.07 : c.width * 0.93 - m;
  g.fillText(letter, x, c.height * 0.56);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.NoColorSpace;
  return t;
}

const vert = /* glsl */`
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;
const frag = /* glsl */`
  precision highp float;
  varying vec2 vUv;
  uniform float uTime, uSeed, uHover, uDim, uAspect;
  uniform vec3 uC1, uC2, uC3;
  uniform sampler2D uMask;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
  }
  float fbm(vec2 p) { float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; } return v; }
  float roundRect(vec2 p, vec2 b, float r) { vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }

  void main() {
    vec2 p = vec2(vUv.x * uAspect, vUv.y);
    float t = uTime * 0.06 + uSeed * 10.0;
    vec2 q = vec2(fbm(p * 1.4 + t), fbm(p * 1.4 - t + 3.1));
    float n = fbm(p * 1.8 + q * 2.2 + vec2(t * 0.7, -t * 0.4));
    vec3 col = mix(uC1, uC2, smoothstep(0.25, 0.75, n));
    col = mix(col, uC3, smoothstep(0.55, 0.95, fbm(p * 3.0 + q * 3.0 - t)));
    // fine light streaks, like fibres in the reference footage
    float streak = smoothstep(0.92, 1.0, sin((p.x * 22.0 + q.y * 9.0 + n * 6.0)) * 0.5 + 0.5);
    col += uC3 * streak * 0.25;
    col *= 0.75 + 0.45 * n;
    col *= 1.0 + uHover * 0.18;

    // letter mask: the letter is painted in near-black across the plane
    float m = texture2D(uMask, vUv).r;
    col = mix(col, vec3(0.02), smoothstep(0.35, 0.65, m));

    // soft inner vignette + grain
    vec2 c = vUv - 0.5;
    col *= 1.0 - dot(c, c) * 0.9;
    col += (hash(vUv * 900.0 + uTime) - 0.5) * 0.05;

    // rounded corners
    vec2 rp = (vUv - 0.5) * vec2(uAspect, 1.0);
    float d = roundRect(rp, vec2(uAspect * 0.5, 0.5), 0.07);
    float alpha = 1.0 - smoothstep(-0.004, 0.004, d);
    gl_FragColor = vec4(col * uDim, alpha);
  }
`;

const planes = [];
const geo = () => new THREE.PlaneGeometry(W, H, 1, 1);

function buildPlanes() {
  planes.forEach(p => { scene.remove(p.mesh); p.mesh.geometry.dispose(); p.mat.uniforms.uMask.value.dispose(); p.mat.dispose(); });
  planes.length = 0;
  for (let i = 0; i < 5; i++) {
    const side = i % 2 === 0 ? -1 : 1; // chapter text right → plane sits left
    const [a, b, c] = D.palettes[i];
    const mat = new THREE.ShaderMaterial({
      vertexShader: vert, fragmentShader: frag, transparent: true,
      uniforms: {
        uTime: { value: 0 }, uSeed: { value: i * 0.37 + 0.11 }, uHover: { value: 0 }, uDim: { value: 1 },
        uAspect: { value: W / H },
        uC1: { value: new THREE.Color(a) }, uC2: { value: new THREE.Color(b) }, uC3: { value: new THREE.Color(c) },
        uMask: { value: letterTexture(LETTERS[i], side) }
      }
    });
    const mesh = new THREE.Mesh(geo(), mat);
    mesh.userData.index = i;
    const base = {
      x: side * OFFSET_X, y: -i * SPACING, z: (i % 2 ? -0.4 : 0.2),
      rx: -0.3, ry: side * -0.36, rz: side * -0.075
    };
    mesh.position.set(base.x, base.y, base.z);
    mesh.rotation.set(base.rx, base.ry, base.rz);
    scene.add(mesh);
    planes.push({ mesh, mat, base, hover: 0 });
  }
}

// ---------- sizing ----------
let camZ = 12.5;
function resize() {
  const w = innerWidth, h = innerHeight;
  const mobile = w <= 768;
  const nW = mobile ? 6.4 : 9.6, nH = mobile ? 3.2 : 3.9;
  const changed = nW !== W;
  W = nW; H = nH; OFFSET_X = mobile ? 0.25 : 1.45;
  camZ = mobile ? 15 : 12.5;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  if (changed || !planes.length) buildPlanes();
}
addEventListener('resize', resize);
resize();

// ---------- pointer: parallax + picking ----------
const mouse = new THREE.Vector2(0, 0), ndc = new THREE.Vector2(9, 9);
const ray = new THREE.Raycaster();
let hovered = -1;
addEventListener('pointermove', e => {
  mouse.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  ndc.copy(mouse);
});
function overUI(target) {
  return target.closest && target.closest('a, button, .site-header, .intro, .about, .team, .contact, .cookie-banner, .world-screen');
}
addEventListener('click', e => {
  if (hovered < 0 || D.world >= 0 || !D.sceneActive || overUI(e.target)) return;
  D.openWorld(hovered);
});

// ---------- camera state ----------
const cam = { x: 0, y: 0, z: camZ, lx: 0, ly: 0 };
// frame-rate independent easing: k is the per-frame factor at 60fps
let dt = 1 / 60;
const lerp = (a, b, k) => a + (b - a) * (1 - Math.pow(1 - k, dt * 60));
const clock = new THREE.Clock();

function frame() {
  requestAnimationFrame(frame);
  dt = Math.min(0.25, clock.getDelta());
  const t = clock.elapsedTime;
  const inWorld = D.world >= 0 && (document.body.classList.contains('world-transitioning') || document.body.classList.contains('world-active'));
  if (!D.sceneActive && !inWorld) return;

  const p = D.progress;
  // plane i is centred at progress 0.015 + 0.17 * i
  let ty = -((p - 0.015) / 0.17) * SPACING;
  let tx = mouse.x * 0.35, tz = camZ;
  if (inWorld) {
    const target = planes[D.world].base;
    tx = target.x; ty = target.y; tz = 4.2;
  }
  const k = inWorld ? 0.085 : 0.08;
  cam.x = lerp(cam.x, tx, k);
  cam.y = lerp(cam.y, ty, k);
  cam.z = lerp(cam.z, tz, inWorld ? 0.07 : 0.06);
  cam.lx = lerp(cam.lx, inWorld ? tx : mouse.x * 0.15, 0.06);
  cam.ly = lerp(cam.ly, inWorld ? ty : ty + mouse.y * 0.25, 0.08);
  camera.position.set(cam.x, cam.y + 0.35, cam.z);
  camera.lookAt(cam.lx, cam.ly, 0);

  // picking
  hovered = -1;
  if (!inWorld && D.sceneActive && !document.body.classList.contains('is-intro')) {
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(planes.map(pl => pl.mesh))[0];
    if (hit) hovered = hit.object.userData.index;
  }
  document.body.classList.toggle('scene-pick', hovered >= 0);

  planes.forEach((pl, i) => {
    const u = pl.mat.uniforms;
    u.uTime.value = t;
    pl.hover = lerp(pl.hover, hovered === i ? 1 : 0, 0.1);
    u.uHover.value = pl.hover;
    const dist = Math.abs(pl.base.y - cam.y) / SPACING;
    u.uDim.value = THREE.MathUtils.clamp(1.15 - dist * 0.42, 0.18, 1);
    // gentle breathing + hover lift
    pl.mesh.rotation.x = pl.base.rx + Math.sin(t * 0.35 + i) * 0.025 + pl.hover * 0.05;
    pl.mesh.rotation.z = pl.base.rz + Math.cos(t * 0.3 + i * 2) * 0.012;
    pl.mesh.position.z = pl.base.z + pl.hover * 0.35;
  });

  renderer.render(scene, camera);
}
requestAnimationFrame(frame);
