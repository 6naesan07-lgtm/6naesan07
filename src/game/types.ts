export type GameState = 'TITLE_MENU' | 'PLAYING' | 'PAUSED' | 'VICTORY' | 'GAME_OVER';

export const FINAL_WAVE = 3;

export type Difficulty = 'normal' | 'hard' | 'abyss';

export type CameraMode = 'action' | 'tactical' | 'hero';

export type SkillId =
  | 'whirlwind'
  | 'wave'
  | 'cleaver'
  | 'phantom_rush'
  | 'blade_orbit'
  | 'meteor_barrage'
  | 'frost_nova'
  | 'cross_slash'
  | 'tsunami_call'
  | 'creator_judgement'
  | 'vortex_pull'
  | 'thunder_chain'
  | 'phoenix_dive'
  | 'venom_burst'
  | 'time_freeze'
  | 'dragon_breath'
  | 'galaxy_collapse'
  | 'divine_ascension'
  | 'custom_skill'
  | 'domain_expansion';

export interface SwordSkillSlot {
  id: SkillId;
  name: string;
  desc: string;
  cooldown: number;
  damageScale?: number;
  rangeScale?: number;
}

export interface DifficultyConfig {
  id: Difficulty;
  label: string;
  description: string;
  telegraphMultiplier: number;
  spawnRateMultiplier: number;
  tentacleHpBonus: number;
  scoreMultiplier: number;
  startingHp: number;
}

export const DIFFICULTY_CONFIGS: Record<Difficulty, DifficultyConfig> = {
  normal: {
    id: 'normal',
    label: '보통',
    description: '여유로운 예고 시간 · 체력 4',
    telegraphMultiplier: 1.15,
    spawnRateMultiplier: 1.0,
    tentacleHpBonus: 0,
    scoreMultiplier: 1.0,
    startingHp: 4,
  },
  hard: {
    id: 'hard',
    label: '어려움',
    description: '빠른 촉수 패턴 · 체력 3',
    telegraphMultiplier: 0.92,
    spawnRateMultiplier: 1.22,
    tentacleHpBonus: 1,
    scoreMultiplier: 1.4,
    startingHp: 3,
  },
  abyss: {
    id: 'abyss',
    label: '심해 극한',
    description: '연속 압박 · 체력 3 · 점수 2배',
    telegraphMultiplier: 0.78,
    spawnRateMultiplier: 1.45,
    tentacleHpBonus: 1,
    scoreMultiplier: 2.0,
    startingHp: 3,
  },
};

export interface Vec2 {
  x: number;
  y: number;
}

export type TentacleAttackType = 'slam' | 'sweep' | 'lunge';
export type TentaclePhase =
  | 'emerging'
  | 'telegraph'
  | 'attacking'
  | 'vulnerable'
  | 'retracting';

export interface Tentacle {
  id: number;
  attackType: TentacleAttackType;
  phase: TentaclePhase;
  phaseTimer: number;
  phaseDuration: number;
  origin: Vec2;
  target: Vec2;
  sweepStartAngle: number;
  sweepEndAngle: number;
  sweepRadius: number;
  currentTip: Vec2;
  cutPoint: Vec2;
  hp: number;
  maxHp: number;
  width: number;
  hitFlash: number;
  didHitPlayer: boolean;
  justDodgeTriggered: boolean;
  hueShift: number;
}

export interface SeveredPiece {
  x: number;
  y: number;
  zHeight: number;
  vz: number;
  vx: number;
  vy: number;
  angle: number;
  angularVel: number;
  length: number;
  width: number;
  alpha: number;
  life: number;
  maxLife: number;
}

export interface InkProjectile {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  life: number;
  justDodged: boolean;
}

export type WaveVisualStyle =
  | 'default'
  | 'empowered'
  | 'venom'
  | 'dragon'
  | 'galaxy'
  | 'tsunami'
  | 'phoenix'
  | 'creator'
  | 'divine';

export interface SwordWaveProjectile {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  radius: number;
  damage: number;
  empowered: boolean;
  waveStyle?: WaveVisualStyle;
  life: number;
  maxLife: number;
  hitTentacleIds: Set<number>;
}

export interface SkillEffect3D {
  id: number;
  type: SkillId;
  customShape?: CustomSkillShape;
  x: number;
  y: number;
  endX?: number;
  endY?: number;
  angle: number;
  radius: number;
  empowered: boolean;
  life: number;
  maxLife: number;
}

export interface Pickup {
  id: number;
  type: 'pearl_heal' | 'gold_scale';
  x: number;
  y: number;
  radius: number;
  life: number;
  maxLife: number;
  bobOffset: number;
}

export interface SlashArc {
  x: number;
  y: number;
  angle: number;
  arcSpread: number;
  radius: number;
  life: number;
  maxLife: number;
  empowered: boolean;
  hitCount: number;
}

export interface Particle {
  x: number;
  y: number;
  zHeight: number;
  vx: number;
  vy: number;
  vz: number;
  radius: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  drag: number;
}

export interface FloatingText {
  x: number;
  y: number;
  vy: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
  scale: number;
}

export interface GhostTrail {
  x: number;
  y: number;
  facingAngle: number;
  alpha: number;
}

