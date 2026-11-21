import * as THREE from 'three';

export function createRoadTexture(
  roadColor: string,
  curbA: string,
  curbB: string,
  anisotropy = 4
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Asphalt base
  ctx.fillStyle = roadColor;
  ctx.fillRect(0, 0, 512, 512);

  // Subtle asphalt grain
  for (let i = 0; i < 4500; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const v = 25 + Math.floor(Math.random() * 35);
    ctx.fillStyle = `rgba(${v},${v},${v + 5},0.35)`;
    ctx.fillRect(x, y, 2, 2);
  }

  // Painted curbs on left & right edges
  const curbW = 26;
  const segH = 64;
  for (let y = 0; y < 512; y += segH) {
    const isA = (y / segH) % 2 === 0;
    ctx.fillStyle = isA ? curbA : curbB;
    ctx.fillRect(0, y, curbW, segH);
    ctx.fillRect(512 - curbW, y, curbW, segH);
  }

  // White shoulder lines
  ctx.fillStyle = 'rgba(248, 250, 252, 0.85)';
  ctx.fillRect(curbW + 6, 0, 7, 512);
  ctx.fillRect(512 - curbW - 13, 0, 7, 512);

  // Yellow dashed center lane line
  ctx.fillStyle = '#fbbf24';
  for (let y = 24; y < 512; y += 128) {
    ctx.fillRect(251, y, 10, 72);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = anisotropy;
  return tex;
}

export function createCheckeredTexture(anisotropy = 4): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  const size = 32;
  for (let y = 0; y < 128; y += size) {
    for (let x = 0; x < 256; x += size) {
      const dark = ((x / size) + (y / size)) % 2 === 0;
      ctx.fillStyle = dark ? '#0f172a' : '#f8fafc';
      ctx.fillRect(x, y, size, size);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = anisotropy;
  return tex;
}

export function createSignTexture(
  title: string,
  subtitle = 'MANILA CIRCUIT',
  bgHex = '#0f766e',
  accentHex = '#fbbf24',
  anisotropy = 4
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 160;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = bgHex;
  ctx.fillRect(0, 0, 512, 160);

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 8;
  ctx.strokeRect(10, 10, 492, 140);

  ctx.fillStyle = accentHex;
  ctx.fillRect(18, 18, 476, 16);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 44px "Chakra Petch", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(title.toUpperCase().slice(0, 20), 256, 82);

  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(subtitle.toUpperCase(), 256, 126);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = anisotropy;
  return tex;
}

export function createBuildingFacadeTexture(
  baseHex: string,
  windowHex: string,
  isGlassTower = false,
  anisotropy = 4
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, 256, 512);

  if (isGlassTower) {
    for (let y = 16; y < 500; y += 28) {
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fillRect(0, y, 256, 4);
      for (let x = 14; x < 242; x += 38) {
        const lit = Math.random() > 0.35;
        ctx.fillStyle = lit ? windowHex : 'rgba(15, 23, 42, 0.75)';
        ctx.fillRect(x, y + 6, 28, 18);
      }
    }
  } else {
    // Filipino shophouse / commercial facade with warm windows & concrete ledges
    for (let y = 24; y < 440; y += 68) {
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.fillRect(0, y + 50, 256, 8);
      for (let x = 22; x < 234; x += 56) {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(x - 2, y - 2, 36, 42);
        ctx.fillStyle = Math.random() > 0.3 ? windowHex : '#334155';
        ctx.fillRect(x + 2, y + 2, 28, 34);
      }
    }
    // Ground floor roll-up shutter
    ctx.fillStyle = '#475569';
    ctx.fillRect(18, 444, 220, 68);
    for (let ry = 452; ry < 512; ry += 10) {
      ctx.fillStyle = '#334155';
      ctx.fillRect(18, ry, 220, 3);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = anisotropy;
  return tex;
}

export function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(64, 64, 12, 64, 64, 62);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.62)');
  grad.addColorStop(0.65, 'rgba(0, 0, 0, 0.28)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createLiveryStripeTexture(
  baseColor: string,
  livery: 'solid' | 'stripes' | 'jeepney' | 'checkered',
  anisotropy = 4
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, 256, 256);

  if (livery === 'stripes') {
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(102, 0, 18, 256);
    ctx.fillRect(136, 0, 18, 256);
  } else if (livery === 'jeepney') {
    // Classic colorful Sarao jeepney side arcs & sunburst stripes
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(0, 32, 256, 22);
    ctx.fillStyle = '#06b6d4';
    ctx.fillRect(0, 60, 256, 14);
    ctx.fillStyle = '#ec4899';
    ctx.fillRect(0, 182, 256, 18);
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.moveTo(0, 128);
    ctx.lineTo(128, 96);
    ctx.lineTo(256, 128);
    ctx.lineTo(128, 160);
    ctx.closePath();
    ctx.fill();
  } else if (livery === 'checkered') {
    const s = 32;
    for (let y = 96; y < 160; y += s) {
      for (let x = 0; x < 256; x += s) {
        if (((x / s) + (y / s)) % 2 === 0) {
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(x, y, s, s);
        } else {
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(x, y, s, s);
        }
      }
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = anisotropy;
  return tex;
}
