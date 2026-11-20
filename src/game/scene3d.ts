import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { ARENA_H, ARENA_W, GameSnapshot, SHIP, shipHalfWidthAt } from './engine';
import { createMaterials3D, Materials3D } from './materials3d';
import {
  CameraMode,
  CustomDomainConfig,
  CustomMonsterConfig,
  CustomSkillConfig,
  MonsterBodyStyle,
  SwordConfig,
} from './types';

export const WORLD_SCALE = 1 / 24;

export function toWorldX(x: number): number {
  return (x - ARENA_W / 2) * WORLD_SCALE;
}

export function toWorldZ(y: number): number {
  return (y - SHIP.centerY) * WORLD_SCALE;
}

export function toWorldY(zHeight: number): number {
  return zHeight * WORLD_SCALE;
}

function detectSoftwareWebGL(): boolean {
  if (typeof document === 'undefined') return false;
  const probe = document.createElement('canvas');
  probe.width = 1;
  probe.height = 1;
  const gl = probe.getContext('webgl2') || probe.getContext('webgl');
  if (!gl) return false;
  const ext = gl.getExtension('WEBGL_debug_renderer_info');
  const rendererName = ext
    ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || '')
    : String(gl.getParameter(gl.RENDERER) || '');
  const isSw = /SwiftShader|llvmpipe|Software|Microsoft Basic Render/i.test(rendererName);
  gl.getExtension('WEBGL_lose_context')?.loseContext();
  return isSw;
}

const TENTACLE_SEGMENTS = 14;
const MAX_TENTACLE_POOL = 8;
const MAX_SEVERED_POOL = 12;
const MAX_INK_POOL = 18;
const MAX_WAVE_POOL = 40;
const MAX_SKILL_EFFECT_POOL = 36;
const MAX_SLASH_POOL = 12;
const MAX_PICKUP_POOL = 10;
const MAX_GHOST_POOL = 16;
const MAX_PARTICLES = 340;
const DOMAIN_SHADER_PARTICLE_COUNT = 360;