export interface Player {
  x: number;
  y: number;
  zHeight: number;
  vx: number;
  vy: number;
  radius: number;
  facingAngle: number;
  aimAngle: number;
  hp: number;
  maxHp: number;
  invulnTimer: number;
  dashTimer: number;
  dashCooldown: number;
  dashMaxCooldown: number;
  dashDir: Vec2;
  slashCooldown: number;
  slashMaxCooldown: number;
  empoweredSlash: boolean;
  hitFlash: number;
  stridePhase: number;
  swingTimer: number;
  swingDuration: number;
  swingDir: number;
  whirlwindTimer: number;
  orbitTimer: number;
  cleaverTimer: number;
  cleaverDuration: number;
  cleaverLanded: boolean;
  skillCooldowns: Record<SkillId, number>;
  skillMaxCooldowns: Record<SkillId, number>;
}

export type MonsterBodyStyle =
  | 'kraken'
  | 'horned_leviathan'
  | 'abyss_serpent'
  | 'armored_crab';

export type MonsterAttackFocus = 'balanced' | 'slam_heavy' | 'sweep_heavy' | 'lunge_heavy';

export type EndingMood = 'triumph' | 'mystery' | 'legend' | 'comedy';

export interface CustomMonsterConfig {
  id: string;
  name: string;
  subtitle: string;
  bodyStyle: MonsterBodyStyle;
  bodyColor: string;
  tentacleColor: string;
  eyeColor: string;
  inkColor: string;
  scale: number;
  finalWave: number;
  speedMultiplier: number;
  attackFocus: MonsterAttackFocus;
}

export interface CustomEndingConfig {
  enabled: boolean;
  victoryTitle: string;
  victoryStory: string;
  victoryMood: EndingMood;
  defeatTitle: string;
  defeatStory: string;
}

export type CustomSkillShape =
  | 'cyclone_burst'
  | 'radial_waves'
  | 'meteor_storm'
  | 'lightning_dash'
  | 'cross_tsunami';

export type CustomSkillBonus =
  | 'none'
  | 'clear_ink'
  | 'stagger'
  | 'heal_one'
  | 'berserk_spark'
  | 'orbit_blades';

export interface CustomSkillConfig {
  enabled: boolean;
  name: string;
  desc: string;
  shape: CustomSkillShape;
  effectColor: string;
  powerLevel: number;
  rangeLevel: number;
  projectileCount: number;
  cooldown: number;
  bonusEffect: CustomSkillBonus;
}

export const DEFAULT_CUSTOM_SKILL: CustomSkillConfig = {
  enabled: false,
  name: '나만의 폭풍 비기',
  desc: '직접 설계한 3D 필살 검술',
  shape: 'cyclone_burst',
  effectColor: '#38bdf8',
  powerLevel: 3,
  rangeLevel: 3,
  projectileCount: 6,
  cooldown: 6.0,
  bonusEffect: 'clear_ink',
};

export type CustomPassiveTrait =
  | 'auto_lightning'
  | 'auto_regen'
  | 'ink_magnet'
  | 'coin_boost'
  | 'aegis_revive';

export interface CustomAbilityConfig {
  enabled: boolean;
  name: string;
  bonusDamage: number;
  speedBonusPct: number;
  basicWaveCount: number;
  waveColor: string;
  traits: CustomPassiveTrait[];
}

export const DEFAULT_CUSTOM_ABILITY: CustomAbilityConfig = {
  enabled: false,
  name: '나만의 각성 능력',
  bonusDamage: 6,
  speedBonusPct: 15,
  basicWaveCount: 1,
  waveColor: '#38bdf8',
  traits: ['ink_magnet'],
};

export type DomainEffectType =
  | 'infinite_void'
  | 'malevolent_shrine'
  | 'celestial_judgement'
  | 'abyss_feast';

export interface CustomDomainConfig {
  enabled: boolean;
  casterName: string;
  domainName: string;
  domainEffect: DomainEffectType;
  domainColor: string;
  duration: number;
  cooldown: number;
  radiusLevel: number;
}

export const DEFAULT_CUSTOM_DOMAIN: CustomDomainConfig = {
  enabled: true,
  casterName: '선장',
  domainName: '무량 심해',
  domainEffect: 'infinite_void',
  domainColor: '#38bdf8',
  duration: 7.0,
  cooldown: 14.0,
  radiusLevel: 3,
};

export const DEFAULT_MONSTER_PRESETS: CustomMonsterConfig[] = [
  {
    id: 'kraken',
    name: '심해의 크라켄',
    subtitle: '폭풍을 부르는 거대 촉수 괴수',
    bodyStyle: 'kraken',
    bodyColor: '#4c2876',
    tentacleColor: '#7c5cbf',
    eyeColor: '#fde047',
    inkColor: '#4f46e5',
    scale: 1.0,
    finalWave: 3,
    speedMultiplier: 1.0,
    attackFocus: 'balanced',
  },
  {
    id: 'crimson_leviathan',
    name: '화염 리바이어던',
    subtitle: '붉은 뿔과 맹렬한 돌진을 휘두르는 해룡',
    bodyStyle: 'horned_leviathan',
    bodyColor: '#991b1b',
    tentacleColor: '#dc2626',
    eyeColor: '#fb923c',
    inkColor: '#ea580c',
    scale: 1.1,
    finalWave: 3,
    speedMultiplier: 1.12,
    attackFocus: 'lunge_heavy',
  },
  {
    id: 'jade_serpent',
    name: '비취 바다뱀',
    subtitle: '파도 위를 넓게 쓸어내리는 심연의 거뱀',
    bodyStyle: 'abyss_serpent',
    bodyColor: '#0f766e',
    tentacleColor: '#14b8a6',
    eyeColor: '#67e8f9',
    inkColor: '#06b6d4',
    scale: 0.96,
    finalWave: 3,
    speedMultiplier: 1.08,
    attackFocus: 'sweep_heavy',
  },
  {
    id: 'golden_carapace',
    name: '황금 갑각 거수',
    subtitle: '갑판을 부수는 묵직한 내려찍기의 거인',
    bodyStyle: 'armored_crab',
    bodyColor: '#92400e',
    tentacleColor: '#d97706',
    eyeColor: '#fef08a',
    inkColor: '#f59e0b',
    scale: 1.18,
    finalWave: 4,
    speedMultiplier: 0.92,
    attackFocus: 'slam_heavy',
  },
];

