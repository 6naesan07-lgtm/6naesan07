import * as THREE from 'three';

export interface Materials3D {
  deckPlank: THREE.MeshStandardMaterial;
  quarterDeck: THREE.MeshStandardMaterial;
  hullWood: THREE.MeshStandardMaterial;
  hullTrim: THREE.MeshStandardMaterial;
  brass: THREE.MeshStandardMaterial;
  iron: THREE.MeshStandardMaterial;
  sail: THREE.MeshStandardMaterial;
  rope: THREE.MeshStandardMaterial;
  lanternGlow: THREE.MeshStandardMaterial;
  ocean: THREE.MeshStandardMaterial;
  foam: THREE.MeshBasicMaterial;
  captainCoat: THREE.MeshStandardMaterial;
  captainTrim: THREE.MeshStandardMaterial;
  captainSkin: THREE.MeshStandardMaterial;
  captainCape: THREE.MeshStandardMaterial;
  captainHat: THREE.MeshStandardMaterial;
  captainShadow: THREE.MeshBasicMaterial;
  cutlassBlade: THREE.MeshStandardMaterial;
  cutlassEmpowered: THREE.MeshStandardMaterial;
  cutlassBerserk: THREE.MeshStandardMaterial;
  krakenSkin: THREE.MeshStandardMaterial;
  krakenEye: THREE.MeshStandardMaterial;
  krakenPupil: THREE.MeshBasicMaterial;
  tentacleBody: THREE.MeshStandardMaterial;
  tentacleHit: THREE.MeshStandardMaterial;
  sucker: THREE.MeshStandardMaterial;
  cutRing: THREE.MeshStandardMaterial;
  cutCore: THREE.MeshBasicMaterial;
  telegraphDanger: THREE.MeshBasicMaterial;
  telegraphBorder: THREE.MeshBasicMaterial;
  inkOrb: THREE.MeshStandardMaterial;
  inkRing: THREE.MeshBasicMaterial;
  pearlHeal: THREE.MeshStandardMaterial;
  goldScale: THREE.MeshStandardMaterial;
  slashNormal: THREE.MeshBasicMaterial;
  slashEmpowered: THREE.MeshBasicMaterial;
  skillWhirlwind: THREE.MeshBasicMaterial;
  skillWhirlwindCore: THREE.MeshBasicMaterial;
  skillWave: THREE.MeshBasicMaterial;
  skillWaveCore: THREE.MeshBasicMaterial;
  skillCleaverGold: THREE.MeshStandardMaterial;
  skillCleaverDome: THREE.MeshBasicMaterial;
  skillCleaverBeam: THREE.MeshBasicMaterial;
  skillFrostGlow: THREE.MeshBasicMaterial;
  skillFrostDome: THREE.MeshBasicMaterial;
  skillTimeGlow: THREE.MeshBasicMaterial;
  skillTimeDome: THREE.MeshBasicMaterial;
  skillGalaxyGlow: THREE.MeshBasicMaterial;
  skillGalaxyDome: THREE.MeshBasicMaterial;
  skillPhoenixGlow: THREE.MeshBasicMaterial;
  skillPhoenixDome: THREE.MeshBasicMaterial;
  skillThunderBeam: THREE.MeshBasicMaterial;
  skillVortexGlow: THREE.MeshBasicMaterial;
  skillVenomWave: THREE.MeshBasicMaterial;
  skillDragonWave: THREE.MeshBasicMaterial;
  skillTsunamiWave: THREE.MeshBasicMaterial;
  skillCreatorGlow: THREE.MeshBasicMaterial;
  skillCreatorDome: THREE.MeshBasicMaterial;
  skillDivineGlow: THREE.MeshBasicMaterial;
  skillDivineDome: THREE.MeshBasicMaterial;
  customSkillGlow: THREE.MeshBasicMaterial;
  customSkillDome: THREE.MeshBasicMaterial;
  domainGlow: THREE.MeshBasicMaterial;
  domainDome: THREE.MeshBasicMaterial;
  ghostTrail: THREE.MeshBasicMaterial;
  particle: THREE.MeshBasicMaterial;
  dispose: () => void;
}

function createWoodPlankTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#5c3c22';
    ctx.fillRect(0, 0, 512, 512);

    const plankRows = 8;
    const rowH = 512 / plankRows;
    for (let r = 0; r < plankRows; r++) {
      const y = r * rowH;
      const shade = ((r * 37) % 18) - 9;
      ctx.fillStyle = `rgb(${94 + shade}, ${61 + Math.round(shade * 0.6)}, ${35 + Math.round(shade * 0.4)})`;
      ctx.fillRect(0, y + 2, 512, rowH - 3);

      // Subtle wood grain streaks
      ctx.strokeStyle = 'rgba(42, 24, 12, 0.25)';
      ctx.lineWidth = 1.5;
      for (let g = 0; g < 6; g++) {
        const gy = y + 8 + ((g * 11 + r * 5) % (rowH - 14));
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.bezierCurveTo(170, gy + ((r % 2) * 3 - 1.5), 340, gy - ((r % 2) * 2 - 1), 512, gy);
        ctx.stroke();
      }

      // Plank horizontal seam
      ctx.fillStyle = '#24140a';
      ctx.fillRect(0, y, 512, 2.5);

      // Staggered vertical plank joints & brass/iron nails
      const jointX = ((r * 173 + 64) % 420) + 46;
      ctx.fillRect(jointX, y, 2.5, rowH);

      ctx.fillStyle = '#1b1109';
      ctx.beginPath();
      ctx.arc(jointX - 9, y + rowH * 0.3, 2.2, 0, Math.PI * 2);
      ctx.arc(jointX - 9, y + rowH * 0.7, 2.2, 0, Math.PI * 2);
      ctx.arc(jointX + 11, y + rowH * 0.3, 2.2, 0, Math.PI * 2);
      ctx.arc(jointX + 11, y + rowH * 0.7, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(5, 3);
  return tex;
}

function createHullWoodTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#382112';
    ctx.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 256; y += 32) {
      ctx.fillStyle = y % 64 === 0 ? '#402615' : '#351f10';
      ctx.fillRect(0, y + 2, 256, 29);
      ctx.fillStyle = '#1d0f07';
      ctx.fillRect(0, y, 256, 2.5);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 2);
  return tex;
}

function createKrakenSkinTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, '#eaeaea');
    grad.addColorStop(0.5, '#c4c4c4');
    grad.addColorStop(1, '#989898');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    for (let i = 0; i < 90; i++) {
      const x = (i * 73) % 256;
      const y = (i * 137) % 256;
      const r = 4 + (i % 9);
      ctx.fillStyle = i % 3 === 0 ? 'rgba(255, 255, 255, 0.25)' : 'rgba(20, 24, 38, 0.26)';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export function createMaterials3D(maxAnisotropy: number): Materials3D {
  const deckTex = createWoodPlankTexture();
  deckTex.anisotropy = maxAnisotropy;

  const hullTex = createHullWoodTexture();
  hullTex.anisotropy = maxAnisotropy;

  const krakenTex = createKrakenSkinTexture();
  krakenTex.anisotropy = maxAnisotropy;

  const textures = [deckTex, hullTex, krakenTex];

  const deckPlank = new THREE.MeshStandardMaterial({
    map: deckTex,
    roughness: 0.84,
    metalness: 0.04,
  });

  const quarterDeck = new THREE.MeshStandardMaterial({
    map: deckTex,
    color: new THREE.Color('#c8a888'),
    roughness: 0.82,
    metalness: 0.05,
  });

  const hullWood = new THREE.MeshStandardMaterial({
    map: hullTex,
    roughness: 0.88,
    metalness: 0.05,
  });

  const hullTrim = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#2b170c'),
    roughness: 0.78,
    metalness: 0.08,
  });

  const brass = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#d99b38'),
    roughness: 0.28,
    metalness: 0.86,
  });

  const iron = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#334155'),
    roughness: 0.42,
    metalness: 0.78,
  });

  const sail = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#e6dfd0'),
    roughness: 0.92,
    metalness: 0.0,
    side: THREE.DoubleSide,
  });

  const rope = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#9a7b56'),
    roughness: 0.95,
    metalness: 0.0,
  });

  const lanternGlow = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#fde68a'),
    emissive: new THREE.Color('#f59e0b'),
    emissiveIntensity: 1.6,
    roughness: 0.3,
  });

  const ocean = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#07223a'),
    roughness: 0.2,
    metalness: 0.14,
    flatShading: true,
  });

  const foam = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#7dd3fc'),
    transparent: true,
    opacity: 0.28,
    depthWrite: false,
  });

  const captainCoat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#1d4ed8'),
    roughness: 0.65,
    metalness: 0.1,
  });

  const captainTrim = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#fbbf24'),
    roughness: 0.32,
    metalness: 0.75,
  });

  const captainSkin = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#f1c29b'),
    roughness: 0.72,
    metalness: 0.02,
  });

  const captainCape = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#b91c1c'),
    roughness: 0.8,
    metalness: 0.05,
    side: THREE.DoubleSide,
  });

  const captainHat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#1e293b'),
    roughness: 0.72,
    metalness: 0.1,
  });

  const captainShadow = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#020617'),
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
  });

  const cutlassBlade = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#e2e8f0'),
    emissive: new THREE.Color('#38bdf8'),
    emissiveIntensity: 0.25,
    roughness: 0.18,
    metalness: 0.92,
  });

  const cutlassEmpowered = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#fef08a'),
    emissive: new THREE.Color('#f59e0b'),
    emissiveIntensity: 1.4,
    roughness: 0.15,
    metalness: 0.85,
  });

  const cutlassBerserk = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#ffe4e6'),
    emissive: new THREE.Color('#f43f5e'),
    emissiveIntensity: 1.9,
    roughness: 0.12,
    metalness: 0.88,
  });

  const krakenSkin = new THREE.MeshStandardMaterial({
    map: krakenTex,
    color: new THREE.Color('#4c2876'),
    roughness: 0.48,
    metalness: 0.12,
  });

  const krakenEye = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#fde047'),
    emissive: new THREE.Color('#f59e0b'),
    emissiveIntensity: 1.2,
    roughness: 0.2,
  });

  const krakenPupil = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#090d16'),
  });

  const tentacleBody = new THREE.MeshStandardMaterial({
    map: krakenTex,
    color: new THREE.Color('#7c5cbf'),
    roughness: 0.42,
    metalness: 0.14,
  });

  const tentacleHit = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#ffffff'),
    emissive: new THREE.Color('#fbbf24'),
    emissiveIntensity: 0.9,
    roughness: 0.3,
  });

  const sucker = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#c4b5fd'),
    roughness: 0.52,
    metalness: 0.06,
  });

  const cutRing = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#fde047'),
    emissive: new THREE.Color('#f59e0b'),
    emissiveIntensity: 1.8,
    roughness: 0.2,
    metalness: 0.5,
  });

  const cutCore = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#fef08a'),
    transparent: true,
    opacity: 0.85,
  });

  const telegraphDanger = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#ef4444'),
    transparent: true,
    opacity: 0.28,
    side: THREE.DoubleSide,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
  });

  const telegraphBorder = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#fca5a5'),
    transparent: true,
    opacity: 0.72,
    side: THREE.DoubleSide,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -3,
  });

  const inkOrb = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#1e1b4b'),
    emissive: new THREE.Color('#4f46e5'),
    emissiveIntensity: 0.85,
    roughness: 0.22,
    metalness: 0.3,
  });

  const inkRing = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#a5b4fc'),
    transparent: true,
    opacity: 0.75,
    side: THREE.DoubleSide,
  });

  const pearlHeal = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#6ee7b7'),
    emissive: new THREE.Color('#10b981'),
    emissiveIntensity: 1.1,
    roughness: 0.16,
    metalness: 0.25,
  });

  const goldScale = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#fde047'),
    emissive: new THREE.Color('#f59e0b'),
    emissiveIntensity: 1.0,
    roughness: 0.22,
    metalness: 0.85,
  });

  const slashNormal = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#7dd3fc'),
    transparent: true,
    opacity: 0.82,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const slashEmpowered = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#fbbf24'),
    transparent: true,
    opacity: 0.92,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const skillWhirlwind = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#38bdf8'),
    transparent: true,
    opacity: 0.82,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const skillWhirlwindCore = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#e0f2fe'),
    transparent: true,
    opacity: 0.9,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const skillWave = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#38bdf8'),
    transparent: true,
    opacity: 0.88,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const skillWaveCore = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#f0f9ff'),
    transparent: true,
    opacity: 0.95,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const skillCleaverGold = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#fde047'),
    emissive: new THREE.Color('#f59e0b'),
    emissiveIntensity: 1.45,
    roughness: 0.18,
    metalness: 0.8,
    transparent: true,
    opacity: 0.95,
  });

  const skillCleaverDome = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#fbbf24'),
    transparent: true,
    opacity: 0.36,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const skillCleaverBeam = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#fef08a'),
    transparent: true,
    opacity: 0.5,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const skillFrostGlow = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#7dd3fc'),
    transparent: true,
    opacity: 0.9,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const skillFrostDome = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#38bdf8'),
    transparent: true,
    opacity: 0.34,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const skillTimeGlow = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#5eead4'),
    transparent: true,
    opacity: 0.92,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const skillTimeDome = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#14b8a6'),
    transparent: true,
    opacity: 0.3,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const skillGalaxyGlow = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#e879f9'),
    transparent: true,
    opacity: 0.92,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const skillGalaxyDome = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#a855f7'),
    transparent: true,
    opacity: 0.35,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const skillPhoenixGlow = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#fb923c'),
    transparent: true,
    opacity: 0.92,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const skillPhoenixDome = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#f97316'),
    transparent: true,
    opacity: 0.38,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const skillThunderBeam = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#c084fc'),
    transparent: true,
    opacity: 0.95,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const skillVortexGlow = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#a78bfa'),
    transparent: true,
    opacity: 0.9,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const skillVenomWave = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#34d399'),
    transparent: true,
    opacity: 0.9,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const skillDragonWave = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#f97316'),
    transparent: true,
    opacity: 0.92,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const skillTsunamiWave = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#2dd4bf'),
    transparent: true,
    opacity: 0.9,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const skillCreatorGlow = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#4ade80'),
    transparent: true,
    opacity: 0.92,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const skillCreatorDome = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#22c55e'),
    transparent: true,
    opacity: 0.34,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const skillDivineGlow = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#fef08a'),
    transparent: true,
    opacity: 0.95,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const skillDivineDome = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#fde047'),
    transparent: true,
    opacity: 0.36,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const customSkillGlow = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#38bdf8'),
    transparent: true,
    opacity: 0.88,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const customSkillDome = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#38bdf8'),
    transparent: true,
    opacity: 0.4,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const domainGlow = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#38bdf8'),
    transparent: true,
    opacity: 0.9,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const domainDome = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#38bdf8'),
    transparent: true,
    opacity: 0.24,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const ghostTrail = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#38bdf8'),
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
  });

  const particle = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#ffffff'),
    transparent: true,
    opacity: 0.92,
  });

  const materialsList: THREE.Material[] = [
    deckPlank,
    quarterDeck,
    hullWood,
    hullTrim,
    brass,
    iron,
    sail,
    rope,
    lanternGlow,
    ocean,
    foam,
    captainCoat,
    captainTrim,
    captainSkin,
    captainCape,
    captainHat,
    captainShadow,
    cutlassBlade,
    cutlassEmpowered,
    cutlassBerserk,
    krakenSkin,
    krakenEye,
    krakenPupil,
    tentacleBody,
    tentacleHit,
    sucker,
    cutRing,
    cutCore,
    telegraphDanger,
    telegraphBorder,
    inkOrb,
    inkRing,
    pearlHeal,
    goldScale,
    slashNormal,
    slashEmpowered,
    skillWhirlwind,
    skillWhirlwindCore,
    skillWave,
    skillWaveCore,
    skillCleaverGold,
    skillCleaverDome,
    skillCleaverBeam,
    skillFrostGlow,
    skillFrostDome,
    skillTimeGlow,
    skillTimeDome,
    skillGalaxyGlow,
    skillGalaxyDome,
    skillPhoenixGlow,
    skillPhoenixDome,
    skillThunderBeam,
    skillVortexGlow,
    skillVenomWave,
    skillDragonWave,
    skillTsunamiWave,
    skillCreatorGlow,
    skillCreatorDome,
    skillDivineGlow,
    skillDivineDome,
    customSkillGlow,
    customSkillDome,
    domainGlow,
    domainDome,
    ghostTrail,
    particle,
  ];

  return {
    deckPlank,
    quarterDeck,
    hullWood,
    hullTrim,
    brass,
    iron,
    sail,
    rope,
    lanternGlow,
    ocean,
    foam,
    captainCoat,
    captainTrim,
    captainSkin,
    captainCape,
    captainHat,
    captainShadow,
    cutlassBlade,
    cutlassEmpowered,
    cutlassBerserk,
    krakenSkin,
    krakenEye,
    krakenPupil,
    tentacleBody,
    tentacleHit,
    sucker,
    cutRing,
    cutCore,
    telegraphDanger,
    telegraphBorder,
    inkOrb,
    inkRing,
    pearlHeal,
    goldScale,
    slashNormal,
    slashEmpowered,
    skillWhirlwind,
    skillWhirlwindCore,
    skillWave,
    skillWaveCore,
    skillCleaverGold,
    skillCleaverDome,
    skillCleaverBeam,
    skillFrostGlow,
    skillFrostDome,
    skillTimeGlow,
    skillTimeDome,
    skillGalaxyGlow,
    skillGalaxyDome,
    skillPhoenixGlow,
    skillPhoenixDome,
    skillThunderBeam,
    skillVortexGlow,
    skillVenomWave,
    skillDragonWave,
    skillTsunamiWave,
    skillCreatorGlow,
    skillCreatorDome,
    skillDivineGlow,
    skillDivineDome,
    customSkillGlow,
    customSkillDome,
    domainGlow,
    domainDome,
    ghostTrail,
    particle,
    dispose: () => {
      materialsList.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
    },
  };
}
