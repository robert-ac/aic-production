/* A small perspective renderer for the conceptual AIC model on the home page. */
const viewer = document.querySelector('.aic-model');
const canvas = viewer?.querySelector('canvas');
const context = canvas?.getContext('2d');

if (viewer && canvas && context) {
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const controls = [...viewer.querySelectorAll('[data-level]')];
  const destinations = [...viewer.querySelectorAll('.aic-model__destination')];
  const colors = ['87d8ff', '75e4e7', '668eff', '94aaff'];
  const levels = [1.58, .54, -.52, -1.62];
  const pointer = { x: 0, y: 0 };
  let active = 0;
  let width = 0, height = 0, dpr = 1;
  let yaw = -.61, pitch = .46;
  let offsets = levels.map(() => 0);
  let frame = 0;
  let inView = true;

  const shade = (color, opacity = 1) => '#' + color + Math.round(255 * opacity).toString(16).padStart(2, '0');

  function paint() {
    frame = 0;
    const wantedYaw = -.61 + pointer.x * .27;
    const wantedPitch = .46 + pointer.y * .14;
    const ease = motion.matches ? 1 : .16;
    yaw += (wantedYaw - yaw) * ease;
    pitch += (wantedPitch - pitch) * ease;
    offsets = offsets.map((offset, index) => offset + ((index === active ? .23 : 0) - offset) * ease);
    const sx = Math.sin(yaw), cx = Math.cos(yaw), sy = Math.sin(pitch), cy = Math.cos(pitch);
    const scale = Math.min(width / 8.8, height / 7.2);
    const project = ([x, y, z]) => {
      const a = x * cx - z * sx;
      const b = x * sx + z * cx;
      const depth = y * sy + b * cy;
      const perspective = 13 / (13 - depth);
      return [width * .5 + scale * a * perspective, height * .47 + scale * (-y * cy + b * sy) * perspective, depth];
    };
    const faces = [], strokes = [];
    const addLine = (points, color, size = 1, dash = []) => strokes.push({ points: points.map(project), color, size, dash });

    function cuboid(x, y, z, w, h, d, fills, edge) {
      const v = [
        [x - w/2,y - h/2,z - d/2], [x + w/2,y - h/2,z - d/2],
        [x + w/2,y + h/2,z - d/2], [x - w/2,y + h/2,z - d/2],
        [x - w/2,y - h/2,z + d/2], [x + w/2,y - h/2,z + d/2],
        [x + w/2,y + h/2,z + d/2], [x - w/2,y + h/2,z + d/2],
      ].map(project);
      const sides = [[0,1,2,3],[5,4,7,6],[4,0,3,7],[1,5,6,2],[3,2,6,7],[4,5,1,0]];
      sides.forEach((face, index) => {
        const polygon = face.map(point => v[point]);
        const [a,b,c] = polygon;
        if ((b[0]-a[0])*(c[1]-a[1]) - (b[1]-a[1])*(c[0]-a[0]) <= 0) return;
        faces.push({ polygon, depth: polygon.reduce((sum, point) => sum + point[2], 0) / 4, fill: fills[index], edge });
      });
    }

    context.setTransform(dpr,0,0,dpr,0,0);
    context.clearRect(0,0,width,height);
    const floor = -2.24;
    for (let i = -5; i <= 5; i++) {
      addLine([[-5,floor,i],[5,floor,i]], '#457dac28');
      addLine([[i,floor,-5],[i,floor,5]], '#457dac28');
    }
    for (const [x, z] of [[-2.64,-1.39],[2.64,-1.39],[2.64,1.39],[-2.64,1.39]]) {
      addLine([[x,floor,z],[x,2.17,z]], '#8ecaff3e', .8, [3, 6]);
    }

    levels.forEach((base, index) => {
      const y = base + offsets[index];
      const color = colors[index];
      const selected = index === active;
      const w = 4.85 - index * .16, d = 2.63 - index * .08;
      const edge = shade(color, selected ? .96 : .55);
      cuboid(0, y - .08, 0, w + .42, .16, d + .38, ['#081a31','#0b2543','#103553','#0a2847','#244e73','#071830'], edge);
      cuboid(0, y + .025, 0, w, .06, d, ['#153052','#173a5c','#204569','#133557',selected ? '#245375' : '#153452','#142c4c'], shade(color, .52));
      const ribs = 12;
      for (let i = 0; i < ribs; i++) {
        const x = i * (w - .35) / (ribs - 1) - (w - .35) / 2;
        addLine([[x,y - .061,d/2 + .193],[x,y - .12,d/2 + .193]], shade(color, selected ? .62 : .27), .75);
      }
      for (let i = 0; i < 4; i++) {
        const x = -1.7 + i * 1.1;
        const tall = index === 1 ? .24 + (i % 2) * .09 : .32 + ((i + index) % 3) * .09;
        const z = i % 2 ? -.35 : .04;
        cuboid(x,y+.06+tall/2,z,.66,tall,1.02,
          ['#153650','#193c59','#285779','#103154',shade(color, selected ? .38 : .24),'#0b2642'], shade(color, selected ? .74 : .34));
        for (let j = -1; j <= 1; j++) {
          addLine([[x+j*.14,y+.06+tall*.19,z+.515],[x+j*.14,y+.06+tall*.79,z+.515]],shade(color, selected ? .47 : .25),.8);
        }
      }
      const route = [[-2.17,y+.065,.9],[-1.2,y+.065,.9],[-.75,y+.065,.61],[1.48,y+.065,.61],[1.96,y+.065,.92],[2.17,y+.065,.92]];
      addLine(route,shade(color,selected ? .95 : .4),selected ? 1.8 : .85);
    });

    function line({points,color,size,dash}) {
      context.beginPath();
      points.forEach(([x,y], index) => index ? context.lineTo(x,y) : context.moveTo(x,y));
      context.strokeStyle = color;
      context.lineWidth = size;
      context.setLineDash(dash);
      context.stroke();
      context.setLineDash([]);
    }
    // Draw the architectural grid and axes beneath the solid faces.
    strokes.splice(0, 26).forEach(line);
    faces.sort((a,b) => a.depth - b.depth).forEach(({polygon, fill, edge}) => {
      context.beginPath();
      polygon.forEach(([x,y], index) => index ? context.lineTo(x,y) : context.moveTo(x,y));
      context.closePath();
      context.fillStyle = fill;
      context.fill();
      context.strokeStyle = edge;
      context.lineWidth = .7;
      context.stroke();
    });
    strokes.forEach(line);
    if (Math.abs(yaw - wantedYaw) + Math.abs(pitch - wantedPitch) > .002 ||
        offsets.some((offset, index) => Math.abs(offset - (index === active ? .23 : 0)) > .003)) wake();
  }

  function wake() {
    if (!frame && width && inView && !document.hidden) frame = requestAnimationFrame(paint);
  }

  function resize() {
    const size = canvas.getBoundingClientRect();
    const pixelRatio = Math.min(devicePixelRatio || 1, 2);
    if (!size.width || !size.height || (width === size.width && height === size.height && dpr === pixelRatio)) return;
    if (frame) cancelAnimationFrame(frame);
    width = size.width;
    height = size.height;
    dpr = pixelRatio;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    paint();
  }

  controls.forEach((button, index) => {
    button.addEventListener('click', () => {
      active = index;
      controls.forEach((control, i) => control.setAttribute('aria-pressed', String(i === index)));
      destinations.forEach((link, i) => { link.hidden = i !== index; });
      wake();
    });
  });
  viewer.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse' || motion.matches) return;
    const rect = canvas.getBoundingClientRect();
    pointer.x = Math.max(-1, Math.min(1, 2 * (event.clientX - rect.left) / width - 1));
    pointer.y = Math.max(-1, Math.min(1, 2 * (event.clientY - rect.top) / height - 1));
    wake();
  }, { passive: true });
  viewer.addEventListener('pointerleave', () => {
    pointer.x = pointer.y = 0;
    wake();
  });
  motion.addEventListener('change', () => {
    pointer.x = pointer.y = 0;
    wake();
  });
  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    wake();
  }).observe(viewer);
  document.addEventListener('visibilitychange', wake);
  resize();
  viewer.classList.add('aic-model--ready');
  viewer.querySelector('.aic-model__controls').hidden = false;
  destinations.forEach((link, index) => { link.hidden = index !== 0; });
}