export const DEFAULT_CUSTOM_ENDING: CustomEndingConfig = {
  enabled: false,
  victoryTitle: '나만의 심해 괴수 토벌 완료!',
  victoryStory:
    '직접 빚어낸 심해의 괴수를 갑판 위 결투 끝에 멋지게 물리쳤습니다. 선원들의 환호 속에 배는 새로운 항로를 향해 출항합니다.',
  victoryMood: 'triumph',
  defeatTitle: '창조한 괴수에게 삼켜진 항해',
  defeatStory:
    '스스로 만들어낸 괴수의 맹공이 생각보다 훨씬 거셌습니다. 검을 다듬고 다시 갑판 위에 올라설 때입니다.',
};

export type SwordBladeStyle =
  | 'cutlass'
  | 'rapier'
  | 'katana'
  | 'claymore'
  | 'serrated'
  | 'royal';

export type SwordId =
  | 'captain_cutlass'
  | 'coral_rapier'
  | 'azure_saber'
  | 'obsidian_katana'
  | 'crimson_claymore'
  | 'emerald_viper'
  | 'storm_twinblade'
  | 'frost_glacier'
  | 'phoenix_flamberge'
  | 'abyssal_excalibur'
  | 'void_reaper'
  | 'poseidon_crownblade'
  | 'astral_cosmos'
  | 'chronos_infinity'
  | 'genesis_dragonblade'
  | 'celestial_leviathan'
  | 'omnipotent_krakenbane'
  | 'cosmic_emperor_blade'
  | 'creator_sword'
  | 'god_sword';

export const CREATOR_SWORD_PASSWORD = '오이';

export interface SwordConfig {
  id: SwordId;
  name: string;
  tierLabel: string;
  description: string;
  bladeStyle: SwordBladeStyle;
  price: number;
  secretLocked?: boolean;
  damageBonus: number;
  rangeMultiplier: number;
  cooldownMultiplier: number;
  scaleBonus: number;
  extraWaves?: number;
  extraMeteors?: number;
  basicSlashWave?: boolean;
  divineBlessing?: boolean;
  divineTraits?: string[];
  bladeColor: string;
  glowColor: string;
  lengthScale: number;
  widthScale: number;
  skills: SwordSkillSlot[];
}

export const SCALE_COIN_RATE = 25;

