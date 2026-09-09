/* ==========================================================================
   Alebex orb, a glossy liquid-metal blob (Three.js).
   A reflective metallic-blue sphere whose surface undulates like liquid
   (animated noise displacement) with environment reflections; it leans toward
   the pointer. No post-processing → transparent (no black box) and light on
   the main thread, so the scroll-scrubbed video stays smooth. Renders only
   while on-screen.
   ========================================================================== */
import * as THREE from "three";

const canvas = document.getElementById("alebexCanvas");
const wrap   = document.getElementById("alebexOrb");

if (canvas && wrap) try {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 4.7);

  // ---- gradient environment for glossy reflections -------------------
  function envTexture() {
    const c = document.createElement("canvas"); c.width = 512; c.height = 256;
    const g = c.getContext("2d");
    const grd = g.createLinearGradient(0, 0, 0, 256);
    grd.addColorStop(0.00, "#eaf7ff");   // near-white
    grd.addColorStop(0.34, "#9fd6ff");   // light blue
    grd.addColorStop(0.52, "#dff2ff");   // bright highlight band
    grd.addColorStop(0.72, "#33b6ff");   // sky blue
    grd.addColorStop(1.00, "#0a3a7a");   // deep blue
    g.fillStyle = grd; g.fillRect(0, 0, 512, 256);
    const rg = g.createRadialGradient(370, 64, 0, 370, 64, 130);
    rg.addColorStop(0, "rgba(255,255,255,0.95)"); rg.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = rg; g.fillRect(0, 0, 512, 256);
    const t = new THREE.CanvasTexture(c);
    t.mapping = THREE.EquirectangularReflectionMapping;
    return t;
  }
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromEquirectangular(envTexture()).texture;
  scene.environment = env;

  // ---- the blob -------------------------------------------------------
  const RAD = 1.2;
  const geo = new THREE.IcosahedronGeometry(RAD, 16);    // smooth enough for big folds
  const basePos = geo.attributes.position.array.slice(); // rest positions
  const nVerts = geo.attributes.position.count;

  // per-vertex gradient through the bloom palette (mapped along a diagonal)
  const stops = [
    [0.00, new THREE.Color(0xe6f4ff)],   // near-white blue
    [0.30, new THREE.Color(0x9fd9ff)],   // light blue
    [0.55, new THREE.Color(0x4fc6ff)],   // sky blue
    [0.78, new THREE.Color(0x22b8ff)],   // cyan
    [1.00, new THREE.Color(0x7fe3e0)],   // light teal
  ];
  function ramp(t) {
    t = Math.max(0, Math.min(1, t));
    for (let i = 1; i < stops.length; i++) {
      if (t <= stops[i][0]) { const a = stops[i-1], b = stops[i]; return a[1].clone().lerp(b[1], (t - a[0]) / (b[0] - a[0])); }
    }
    return stops[stops.length - 1][1].clone();
  }
  const vcol = new Float32Array(nVerts * 3), cc = new THREE.Color();
  for (let i = 0; i < nVerts; i++) {
    const x = basePos[i*3], y = basePos[i*3+1];
    cc.copy(ramp(((x + y) / (RAD * 2)) * 0.5 + 0.5));
    vcol[i*3] = cc.r; vcol[i*3+1] = cc.g; vcol[i*3+2] = cc.b;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(vcol, 3));

  const mat = new THREE.MeshPhysicalMaterial({
    vertexColors: true, color: 0xffffff, metalness: 0.5, roughness: 0.24,
    clearcoat: 1.0, clearcoatRoughness: 0.3, envMap: env, envMapIntensity: 1.45,
  });
  const blob = new THREE.Mesh(geo, mat);
  scene.add(blob);

  scene.add(new THREE.AmbientLight(0x3a5a88, 0.8));
  const key = new THREE.DirectionalLight(0xeaf6ff, 2.4); key.position.set(2, 3, 4); scene.add(key);
  const rim = new THREE.PointLight(0x22b8ff, 26, 24);    rim.position.set(-3, -1.5, 2); scene.add(rim);
  const warm = new THREE.PointLight(0x7fe3e0, 12, 18);   warm.position.set(2, -3, -1); scene.add(warm);

  function resize() { const s = Math.max(1, wrap.clientWidth); renderer.setSize(s, s, false); }
  resize();
  window.addEventListener("resize", resize, { passive: true });

  // pointer → lean the blob
  let px = 0, py = 0;
  wrap.addEventListener("pointermove", (e) => {
    const b = wrap.getBoundingClientRect();
    px = ((e.clientX - b.left) / b.width - 0.5) * 2;
    py = ((e.clientY - b.top) / b.height - 0.5) * 2;
  });
  wrap.addEventListener("pointerleave", () => { px = 0; py = 0; });

  // pseudo-noise displacement
  function displace(time, amp) {
    const pos = geo.attributes.position.array;
    for (let i = 0; i < nVerts; i++) {
      const ix = i * 3, iy = ix + 1, iz = ix + 2;
      const bx = basePos[ix], by = basePos[iy], bz = basePos[iz];
      // multi-octave, domain-rotating noise → big flowing folds (liquid, not a ball)
      const n =
        Math.sin(bx * 1.4 + time)       * Math.cos(by * 1.6 - time * 0.7) +
        Math.sin(by * 2.2 + time * 1.1) * Math.cos(bz * 1.9 + time * 0.5) * 0.7 +
        Math.sin(bz * 1.7 - time * 0.9) * Math.cos(bx * 2.1 + time * 1.3) * 0.6 +
        Math.sin((bx + by + bz) * 2.7 + time * 1.8) * 0.4;
      const k = 1 + (n * amp) / 2.7;
      pos[ix] = bx * k; pos[iy] = by * k; pos[iz] = bz * k;
    }
    geo.attributes.position.needsUpdate = true;
    geo.computeVertexNormals();
  }

  let onScreen = false;
  new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; }).observe(wrap);

  let t = 0;
  function tick() {
    requestAnimationFrame(tick);
    if (!onScreen) return;
    t += 0.014;
    displace(t, 0.6);
    blob.rotation.y += 0.004;
    blob.rotation.x += (py * 0.5 - blob.rotation.x) * 0.05;
    blob.rotation.z += (-px * 0.4 - blob.rotation.z) * 0.05;
    renderer.render(scene, camera);
  }
  displace(0, 0.6);
  renderer.render(scene, camera);
  if (!reduce) requestAnimationFrame(tick);
} catch (e) {
  console.warn("Alebex orb fell back to CSS:", e && e.message);
  wrap.classList.add("is-fallback");
}