const DomainUnderwaterShader = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    uTime: { value: 0 },
    uIntensity: { value: 0 },
    uBurst: { value: 1 },
    uColor: { value: new THREE.Color('#38bdf8') },
    uAspect: { value: 16 / 9 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uIntensity;
    uniform float uBurst;
    uniform vec3 uColor;
    uniform float uAspect;
    varying vec2 vUv;

    void main() {
      vec2 centered = vUv - 0.5;
      vec2 aspectVec = vec2(centered.x * uAspect, centered.y);
      float dist = length(aspectVec);
      vec2 radialDir = dist > 0.0001 ? aspectVec / dist : vec2(0.0);
      radialDir.x /= max(0.5, uAspect);

      // Edge-weighted continuous underwater current distortion
      float edgeFactor = 0.42 + 0.85 * smoothstep(0.08, 0.78, dist);
      float waveX = sin(vUv.y * 16.0 + uTime * 3.1) * 0.0055
                  + cos((vUv.x + vUv.y) * 23.0 - uTime * 2.3) * 0.0032;
      float waveY = cos(vUv.x * 14.0 - uTime * 2.7) * 0.0048
                  + sin((vUv.x - vUv.y) * 21.0 + uTime * 2.1) * 0.0028;

      // Expanding activation shockwave ripple across the screen
      float ringRadius = uBurst * 1.18;
      float ringMask = exp(-pow((dist - ringRadius) * 13.0, 2.0)) * (1.0 - smoothstep(0.55, 1.0, uBurst));
      vec2 burstOffset = radialDir * ringMask * 0.028;

      vec2 offset = (vec2(waveX, waveY) * edgeFactor + burstOffset) * uIntensity;
      vec2 baseUv = clamp(vUv + offset, 0.002, 0.998);

      // Subtle underwater chromatic refraction near edges & shockwave crest
      float dispAmt = (0.0022 * smoothstep(0.15, 0.85, dist) + ringMask * 0.007) * uIntensity;
      vec2 dispVec = radialDir * dispAmt;
      float r = texture2D(tDiffuse, clamp(baseUv + dispVec, 0.002, 0.998)).r;
      float g = texture2D(tDiffuse, baseUv).g;
      float b = texture2D(tDiffuse, clamp(baseUv - dispVec, 0.002, 0.998)).b;
      vec3 col = vec3(r, g, b);

      // Animated underwater caustic web shimmer
      float c1 = sin(baseUv.x * 20.0 + uTime * 1.85 + sin(baseUv.y * 11.0 - uTime * 1.35));
      float c2 = cos(baseUv.y * 19.0 - uTime * 2.15 + cos(baseUv.x * 13.0 + uTime * 1.65));
      float caustic = pow(max(0.0, 1.0 - abs(c1 + c2) * 0.52), 3.0);

      // Submerged depth tint + caustic highlight + activation ring flash + abyssal border vignette
      vec3 deepTint = mix(vec3(1.0), uColor * 0.78 + vec3(0.16, 0.36, 0.48), 0.38);
      col = mix(col, col * deepTint, uIntensity * 0.65);

      vec3 causticColor = mix(uColor, vec3(0.72, 0.96, 1.0), 0.45);
      col += causticColor * caustic * (0.08 + 0.10 * smoothstep(0.15, 0.85, dist)) * uIntensity;
      col += mix(uColor, vec3(1.0), 0.5) * ringMask * 0.28 * uIntensity;

      float vignette = smoothstep(0.32, 0.96, dist) * 0.36 * uIntensity;
      col = mix(col, uColor * 0.22 + vec3(0.01, 0.04, 0.09), vignette);

      gl_FragColor = vec4(col, 1.0);
    }
  `,
};

interface TentacleVisual {
  group: THREE.Group;
  segments: THREE.Mesh[];
  suckers: THREE.Mesh[];
  cutGroup: THREE.Group;
  cutRing: THREE.Mesh;
  cutCore: THREE.Mesh;
  telegraphGroup: THREE.Group;
  telegraphCircle: THREE.Mesh;
  telegraphLine: THREE.Mesh;
  telegraphArc: THREE.Mesh;
}

interface SlashVisual {
  group: THREE.Group;
  outerArc: THREE.Mesh;
  innerArc: THREE.Mesh;
}

interface SwordWaveVisual {
  group: THREE.Group;
  outerBlade: THREE.Mesh;
  innerBlade: THREE.Mesh;
  wakeMesh: THREE.Mesh;
}

interface SkillEffectVisual {
  group: THREE.Group;
  whirlwindRing1: THREE.Mesh;
  whirlwindRing2: THREE.Mesh;
  whirlwindCyclone: THREE.Mesh;
  cleaverSword: THREE.Group;
  cleaverDome: THREE.Mesh;
  cleaverBeam: THREE.Mesh;
  cleaverImpactRing: THREE.Mesh;
  rushBeam: THREE.Mesh;
}

interface PickupVisual {
  group: THREE.Group;
  mesh: THREE.Mesh;
  halo: THREE.Mesh;
}

interface InkVisual {
  group: THREE.Group;
  orb: THREE.Mesh;
  ring: THREE.Mesh;
}

// Pre-allocated scratch objects to avoid per-frame GC churn
const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _v3 = new THREE.Vector3();
const _vMid = new THREE.Vector3();
const _vDir = new THREE.Vector3();
const _up = new THREE.Vector3(0, 1, 0);
const _quat = new THREE.Quaternion();
const _mat4 = new THREE.Matrix4();
const _scale = new THREE.Vector3();
const _color = new THREE.Color();
const _raycaster = new THREE.Raycaster();
const _ndc = new THREE.Vector2();
const _deckPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.4);
const _intersectPt = new THREE.Vector3();
const _baseBgColor = new THREE.Color('#061320');
const _domainBgTarget = new THREE.Color('#061320');
const _domainTintColor = new THREE.Color('#38bdf8');

export class KrakenScene3D {
  public readonly isSoftware: boolean;
  public readonly renderer: THREE.WebGLRenderer;
  public readonly scene: THREE.Scene;
  public readonly camera: THREE.PerspectiveCamera;

  private container: HTMLElement;
  private materials: Materials3D;
  private pmremGenerator: THREE.PMREMGenerator;
  private envRenderTarget: THREE.WebGLRenderTarget;
  private geometries: THREE.BufferGeometry[] = [];

  private oceanMesh!: THREE.Mesh;
  private oceanBaseZ!: Float32Array;
  private shipGroup!: THREE.Group;
  private krakenGroup!: THREE.Group;
  private monsterHeadGroups!: Record<MonsterBodyStyle, THREE.Group>;
  private krakenLeftPupil!: THREE.Mesh;
  private krakenRightPupil!: THREE.Mesh;
  private krakenCollarTentacles: THREE.Mesh[] = [];

  private captainGroup!: THREE.Group;
  private captainBodyGroup!: THREE.Group;
  private captainArmPivot!: THREE.Group;
  private captainCutlassBlade!: THREE.Mesh;
  private captainCape!: THREE.Mesh;
  private captainShadow!: THREE.Mesh;
  private orbitBladesGroup!: THREE.Group;
  private orbitBladeMeshes: THREE.Mesh[] = [];
  private divineHaloGroup!: THREE.Group;
  private divineHaloOuter!: THREE.Mesh;
  private divineHaloInner!: THREE.Mesh;
  private domainGroup!: THREE.Group;
  private domainDomeMesh!: THREE.Mesh;
  private domainRingOuter!: THREE.Mesh;
  private domainRingInner!: THREE.Mesh;
  private domainParticlesPoints!: THREE.Points;
  private domainParticleMaterial!: THREE.ShaderMaterial;

  private composer!: EffectComposer;
  private renderPass!: RenderPass;
  private domainPass!: ShaderPass;
  private outputPass!: OutputPass;
  private domainDistortionIntensity = 0;
  private domainBurstProgress = 1;
  private wasDomainActive = false;

  private tentaclePool: TentacleVisual[] = [];
  private severedPool: THREE.Mesh[] = [];
  private inkPool: InkVisual[] = [];
  private wavePool: SwordWaveVisual[] = [];
  private skillEffectPool: SkillEffectVisual[] = [];
  private slashPool: SlashVisual[] = [];
  private pickupPool: PickupVisual[] = [];
  private ghostPool: THREE.Mesh[] = [];
  private particleInstanced!: THREE.InstancedMesh;

  private cameraMode: CameraMode = 'action';
  private camPos = new THREE.Vector3(0, 16.5, 22.5);
  private camLook = new THREE.Vector3(0, 0.6, -2.0);
  private camTargetPos = new THREE.Vector3(0, 16.5, 22.5);
  private camTargetLook = new THREE.Vector3(0, 0.6, -2.0);
  private currentFov = 46;
  private pendingTimers = new Set<number>();
  private disposed = false;

  constructor(container: HTMLElement) {
    this.container = container;
    this.isSoftware = detectSoftwareWebGL();

    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftware,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.setPixelRatio(this.isSoftware ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(width, height);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.renderer.shadowMap.enabled = !this.isSoftware;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;

    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.renderer.domElement.style.display = 'block';
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#061320');
    this.scene.fog = new THREE.FogExp2(0x061320, 0.011);

    this.camera = new THREE.PerspectiveCamera(46, width / height, 0.5, 220);
    this.camera.position.copy(this.camPos);
    this.camera.lookAt(this.camLook);

    // Environment reflection for brass cannons & steel cutlass
    this.pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    const roomEnv = new RoomEnvironment();
    this.envRenderTarget = this.pmremGenerator.fromScene(roomEnv, 0.04);
    this.scene.environment = this.envRenderTarget.texture;
    roomEnv.dispose();

    const maxAniso = this.isSoftware
      ? 1
      : Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
    this.materials = createMaterials3D(maxAniso);

    this.setupLighting();
    this.buildOcean();
    this.buildGalleonShip();
    this.buildKrakenBoss();
    this.buildCaptainHero();
    this.buildDomainVisuals();
    this.buildDomainParticles();
    this.buildPools();
    this.setupPostProcessing(width, height);

    if (!this.isSoftware) {
      this.renderer.compile(this.scene, this.camera);
    }
  }

  private trackGeo<T extends THREE.BufferGeometry>(geo: T): T {
    this.geometries.push(geo);
    return geo;
  }

  private setupLighting(): void {
    const hemi = new THREE.HemisphereLight(0x88c8ff, 0x091624, 0.9);
    this.scene.add(hemi);

    const sunKey = new THREE.DirectionalLight(0xffe7c2, 1.9);
    sunKey.position.set(18, 30, 16);
    if (!this.isSoftware) {
      sunKey.castShadow = true;
      sunKey.shadow.mapSize.set(2048, 2048);
      sunKey.shadow.camera.near = 6;
      sunKey.shadow.camera.far = 90;
      sunKey.shadow.camera.left = -26;
      sunKey.shadow.camera.right = 26;
      sunKey.shadow.camera.top = 20;
      sunKey.shadow.camera.bottom = -20;
      sunKey.shadow.bias = -0.0005;
    }
    this.scene.add(sunKey);

    const abyssRim = new THREE.DirectionalLight(0x38bdf8, 0.78);
    abyssRim.position.set(-14, 14, -22);
    this.scene.add(abyssRim);

    const sternLanternLight = new THREE.PointLight(0xf59e0b, 14, 18, 1.6);
    sternLanternLight.position.set(toWorldX(SHIP.sternX + 26), 2.8, 0);
    this.scene.add(sternLanternLight);
  }

  private buildOcean(): void {
    const geo = this.trackGeo(new THREE.PlaneGeometry(180, 140, 52, 42));
    this.oceanBaseZ = new Float32Array(geo.attributes.position.count);
    for (let i = 0; i < geo.attributes.position.count; i++) {
      this.oceanBaseZ[i] = geo.attributes.position.getZ(i);
    }
    this.oceanMesh = new THREE.Mesh(geo, this.materials.ocean);
    this.oceanMesh.rotation.x = -Math.PI / 2;
    this.oceanMesh.position.y = -1.45;
    this.oceanMesh.receiveShadow = !this.isSoftware;
    this.scene.add(this.oceanMesh);
  }

  private buildGalleonShip(): void {
    this.shipGroup = new THREE.Group();
    this.scene.add(this.shipGroup);

    // 1. Extruded Galleon Hull matching SHIP & shipHalfWidthAt()
    const hullShape = new THREE.Shape();
    const xs: number[] = [];
    for (let x = SHIP.sternX; x <= SHIP.bowTipX; x += 22) xs.push(x);
    if (xs[xs.length - 1] !== SHIP.bowTipX) xs.push(SHIP.bowTipX);

    hullShape.moveTo(toWorldX(SHIP.sternX), toWorldZ(SHIP.centerY - shipHalfWidthAt(SHIP.sternX)));
    for (let i = 1; i < xs.length; i++) {
      const x = xs[i];
      hullShape.lineTo(toWorldX(x), toWorldZ(SHIP.centerY - shipHalfWidthAt(x)));
    }
    for (let i = xs.length - 1; i >= 0; i--) {
      const x = xs[i];
      hullShape.lineTo(toWorldX(x), toWorldZ(SHIP.centerY + shipHalfWidthAt(x)));
    }
    hullShape.closePath();

    // Main wood deck slab (top at y = 0, bottom at y = -2.2)
    const hullGeo = this.trackGeo(
      new THREE.ExtrudeGeometry(hullShape, {
        depth: 2.2,
        bevelEnabled: true,
        bevelThickness: 0.14,
        bevelSize: 0.14,
        bevelSegments: 2,
      }),
    );
    // Normalize UVs so plank texture tiles naturally across the ship
    const uvAttr = hullGeo.attributes.uv;
    for (let i = 0; i < uvAttr.count; i++) {
      uvAttr.setXY(i, uvAttr.getX(i) * 0.12, uvAttr.getY(i) * 0.12);
    }
    uvAttr.needsUpdate = true;

    const hullMesh = new THREE.Mesh(hullGeo, [this.materials.deckPlank, this.materials.hullWood]);
    hullMesh.rotation.x = Math.PI / 2;
    hullMesh.position.y = 0;
    hullMesh.receiveShadow = !this.isSoftware;
    hullMesh.castShadow = !this.isSoftware;
    this.shipGroup.add(hullMesh);

    // 2. Perimeter Bulwark Rails (low wooden railing so sightlines stay wide open)
    const railPostGeo = this.trackGeo(new THREE.BoxGeometry(0.24, 0.55, 0.24));
    const railBarGeo = this.trackGeo(new THREE.BoxGeometry(1.05, 0.18, 0.24));
    for (let x = SHIP.sternX + 18; x < SHIP.bowTipX - 30; x += 24) {
      const half = shipHalfWidthAt(x);
      const nextHalf = shipHalfWidthAt(x + 24);
      const wx = toWorldX(x);
      const nextWx = toWorldX(x + 24);
      const dx = nextWx - wx;

      for (const side of [-1, 1]) {
        const wz = toWorldZ(SHIP.centerY + side * half);
        const nextWz = toWorldZ(SHIP.centerY + side * nextHalf);
        const dz = nextWz - wz;
        const post = new THREE.Mesh(railPostGeo, this.materials.hullTrim);
        post.position.set(wx, 0.28, wz);
        this.shipGroup.add(post);

        const segLen = Math.hypot(dx, dz);
        const rail = new THREE.Mesh(railBarGeo, this.materials.hullTrim);
        rail.position.set((wx + nextWx) / 2, 0.52, (wz + nextWz) / 2);
        rail.scale.x = segLen;
        rail.rotation.y = -Math.atan2(dz, dx);
        this.shipGroup.add(rail);
      }
    }

    // 3. Stern Quarterdeck & Helm Wheel
    const sternDeckGeo = this.trackGeo(
      new THREE.BoxGeometry(4.2, 0.42, (SHIP.sternHalfBeam * 2 - 12) * WORLD_SCALE),
    );
    const sternDeck = new THREE.Mesh(sternDeckGeo, this.materials.quarterDeck);
    sternDeck.position.set(toWorldX(SHIP.sternX + 48), 0.21, 0);
    sternDeck.receiveShadow = !this.isSoftware;
    this.shipGroup.add(sternDeck);

    // Helm wheel
    const helmGroup = new THREE.Group();
    helmGroup.position.set(toWorldX(SHIP.sternX + 52), 1.05, 0);
    const helmPost = new THREE.Mesh(
      this.trackGeo(new THREE.BoxGeometry(0.32, 1.1, 0.45)),
      this.materials.hullTrim,
    );
    helmPost.position.set(-0.32, -0.35, 0);
    helmGroup.add(helmPost);

    const wheelRim = new THREE.Mesh(
      this.trackGeo(new THREE.TorusGeometry(0.55, 0.07, 8, 16)),
      this.materials.brass,
    );
    wheelRim.rotation.y = Math.PI / 2;
    helmGroup.add(wheelRim);

    const spokeGeo = this.trackGeo(new THREE.CylinderGeometry(0.035, 0.035, 1.35, 6));
    for (let s = 0; s < 4; s++) {
      const spoke = new THREE.Mesh(spokeGeo, this.materials.hullTrim);
      spoke.rotation.x = (s * Math.PI) / 4;
      helmGroup.add(spoke);
    }
    this.shipGroup.add(helmGroup);

    // 4. Two Stern Brass Lanterns
    const lanternGeo = this.trackGeo(new THREE.CylinderGeometry(0.24, 0.18, 0.45, 6));
    const lanternCapGeo = this.trackGeo(new THREE.ConeGeometry(0.3, 0.25, 6));
    for (const side of [-1, 1]) {
      const lGroup = new THREE.Group();
      lGroup.position.set(toWorldX(SHIP.sternX + 12), 1.45, side * 4.4);
      const pole = new THREE.Mesh(
        this.trackGeo(new THREE.CylinderGeometry(0.06, 0.06, 1.1, 6)),
        this.materials.iron,
      );
      pole.position.y = -0.55;
      lGroup.add(pole);
      const glass = new THREE.Mesh(lanternGeo, this.materials.lanternGlow);
      lGroup.add(glass);
      const cap = new THREE.Mesh(lanternCapGeo, this.materials.brass);
      cap.position.y = 0.34;
      lGroup.add(cap);
      this.shipGroup.add(lGroup);
    }

    // 5. Center Cargo Hatch Grate
    const hatchFrame = new THREE.Mesh(
      this.trackGeo(new THREE.BoxGeometry(4.2, 0.2, 3.6)),
      this.materials.hullTrim,
    );
    hatchFrame.position.set(toWorldX(510), 0.1, 0);
    hatchFrame.receiveShadow = !this.isSoftware;
    this.shipGroup.add(hatchFrame);

    const hatchInner = new THREE.Mesh(
      this.trackGeo(new THREE.BoxGeometry(3.6, 0.22, 3.0)),
      this.materials.rope,
    );
    hatchInner.position.set(toWorldX(510), 0.11, 0);
    hatchInner.receiveShadow = !this.isSoftware;
    this.shipGroup.add(hatchInner);

    // 6. Six Brass Deck Cannons (3 port, 3 starboard)
    const cannonXs = [310, 480, 650];
    const barrelGeo = this.trackGeo(new THREE.CylinderGeometry(0.18, 0.28, 1.55, 10));
    const carriageGeo = this.trackGeo(new THREE.BoxGeometry(0.95, 0.34, 0.72));
    for (const cx of cannonXs) {
      for (const side of [-1, 1]) {
        const cGroup = new THREE.Group();
        const wz = toWorldZ(SHIP.centerY + side * (shipHalfWidthAt(cx) - 22));
        cGroup.position.set(toWorldX(cx), 0.36, wz);

        const carriage = new THREE.Mesh(carriageGeo, this.materials.hullTrim);
        cGroup.add(carriage);

        const barrel = new THREE.Mesh(barrelGeo, this.materials.brass);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(0, 0.22, side * 0.48);
        barrel.castShadow = !this.isSoftware;
        cGroup.add(barrel);

        this.shipGroup.add(cGroup);
      }
    }

    // 7. Bowsprit Spar at Forward Tip
    const bowsprit = new THREE.Mesh(
      this.trackGeo(new THREE.CylinderGeometry(0.14, 0.28, 6.2, 8)),
      this.materials.hullTrim,
    );
    bowsprit.rotation.z = -Math.PI / 2 + 0.16;
    bowsprit.position.set(toWorldX(SHIP.bowTipX + 42), 0.75, 0);
    this.shipGroup.add(bowsprit);

    // 8. Two Tall Galleon Masts with High Furled Sails (high above Y=8.5 so camera view stays clean!)
    const mastConfigs = [
      { x: 325, height: 14.5, sailWidth: 7.2 },
      { x: 675, height: 13.0, sailWidth: 6.2 },
    ];
    for (const mc of mastConfigs) {
      const mGroup = new THREE.Group();
      mGroup.position.set(toWorldX(mc.x), 0, 0);

      const mast = new THREE.Mesh(
        this.trackGeo(new THREE.CylinderGeometry(0.24, 0.36, mc.height, 10)),
        this.materials.hullTrim,
      );
      mast.position.y = mc.height / 2;
      mast.castShadow = !this.isSoftware;
      mGroup.add(mast);

      // Crow's nest
      const nest = new THREE.Mesh(
        this.trackGeo(new THREE.CylinderGeometry(0.95, 0.7, 0.55, 10)),
        this.materials.hullTrim,
      );
      nest.position.y = mc.height * 0.72;
      mGroup.add(nest);

      // High yardarm & partially furled sail billowing forward
      const yard = new THREE.Mesh(
        this.trackGeo(new THREE.CylinderGeometry(0.11, 0.11, mc.sailWidth, 8)),
        this.materials.hullTrim,
      );
      yard.rotation.x = Math.PI / 2;
      yard.position.y = mc.height * 0.82;
      mGroup.add(yard);

      const furledSail = new THREE.Mesh(
        this.trackGeo(new THREE.CylinderGeometry(0.42, 0.42, mc.sailWidth * 0.88, 10)),
        this.materials.sail,
      );
      furledSail.rotation.x = Math.PI / 2;
      furledSail.position.set(0.32, mc.height * 0.79, 0);
      mGroup.add(furledSail);

      this.shipGroup.add(mGroup);
    }
  }

  private buildKrakenBoss(): void {
    this.krakenGroup = new THREE.Group();
    this.krakenGroup.position.set(0, 0.8, toWorldZ(SHIP.centerY - SHIP.halfBeam - 135));
    this.scene.add(this.krakenGroup);

    // 1. Kraken Cephalopod Head
    const krakenHead = new THREE.Group();
    const mantle = new THREE.Mesh(
      this.trackGeo(new THREE.SphereGeometry(4.4, 20, 16)),
      this.materials.krakenSkin,
    );
    mantle.scale.set(1.05, 1.45, 0.9);
    mantle.position.set(0, 3.2, 0);
    mantle.castShadow = !this.isSoftware;
    krakenHead.add(mantle);

    const finGeo = this.trackGeo(new THREE.ConeGeometry(2.1, 4.2, 6));
    for (const side of [-1, 1]) {
      const fin = new THREE.Mesh(finGeo, this.materials.krakenSkin);
      fin.position.set(side * 3.8, 5.4, -0.4);
      fin.rotation.z = side * -0.95;
      fin.scale.set(0.55, 1, 0.35);
      krakenHead.add(fin);
    }
    this.krakenGroup.add(krakenHead);

    // 2. Horned Leviathan Head
    const leviathanHead = new THREE.Group();
    leviathanHead.visible = false;
    const levSkull = new THREE.Mesh(
      this.trackGeo(new THREE.DodecahedronGeometry(4.1, 1)),
      this.materials.krakenSkin,
    );
    levSkull.scale.set(1.15, 1.15, 1.05);
    levSkull.position.set(0, 2.9, 0.2);
    leviathanHead.add(levSkull);

    const hornGeo = this.trackGeo(new THREE.ConeGeometry(0.95, 5.8, 8));
    for (const side of [-1, 1]) {
      const horn = new THREE.Mesh(hornGeo, this.materials.sucker);
      horn.position.set(side * 3.4, 5.8, -0.2);
      horn.rotation.z = side * -0.58;
      horn.rotation.x = -0.22;
      leviathanHead.add(horn);
    }
    const spikeGeo = this.trackGeo(new THREE.ConeGeometry(0.65, 2.8, 5));
    for (let s = 0; s < 3; s++) {
      const sp = new THREE.Mesh(spikeGeo, this.materials.tentacleBody);
      sp.position.set(0, 6.2 - s * 0.7, -1.0 - s * 1.1);
      sp.rotation.x = -0.45 - s * 0.25;
      leviathanHead.add(sp);
    }
    this.krakenGroup.add(leviathanHead);

    // 3. Abyss Serpent Hooded Head
    const serpentHead = new THREE.Group();
    serpentHead.visible = false;
    const serpCore = new THREE.Mesh(
      this.trackGeo(new THREE.CylinderGeometry(2.4, 3.6, 7.6, 12)),
      this.materials.krakenSkin,
    );
    serpCore.position.set(0, 3.2, -0.3);
    serpentHead.add(serpCore);

    const hood = new THREE.Mesh(
      this.trackGeo(new THREE.SphereGeometry(5.2, 16, 12)),
      this.materials.krakenSkin,
    );
    hood.scale.set(1.35, 0.95, 0.38);
    hood.position.set(0, 3.6, -1.2);
    serpentHead.add(hood);

    const crest = new THREE.Mesh(
      this.trackGeo(new THREE.OctahedronGeometry(2.1, 0)),
      this.materials.tentacleBody,
    );
    crest.scale.set(0.75, 1.8, 0.5);
    crest.position.set(0, 6.6, 0.4);
    serpentHead.add(crest);
    this.krakenGroup.add(serpentHead);

    // 4. Armored Crab Colossal Head
    const crabHead = new THREE.Group();
    crabHead.visible = false;
    const carapace = new THREE.Mesh(
      this.trackGeo(new THREE.SphereGeometry(4.8, 16, 12)),
      this.materials.krakenSkin,
    );
    carapace.scale.set(1.45, 0.92, 1.0);
    carapace.position.set(0, 3.1, -0.2);
    crabHead.add(carapace);

    const clawGeo = this.trackGeo(new THREE.ConeGeometry(1.35, 4.4, 6));
    for (const side of [-1, 1]) {
      const pincer = new THREE.Mesh(clawGeo, this.materials.tentacleBody);
      pincer.position.set(side * 5.2, 2.2, 2.4);
      pincer.rotation.x = Math.PI * 0.42;
      pincer.rotation.z = side * 0.42;
      crabHead.add(pincer);
    }
    this.krakenGroup.add(crabHead);

    this.monsterHeadGroups = {
      kraken: krakenHead,
      horned_leviathan: leviathanHead,
      abyss_serpent: serpentHead,
      armored_crab: crabHead,
    };

    // Shared Glowing Eyes + Tracking Pupils
    const eyeGeo = this.trackGeo(new THREE.SphereGeometry(0.78, 12, 10));
    const pupilGeo = this.trackGeo(new THREE.BoxGeometry(0.22, 0.92, 0.38));

    const leftEye = new THREE.Mesh(eyeGeo, this.materials.krakenEye);
    leftEye.position.set(-2.0, 2.5, 3.35);
    this.krakenGroup.add(leftEye);

    this.krakenLeftPupil = new THREE.Mesh(pupilGeo, this.materials.krakenPupil);
    this.krakenLeftPupil.position.set(-2.0, 2.5, 4.02);
    this.krakenGroup.add(this.krakenLeftPupil);

    const rightEye = new THREE.Mesh(eyeGeo, this.materials.krakenEye);
    rightEye.position.set(2.0, 2.5, 3.35);
    this.krakenGroup.add(rightEye);

    this.krakenRightPupil = new THREE.Mesh(pupilGeo, this.materials.krakenPupil);
    this.krakenRightPupil.position.set(2.0, 2.5, 4.02);
    this.krakenGroup.add(this.krakenRightPupil);

    // Undulating Collar Tentacles emerging from the waves
    const collarGeo = this.trackGeo(new THREE.ConeGeometry(0.65, 5.4, 8));
    for (let i = 0; i < 6; i++) {
      const ang = -1.15 + (i / 5) * 2.3;
      const t = new THREE.Mesh(collarGeo, this.materials.tentacleBody);
      t.position.set(Math.sin(ang) * 4.5, 0.6, Math.cos(ang) * 2.2);
      t.rotation.x = 0.35;
      t.rotation.z = -ang * 0.45;
      this.krakenGroup.add(t);
      this.krakenCollarTentacles.push(t);
    }
  }

  private buildCaptainHero(): void {
    this.captainGroup = new THREE.Group();
    this.scene.add(this.captainGroup);

    // Ground shadow disc on the deck (keeps jump height super readable!)
    this.captainShadow = new THREE.Mesh(
      this.trackGeo(new THREE.CircleGeometry(0.85, 16)),
      this.materials.captainShadow,
    );
    this.captainShadow.rotation.x = -Math.PI / 2;
    this.captainShadow.position.y = 0.04;
    this.scene.add(this.captainShadow);

    this.captainBodyGroup = new THREE.Group();
    this.captainGroup.add(this.captainBodyGroup);

    // Torso (Captain's Navy Coat)
    const torso = new THREE.Mesh(
      this.trackGeo(new THREE.CylinderGeometry(0.42, 0.54, 1.15, 10)),
      this.materials.captainCoat,
    );
    torso.position.y = 0.88;
    torso.castShadow = !this.isSoftware;
    this.captainBodyGroup.add(torso);

    // Gold Belt & Epaulettes
    const belt = new THREE.Mesh(
      this.trackGeo(new THREE.CylinderGeometry(0.49, 0.51, 0.16, 10)),
      this.materials.captainTrim,
    );
    belt.position.y = 0.58;
    this.captainBodyGroup.add(belt);

    // Boots
    const bootGeo = this.trackGeo(new THREE.CapsuleGeometry(0.16, 0.24, 4, 6));
    for (const side of [-1, 1]) {
      const boot = new THREE.Mesh(bootGeo, this.materials.captainHat);
      boot.position.set(0, 0.24, side * 0.22);
      this.captainBodyGroup.add(boot);
    }

    // Head + Tricorn Hat
    const head = new THREE.Mesh(
      this.trackGeo(new THREE.SphereGeometry(0.35, 12, 10)),
      this.materials.captainSkin,
    );
    head.position.y = 1.72;
    head.castShadow = !this.isSoftware;
    this.captainBodyGroup.add(head);

    const hatBrim = new THREE.Mesh(
      this.trackGeo(new THREE.CylinderGeometry(0.62, 0.62, 0.1, 3)),
      this.materials.captainHat,
    );
    hatBrim.position.y = 1.98;
    hatBrim.rotation.y = Math.PI / 2;
    this.captainBodyGroup.add(hatBrim);

    const hatCrown = new THREE.Mesh(
      this.trackGeo(new THREE.CylinderGeometry(0.32, 0.36, 0.32, 8)),
      this.materials.captainHat,
    );
    hatCrown.position.y = 2.1;
    this.captainBodyGroup.add(hatCrown);

    // Crimson Cape trailing behind (-X in local captain space)
    this.captainCape = new THREE.Mesh(
      this.trackGeo(new THREE.PlaneGeometry(0.9, 1.1, 2, 2)),
      this.materials.captainCape,
    );
    this.captainCape.position.set(-0.52, 0.92, 0);
    this.captainCape.rotation.y = Math.PI / 2;
    this.captainCape.rotation.x = 0.28;
    this.captainBodyGroup.add(this.captainCape);

    // Sword Arm Pivot + Cutlass (+X forward)
    this.captainArmPivot = new THREE.Group();
    this.captainArmPivot.position.set(0.15, 1.25, 0.42);
    this.captainBodyGroup.add(this.captainArmPivot);

    const hilt = new THREE.Mesh(
      this.trackGeo(new THREE.CylinderGeometry(0.06, 0.06, 0.35, 6)),
      this.materials.captainTrim,
    );
    hilt.rotation.z = Math.PI / 2;
    hilt.position.set(0.3, 0, 0);
    this.captainArmPivot.add(hilt);

    const guard = new THREE.Mesh(
      this.trackGeo(new THREE.BoxGeometry(0.09, 0.36, 0.14)),
      this.materials.captainTrim,
    );
    guard.position.set(0.48, 0, 0);
    this.captainArmPivot.add(guard);

    this.captainCutlassBlade = new THREE.Mesh(
      this.trackGeo(new THREE.BoxGeometry(1.45, 0.12, 0.04)),
      this.materials.cutlassBlade,
    );
    this.captainCutlassBlade.position.set(1.22, 0.04, 0);
    this.captainCutlassBlade.castShadow = !this.isSoftware;
    this.captainArmPivot.add(this.captainCutlassBlade);

    // 4 Orbiting 3D Spectral Blades for blade_orbit skill
    this.orbitBladesGroup = new THREE.Group();
    this.orbitBladesGroup.visible = false;
    this.scene.add(this.orbitBladesGroup);
    const orbitSwordGeo = this.trackGeo(new THREE.BoxGeometry(0.18, 0.08, 1.55));
    for (let i = 0; i < 4; i++) {
      const ang = (i * Math.PI) / 2;
      const orbSword = new THREE.Mesh(orbitSwordGeo, this.materials.skillWave);
      const r = 3.5;
      orbSword.position.set(Math.cos(ang) * r, 0.95, Math.sin(ang) * r);
      orbSword.rotation.y = -ang;
      this.orbitBladesGroup.add(orbSword);
      this.orbitBladeMeshes.push(orbSword);
    }

    // Golden Celestial Halo Aura when wielding the God Sword
    this.divineHaloGroup = new THREE.Group();
    this.divineHaloGroup.visible = false;
    this.scene.add(this.divineHaloGroup);
    const haloOuterGeo = this.trackGeo(new THREE.TorusGeometry(2.15, 0.08, 8, 32));
    const haloInnerGeo = this.trackGeo(new THREE.TorusGeometry(1.45, 0.06, 8, 28));
    this.divineHaloOuter = new THREE.Mesh(haloOuterGeo, this.materials.skillDivineGlow);
    this.divineHaloOuter.rotation.x = Math.PI / 2;
    this.divineHaloOuter.position.y = 0.25;
    this.divineHaloInner = new THREE.Mesh(haloInnerGeo, this.materials.cutCore);
    this.divineHaloInner.rotation.x = Math.PI / 2;
    this.divineHaloInner.position.y = 2.45;
    this.divineHaloGroup.add(this.divineHaloOuter, this.divineHaloInner);
  }

  private buildDomainVisuals(): void {
    this.domainGroup = new THREE.Group();
    this.domainGroup.visible = false;
    this.scene.add(this.domainGroup);

    const domeGeo = this.trackGeo(
      new THREE.SphereGeometry(1, 28, 16, 0, Math.PI * 2, 0, Math.PI * 0.52),
    );
    this.domainDomeMesh = new THREE.Mesh(domeGeo, this.materials.domainDome);
    this.domainGroup.add(this.domainDomeMesh);

    const outerRingGeo = this.trackGeo(new THREE.TorusGeometry(1, 0.022, 8, 48));
    this.domainRingOuter = new THREE.Mesh(outerRingGeo, this.materials.domainGlow);
    this.domainRingOuter.rotation.x = Math.PI / 2;
    this.domainRingOuter.position.y = 0.28;
    this.domainGroup.add(this.domainRingOuter);

    const innerRingGeo = this.trackGeo(new THREE.TorusGeometry(0.68, 0.018, 8, 40));
    this.domainRingInner = new THREE.Mesh(innerRingGeo, this.materials.domainGlow);
    this.domainRingInner.rotation.x = Math.PI / 2;
    this.domainRingInner.position.y = 0.42;
    this.domainGroup.add(this.domainRingInner);

    const pillarGeo = this.trackGeo(new THREE.CylinderGeometry(0.16, 0.28, 12, 8, 1, true));
    for (let i = 0; i < 6; i++) {
      const ang = (i * Math.PI * 2) / 6;
      const pillar = new THREE.Mesh(pillarGeo, this.materials.domainDome);
      pillar.position.set(Math.cos(ang) * 0.94, 6, Math.sin(ang) * 0.94);
      this.domainGroup.add(pillar);
    }
  }

  private buildDomainParticles(): void {
    const count = DOMAIN_SHADER_PARTICLE_COUNT;
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count * 4);
    const kinds = new Float32Array(count);
    const sizes = new Float32Array(count);

    const hash = (n: number) => {
      const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
      return s - Math.floor(s);
    };

    for (let i = 0; i < count; i++) {
      seeds[i * 4 + 0] = hash(i * 4 + 1) * Math.PI * 2; // base angle
      seeds[i * 4 + 1] = 0.14 + Math.sqrt(hash(i * 4 + 2)) * 1.18; // radial ratio
      seeds[i * 4 + 2] = 0.45 + hash(i * 4 + 3) * 1.15; // vertical speed
      seeds[i * 4 + 3] = hash(i * 4 + 4) * Math.PI * 2; // phase offset
      kinds[i] = i % 3; // 0: underwater bubble, 1: vortex energy mote, 2: bioluminescent spore
      sizes[i] = 14 + hash(i * 7 + 5) * 24;
    }

    const geo = this.trackGeo(new THREE.BufferGeometry());
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 4));
    geo.setAttribute('aKind', new THREE.BufferAttribute(kinds, 1));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));

    this.domainParticleMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uIntensity: { value: 0 },
        uBurst: { value: 1 },
        uRadius: { value: 14 },
        uCenter: { value: new THREE.Vector3(0, 0, 0) },
        uColor: { value: new THREE.Color('#38bdf8') },
        uPixelRatio: { value: this.renderer.getPixelRatio() },
      },
      vertexShader: /* glsl */ `
        attribute vec4 aSeed;
        attribute float aKind;
        attribute float aSize;

        uniform float uTime;
        uniform float uIntensity;
        uniform float uBurst;
        uniform float uRadius;
        uniform vec3 uCenter;
        uniform float uPixelRatio;

        varying float vKind;
        varying float vAlpha;
        varying float vPulse;

        void main() {
          vKind = aKind;
          float baseAng = aSeed.x;
          float radRatio = aSeed.y;
          float vSpeed = aSeed.z;
          float phase = aSeed.w;

          // Continuous rising height wrap across domain dome height
          float cycle = fract(phase * 0.15915 + uTime * vSpeed * 0.22);
          float y = -0.3 + cycle * 12.5;

          // Swirling underwater vortex around the caster's domain center
          float swirlRate = 0.45 + (1.25 - min(radRatio, 1.25)) * 0.85;
          float ang = baseAng + uTime * swirlRate + sin(uTime * 1.4 + phase) * 0.28;

          float burstScale = mix(0.22, 1.0, smoothstep(0.0, 0.48, uBurst));
          float r = uRadius * radRatio * burstScale;
          float sway = sin(uTime * 2.1 + phase + y * 0.5) * 0.48;

          vec3 worldPos = vec3(
            uCenter.x + cos(ang) * r + sway,
            y,
            uCenter.z + sin(ang) * r + cos(uTime * 1.8 + phase) * 0.42
          );

          vec4 mvPosition = modelViewMatrix * vec4(worldPos, 1.0);
          gl_Position = projectionMatrix * mvPosition;

          float edgeFade = smoothstep(0.0, 0.14, cycle) * (1.0 - smoothstep(0.75, 1.0, cycle));
          vAlpha = edgeFade * uIntensity;
          vPulse = 0.72 + 0.28 * sin(uTime * 5.0 + phase * 2.0);

          float distScale = 22.0 / max(4.0, -mvPosition.z);
          gl_PointSize = aSize * uPixelRatio * (0.65 + 0.35 * uIntensity) * distScale;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor;
        varying float vKind;
        varying float vAlpha;
        varying float vPulse;

        void main() {
          vec2 uv = gl_PointCoord - 0.5;
          float d = length(uv);
          if (d > 0.5) discard;

          vec3 col = uColor;
          float alpha = 0.0;

          if (vKind < 0.5) {
            // Underwater bubble: crisp glowing rim + specular highlight dot
            float rim = smoothstep(0.26, 0.41, d) * (1.0 - smoothstep(0.41, 0.5, d));
            float spec = exp(-dot(uv - vec2(-0.15, -0.15), uv - vec2(-0.15, -0.15)) * 95.0);
            col = mix(uColor, vec3(0.86, 0.97, 1.0), 0.55 + spec * 0.45);
            alpha = (rim * 0.9 + spec * 0.75 + 0.12 * (1.0 - d * 2.0)) * vAlpha;
          } else if (vKind < 1.5) {
            // Swirling domain energy spark
            float core = exp(-d * d * 22.0);
            float halo = smoothstep(0.5, 0.05, d) * 0.48;
            col = mix(uColor, vec3(1.0), core * 0.72);
            alpha = (core + halo) * vPulse * vAlpha;
          } else {
            // Bioluminescent abyssal spore
            float orb = smoothstep(0.5, 0.08, d);
            col = mix(uColor, vec3(0.45, 0.95, 1.0), 0.35 * vPulse);
            alpha = orb * orb * 0.75 * vPulse * vAlpha;
          }

          gl_FragColor = vec4(col, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.domainParticlesPoints = new THREE.Points(geo, this.domainParticleMaterial);
    this.domainParticlesPoints.visible = false;
    this.domainParticlesPoints.frustumCulled = false;
    this.domainParticlesPoints.renderOrder = 10;
    this.scene.add(this.domainParticlesPoints);
  }

  private setupPostProcessing(width: number, height: number): void {
    this.composer = new EffectComposer(this.renderer);
    this.composer.setPixelRatio(this.renderer.getPixelRatio());
    this.composer.setSize(width, height);

    this.renderPass = new RenderPass(this.scene, this.camera);
    this.domainPass = new ShaderPass(DomainUnderwaterShader);
    this.domainPass.uniforms.uAspect.value = width / Math.max(1, height);
    this.outputPass = new OutputPass();

    this.composer.addPass(this.renderPass);
    this.composer.addPass(this.domainPass);
    this.composer.addPass(this.outputPass);
  }

  private buildPools(): void {
    // 1. Tentacle Pool (14 articulated segments + suckers + cut ring + telegraph)
    const segGeo = this.trackGeo(new THREE.CylinderGeometry(0.75, 1.0, 1.0, 10));
    const suckerGeo = this.trackGeo(new THREE.SphereGeometry(0.24, 6, 6));
    const cutRingGeo = this.trackGeo(new THREE.TorusGeometry(1.15, 0.15, 10, 24));
    const cutCoreGeo = this.trackGeo(new THREE.SphereGeometry(0.55, 10, 10));
    const teleCircleGeo = this.trackGeo(new THREE.RingGeometry(0.1, 1.0, 24));
    const teleLineGeo = this.trackGeo(new THREE.PlaneGeometry(1, 1));
    const teleArcGeo = this.trackGeo(new THREE.RingGeometry(0.35, 1.0, 24, 1, 0, 1.56));

    for (let i = 0; i < MAX_TENTACLE_POOL; i++) {
      const group = new THREE.Group();
      group.visible = false;
      this.scene.add(group);

      const segments: THREE.Mesh[] = [];
      const suckers: THREE.Mesh[] = [];
      for (let s = 0; s < TENTACLE_SEGMENTS; s++) {
        const seg = new THREE.Mesh(segGeo, this.materials.tentacleBody);
        seg.castShadow = !this.isSoftware;
        group.add(seg);
        segments.push(seg);

        if (s >= 2 && s % 2 === 0) {
          const suck = new THREE.Mesh(suckerGeo, this.materials.sucker);
          group.add(suck);
          suckers.push(suck);
        }
      }

      const cutGroup = new THREE.Group();
      const cutRing = new THREE.Mesh(cutRingGeo, this.materials.cutRing);
      const cutCore = new THREE.Mesh(cutCoreGeo, this.materials.cutCore);
      cutGroup.add(cutRing);
      cutGroup.add(cutCore);
      group.add(cutGroup);

      const telegraphGroup = new THREE.Group();
      telegraphGroup.visible = false;
      this.scene.add(telegraphGroup);

      const telegraphCircle = new THREE.Mesh(teleCircleGeo, this.materials.telegraphDanger);
      telegraphCircle.rotation.x = -Math.PI / 2;
      telegraphCircle.position.y = 0.05;
      telegraphGroup.add(telegraphCircle);

      const telegraphLine = new THREE.Mesh(teleLineGeo, this.materials.telegraphDanger);
      telegraphLine.rotation.x = -Math.PI / 2;
      telegraphLine.position.y = 0.045;
      telegraphGroup.add(telegraphLine);

      const telegraphArc = new THREE.Mesh(teleArcGeo, this.materials.telegraphDanger);
      telegraphArc.rotation.x = -Math.PI / 2;
      telegraphArc.position.y = 0.045;
      telegraphGroup.add(telegraphArc);

      this.tentaclePool.push({
        group,
        segments,
        suckers,
        cutGroup,
        cutRing,
        cutCore,
        telegraphGroup,
        telegraphCircle,
        telegraphLine,
        telegraphArc,
      });
    }

    // 2. Severed Pieces Pool
    const sevGeo = this.trackGeo(new THREE.ConeGeometry(0.8, 2.4, 8));
    for (let i = 0; i < MAX_SEVERED_POOL; i++) {
      const m = new THREE.Mesh(sevGeo, this.materials.tentacleBody);
      m.visible = false;
      this.scene.add(m);
      this.severedPool.push(m);
    }

    // 3. Ink Projectiles Pool
    const inkGeo = this.trackGeo(new THREE.SphereGeometry(0.55, 12, 10));
    const inkRingGeo = this.trackGeo(new THREE.TorusGeometry(0.72, 0.08, 6, 16));
    for (let i = 0; i < MAX_INK_POOL; i++) {
      const group = new THREE.Group();
      group.visible = false;
      const orb = new THREE.Mesh(inkGeo, this.materials.inkOrb);
      const ring = new THREE.Mesh(inkRingGeo, this.materials.inkRing);
      ring.rotation.x = Math.PI / 2;
      group.add(orb, ring);
      this.scene.add(group);
      this.inkPool.push({ group, orb, ring });
    }

    // 4. Sword Wave Projectiles Pool (E skill 3D crescent waves)
    const waveOuterGeo = this.trackGeo(
      new THREE.TorusGeometry(2.2, 0.32, 8, 24, Math.PI * 0.9),
    );
    const waveInnerGeo = this.trackGeo(
      new THREE.TorusGeometry(1.95, 0.16, 8, 24, Math.PI * 0.85),
    );
    const waveWakeGeo = this.trackGeo(new THREE.ConeGeometry(1.2, 2.4, 4));
    for (let i = 0; i < MAX_WAVE_POOL; i++) {
      const group = new THREE.Group();
      group.visible = false;
      const outerBlade = new THREE.Mesh(waveOuterGeo, this.materials.skillWave);
      outerBlade.rotation.x = Math.PI / 2;
      outerBlade.rotation.z = -Math.PI * 0.45;
      const innerBlade = new THREE.Mesh(waveInnerGeo, this.materials.skillWaveCore);
      innerBlade.rotation.x = Math.PI / 2;
      innerBlade.rotation.z = -Math.PI * 0.425;
      const wakeMesh = new THREE.Mesh(waveWakeGeo, this.materials.skillWave);
      wakeMesh.rotation.z = Math.PI / 2;
      wakeMesh.position.x = -1.2;
      wakeMesh.scale.set(0.35, 1, 1.3);
      group.add(outerBlade, innerBlade, wakeMesh);
      this.scene.add(group);
      this.wavePool.push({ group, outerBlade, innerBlade, wakeMesh });
    }

    // 5. Skill Effects Pool (Whirlwind Q + Sky Cleaver R)
    const wwRingGeo = this.trackGeo(new THREE.TorusGeometry(1, 0.14, 8, 32, Math.PI * 1.45));
    const wwCycloneGeo = this.trackGeo(new THREE.CylinderGeometry(1.05, 0.45, 2.4, 20, 1, true));
    const domeGeo = this.trackGeo(new THREE.SphereGeometry(1, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2));
    const beamGeo = this.trackGeo(new THREE.CylinderGeometry(0.65, 1.15, 24, 16, 1, true));
    const impactRingGeo = this.trackGeo(new THREE.RingGeometry(0.72, 1.0, 32));

    // Giant Spectral Broadsword Geometry parts
    const gsBladeGeo = this.trackGeo(new THREE.BoxGeometry(0.6, 7.2, 1.25));
    const gsTipGeo = this.trackGeo(new THREE.ConeGeometry(0.68, 1.8, 4));
    const gsGuardGeo = this.trackGeo(new THREE.BoxGeometry(0.45, 0.45, 3.2));
    const gsHiltGeo = this.trackGeo(new THREE.CylinderGeometry(0.2, 0.22, 1.9, 8));

    for (let i = 0; i < MAX_SKILL_EFFECT_POOL; i++) {
      const group = new THREE.Group();
      group.visible = false;

      const whirlwindRing1 = new THREE.Mesh(wwRingGeo, this.materials.skillWhirlwind);
      whirlwindRing1.rotation.x = Math.PI / 2;
      const whirlwindRing2 = new THREE.Mesh(wwRingGeo, this.materials.skillWhirlwindCore);
      whirlwindRing2.rotation.x = Math.PI / 2;
      const whirlwindCyclone = new THREE.Mesh(wwCycloneGeo, this.materials.skillWhirlwind);

      const cleaverSword = new THREE.Group();
      const gsBlade = new THREE.Mesh(gsBladeGeo, this.materials.skillCleaverGold);
      gsBlade.position.y = 4.5;
      const gsTip = new THREE.Mesh(gsTipGeo, this.materials.skillCleaverGold);
      gsTip.rotation.x = Math.PI;
      gsTip.position.y = 0.05;
      const gsGuard = new THREE.Mesh(gsGuardGeo, this.materials.captainTrim);
      gsGuard.position.y = 8.1;
      const gsHilt = new THREE.Mesh(gsHiltGeo, this.materials.captainTrim);
      gsHilt.position.y = 9.15;
      cleaverSword.add(gsBlade, gsTip, gsGuard, gsHilt);

      const cleaverDome = new THREE.Mesh(domeGeo, this.materials.skillCleaverDome);
      const cleaverBeam = new THREE.Mesh(beamGeo, this.materials.skillCleaverBeam);
      cleaverBeam.position.y = 12;
      const cleaverImpactRing = new THREE.Mesh(impactRingGeo, this.materials.cutCore);
      cleaverImpactRing.rotation.x = -Math.PI / 2;
      cleaverImpactRing.position.y = 0.08;

      const rushBeamGeo = this.trackGeo(new THREE.CylinderGeometry(0.5, 0.85, 1.0, 12, 1, true));
      const rushBeam = new THREE.Mesh(rushBeamGeo, this.materials.skillWave);
      rushBeam.rotation.z = Math.PI / 2;
      rushBeam.position.y = 0.9;
      rushBeam.visible = false;

      group.add(
        whirlwindRing1,
        whirlwindRing2,
        whirlwindCyclone,
        cleaverSword,
        cleaverDome,
        cleaverBeam,
        cleaverImpactRing,
        rushBeam,
      );
      this.scene.add(group);
      this.skillEffectPool.push({
        group,
        whirlwindRing1,
        whirlwindRing2,
        whirlwindCyclone,
        cleaverSword,
        cleaverDome,
        cleaverBeam,
        cleaverImpactRing,
        rushBeam,
      });
    }

    // 6. Basic Slash Arcs Pool
    const slashOuterGeo = this.trackGeo(new THREE.RingGeometry(0.62, 1.0, 20, 1, -1.2, 2.4));
    const slashInnerGeo = this.trackGeo(new THREE.RingGeometry(0.84, 1.02, 20, 1, -1.0, 2.0));
    for (let i = 0; i < MAX_SLASH_POOL; i++) {
      const group = new THREE.Group();
      group.visible = false;
      const outerArc = new THREE.Mesh(slashOuterGeo, this.materials.slashNormal);
      outerArc.rotation.x = -Math.PI / 2;
      const innerArc = new THREE.Mesh(slashInnerGeo, this.materials.skillWaveCore);
      innerArc.rotation.x = -Math.PI / 2;
      innerArc.position.y = 0.03;
      group.add(outerArc, innerArc);
      this.scene.add(group);
      this.slashPool.push({ group, outerArc, innerArc });
    }

    // 7. Pickups Pool
    const pickupGeo = this.trackGeo(new THREE.OctahedronGeometry(0.58, 0));
    const pickupHaloGeo = this.trackGeo(new THREE.TorusGeometry(0.85, 0.07, 6, 18));
    for (let i = 0; i < MAX_PICKUP_POOL; i++) {
      const group = new THREE.Group();
      group.visible = false;
      const mesh = new THREE.Mesh(pickupGeo, this.materials.pearlHeal);
      const halo = new THREE.Mesh(pickupHaloGeo, this.materials.cutCore);
      halo.rotation.x = Math.PI / 2;
      group.add(mesh, halo);
      this.scene.add(group);
      this.pickupPool.push({ group, mesh, halo });
    }

    // 8. Dash Ghost Trails Pool
    const ghostGeo = this.trackGeo(new THREE.CapsuleGeometry(0.45, 1.1, 4, 8));
    for (let i = 0; i < MAX_GHOST_POOL; i++) {
      const m = new THREE.Mesh(ghostGeo, this.materials.ghostTrail);
      m.visible = false;
      this.scene.add(m);
      this.ghostPool.push(m);
    }

    // 9. InstancedMesh Particle Pool
    const pGeo = this.trackGeo(new THREE.IcosahedronGeometry(0.22, 0));
    this.particleInstanced = new THREE.InstancedMesh(pGeo, this.materials.particle, MAX_PARTICLES);
    this.particleInstanced.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.particleInstanced.count = 0;
    this.scene.add(this.particleInstanced);
  }

  public applyCustomMonster(monster: CustomMonsterConfig): void {
    if (this.disposed) return;
    (Object.keys(this.monsterHeadGroups) as MonsterBodyStyle[]).forEach((style) => {
      this.monsterHeadGroups[style].visible = style === monster.bodyStyle;
    });

    const scale = THREE.MathUtils.clamp(monster.scale, 0.8, 1.38);
    this.krakenGroup.scale.setScalar(scale);

    this.materials.krakenSkin.color.set(monster.bodyColor || '#4c2876');
    this.materials.tentacleBody.color.set(monster.tentacleColor || '#7c5cbf');
    _color.set(monster.tentacleColor || '#7c5cbf').lerp(new THREE.Color('#ffffff'), 0.42);
    this.materials.sucker.color.copy(_color);

    this.materials.krakenEye.color.set(monster.eyeColor || '#fde047');
    this.materials.krakenEye.emissive.set(monster.eyeColor || '#f59e0b');

    this.materials.inkOrb.emissive.set(monster.inkColor || '#4f46e5');
    _color.set(monster.inkColor || '#4f46e5').lerp(new THREE.Color('#ffffff'), 0.38);
    this.materials.inkRing.color.copy(_color);
  }

  public applySwordVisual(sword: SwordConfig): void {
    if (this.disposed) return;
    const zScale = sword.bladeStyle === 'claymore' || sword.bladeStyle === 'royal' ? 1.45 : 1.05;
    this.captainCutlassBlade.scale.set(sword.lengthScale, sword.widthScale, zScale);
    this.captainCutlassBlade.position.set(0.5 + 0.72 * sword.lengthScale, 0.04, 0);

    this.materials.cutlassBlade.color.set(sword.bladeColor);
    this.materials.cutlassBlade.emissive.set(sword.glowColor);
    this.materials.cutlassBlade.emissiveIntensity =
      sword.price >= 1200 ? 0.95 : sword.price >= 500 ? 0.65 : sword.price > 0 ? 0.45 : 0.25;

    this.materials.slashNormal.color.set(sword.glowColor);
    this.materials.skillWave.color.set(sword.glowColor);
    this.materials.skillWhirlwind.color.set(sword.glowColor);
    this.materials.ghostTrail.color.set(sword.glowColor);
  }

  public applyCustomSkill(skill: CustomSkillConfig): void {
    if (this.disposed) return;
    const hex = skill.effectColor || '#38bdf8';
    this.materials.customSkillGlow.color.set(hex);
    this.materials.customSkillDome.color.set(hex);
  }

  public applyCustomDomain(domain: CustomDomainConfig): void {
    if (this.disposed) return;
    const hex = domain.domainColor || '#38bdf8';
    this.materials.domainGlow.color.set(hex);
    this.materials.domainDome.color.set(hex);
    _domainTintColor.set(hex);
    if (this.domainPass) {
      (this.domainPass.uniforms.uColor.value as THREE.Color).copy(_domainTintColor);
    }
    if (this.domainParticleMaterial) {
      (this.domainParticleMaterial.uniforms.uColor.value as THREE.Color).copy(_domainTintColor);
    }
  }

  public setCameraMode(mode: CameraMode): void {
    this.cameraMode = mode;
  }

  public getCameraMode(): CameraMode {
    return this.cameraMode;
  }

  public resize(width: number, height: number): void {
    if (this.disposed) return;
    const w = Math.max(1, width);
    const h = Math.max(1, height);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    if (this.composer) {
      this.composer.setSize(w, h);
    }
    if (this.domainPass) {
      this.domainPass.uniforms.uAspect.value = w / h;
    }
  }

  public screenToDeck(clientX: number, clientY: number): { x: number; y: number } | null {
    const rect = this.renderer.domElement.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;
    _ndc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    _ndc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    _raycaster.setFromCamera(_ndc, this.camera);
    const hit = _raycaster.ray.intersectPlane(_deckPlane, _intersectPt);
    if (!hit) return null;
    return {
      x: hit.x / WORLD_SCALE + ARENA_W / 2,
      y: hit.z / WORLD_SCALE + SHIP.centerY,
    };
  }

  public projectToScreen(x: number, y: number, zHeight = 0): { x: number; y: number } | null {
    _v1.set(toWorldX(x), toWorldY(zHeight), toWorldZ(y));
    _v1.project(this.camera);
    if (_v1.z > 1) return null;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    return {
      x: (_v1.x * 0.5 + 0.5) * w,
      y: (-_v1.y * 0.5 + 0.5) * h,
    };
  }

  public afterDraw(callback: (now: number) => void): number {
    if (this.disposed) return 0;
    if (!this.isSoftware) {
      return window.requestAnimationFrame(callback);
    }

    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    if (typeof gl.fenceSync === 'function') {
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (this.disposed) return;
        const status = sync ? gl.clientWaitSync(sync, 0, 0) : gl.ALREADY_SIGNALED;
        if (
          status === gl.ALREADY_SIGNALED ||
          status === gl.CONDITION_SATISFIED ||
          status === gl.WAIT_FAILED
        ) {
          if (sync) gl.deleteSync(sync);
          const id = window.setTimeout(() => {
            this.pendingTimers.delete(id);
            if (!this.disposed) callback(performance.now());
          }, 80);
          this.pendingTimers.add(id);
        } else {
          const id = window.setTimeout(() => {
            this.pendingTimers.delete(id);
            poll();
          }, 16);
          this.pendingTimers.add(id);
        }
      };
      poll();
      return 0;
    }

    const id = window.setTimeout(() => {
      this.pendingTimers.delete(id);
      if (!this.disposed) callback(performance.now());
    }, 80);
    this.pendingTimers.add(id);
    return id;
  }

  public renderFrame(snap: GameSnapshot, rawDt: number): void {
    if (this.disposed) return;
    const dt = Math.min(rawDt, 0.05);
    const t = snap.ambientTime;

    this.updateOceanAndShip(t);
    this.updateKraken(snap, t);
    this.updateCaptain(snap, t);
    this.updateTentacles(snap, t);
    this.updateSeveredPieces(snap);
    this.updateInkProjectiles(snap, t);
    this.updateSwordWaves(snap);
    this.updateSkillEffects(snap, t);
    this.updateDomainExpansion(snap, t, dt);
    this.updateSlashArcs(snap);
    this.updatePickups(snap, t);
    this.updateGhosts(snap);
    this.updateParticles(snap);
    this.updateCamera(snap, dt);

    if (!this.isSoftware && this.domainDistortionIntensity > 0.002) {
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }

  private updateDomainExpansion(snap: GameSnapshot, t: number, dt: number): void {
    if (snap.domainActive && !this.wasDomainActive) {
      this.domainBurstProgress = 0;
    }
    this.wasDomainActive = snap.domainActive;

    const targetIntensity = snap.domainActive ? 1.0 : 0.0;
    this.domainDistortionIntensity = THREE.MathUtils.damp(
      this.domainDistortionIntensity,
      targetIntensity,
      snap.domainActive ? 10.0 : 5.5,
      dt,
    );

    if (snap.domainActive) {
      this.domainBurstProgress = Math.min(1.0, this.domainBurstProgress + dt * 1.35);
    }

    // Update full-screen underwater distortion shader uniforms
    if (this.domainPass) {
      this.domainPass.uniforms.uTime.value = t;
      this.domainPass.uniforms.uIntensity.value = this.domainDistortionIntensity;
      this.domainPass.uniforms.uBurst.value = this.domainBurstProgress;
    }

    // Subtle deep-sea background & fog color shift when Domain Expansion is active (benefits both GPU & software WebGL)
    if (this.domainDistortionIntensity > 0.002) {
      _domainBgTarget.copy(_baseBgColor).lerp(_domainTintColor, 0.16);
      if (this.scene.background instanceof THREE.Color) {
        this.scene.background.copy(_baseBgColor).lerp(_domainBgTarget, this.domainDistortionIntensity);
      }
      if (this.scene.fog instanceof THREE.FogExp2) {
        this.scene.fog.color.copy(_baseBgColor).lerp(_domainBgTarget, this.domainDistortionIntensity);
        this.scene.fog.density = THREE.MathUtils.lerp(0.011, 0.0165, this.domainDistortionIntensity);
      }
    } else {
      if (this.scene.background instanceof THREE.Color) {
        this.scene.background.copy(_baseBgColor);
      }
      if (this.scene.fog instanceof THREE.FogExp2) {
        this.scene.fog.color.copy(_baseBgColor);
        this.scene.fog.density = 0.011;
      }
    }

    const wx = toWorldX(snap.domainX);
    const wz = toWorldZ(snap.domainY);
    const baseWorldR = snap.domainRadius * WORLD_SCALE;

    // Update GPU 3D Domain Particle Field (rising underwater bubbles, vortex sparks, bioluminescent motes)
    if (this.domainParticlesPoints) {
      if (this.domainDistortionIntensity > 0.004) {
        this.domainParticlesPoints.visible = true;
        this.domainParticleMaterial.uniforms.uTime.value = t;
        this.domainParticleMaterial.uniforms.uIntensity.value = this.domainDistortionIntensity;
        this.domainParticleMaterial.uniforms.uBurst.value = this.domainBurstProgress;
        this.domainParticleMaterial.uniforms.uRadius.value = Math.max(8, baseWorldR);
        (this.domainParticleMaterial.uniforms.uCenter.value as THREE.Vector3).set(wx, 0, wz);
      } else {
        this.domainParticlesPoints.visible = false;
      }
    }

    if (!snap.domainActive) {
      this.domainGroup.visible = false;
      return;
    }

    this.domainGroup.visible = true;
    this.domainGroup.position.set(wx, 0.1, wz);

    const elapsed = Math.max(0, snap.domainMaxDuration - snap.domainTimer);
    const openScale = THREE.MathUtils.clamp(elapsed / 0.35, 0.15, 1);
    const closeFade = THREE.MathUtils.clamp(snap.domainTimer / 0.45, 0.2, 1);
    const worldR = baseWorldR * openScale;

    this.domainGroup.scale.set(worldR, worldR * 0.65 * closeFade, worldR);
    this.domainRingOuter.rotation.z = t * 1.4;
    this.domainRingInner.rotation.z = -t * 2.1;
    this.materials.domainDome.opacity = (0.22 + Math.sin(t * 5) * 0.04) * closeFade;
    this.materials.domainGlow.opacity = 0.88 * closeFade;
  }

  private updateOceanAndShip(t: number): void {
    const pos = this.oceanMesh.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const wave =
        Math.sin(x * 0.12 + t * 1.9) * 0.38 + Math.cos(y * 0.16 + t * 1.45) * 0.28;
      pos.setZ(i, this.oceanBaseZ[i] + wave);
    }
    pos.needsUpdate = true;
    this.oceanMesh.geometry.computeVertexNormals();

    // Subtle sea roll on the galleon ship (very gentle so deck coordinates stay aligned)
    this.shipGroup.rotation.x = Math.sin(t * 1.1) * 0.012;
    this.shipGroup.rotation.z = Math.cos(t * 0.85) * 0.008;
    this.shipGroup.position.y = Math.sin(t * 1.35) * 0.07;
  }

  private updateKraken(snap: GameSnapshot, t: number): void {
    const p = snap.player;
    const sink = snap.victorySinkProgress;

    if (sink > 0) {
      const ease = sink * sink * (3 - 2 * sink);
      this.krakenGroup.position.y = 0.75 - ease * 11.8 + Math.sin(t * 7) * (1 - ease) * 0.28;
      this.krakenGroup.rotation.x = ease * 0.55;
      this.krakenGroup.rotation.y = Math.sin(t * 5) * (1 - ease) * 0.16;
      this.krakenGroup.visible = sink < 0.99;
    } else {
      this.krakenGroup.visible = true;
      this.krakenGroup.position.y = 0.75 + Math.sin(t * 1.5) * 0.45;
      this.krakenGroup.rotation.x = 0;
      this.krakenGroup.rotation.y = Math.sin(t * 0.6) * 0.06;
    }

    // Eye pupils track the Captain
    const lookDx = THREE.MathUtils.clamp((p.x - ARENA_W / 2) / 500, -0.25, 0.25);
    const lookDy = THREE.MathUtils.clamp((p.y - SHIP.centerY) / 400, -0.15, 0.15);
    this.krakenLeftPupil.position.set(-2.0 + lookDx, 2.5 - lookDy, 4.02);
    this.krakenRightPupil.position.set(2.0 + lookDx, 2.5 - lookDy, 4.02);

    for (let i = 0; i < this.krakenCollarTentacles.length; i++) {
      const ct = this.krakenCollarTentacles[i];
      ct.rotation.x = 0.35 + Math.sin(t * 2.4 + i * 1.1) * 0.22 + sink * 0.65;
    }
  }

  private updateCaptain(snap: GameSnapshot, t: number): void {
    const p = snap.player;
    const wx = toWorldX(p.x);
    const wz = toWorldZ(p.y);
    const wy = toWorldY(p.zHeight);

    this.captainGroup.position.set(wx, wy, wz);
    this.captainShadow.position.set(wx, 0.04, wz);
    const shadowScale = THREE.MathUtils.clamp(1 - wy * 0.08, 0.45, 1.0);
    this.captainShadow.scale.setScalar(shadowScale);

    // Invulnerability blink visibility
    this.captainGroup.visible =
      p.invulnTimer <= 0 || p.dashTimer > 0 || p.cleaverTimer > 0 || Math.floor(t * 20) % 2 === 0;

    // Captain orientation: whirlwind spins 360°, otherwise faces facingAngle
    if (p.whirlwindTimer > 0) {
      this.captainGroup.rotation.y = -p.facingAngle + (0.45 - p.whirlwindTimer) * 28;
    } else {
      this.captainGroup.rotation.y = -p.facingAngle;
    }

    // Running stride bob + dash lean + cleaver forward dive
    const speed = Math.hypot(p.vx, p.vy);
    const strideBob = speed > 20 && wy < 0.1 ? Math.abs(Math.sin(p.stridePhase)) * 0.14 : 0;
    this.captainBodyGroup.position.y = strideBob;
    this.captainBodyGroup.rotation.z =
      p.dashTimer > 0 ? -0.32 : p.cleaverTimer > 0 ? -0.22 : speed > 20 ? -0.1 : 0;

    // Berserk mode energetic pulse & cape flutter
    const berserkScale = snap.berserkActive ? 1.06 + Math.sin(t * 16) * 0.025 : 1.0;
    this.captainGroup.scale.setScalar(berserkScale);

    // Cape flutter
    this.captainCape.rotation.x =
      0.24 +
      (speed > 20 || snap.berserkActive
        ? Math.sin(t * (snap.berserkActive ? 22 : 16)) * 0.18 + 0.25
        : Math.sin(t * 3) * 0.06);

    // Cutlass material glow when berserk, empowered, or victorious
    this.captainCutlassBlade.material = snap.berserkActive
      ? this.materials.cutlassBerserk
      : p.empoweredSlash || snap.victorySinkProgress > 0
        ? this.materials.cutlassEmpowered
        : this.materials.cutlassBlade;

    // Sword Arm Swing Animation in 3D!
    if (snap.victorySinkProgress > 0) {
      // Raise glowing cutlass skyward in victory salute
      this.captainArmPivot.rotation.set(0, -0.2, 1.18 + Math.sin(t * 5) * 0.08);
    } else if (p.whirlwindTimer > 0) {
      this.captainArmPivot.rotation.set(0, 0, 0);
    } else if (p.cleaverTimer > 0) {
      const prog = 1 - p.cleaverTimer / p.cleaverDuration;
      // Raise overhead during ascent, slam down at 0.72!
      const slamPitch = prog < 0.65 ? -1.4 : THREE.MathUtils.lerp(-1.4, 0.75, (prog - 0.65) / 0.15);
      this.captainArmPivot.rotation.set(0, 0, -slamPitch);
    } else if (p.swingTimer > 0) {
      const prog = 1 - p.swingTimer / p.swingDuration;
      const sweep = (prog - 0.5) * 2.4 * p.swingDir;
      this.captainArmPivot.rotation.set(0, sweep, 0.12);
    } else {
      this.captainArmPivot.rotation.set(0, -0.45, 0.15 + Math.sin(t * 4) * 0.05);
    }

    // Orbiting 3D spectral blades (blade_orbit skill)
    if (p.orbitTimer > 0) {
      this.orbitBladesGroup.visible = true;
      this.orbitBladesGroup.position.set(wx, wy, wz);
      this.orbitBladesGroup.rotation.y = t * 6.5;
      const fadeScale = THREE.MathUtils.clamp(p.orbitTimer / 0.35, 0.2, 1);
      this.orbitBladesGroup.scale.setScalar(fadeScale);
      for (let i = 0; i < this.orbitBladeMeshes.length; i++) {
        this.orbitBladeMeshes[i].rotation.x = Math.sin(t * 8 + i) * 0.22;
      }
    } else {
      this.orbitBladesGroup.visible = false;
    }

    // God Sword Celestial Halo Aura
    if (snap.divinePowerActive) {
      this.divineHaloGroup.visible = true;
      this.divineHaloGroup.position.set(wx, wy, wz);
      this.divineHaloOuter.rotation.z = t * 1.8;
      this.divineHaloOuter.scale.setScalar(1 + Math.sin(t * 4) * 0.06);
      this.divineHaloInner.rotation.z = -t * 2.6;
      this.divineHaloInner.position.y = 2.45 + Math.sin(t * 3.5) * 0.12;
    } else {
      this.divineHaloGroup.visible = false;
    }
  }

  private updateTentacles(snap: GameSnapshot, t: number): void {
    for (let i = 0; i < MAX_TENTACLE_POOL; i++) {
      const vis = this.tentaclePool[i];
      const ten = snap.tentacles[i];
      if (!ten) {
        vis.group.visible = false;
        vis.telegraphGroup.visible = false;
        continue;
      }

      vis.group.visible = true;

      // 3D Bezier Tentacle Spine from ocean origin -> high arch -> currentTip
      const ox = toWorldX(ten.origin.x);
      const oz = toWorldZ(ten.origin.y);
      const tx = toWorldX(ten.currentTip.x);
      const tz = toWorldZ(ten.currentTip.y);

      let midLift = 4.2;
      let tipY = 0.35;
      if (ten.phase === 'emerging') {
        midLift = 2.6;
        tipY = 1.4;
      } else if (ten.phase === 'telegraph') {
        midLift = 6.2 + Math.sin(t * 14 + ten.id) * 0.4;
        tipY = 4.8;
      } else if (ten.phase === 'attacking') {
        const prog = ten.phaseTimer / Math.max(0.01, ten.phaseDuration);
        midLift = THREE.MathUtils.lerp(5.8, 2.2, prog);
        tipY = ten.attackType === 'slam' ? THREE.MathUtils.lerp(4.4, 0.3, prog) : 0.65;
      } else if (ten.phase === 'vulnerable') {
        midLift = 1.85;
        tipY = 0.25;
      } else if (ten.phase === 'retracting') {
        midLift = 1.6;
        tipY = 0.2;
      }

      _v1.set(ox, -1.1, oz); // Base submerged in sea
      _v2.set((ox + tx) * 0.5, midLift, (oz + tz) * 0.5); // High arched control point
      _v3.set(tx, tipY, tz); // Tip

      const baseRadius = (ten.width * 0.52) * WORLD_SCALE;
      const mat = ten.hitFlash > 0 ? this.materials.tentacleHit : this.materials.tentacleBody;

      // Position articulated segments along quadratic Bezier
      let prevX = _v1.x;
      let prevY = _v1.y;
      let prevZ = _v1.z;
      let suckerIdx = 0;

      for (let s = 0; s < TENTACLE_SEGMENTS; s++) {
        const u = (s + 1) / TENTACLE_SEGMENTS;
        const inv = 1 - u;
        const px = inv * inv * _v1.x + 2 * inv * u * _v2.x + u * u * _v3.x;
        const py = inv * inv * _v1.y + 2 * inv * u * _v2.y + u * u * _v3.y;
        const pz = inv * inv * _v1.z + 2 * inv * u * _v2.z + u * u * _v3.z;

        const seg = vis.segments[s];
        seg.material = mat;
        _vMid.set((prevX + px) * 0.5, (prevY + py) * 0.5, (prevZ + pz) * 0.5);
        _vDir.set(px - prevX, py - prevY, pz - prevZ);
        const segLen = Math.max(0.08, _vDir.length());
        _vDir.normalize();

        seg.position.copy(_vMid);
        _quat.setFromUnitVectors(_up, _vDir);
        seg.quaternion.copy(_quat);
        const taper = THREE.MathUtils.lerp(1.15, 0.36, u);
        seg.scale.set(baseRadius * taper, segLen * 1.18, baseRadius * taper);

        if (s >= 2 && s % 2 === 0 && suckerIdx < vis.suckers.length) {
          const suck = vis.suckers[suckerIdx++];
          suck.position.set(px, py - baseRadius * taper * 0.72, pz);
          suck.scale.setScalar(taper);
        }

        prevX = px;
        prevY = py;
        prevZ = pz;
      }

      // Glowing 3D Cut-Line Ring at cutPoint
      const showCut = ten.phase === 'vulnerable' || ten.phase === 'attacking';
      vis.cutGroup.visible = showCut;
      if (showCut) {
        const cx = toWorldX(ten.cutPoint.x);
        const cz = toWorldZ(ten.cutPoint.y);
        const cutU = 0.64;
        const inv = 1 - cutU;
        const cutY = inv * inv * _v1.y + 2 * inv * cutU * _v2.y + cutU * cutU * _v3.y;
        vis.cutGroup.position.set(cx, Math.max(0.65, cutY), cz);
        vis.cutRing.rotation.y = t * 4.5;
        vis.cutRing.rotation.x = Math.PI / 2 + Math.sin(t * 3) * 0.25;
        const pulse = ten.phase === 'vulnerable' ? 1.05 + Math.sin(t * 14) * 0.2 : 0.75;
        vis.cutGroup.scale.setScalar(pulse);
      }

      // 3D Telegraph Red Warning Zone on Ship Deck
      if (ten.phase === 'telegraph') {
        vis.telegraphGroup.visible = true;
        const progress = Math.min(1, ten.phaseTimer / Math.max(0.01, ten.phaseDuration));
        this.materials.telegraphDanger.opacity = 0.22 + progress * 0.25;

        if (ten.attackType === 'slam' || ten.attackType === 'lunge') {
          vis.telegraphCircle.visible = true;
          vis.telegraphLine.visible = true;
          vis.telegraphArc.visible = false;

          const targetWx = toWorldX(ten.target.x);
          const targetWz = toWorldZ(ten.target.y);
          const rad = (ten.width * 1.4) * WORLD_SCALE;
          vis.telegraphCircle.position.set(targetWx, 0.05, targetWz);
          vis.telegraphCircle.scale.setScalar(rad * (0.65 + progress * 0.35));

          const dx = targetWx - ox;
          const dz = targetWz - oz;
          const lineLen = Math.hypot(dx, dz);
          vis.telegraphLine.position.set((ox + targetWx) * 0.5, 0.045, (oz + targetWz) * 0.5);
          vis.telegraphLine.scale.set(lineLen, (ten.width * 0.9) * WORLD_SCALE, 1);
          vis.telegraphLine.rotation.z = -Math.atan2(dz, dx);
        } else {
          // Sweep telegraph cone
          vis.telegraphCircle.visible = false;
          vis.telegraphLine.visible = false;
          vis.telegraphArc.visible = true;
          const sweepR = ten.sweepRadius * WORLD_SCALE;
          vis.telegraphArc.position.set(ox, 0.045, oz);
          vis.telegraphArc.scale.setScalar(sweepR);
          const midSweep = (ten.sweepStartAngle + ten.sweepEndAngle) * 0.5;
          vis.telegraphArc.rotation.z = -midSweep - 0.78;
        }
      } else {
        vis.telegraphGroup.visible = false;
      }
    }
  }

  private updateSeveredPieces(snap: GameSnapshot): void {
    for (let i = 0; i < MAX_SEVERED_POOL; i++) {
      const m = this.severedPool[i];
      const sp = snap.severedPieces[i];
      if (!sp) {
        m.visible = false;
        continue;
      }
      m.visible = true;
      m.position.set(toWorldX(sp.x), toWorldY(sp.zHeight) + 0.35, toWorldZ(sp.y));
      m.rotation.set(sp.angle * 0.8, -sp.angle, sp.angle * 1.3);
      const sLen = (sp.length * WORLD_SCALE) / 2.4;
      const sWid = (sp.width * WORLD_SCALE) / 1.4;
      m.scale.set(sWid, Math.max(0.4, sLen), sWid);
    }
  }

  private updateInkProjectiles(snap: GameSnapshot, t: number): void {
    for (let i = 0; i < MAX_INK_POOL; i++) {
      const vis = this.inkPool[i];
      const orb = snap.inkProjectiles[i];
      if (!orb) {
        vis.group.visible = false;
        continue;
      }
      vis.group.visible = true;
      vis.group.position.set(toWorldX(orb.x), 0.85, toWorldZ(orb.y));
      vis.ring.rotation.z = t * 5;
      vis.ring.rotation.x = Math.PI / 2 + Math.sin(t * 4 + orb.id) * 0.45;
      vis.group.scale.setScalar((orb.radius / 13) * 1.0);
    }
  }

  private updateSwordWaves(snap: GameSnapshot): void {
    for (let i = 0; i < MAX_WAVE_POOL; i++) {
      const vis = this.wavePool[i];
      const w = snap.swordWaves[i];
      if (!w) {
        vis.group.visible = false;
        continue;
      }
      vis.group.visible = true;
      vis.group.position.set(toWorldX(w.x), 0.95, toWorldZ(w.y));
      vis.group.rotation.y = -w.angle;
      const fade = THREE.MathUtils.clamp(w.life / 0.25, 0, 1);
      const s = (w.radius / 58) * (0.9 + (1 - w.life / w.maxLife) * 0.35);
      vis.group.scale.set(s, s * fade, s);
      vis.outerBlade.material =
        w.waveStyle === 'venom'
          ? this.materials.skillVenomWave
          : w.waveStyle === 'dragon'
            ? this.materials.skillDragonWave
            : w.waveStyle === 'galaxy'
              ? this.materials.skillGalaxyGlow
              : w.waveStyle === 'tsunami'
                ? this.materials.skillTsunamiWave
                : w.waveStyle === 'phoenix'
                  ? this.materials.skillPhoenixGlow
                  : w.waveStyle === 'creator'
                    ? this.materials.skillCreatorGlow
                    : w.waveStyle === 'divine'
                      ? this.materials.skillDivineGlow
                      : w.empowered
                        ? this.materials.slashEmpowered
                        : this.materials.skillWave;
    }
  }

  private updateSkillEffects(snap: GameSnapshot, t: number): void {
    for (let i = 0; i < MAX_SKILL_EFFECT_POOL; i++) {
      const vis = this.skillEffectPool[i];
      const ef = snap.skillEffects[i];
      if (!ef) {
        vis.group.visible = false;
        continue;
      }
      vis.group.visible = true;
      const prog = 1 - ef.life / ef.maxLife;
      const worldR = ef.radius * WORLD_SCALE;

      if (ef.type === 'whirlwind') {
        // Follows player closely
        vis.group.position.set(toWorldX(snap.player.x), 0.7, toWorldZ(snap.player.y));
        vis.group.rotation.y = 0;
        vis.whirlwindRing1.material = this.materials.skillWhirlwind;
        vis.whirlwindRing2.material = this.materials.skillWhirlwindCore;
        vis.whirlwindCyclone.material = this.materials.skillWhirlwind;
        vis.whirlwindRing1.visible = true;
        vis.whirlwindRing2.visible = true;
        vis.whirlwindCyclone.visible = true;
        vis.cleaverSword.visible = false;
        vis.cleaverDome.visible = false;
        vis.cleaverBeam.visible = false;
        vis.cleaverImpactRing.visible = false;
        vis.rushBeam.visible = false;

        const expand = THREE.MathUtils.lerp(0.45, 1.08, Math.min(1, prog * 2.2));
        const fade = THREE.MathUtils.clamp(1 - prog, 0, 1);
        vis.whirlwindRing1.scale.set(worldR * expand, worldR * expand, 1.2);
        vis.whirlwindRing1.rotation.z = t * 18;
        vis.whirlwindRing2.scale.set(worldR * 0.72 * expand, worldR * 0.72 * expand, 1.2);
        vis.whirlwindRing2.position.y = 0.55;
        vis.whirlwindRing2.rotation.z = -t * 22;
        vis.whirlwindCyclone.scale.set(worldR * 0.85 * expand, 1.25 * fade, worldR * 0.85 * expand);
        vis.whirlwindCyclone.rotation.y = t * 14;
      } else if (ef.type === 'cleaver' || ef.type === 'phoenix_dive') {
        const isPhoenix = ef.type === 'phoenix_dive';
        vis.group.position.set(toWorldX(ef.x), 0, toWorldZ(ef.y));
        vis.group.rotation.y = 0;
        vis.whirlwindRing1.visible = false;
        vis.whirlwindRing2.visible = false;
        vis.whirlwindCyclone.visible = false;
        vis.rushBeam.visible = false;
        vis.cleaverDome.material = isPhoenix
          ? this.materials.skillPhoenixDome
          : this.materials.skillCleaverDome;
        vis.cleaverBeam.material = isPhoenix
          ? this.materials.skillPhoenixGlow
          : this.materials.skillCleaverBeam;
        vis.cleaverImpactRing.material = isPhoenix
          ? this.materials.skillPhoenixGlow
          : this.materials.skillCleaverGold;

        const impactAt = 0.44;
        if (prog < impactAt) {
          const dropT = prog / impactAt;
          vis.cleaverSword.visible = true;
          vis.cleaverSword.position.y = THREE.MathUtils.lerp(14.5, 0.2, dropT * dropT);
          vis.cleaverSword.rotation.y = -ef.angle;
          vis.cleaverDome.visible = false;
          vis.cleaverBeam.visible = false;
          vis.cleaverImpactRing.visible = true;
          vis.cleaverImpactRing.scale.setScalar(worldR * (0.4 + dropT * 0.6));
        } else {
          const burstT = (prog - impactAt) / (1 - impactAt);
          vis.cleaverSword.visible = burstT < 0.55;
          vis.cleaverSword.position.y = 0.15;
          vis.cleaverSword.rotation.y = -ef.angle;

          vis.cleaverDome.visible = true;
          const domeScale = worldR * (0.25 + Math.sin(burstT * Math.PI * 0.5) * 0.95);
          vis.cleaverDome.scale.setScalar(domeScale);

          vis.cleaverBeam.visible = burstT < 0.65;
          const beamScale = Math.max(0.05, 1 - burstT / 0.65);
          vis.cleaverBeam.scale.set(beamScale * (isPhoenix ? 1.7 : 1.4), 1, beamScale * (isPhoenix ? 1.7 : 1.4));

          vis.cleaverImpactRing.visible = true;
          vis.cleaverImpactRing.scale.setScalar(worldR * (0.6 + burstT * 0.68));
        }
      } else if (ef.type === 'phantom_rush' || ef.type === 'thunder_chain') {
        const isThunder = ef.type === 'thunder_chain';
        const sx = toWorldX(ef.x);
        const sz = toWorldZ(ef.y);
        const ex = toWorldX(ef.endX ?? ef.x);
        const ez = toWorldZ(ef.endY ?? ef.y);
        const dx = ex - sx;
        const dz = ez - sz;
        const distW = Math.max(0.5, Math.hypot(dx, dz));

        vis.group.position.set((sx + ex) * 0.5, isThunder ? 0.35 : 0, (sz + ez) * 0.5);
        vis.group.rotation.y = -Math.atan2(dz, dx);
        vis.whirlwindRing1.visible = false;
        vis.whirlwindRing2.visible = false;
        vis.whirlwindCyclone.visible = false;
        vis.cleaverSword.visible = false;
        vis.cleaverDome.visible = false;
        vis.cleaverBeam.visible = false;
        vis.cleaverImpactRing.visible = false;
        vis.rushBeam.material = isThunder
          ? this.materials.skillThunderBeam
          : this.materials.skillWave;
        vis.rushBeam.visible = true;

        const shrink = Math.max(0.08, 1 - prog);
        const pulse = isThunder ? 1.15 + Math.sin(t * 48) * 0.38 : 1.4;
        vis.rushBeam.scale.set(shrink * pulse, distW, shrink * pulse);
        vis.rushBeam.rotation.x = t * (isThunder ? 34 : 20);
      } else if (ef.type === 'frost_nova') {
        vis.group.position.set(toWorldX(ef.x), 0.1, toWorldZ(ef.y));
        vis.group.rotation.y = 0;
        vis.whirlwindRing1.visible = true;
        vis.whirlwindRing1.material = this.materials.skillFrostGlow;
        vis.whirlwindRing1.scale.set(worldR * (0.4 + prog * 0.7), worldR * (0.4 + prog * 0.7), 1.2);
        vis.whirlwindRing1.rotation.z = t * 12;
        vis.whirlwindRing2.visible = false;
        vis.whirlwindCyclone.visible = false;
        vis.cleaverSword.visible = false;
        vis.cleaverBeam.visible = false;
        vis.rushBeam.visible = false;

        vis.cleaverDome.material = this.materials.skillFrostDome;
        vis.cleaverImpactRing.material = this.materials.skillFrostGlow;
        vis.cleaverDome.visible = true;
        vis.cleaverDome.scale.setScalar(worldR * (0.2 + Math.sin(prog * Math.PI * 0.5) * 0.95));
        vis.cleaverImpactRing.visible = true;
        vis.cleaverImpactRing.scale.setScalar(worldR * (0.35 + prog * 0.85));
      } else if (ef.type === 'time_freeze') {
        vis.group.position.set(toWorldX(ef.x), 0.18, toWorldZ(ef.y));
        vis.group.rotation.y = 0;
        vis.cleaverSword.visible = false;
        vis.whirlwindCyclone.visible = false;
        vis.rushBeam.visible = false;

        vis.whirlwindRing1.material = this.materials.skillTimeGlow;
        vis.whirlwindRing2.material = this.materials.skillTimeGlow;
        vis.cleaverDome.material = this.materials.skillTimeDome;
        vis.cleaverBeam.material = this.materials.skillTimeGlow;
        vis.cleaverImpactRing.material = this.materials.skillTimeGlow;

        const expand = THREE.MathUtils.lerp(0.35, 1.05, Math.min(1, prog * 1.6));
        vis.whirlwindRing1.visible = true;
        vis.whirlwindRing1.scale.set(worldR * expand, worldR * expand, 1.3);
        vis.whirlwindRing1.rotation.z = t * 6;

        vis.whirlwindRing2.visible = true;
        vis.whirlwindRing2.scale.set(worldR * 0.65 * expand, worldR * 0.65 * expand, 1.3);
        vis.whirlwindRing2.position.y = 0.5;
        vis.whirlwindRing2.rotation.z = -t * 14;

        vis.cleaverDome.visible = true;
        vis.cleaverDome.scale.setScalar(worldR * (0.25 + Math.sin(prog * Math.PI * 0.5) * 0.85));

        vis.cleaverBeam.visible = prog < 0.6;
        const beamS = Math.max(0.05, 1 - prog / 0.6);
        vis.cleaverBeam.scale.set(beamS * 1.4, 1.15, beamS * 1.4);

        vis.cleaverImpactRing.visible = true;
        vis.cleaverImpactRing.scale.setScalar(worldR * expand);
      } else if (ef.type === 'galaxy_collapse') {
        vis.group.position.set(toWorldX(ef.x), 0.25, toWorldZ(ef.y));
        vis.group.rotation.y = 0;
        vis.cleaverSword.visible = false;
        vis.rushBeam.visible = false;

        const expand = THREE.MathUtils.lerp(0.35, 1.18, Math.min(1, prog * 1.8));
        const fade = THREE.MathUtils.clamp(1 - prog, 0, 1);

        vis.whirlwindRing1.material = this.materials.skillGalaxyGlow;
        vis.whirlwindRing2.material = this.materials.skillWhirlwindCore;
        vis.whirlwindCyclone.material = this.materials.skillGalaxyGlow;
        vis.cleaverDome.material = this.materials.skillGalaxyDome;
        vis.cleaverBeam.material = this.materials.skillGalaxyGlow;
        vis.cleaverImpactRing.material = this.materials.skillGalaxyGlow;

        vis.whirlwindRing1.visible = true;
        vis.whirlwindRing1.scale.set(worldR * expand, worldR * expand, 1.35);
        vis.whirlwindRing1.rotation.z = t * 22;

        vis.whirlwindRing2.visible = true;
        vis.whirlwindRing2.scale.set(worldR * 0.72 * expand, worldR * 0.72 * expand, 1.35);
        vis.whirlwindRing2.position.y = 0.6;
        vis.whirlwindRing2.rotation.z = -t * 26;

        vis.whirlwindCyclone.visible = true;
        vis.whirlwindCyclone.scale.set(worldR * 0.88 * expand, 1.35 * fade, worldR * 0.88 * expand);
        vis.whirlwindCyclone.rotation.y = t * 18;

        vis.cleaverDome.visible = true;
        vis.cleaverDome.scale.setScalar(worldR * (0.28 + Math.sin(prog * Math.PI * 0.5) * 0.9));

        vis.cleaverBeam.visible = prog < 0.65;
        const beamS = Math.max(0.05, 1 - prog / 0.65);
        vis.cleaverBeam.scale.set(beamS * 1.6, 1.2, beamS * 1.6);

        vis.cleaverImpactRing.visible = true;
        vis.cleaverImpactRing.scale.setScalar(worldR * (0.4 + prog * 0.9));
      } else if (ef.type === 'dragon_breath') {
        vis.group.position.set(toWorldX(ef.x), 0.2, toWorldZ(ef.y));
        vis.group.rotation.y = 0;
        vis.whirlwindRing1.visible = true;
        vis.whirlwindRing1.material = this.materials.skillPhoenixGlow;
        vis.whirlwindRing1.scale.set(worldR * (0.5 + prog * 0.7), worldR * (0.5 + prog * 0.7), 1.3);
        vis.whirlwindRing1.rotation.z = t * 18;
        vis.whirlwindRing2.visible = false;
        vis.whirlwindCyclone.visible = false;
        vis.cleaverSword.visible = false;
        vis.rushBeam.visible = false;

        vis.cleaverDome.material = this.materials.skillPhoenixDome;
        vis.cleaverBeam.material = this.materials.skillPhoenixGlow;
        vis.cleaverImpactRing.material = this.materials.skillDragonWave;

        vis.cleaverDome.visible = true;
        vis.cleaverDome.scale.setScalar(worldR * (0.25 + Math.sin(prog * Math.PI * 0.5) * 0.85));
        vis.cleaverBeam.visible = prog < 0.55;
        const beamS = Math.max(0.05, 1 - prog / 0.55);
        vis.cleaverBeam.scale.set(beamS * 1.3, 0.95, beamS * 1.3);
        vis.cleaverImpactRing.visible = true;
        vis.cleaverImpactRing.scale.setScalar(worldR * (0.4 + prog * 0.85));
      } else if (ef.type === 'vortex_pull') {
        vis.group.position.set(toWorldX(snap.player.x), 0.45, toWorldZ(snap.player.y));
        vis.group.rotation.y = 0;
        vis.cleaverSword.visible = false;
        vis.cleaverBeam.visible = false;
        vis.rushBeam.visible = false;

        const contract = THREE.MathUtils.lerp(1.22, 0.22, prog);
        const fade = THREE.MathUtils.clamp(1 - prog, 0, 1);

        vis.whirlwindRing1.material = this.materials.skillVortexGlow;
        vis.whirlwindRing2.material = this.materials.skillWhirlwindCore;
        vis.whirlwindCyclone.material = this.materials.skillVortexGlow;
        vis.cleaverDome.material = this.materials.skillGalaxyDome;
        vis.cleaverImpactRing.material = this.materials.skillVortexGlow;

        vis.whirlwindRing1.visible = true;
        vis.whirlwindRing1.scale.set(worldR * contract, worldR * contract, 1.3);
        vis.whirlwindRing1.rotation.z = -t * 26;

        vis.whirlwindRing2.visible = true;
        vis.whirlwindRing2.scale.set(worldR * 0.68 * contract, worldR * 0.68 * contract, 1.3);
        vis.whirlwindRing2.position.y = 0.55;
        vis.whirlwindRing2.rotation.z = t * 30;

        vis.whirlwindCyclone.visible = true;
        vis.whirlwindCyclone.scale.set(worldR * 0.85 * contract, 1.55 * fade, worldR * 0.85 * contract);
        vis.whirlwindCyclone.rotation.y = -t * 22;

        vis.cleaverDome.visible = true;
        vis.cleaverDome.scale.setScalar(worldR * contract * 0.55);
        vis.cleaverImpactRing.visible = true;
        vis.cleaverImpactRing.scale.setScalar(worldR * contract);
      } else if (ef.type === 'creator_judgement' || ef.type === 'divine_ascension') {
        const isDivine = ef.type === 'divine_ascension';
        vis.group.position.set(toWorldX(snap.player.x), 0.35, toWorldZ(snap.player.y));
        vis.group.rotation.y = 0;
        vis.cleaverSword.visible = false;
        vis.rushBeam.visible = false;

        const expand = THREE.MathUtils.lerp(0.45, 1.28, Math.min(1, prog * 1.8));
        const fade = THREE.MathUtils.clamp(1 - prog, 0, 1);

        vis.whirlwindRing1.material = isDivine
          ? this.materials.skillDivineGlow
          : this.materials.skillCreatorGlow;
        vis.whirlwindRing2.material = this.materials.skillWhirlwindCore;
        vis.whirlwindCyclone.material = isDivine
          ? this.materials.skillDivineGlow
          : this.materials.skillCreatorGlow;
        vis.cleaverDome.material = isDivine
          ? this.materials.skillDivineDome
          : this.materials.skillCreatorDome;
        vis.cleaverBeam.material = isDivine
          ? this.materials.skillDivineGlow
          : this.materials.skillCreatorGlow;
        vis.cleaverImpactRing.material = isDivine
          ? this.materials.skillDivineGlow
          : this.materials.skillCreatorGlow;

        vis.whirlwindRing1.visible = true;
        vis.whirlwindRing1.scale.set(worldR * expand, worldR * expand, 1.35);
        vis.whirlwindRing1.rotation.z = t * 22;

        vis.whirlwindRing2.visible = true;
        vis.whirlwindRing2.scale.set(worldR * 0.78 * expand, worldR * 0.78 * expand, 1.35);
        vis.whirlwindRing2.position.y = 0.75;
        vis.whirlwindRing2.rotation.z = -t * 26;

        vis.whirlwindCyclone.visible = true;
        vis.whirlwindCyclone.scale.set(worldR * 0.98 * expand, 1.55 * fade, worldR * 0.98 * expand);
        vis.whirlwindCyclone.rotation.y = t * 20;

        vis.cleaverDome.visible = true;
        vis.cleaverDome.scale.setScalar(worldR * (0.32 + Math.sin(prog * Math.PI * 0.5) * 0.95));

        vis.cleaverBeam.visible = prog < 0.75;
        const beamS = Math.max(0.05, 1 - prog / 0.75);
        vis.cleaverBeam.scale.set(beamS * (isDivine ? 2.1 : 1.7), 1.35, beamS * (isDivine ? 2.1 : 1.7));

        vis.cleaverImpactRing.visible = true;
        vis.cleaverImpactRing.scale.setScalar(worldR * (0.4 + prog * 0.95));
      } else if (ef.type === 'custom_skill') {
        const shape = ef.customShape ?? 'cyclone_burst';
        if (shape === 'lightning_dash') {
          const sx = toWorldX(ef.x);
          const sz = toWorldZ(ef.y);
          const ex = toWorldX(ef.endX ?? ef.x);
          const ez = toWorldZ(ef.endY ?? ef.y);
          const dx = ex - sx;
          const dz = ez - sz;
          const distW = Math.max(0.5, Math.hypot(dx, dz));

          vis.group.position.set((sx + ex) * 0.5, 0, (sz + ez) * 0.5);
          vis.group.rotation.y = -Math.atan2(dz, dx);
          vis.whirlwindRing1.visible = false;
          vis.whirlwindRing2.visible = false;
          vis.whirlwindCyclone.visible = false;
          vis.cleaverSword.visible = false;
          vis.cleaverDome.visible = false;
          vis.cleaverBeam.visible = false;
          vis.cleaverImpactRing.visible = false;
          vis.rushBeam.material = this.materials.customSkillGlow;
          vis.rushBeam.visible = true;
          const shrink = Math.max(0.08, 1 - prog);
          vis.rushBeam.scale.set(shrink * 1.65, distW, shrink * 1.65);
          vis.rushBeam.rotation.x = t * 22;
        } else if (shape === 'cyclone_burst') {
          vis.group.position.set(toWorldX(snap.player.x), 0.4, toWorldZ(snap.player.y));
          vis.group.rotation.y = 0;
          vis.cleaverSword.visible = false;
          vis.rushBeam.visible = false;

          const expand = THREE.MathUtils.lerp(0.45, 1.15, Math.min(1, prog * 2.0));
          const fade = THREE.MathUtils.clamp(1 - prog, 0, 1);

          vis.whirlwindRing1.material = this.materials.customSkillGlow;
          vis.whirlwindRing2.material = this.materials.skillWhirlwindCore;
          vis.whirlwindCyclone.material = this.materials.customSkillGlow;
          vis.cleaverDome.material = this.materials.customSkillDome;
          vis.cleaverImpactRing.material = this.materials.customSkillGlow;

          vis.whirlwindRing1.visible = true;
          vis.whirlwindRing1.scale.set(worldR * expand, worldR * expand, 1.3);
          vis.whirlwindRing1.rotation.z = t * 20;

          vis.whirlwindRing2.visible = true;
          vis.whirlwindRing2.scale.set(worldR * 0.76 * expand, worldR * 0.76 * expand, 1.3);
          vis.whirlwindRing2.position.y = 0.65;
          vis.whirlwindRing2.rotation.z = -t * 24;

          vis.whirlwindCyclone.visible = true;
          vis.whirlwindCyclone.scale.set(worldR * 0.9 * expand, 1.35 * fade, worldR * 0.9 * expand);
          vis.whirlwindCyclone.rotation.y = t * 16;

          vis.cleaverDome.visible = true;
          vis.cleaverDome.scale.setScalar(worldR * (0.25 + Math.sin(prog * Math.PI * 0.5) * 0.85));
          vis.cleaverBeam.visible = false;
          vis.cleaverImpactRing.visible = true;
          vis.cleaverImpactRing.scale.setScalar(worldR * (0.35 + prog * 0.85));
        } else {
          // radial_waves, meteor_storm, cross_tsunami aura burst
          vis.group.position.set(toWorldX(ef.x), 0.12, toWorldZ(ef.y));
          vis.group.rotation.y = 0;
          vis.whirlwindRing1.visible = false;
          vis.whirlwindRing2.visible = false;
          vis.whirlwindCyclone.visible = false;
          vis.cleaverSword.visible = false;
          vis.rushBeam.visible = false;

          vis.cleaverDome.material = this.materials.customSkillDome;
          vis.cleaverBeam.material = this.materials.customSkillGlow;
          vis.cleaverImpactRing.material = this.materials.customSkillGlow;

          vis.cleaverDome.visible = true;
          vis.cleaverDome.scale.setScalar(worldR * (0.22 + Math.sin(prog * Math.PI * 0.5) * 0.92));

          vis.cleaverBeam.visible = prog < 0.65;
          const beamS = Math.max(0.05, 1 - prog / 0.65);
          vis.cleaverBeam.scale.set(beamS * 1.45, 1.1, beamS * 1.45);

          vis.cleaverImpactRing.visible = true;
          vis.cleaverImpactRing.scale.setScalar(worldR * (0.35 + prog * 0.9));
        }
      }
    }
  }

  private updateSlashArcs(snap: GameSnapshot): void {
    for (let i = 0; i < MAX_SLASH_POOL; i++) {
      const vis = this.slashPool[i];
      const arc = snap.slashArcs[i];
      if (!arc) {
        vis.group.visible = false;
        continue;
      }
      vis.group.visible = true;
      const prog = 1 - arc.life / arc.maxLife;
      const r = arc.radius * WORLD_SCALE;
      vis.group.position.set(toWorldX(arc.x), 0.95, toWorldZ(arc.y));
      vis.group.rotation.y = -arc.angle;
      vis.group.rotation.x = Math.sin(prog * Math.PI) * 0.16;
      vis.group.scale.setScalar(r * (0.85 + prog * 0.25));
      vis.outerArc.material = arc.empowered ? this.materials.slashEmpowered : this.materials.slashNormal;
    }
  }

  private updatePickups(snap: GameSnapshot, t: number): void {
    for (let i = 0; i < MAX_PICKUP_POOL; i++) {
      const vis = this.pickupPool[i];
      const item = snap.pickups[i];
      if (!item) {
        vis.group.visible = false;
        continue;
      }
      vis.group.visible = true;
      const bob = Math.sin(t * 4.5 + item.bobOffset) * 0.22;
      vis.group.position.set(toWorldX(item.x), 0.85 + bob, toWorldZ(item.y));
      vis.mesh.rotation.y = t * 2.5;
      vis.mesh.material =
        item.type === 'pearl_heal' ? this.materials.pearlHeal : this.materials.goldScale;
    }
  }

  private updateGhosts(snap: GameSnapshot): void {
    for (let i = 0; i < MAX_GHOST_POOL; i++) {
      const m = this.ghostPool[i];
      const g = snap.ghostTrails[i];
      if (!g) {
        m.visible = false;
        continue;
      }
      m.visible = true;
      m.position.set(toWorldX(g.x), 1.0, toWorldZ(g.y));
      m.scale.setScalar(0.6 + g.alpha * 0.4);
    }
  }

  private updateParticles(snap: GameSnapshot): void {
    const count = Math.min(snap.particles.length, MAX_PARTICLES);
    this.particleInstanced.count = count;
    for (let i = 0; i < count; i++) {
      const pt = snap.particles[i];
      _v1.set(toWorldX(pt.x), Math.max(0.1, toWorldY(pt.zHeight)), toWorldZ(pt.y));
      const s = Math.max(0.05, pt.radius * WORLD_SCALE * 1.45 * pt.alpha);
      _scale.setScalar(s);
      _quat.identity();
      _mat4.compose(_v1, _quat, _scale);
      this.particleInstanced.setMatrixAt(i, _mat4);
      _color.set(pt.color);
      this.particleInstanced.setColorAt(i, _color);
    }
    this.particleInstanced.instanceMatrix.needsUpdate = true;
    if (this.particleInstanced.instanceColor) {
      this.particleInstanced.instanceColor.needsUpdate = true;
    }
  }

  private updateCamera(snap: GameSnapshot, dt: number): void {
    const px = toWorldX(snap.player.x);
    const pz = toWorldZ(snap.player.y);

    let targetFov = 46;
    if (snap.victorySinkProgress > 0) {
      // Heroic dramatic 3-point perspective framing Captain and sinking Kraken
      targetFov = 44;
      this.camTargetPos.set(px * 0.65 - 3.5, 11.5, pz * 0.5 + 16.5);
      this.camTargetLook.set(px * 0.5, 1.6, -4.5);
    } else if (this.cameraMode === 'action') {
      // Dramatic 3-point perspective over the stern/starboard quarter showing ship + towering Kraken
      targetFov = 46;
      this.camTargetPos.set(px * 0.44, 15.8, pz * 0.35 + 21.8);
      this.camTargetLook.set(px * 0.42, 0.9, pz * 0.35 - 2.6);
    } else if (this.cameraMode === 'tactical') {
      // High 3D tactical viewpoint for crisp whole-deck awareness
      targetFov = 42;
      this.camTargetPos.set(px * 0.2, 26.5, pz * 0.25 + 16.5);
      this.camTargetLook.set(px * 0.2, 0.2, pz * 0.25 - 1.2);
    } else {
      // Hero close action perspective
      targetFov = 52;
      this.camTargetPos.set(px * 0.72, 9.6, pz * 0.65 + 13.8);
      this.camTargetLook.set(px * 0.78, 1.35, pz * 0.65 - 3.6);
    }

    const smooth = 7.5;
    this.camPos.x = THREE.MathUtils.damp(this.camPos.x, this.camTargetPos.x, smooth, dt);
    this.camPos.y = THREE.MathUtils.damp(this.camPos.y, this.camTargetPos.y, smooth, dt);
    this.camPos.z = THREE.MathUtils.damp(this.camPos.z, this.camTargetPos.z, smooth, dt);

    this.camLook.x = THREE.MathUtils.damp(this.camLook.x, this.camTargetLook.x, smooth, dt);
    this.camLook.y = THREE.MathUtils.damp(this.camLook.y, this.camTargetLook.y, smooth, dt);
    this.camLook.z = THREE.MathUtils.damp(this.camLook.z, this.camTargetLook.z, smooth, dt);

    this.currentFov = THREE.MathUtils.damp(this.currentFov, targetFov, 6, dt);
    if (Math.abs(this.camera.fov - this.currentFov) > 0.05) {
      this.camera.fov = this.currentFov;
      this.camera.updateProjectionMatrix();
    }

    this.camera.position.copy(this.camPos);
    if (snap.shakeTimer > 0 && snap.shakeMagnitude > 0) {
      const shakeAmt = snap.shakeMagnitude * WORLD_SCALE * 0.45;
      this.camera.position.x += (Math.random() - 0.5) * 2 * shakeAmt;
      this.camera.position.y += (Math.random() - 0.5) * 2 * shakeAmt;
    }
    this.camera.lookAt(this.camLook);
  }

  public dispose(): void {
    this.disposed = true;
    this.pendingTimers.forEach((id) => window.clearTimeout(id));
    this.pendingTimers.clear();
    this.geometries.forEach((g) => g.dispose());
    this.domainParticleMaterial?.dispose();
    this.renderPass?.dispose();
    this.domainPass?.dispose();
    this.outputPass?.dispose();
    this.composer?.dispose();
    this.materials.dispose();
    this.envRenderTarget.dispose();
    this.pmremGenerator.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