export const SWORDS_CATALOG: SwordConfig[] = [
  {
    id: 'captain_cutlass',
    name: '선장의 커틀러스',
    tierLabel: '기본',
    description: '선원들에게 전수되는 균형 잡힌 강철 곡도 · 기본 3종 검술',
    bladeStyle: 'cutlass',
    price: 0,
    damageBonus: 0,
    rangeMultiplier: 1.0,
    cooldownMultiplier: 1.0,
    scaleBonus: 0,
    bladeColor: '#e2e8f0',
    glowColor: '#38bdf8',
    lengthScale: 1.0,
    widthScale: 1.0,
    skills: [
      { id: 'whirlwind', name: '선원 회전베기', desc: '360° 폭풍+4방 검풍', cooldown: 4.8 },
      { id: 'wave', name: '청해 검기', desc: '고속 대형 관통 파동', cooldown: 5.5 },
      { id: 'cleaver', name: '갑판 내려베기', desc: '초강력 도약 대지강타', cooldown: 8.5 },
    ],
  },
  {
    id: 'coral_rapier',
    name: '산호 레이피어',
    tierLabel: '입문',
    description: '가볍고 날카로운 세검 · 기민한 찌르기와 호위진 특화',
    bladeStyle: 'rapier',
    price: 90,
    damageBonus: 0,
    rangeMultiplier: 1.12,
    cooldownMultiplier: 0.84,
    scaleBonus: 0,
    bladeColor: '#fbcfe8',
    glowColor: '#f472b6',
    lengthScale: 1.18,
    widthScale: 0.72,
    skills: [
      { id: 'phantom_rush', name: '산호 쾌속 찌르기', desc: '고속 관통 + 착지 폭발', cooldown: 5.0, damageScale: 1.15 },
      { id: 'cross_slash', name: '진주 X자 연격', desc: '강력 교차 X참+파동', cooldown: 5.5 },
      { id: 'blade_orbit', name: '산호 수호진', desc: '고속 회전 세검 방어', cooldown: 9.5 },
    ],
  },
  {
    id: 'azure_saber',
    name: '청해의 사벨',
    tierLabel: '숙련',
    description: '파도처럼 매끄러운 연격 · 해일과 십자 참격 특화',
    bladeStyle: 'cutlass',
    price: 160,
    damageBonus: 0,
    rangeMultiplier: 1.1,
    cooldownMultiplier: 0.82,
    scaleBonus: 0,
    bladeColor: '#bae6fd',
    glowColor: '#06b6d4',
    lengthScale: 1.14,
    widthScale: 0.94,
    skills: [
      { id: 'tsunami_call', name: '물보라 대범람', desc: '5열 거대 해일 참격', cooldown: 7.0 },
      { id: 'wave', name: '파도 초승달', desc: '물살 관통 대형 검기', cooldown: 5.2 },
      { id: 'whirlwind', name: '바다 소용돌이', desc: '360° 물보라+4방 검풍', cooldown: 4.8 },
      { id: 'cross_slash', name: '청해 십자 참격', desc: '쌍검기 대폭발 베기', cooldown: 5.0 },
    ],
  },
  {
    id: 'obsidian_katana',
    name: '흑요석 심해 태도',
    tierLabel: '숙련',
    description: '칠흑의 심해 명도 · 발도술과 연쇄 뇌전 베기 특화',
    bladeStyle: 'katana',
    price: 260,
    damageBonus: 1,
    rangeMultiplier: 1.16,
    cooldownMultiplier: 0.88,
    scaleBonus: 0,
    bladeColor: '#cbd5e1',
    glowColor: '#6366f1',
    lengthScale: 1.26,
    widthScale: 0.88,
    skills: [
      { id: 'phantom_rush', name: '흑요 발도 일섬', desc: '치명 발도 + 착지 참격', cooldown: 4.8, damageScale: 1.25 },
      { id: 'thunder_chain', name: '암흑 연쇄 뇌격', desc: '최대 8촉수 번개 타격', cooldown: 7.0 },
      { id: 'cross_slash', name: '칠흑 열십자 베기', desc: '어둠 X자 대폭발', cooldown: 5.4, damageScale: 1.2 },
      { id: 'cleaver', name: '어둠의 단죄', desc: '초거대 수직 강타', cooldown: 8.5 },
    ],
  },
  {
    id: 'crimson_claymore',
    name: '선홍빛 대검',
    tierLabel: '희귀',
    description: '두꺼운 붉은 양손 대검 · 불사조 강하와 대지 붕괴 특화',
    bladeStyle: 'claymore',
    price: 380,
    damageBonus: 1,
    rangeMultiplier: 1.24,
    cooldownMultiplier: 0.94,
    scaleBonus: 0,
    bladeColor: '#fecaca',
    glowColor: '#ef4444',
    lengthScale: 1.32,
    widthScale: 1.5,
    skills: [
      { id: 'cleaver', name: '선홍 대지 붕괴', desc: '초대형 도약 대강타', cooldown: 7.8, damageScale: 1.3, rangeScale: 1.15 },
      { id: 'phoenix_dive', name: '홍련 강하 폭격', desc: '화염 강타 + 8방 파동', cooldown: 8.0, damageScale: 1.25 },
      { id: 'whirlwind', name: '혈풍 대검풍', desc: '광역 대검 회전+검풍', cooldown: 4.8, rangeScale: 1.15 },
      { id: 'meteor_barrage', name: '선홍 유성 강타', desc: '대검 6연 낙하 폭격', cooldown: 10.5 },
    ],
  },
  {
    id: 'emerald_viper',
    name: '비취 독니검',
    tierLabel: '희귀',
    description: '괴수의 비늘을 뜯어내는 맹독 곡검 · 독무 파열 & 흡인 특화',
    bladeStyle: 'serrated',
    price: 500,
    damageBonus: 1,
    rangeMultiplier: 1.18,
    cooldownMultiplier: 0.85,
    scaleBonus: 1,
    bladeColor: '#a7f3d0',
    glowColor: '#10b981',
    lengthScale: 1.22,
    widthScale: 1.18,
    skills: [
      { id: 'venom_burst', name: '맹독 7연 톱날', desc: '7갈래 독파+비늘 추출', cooldown: 5.5, damageScale: 1.2 },
      { id: 'vortex_pull', name: '비취 와류 흡인', desc: '보물 회수+와류 강타', cooldown: 7.0 },
      { id: 'blade_orbit', name: '독니 호위 검진', desc: '비취 4검 고속 방어', cooldown: 9.0, damageScale: 1.2 },
      { id: 'phantom_rush', name: '맹독 기습 돌진', desc: '독아 관통 + 폭발', cooldown: 4.8 },
    ],
  },
  {
    id: 'storm_twinblade',
    name: '폭풍의 뇌전검',
    tierLabel: '영웅',
    description: '번개를 두른 뇌전 명검 · 연쇄 뇌격과 감전 충격파 특화',
    bladeStyle: 'katana',
    price: 680,
    damageBonus: 1,
    rangeMultiplier: 1.26,
    cooldownMultiplier: 0.8,
    scaleBonus: 1,
    bladeColor: '#ddd6fe',
    glowColor: '#a855f7',
    lengthScale: 1.34,
    widthScale: 1.22,
    skills: [
      { id: 'thunder_chain', name: '연쇄 뇌전 일섬', desc: '최대 8촉수 번개 심판', cooldown: 6.4, damageScale: 1.3 },
      { id: 'frost_nova', name: '뇌전 폭풍 충격파', desc: '빙결 경직 + 6방 파동', cooldown: 6.8, damageScale: 1.25 },
      { id: 'phantom_rush', name: '번개 섬광 돌진', desc: '초고속 전격 참격', cooldown: 4.6, damageScale: 1.2 },
      { id: 'whirlwind', name: '태풍 칼바람', desc: '360° 뇌전 회전+4파동', cooldown: 4.6 },
    ],
  },
  {
    id: 'frost_glacier',
    name: '만년빙 거대검',
    tierLabel: '영웅',
    description: '심해 빙하를 깎아 만든 얼음 대검 · 시간 빙결과 영도 파열 특화',
    bladeStyle: 'claymore',
    price: 860,
    damageBonus: 2,
    rangeMultiplier: 1.3,
    cooldownMultiplier: 0.86,
    scaleBonus: 1,
    bladeColor: '#e0f2fe',
    glowColor: '#38bdf8',
    lengthScale: 1.38,
    widthScale: 1.55,
    skills: [
      { id: 'frost_nova', name: '절대영도 빙결파', desc: '촉수 빙결 + 6방 파동', cooldown: 6.6, damageScale: 1.3, rangeScale: 1.15 },
      { id: 'time_freeze', name: '만년빙 시간 정지', desc: '전장 촉수 3.5초 봉인', cooldown: 8.6 },
      { id: 'tsunami_call', name: '빙해 5중 대파도', desc: '빙결 5열 거대 해일', cooldown: 7.0 },
      { id: 'cleaver', name: '빙하 붕괴 베기', desc: '거대 얼음 성검 강타', cooldown: 8.0, damageScale: 1.25 },
    ],
  },
  {
    id: 'phoenix_flamberge',
    name: '불사조 화염검',
    tierLabel: '영웅',
    description: '타오르는 물결 톱날 검 · 불사조 강하와 용숨결 화염 연사 5스킬',
    bladeStyle: 'serrated',
    price: 1050,
    damageBonus: 2,
    rangeMultiplier: 1.28,
    cooldownMultiplier: 0.76,
    scaleBonus: 1,
    bladeColor: '#fed7aa',
    glowColor: '#f97316',
    lengthScale: 1.36,
    widthScale: 1.35,
    skills: [
      { id: 'phoenix_dive', name: '불사조 홍련 강하', desc: '도약 폭격 + 8방 화염파', cooldown: 7.2, damageScale: 1.35 },
      { id: 'dragon_breath', name: '불꽃 날개 브레스', desc: '7연속 초고속 화염 검기', cooldown: 5.6, damageScale: 1.25 },
      { id: 'meteor_barrage', name: '화염 유성 검우', desc: '불타는 천검 6연타', cooldown: 9.6, damageScale: 1.2 },
      { id: 'cross_slash', name: '작열 십자 화참', desc: '불꽃 X자 대참격', cooldown: 5.2 },
      { id: 'whirlwind', name: '태양 화염 선풍', desc: '360° 작열+4방 검풍', cooldown: 4.6 },
    ],
  },
  {
    id: 'abyssal_excalibur',
    name: '심연의 황금 성검',
    tierLabel: '전설',
    description: '바다를 가르는 황금 성검 · 성광 흡인과 심판의 5대 성술',
    bladeStyle: 'royal',
    price: 1300,
    damageBonus: 2,
    rangeMultiplier: 1.35,
    cooldownMultiplier: 0.75,
    scaleBonus: 2,
    extraWaves: 2,
    bladeColor: '#fef08a',
    glowColor: '#f59e0b',
    lengthScale: 1.46,
    widthScale: 1.58,
    skills: [
      { id: 'cleaver', name: '성검 천둥 심판', desc: '초광역 황금 성검 강타', cooldown: 7.6, damageScale: 1.35 },
      { id: 'wave', name: '성광 3갈래 검기', desc: '3연속 황금 대검기', cooldown: 5.2, damageScale: 1.2 },
      { id: 'vortex_pull', name: '성광 정화 와류', desc: '보물 회수+대폭발', cooldown: 6.8 },
      { id: 'blade_orbit', name: '수호 성검진', desc: '황금 4검 초고속 회전', cooldown: 9.0 },
      { id: 'meteor_barrage', name: '천상의 성검우', desc: '6연 황금 유성 폭격', cooldown: 10.0 },
    ],
  },
  {
    id: 'void_reaper',
    name: '공허의 심해 참마도',
    tierLabel: '전설',
    description: '심연의 어둠을 벼려낸 거대 참마도 · 블랙홀 흡인과 은하 붕괴',
    bladeStyle: 'katana',
    price: 1750,
    damageBonus: 3,
    rangeMultiplier: 1.42,
    cooldownMultiplier: 0.74,
    scaleBonus: 2,
    extraWaves: 2,
    bladeColor: '#f5d0fe',
    glowColor: '#d946ef',
    lengthScale: 1.58,
    widthScale: 1.42,
    skills: [
      { id: 'vortex_pull', name: '공허 블랙홀', desc: '보물 흡인 + 중력 폭발', cooldown: 6.4, damageScale: 1.35 },
      { id: 'galaxy_collapse', name: '심연 12방 붕괴참', desc: '6연 X참 + 12방 성좌파', cooldown: 6.8, damageScale: 1.3 },
      { id: 'phantom_rush', name: '공허 차원 베기', desc: '공간 도약 + 도착 폭파', cooldown: 4.6, damageScale: 1.35 },
      { id: 'venom_burst', name: '심연 침식 파동', desc: '7연 독파+비늘 추출', cooldown: 5.4 },
      { id: 'frost_nova', name: '심연 균열 파열', desc: '공허 빙결 + 6방 검기', cooldown: 6.6 },
    ],
  },
  {
    id: 'poseidon_crownblade',
    name: '해왕 포세이돈 신검',
    tierLabel: '신화',
    description: '모든 심해를 제압하는 해왕의 신검 · 대범람 해일과 해왕 용숨결',
    bladeStyle: 'royal',
    price: 2400,
    damageBonus: 4,
    rangeMultiplier: 1.5,
    cooldownMultiplier: 0.68,
    scaleBonus: 3,
    extraWaves: 2,
    bladeColor: '#cffafe',
    glowColor: '#22d3ee',
    lengthScale: 1.66,
    widthScale: 1.68,
    skills: [
      { id: 'tsunami_call', name: '포세이돈 대범람', desc: '거대 5중 해일 소환', cooldown: 6.0, damageScale: 1.35, rangeScale: 1.2 },
      { id: 'vortex_pull', name: '심해 대소용돌이', desc: '보물 흡인 + 와류 강타', cooldown: 6.4, damageScale: 1.3 },
      { id: 'dragon_breath', name: '해류 7연 포효', desc: '전방 7연 수압 연사', cooldown: 5.4 },
      { id: 'blade_orbit', name: '해왕 4검 호위진', desc: '심해 수호 초고속진', cooldown: 8.6, damageScale: 1.25 },
      { id: 'frost_nova', name: '심해 수압 충격파', desc: '촉수 빙결 + 6방 파동', cooldown: 6.4 },
    ],
  },
  {
    id: 'astral_cosmos',
    name: '성운의 천공검',
    tierLabel: '초월',
    description: '은하의 별빛을 담은 초월 명검 · 성좌 붕괴와 연쇄 성광 뇌격',
    bladeStyle: 'katana',
    price: 5500,
    damageBonus: 5,
    rangeMultiplier: 1.56,
    cooldownMultiplier: 0.64,
    scaleBonus: 4,
    extraWaves: 2,
    bladeColor: '#ede9fe',
    glowColor: '#8b5cf6',
    lengthScale: 1.72,
    widthScale: 1.52,
    skills: [
      { id: 'galaxy_collapse', name: '성좌 대붕괴', desc: '6연 X참 + 12방 성광파', cooldown: 6.4, damageScale: 1.4 },
      { id: 'thunder_chain', name: '별빛 연쇄 섬광', desc: '8촉수 천공 뇌격 심판', cooldown: 6.0, damageScale: 1.35 },
      { id: 'meteor_barrage', name: '별무리 유성군', desc: '성운 천검 8연 낙하', cooldown: 9.2, damageScale: 1.25 },
      { id: 'phantom_rush', name: '유성광 초월 돌진', desc: '별빛 관통 + 폭발', cooldown: 4.6 },
      { id: 'blade_orbit', name: '성단 4검 궤도진', desc: '은하 궤도 고속 회전', cooldown: 8.4 },
    ],
  },
  {
    id: 'chronos_infinity',
    name: '시간의 무한 대검',
    tierLabel: '초월',
    description: '시공간을 가르는 영원의 대검 · 시간 정지와 6종 시공간 비기 완비',
    bladeStyle: 'claymore',
    price: 10500,
    damageBonus: 6,
    rangeMultiplier: 1.65,
    cooldownMultiplier: 0.6,
    scaleBonus: 5,
    extraWaves: 4,
    bladeColor: '#f0fdfa',
    glowColor: '#14b8a6',
    lengthScale: 1.78,
    widthScale: 1.75,
    skills: [
      { id: 'time_freeze', name: '크로노스 시간 정지', desc: '전장 촉수 정지+쿨가속', cooldown: 7.6, damageScale: 1.35 },
      { id: 'galaxy_collapse', name: '시공 균열 12참', desc: '12방 시공간 폭발파', cooldown: 6.2, damageScale: 1.3 },
      { id: 'vortex_pull', name: '역행의 시계 와류', desc: '전장 흡인 + 중력파', cooldown: 6.4 },
      { id: 'phantom_rush', name: '시간 왜곡 돌진', desc: '초고속 공간 일섬', cooldown: 4.6 },
      { id: 'blade_orbit', name: '태엽 4검 무한진', desc: '영원의 수호 검진', cooldown: 8.6 },
      { id: 'meteor_barrage', name: '차원 유성 폭우', desc: '시공 천검 10연 강림', cooldown: 9.4 },
    ],
  },
  {
    id: 'genesis_dragonblade',
    name: '태초 해황룡 천검',
    tierLabel: '태초',
    description: '20,000 코인의 궁극 신검 · 용의 숨결 + 불사조 강하 등 6비기',
    bladeStyle: 'royal',
    price: 20000,
    damageBonus: 8,
    rangeMultiplier: 1.8,
    cooldownMultiplier: 0.54,
    scaleBonus: 6,
    extraWaves: 4,
    extraMeteors: 2,
    bladeColor: '#fffbeb',
    glowColor: '#fbbf24',
    lengthScale: 1.88,
    widthScale: 1.85,
    skills: [
      { id: 'dragon_breath', name: '해황룡 용숨결 연사', desc: '7연 황금 용기 폭풍', cooldown: 5.0, damageScale: 1.4 },
      { id: 'phoenix_dive', name: '황룡 강림 폭격', desc: '대지 강타 + 8방 파동', cooldown: 6.4, damageScale: 1.35 },
      { id: 'tsunami_call', name: '해황룡 대범람', desc: '황룡 5열 거대 해일', cooldown: 6.0, damageScale: 1.35 },
      { id: 'cross_slash', name: '신룡 X자 천참', desc: '황룡 대십자 참격', cooldown: 4.8, damageScale: 1.3 },
      { id: 'blade_orbit', name: '황룡 4검 수호진', desc: '초고속 지속 방어참', cooldown: 8.4 },
      { id: 'meteor_barrage', name: '8연 태초 유성우', desc: '8개 천검 동시 낙하', cooldown: 9.2 },
    ],
  },
  {
    id: 'celestial_leviathan',
    name: '천공 리바이어던 대검',
    tierLabel: '창세',
    description: '하늘과 바다를 동시에 가르는 창세의 대검 · 천공 뇌전과 창세 6비기',
    bladeStyle: 'claymore',
    price: 48000,
    damageBonus: 11,
    rangeMultiplier: 1.95,
    cooldownMultiplier: 0.48,
    scaleBonus: 9,
    extraWaves: 6,
    extraMeteors: 2,
    bladeColor: '#e0e7ff',
    glowColor: '#60a5fa',
    lengthScale: 1.98,
    widthScale: 1.92,
    skills: [
      { id: 'tsunami_call', name: '창세 해일 범람', desc: '5중 창세 대파도 일소', cooldown: 5.6, damageScale: 1.4 },
      { id: 'thunder_chain', name: '천공 연쇄 뇌격', desc: '8촉수 동시 천공 뇌격', cooldown: 5.8, damageScale: 1.4 },
      { id: 'dragon_breath', name: '리바이어던 포효', desc: '7연 천공 검기 폭격', cooldown: 5.0 },
      { id: 'frost_nova', name: '천공 뇌전 충격파', desc: '전장 빙결 + 6방 파동', cooldown: 6.2, damageScale: 1.35 },
      { id: 'cleaver', name: '천공 성검 강타', desc: '초대형 하늘 성검', cooldown: 7.2 },
      { id: 'meteor_barrage', name: '창세 8연 유성우', desc: '8연 천검 대폭격', cooldown: 9.0 },
    ],
  },
  {
    id: 'omnipotent_krakenbane',
    name: '절대신 크라켄 멸살검',
    tierLabel: '절대',
    description: '100,000 코인 최강 절대 신검 · 멸살 독파·시간 정지·은하 붕괴 6비기',
    bladeStyle: 'royal',
    price: 100000,
    damageBonus: 16,
    rangeMultiplier: 2.2,
    cooldownMultiplier: 0.42,
    scaleBonus: 14,
    extraWaves: 8,
    extraMeteors: 4,
    basicSlashWave: true,
    bladeColor: '#fff1f2',
    glowColor: '#f43f5e',
    lengthScale: 2.12,
    widthScale: 2.05,
    skills: [
      { id: 'galaxy_collapse', name: '멸살 12방 성좌참', desc: '6중 X참 + 12성좌검기', cooldown: 5.4, damageScale: 1.5 },
      { id: 'venom_burst', name: '크라켄 심연 독파', desc: '7연 멸살 독파+비늘추출', cooldown: 4.6, damageScale: 1.4 },
      { id: 'time_freeze', name: '절대 시공 경직', desc: '전장 봉인 + 쿨타임가속', cooldown: 6.8, damageScale: 1.4 },
      { id: 'tsunami_call', name: '멸살 대범람 해일', desc: '5열 절대 파도 일소', cooldown: 5.6, damageScale: 1.45 },
      { id: 'cross_slash', name: '크라켄 멸절 X참', desc: '파괴적 십자 대폭발', cooldown: 4.5, damageScale: 1.4 },
      { id: 'meteor_barrage', name: '종말 10연 유성우', desc: '10연 천검 대폭격', cooldown: 8.6, damageScale: 1.35 },
    ],
  },
  {
    id: 'cosmic_emperor_blade',
    name: '은하 종언의 패왕신검',
    tierLabel: '신격',
    description: '4,000,000 코인 최고가 상점 신검 · 평타 검기 + 은하 패왕 신격 6비기',
    bladeStyle: 'royal',
    price: 4000000,
    damageBonus: 22,
    rangeMultiplier: 2.32,
    cooldownMultiplier: 0.37,
    scaleBonus: 18,
    extraWaves: 10,
    extraMeteors: 6,
    basicSlashWave: true,
    bladeColor: '#fef08a',
    glowColor: '#ec4899',
    lengthScale: 2.18,
    widthScale: 2.08,
    skills: [
      { id: 'galaxy_collapse', name: '은하 종언 대붕괴', desc: '6중 X참 + 12방 은하파', cooldown: 4.8, damageScale: 1.6, rangeScale: 1.25 },
      { id: 'phoenix_dive', name: '패왕 성운 강하', desc: '초신성 강타 + 8방 해일', cooldown: 5.4, damageScale: 1.55 },
      { id: 'thunder_chain', name: '성계 연쇄 천벌', desc: '8촉수 동시 천벌 뇌격', cooldown: 5.0, damageScale: 1.5 },
      { id: 'time_freeze', name: '우주 시간 정지', desc: '전장 봉인 + 쿨가속', cooldown: 6.4, damageScale: 1.45 },
      { id: 'tsunami_call', name: '우주 은하 대범람', desc: '초대형 5중 성운 해일', cooldown: 5.0, damageScale: 1.55 },
      { id: 'blade_orbit', name: '태양계 수호 검진', desc: '초고속 영원 회전검', cooldown: 7.4, damageScale: 1.5 },
    ],
  },
  {
    id: 'creator_sword',
    name: '제작자의 검 · 절대 오이 신검',
    tierLabel: '제작자',
    description: '비밀번호("오이")로 해금하는 제작자 전용 초월 신검 · 전용 궁극기 [제작자의 오이 심판] 탑재',
    bladeStyle: 'royal',
    price: 0,
    secretLocked: true,
    damageBonus: 25,
    rangeMultiplier: 2.35,
    cooldownMultiplier: 0.35,
    scaleBonus: 20,
    extraWaves: 10,
    extraMeteors: 7,
    basicSlashWave: true,
    bladeColor: '#dcfce7',
    glowColor: '#22c55e',
    lengthScale: 2.2,
    widthScale: 2.1,
    skills: [
      { id: 'creator_judgement', name: '제작자의 오이 심판', desc: '16검기+9유성+회복+광폭화', cooldown: 7.5, damageScale: 1.65, rangeScale: 1.3 },
      { id: 'vortex_pull', name: '오이 절대 흡인진', desc: '전장 보물 회수 + 중력파', cooldown: 5.2, damageScale: 1.5 },
      { id: 'venom_burst', name: '비취 오이 7연 참격', desc: '7연 독기파 + 비늘 추출', cooldown: 4.2, damageScale: 1.5 },
      { id: 'phantom_rush', name: '개발자 차원 돌진', desc: '초장거리 일섬 + 폭발', cooldown: 4.0, damageScale: 1.5 },
      { id: 'blade_orbit', name: '신성 오이 수호진', desc: '초고속 오이 검진', cooldown: 7.2, damageScale: 1.5 },
      { id: 'meteor_barrage', name: '초월 13연 유성우', desc: '13연 천검 대폭격', cooldown: 7.6, damageScale: 1.4 },
    ],
  },
  {
    id: 'god_sword',
    name: '신의 검 · 태초 천신검',
    tierLabel: '천신',
    description:
      '비밀번호("오이")로 해금하는 신의 검 · 불멸 부활·자동 천벌·3연 신성검기 등 4대 태초 신능력 탑재',
    bladeStyle: 'royal',
    price: 0,
    secretLocked: true,
    damageBonus: 32,
    rangeMultiplier: 2.5,
    cooldownMultiplier: 0.3,
    scaleBonus: 25,
    extraWaves: 12,
    extraMeteors: 9,
    basicSlashWave: true,
    divineBlessing: true,
    divineTraits: [
      '불멸의 신성 가호: 치명 피해 방어 + 생명 100% 부활 + 즉시 광폭화 (28초 쿨)',
      '신성 3연 검기 & 4타 천벌: 평타 3갈래 신성 검기 + 4번째 베기마다 자동 천벌 낙뢰',
      '자동 천벌 뇌격: 2.8초마다 촉수 자동 천벌 타격 + 약점 노출',
      '천신 오라: 이속 +25% · 대시 충격파 · 전리품 흡인 · 근접 먹물 증발 · 10초마다 회복',
    ],
    bladeColor: '#ffffff',
    glowColor: '#fde047',
    lengthScale: 2.3,
    widthScale: 2.15,
    skills: [
      { id: 'divine_ascension', name: '신의 강림 · 태초 천벌', desc: '20검기+11유성+2회복+쿨감', cooldown: 7.0, damageScale: 1.9, rangeScale: 1.45 },
      { id: 'time_freeze', name: '신의 섭리 · 시공 정지', desc: '전장 완전 봉인 + 쿨가속', cooldown: 5.8, damageScale: 1.65 },
      { id: 'galaxy_collapse', name: '창세 천공 대붕괴', desc: '6중 X참 + 12방 성좌파', cooldown: 4.6, damageScale: 1.7 },
      { id: 'thunder_chain', name: '천벌 연쇄 신뢰', desc: '8촉수 동시 천벌 뇌격', cooldown: 4.4, damageScale: 1.7 },
      { id: 'dragon_breath', name: '신의 숨결 7연 신참', desc: '7연 창세 황금 용기파', cooldown: 4.0, damageScale: 1.65 },
      { id: 'tsunami_call', name: '창세 신해 대범람', desc: '바다를 가르는 5중 해일', cooldown: 4.4, damageScale: 1.7, rangeScale: 1.35 },
    ],
  },
];

export function getSwordConfig(id: SwordId): SwordConfig {
  return SWORDS_CATALOG.find((s) => s.id === id) ?? SWORDS_CATALOG[0];
}

export interface HUDStats {
  hp: number;
  maxHp: number;
  score: number;
  scalesEarned: number;
  coinsEarned: number;
  combo: number;
  maxCombo: number;
  severedCount: number;
  justDodgeCount: number;
  wave: number;
  finalWave: number;
  monsterName: string;
  bossHp: number;
  bossMaxHp: number;
  dashReadyRatio: number;
  empoweredSlash: boolean;
  berserkActive: boolean;
  berserkTimer: number;
  berserkMaxDuration: number;
  berserkThreshold: number;
  berserkDamageMultiplier: number;
  berserkCoinMultiplier: number;
  elapsedSeconds: number;
  waveBannerTimer: number;
  endlessMode: boolean;
  victoryCinematicActive: boolean;
  hasDivineSword: boolean;
  divineAegisReady: boolean;
  divineAegisCooldown: number;
  domainActive: boolean;
  domainTimer: number;
  domainMaxDuration: number;
  domainCallout: string;
  skillCooldowns: Record<SkillId, number>;
  skillMaxCooldowns: Record<SkillId, number>;
}

export type EndingGrade = 'S' | 'A' | 'B';

export interface RunSummary {
  score: number;
  bestScore: number;
  scalesEarned: number;
  coinsEarned: number;
  isNewBest: boolean;
  isVictory: boolean;
  isCustomEnding: boolean;
  victoryMood: EndingMood;
  monsterName: string;
  endlessMode: boolean;
  grade: EndingGrade;
  endingTitle: string;
  endingEpilogue: string;
  remainingHp: number;
  maxHp: number;
  severedCount: number;
  justDodgeCount: number;
  maxCombo: number;
  wave: number;
  finalWave: number;
  elapsedSeconds: number;
  difficulty: Difficulty;
}
