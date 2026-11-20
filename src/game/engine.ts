import { soundEngine } from './audio';
import {
  CustomAbilityConfig,
  CustomDomainConfig,
  CustomEndingConfig,
  CustomMonsterConfig,
  CustomSkillConfig,
  DEFAULT_CUSTOM_ABILITY,
  DEFAULT_CUSTOM_DOMAIN,
  DEFAULT_CUSTOM_ENDING,
  DEFAULT_CUSTOM_SKILL,
  DEFAULT_MONSTER_PRESETS,
  DIFFICULTY_CONFIGS,
  Difficulty,
  EndingGrade,
  FloatingText,
  GhostTrail,
  HUDStats,
  InkProjectile,
  Particle,
  Pickup,
  Player,
  RunSummary,
  SeveredPiece,
  SkillEffect3D,
  SkillId,
  SlashArc,
  SWORDS_CATALOG,
  SwordConfig,
  SwordSkillSlot,
  SwordWaveProjectile,
  Tentacle,
  TentacleAttackType,
  Vec2,
} from './types';

const DEFAULT_SKILL_COOLDOWNS: Record<SkillId, number> = {
  whirlwind: 5.0,
  wave: 6.0,
  cleaver: 9.0,
  phantom_rush: 5.5,
  blade_orbit: 11.0,
  meteor_barrage: 12.0,
  frost_nova: 7.0,
  cross_slash: 5.5,
  tsunami_call: 7.2,
  creator_judgement: 8.0,
  vortex_pull: 7.0,
  thunder_chain: 6.5,
  phoenix_dive: 7.5,
  venom_burst: 5.5,
  time_freeze: 8.5,
  dragon_breath: 5.5,
  galaxy_collapse: 6.8,
  divine_ascension: 7.5,
  custom_skill: 6.0,
  domain_expansion: 14.0,
};

function buildSkillCooldownRecord(initialVal: number): Record<SkillId, number> {
  return {
    whirlwind: initialVal,
    wave: initialVal,
    cleaver: initialVal,
    phantom_rush: initialVal,
    blade_orbit: initialVal,
    meteor_barrage: initialVal,
    frost_nova: initialVal,
    cross_slash: initialVal,
    tsunami_call: initialVal,
    creator_judgement: initialVal,
    vortex_pull: initialVal,
    thunder_chain: initialVal,
    phoenix_dive: initialVal,
    venom_burst: initialVal,
    time_freeze: initialVal,
    dragon_breath: initialVal,
    galaxy_collapse: initialVal,
    divine_ascension: initialVal,
    custom_skill: initialVal,
    domain_expansion: initialVal,
  };
}

function buildMaxCooldownsForSword(
  sword: SwordConfig,
  customSkill: CustomSkillConfig = DEFAULT_CUSTOM_SKILL,
  customDomain: CustomDomainConfig = DEFAULT_CUSTOM_DOMAIN,
): Record<SkillId, number> {
  const cdMul = sword.cooldownMultiplier;
  const maxCds: Record<SkillId, number> = {
    whirlwind: DEFAULT_SKILL_COOLDOWNS.whirlwind * cdMul,
    wave: DEFAULT_SKILL_COOLDOWNS.wave * cdMul,
    cleaver: DEFAULT_SKILL_COOLDOWNS.cleaver * cdMul,
    phantom_rush: DEFAULT_SKILL_COOLDOWNS.phantom_rush * cdMul,
    blade_orbit: DEFAULT_SKILL_COOLDOWNS.blade_orbit * cdMul,
    meteor_barrage: DEFAULT_SKILL_COOLDOWNS.meteor_barrage * cdMul,
    frost_nova: DEFAULT_SKILL_COOLDOWNS.frost_nova * cdMul,
    cross_slash: DEFAULT_SKILL_COOLDOWNS.cross_slash * cdMul,
    tsunami_call: DEFAULT_SKILL_COOLDOWNS.tsunami_call * cdMul,
    creator_judgement: DEFAULT_SKILL_COOLDOWNS.creator_judgement * cdMul,
    vortex_pull: DEFAULT_SKILL_COOLDOWNS.vortex_pull * cdMul,
    thunder_chain: DEFAULT_SKILL_COOLDOWNS.thunder_chain * cdMul,
    phoenix_dive: DEFAULT_SKILL_COOLDOWNS.phoenix_dive * cdMul,
    venom_burst: DEFAULT_SKILL_COOLDOWNS.venom_burst * cdMul,
    time_freeze: DEFAULT_SKILL_COOLDOWNS.time_freeze * cdMul,
    dragon_breath: DEFAULT_SKILL_COOLDOWNS.dragon_breath * cdMul,
    galaxy_collapse: DEFAULT_SKILL_COOLDOWNS.galaxy_collapse * cdMul,
    divine_ascension: DEFAULT_SKILL_COOLDOWNS.divine_ascension * cdMul,
    custom_skill: Math.max(2.5, customSkill.cooldown) * cdMul,
    domain_expansion: Math.max(7.0, customDomain.cooldown) * Math.max(0.55, cdMul),
  };
  for (const sk of sword.skills) {
    maxCds[sk.id] = sk.cooldown * cdMul;
  }
  return maxCds;
}

export const ARENA_W = 1120;
export const ARENA_H = 660;

export const BERSERK_COMBO_THRESHOLD = 5;
export const BERSERK_DURATION = 10;
export const BERSERK_DAMAGE_MULTIPLIER = 2;
export const BERSERK_COIN_MULTIPLIER = 2;
export const BASE_SEVER_COINS = 15;

export const SHIP = {
  sternX: 108,
  waistStartX: 220,
  waistEndX: 720,
  bowTipX: 1004,
  bowspritTipX: 1086,
  centerY: 382,
  halfBeam: 212,
  sternHalfBeam: 174,
};

export function shipHalfWidthAt(x: number): number {
  if (x <= SHIP.sternX) return SHIP.sternHalfBeam;
  if (x < SHIP.waistStartX) {
    const t = (x - SHIP.sternX) / (SHIP.waistStartX - SHIP.sternX);
    return lerp(SHIP.sternHalfBeam, SHIP.halfBeam, Math.sin((t * Math.PI) / 2));
  }
  if (x <= SHIP.waistEndX) return SHIP.halfBeam;
  if (x >= SHIP.bowTipX) return 6;
  const t = (x - SHIP.waistEndX) / (SHIP.bowTipX - SHIP.waistEndX);
  return Math.max(6, SHIP.halfBeam * Math.pow(1 - t, 0.72));
}

export function clampToShip(x: number, y: number, margin: number): Vec2 {
  const cx = clamp(x, SHIP.sternX + margin, SHIP.bowTipX - margin - 20);
  const maxHalf = Math.max(14, shipHalfWidthAt(cx) - margin);
  const cy = clamp(y, SHIP.centerY - maxHalf, SHIP.centerY + maxHalf);
  return { x: cx, y: cy };
}

export interface GameSnapshot {
  player: Player;
  tentacles: Tentacle[];
  severedPieces: SeveredPiece[];
  inkProjectiles: InkProjectile[];
  swordWaves: SwordWaveProjectile[];
  skillEffects: SkillEffect3D[];
  pickups: Pickup[];
  slashArcs: SlashArc[];
  particles: Particle[];
  floatingTexts: FloatingText[];
  ghostTrails: GhostTrail[];
  ambientTime: number;
  shakeTimer: number;
  shakeMagnitude: number;
  wave: number;
  victorySinkProgress: number;
  berserkActive: boolean;
  berserkTimer: number;
  berserkMaxDuration: number;
  berserkProgress: number;
  berserkDamageMultiplier: number;
  berserkCoinMultiplier: number;
  divinePowerActive: boolean;
  domainActive: boolean;
  domainX: number;
  domainY: number;
  domainRadius: number;
  domainTimer: number;
  domainMaxDuration: number;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function dist(a: Vec2, b: Vec2): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function distToSegment(p: Vec2, a: Vec2, b: Vec2): { d: number; closest: Vec2; t: number } {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return { d: dist(p, a), closest: { ...a }, t: 0 };
  const t = clamp(((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq, 0, 1);
  const closest = { x: a.x + t * dx, y: a.y + t * dy };
  return { d: dist(p, closest), closest, t };
}

function angleDiff(a: number, b: number): number {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export interface InputState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  touchMoveX: number;
  touchMoveY: number;
  padMoveX: number;
  padMoveY: number;
  padAimAngle: number | null;
  mouseX: number;
  mouseY: number;
  mouseActive: boolean;
}

export class KrakenGameEngine {
  private difficulty: Difficulty = 'normal';
  private reducedMotion = false;

  private player!: Player;
  private tentacles: Tentacle[] = [];
  private severedPieces: SeveredPiece[] = [];
  private inkProjectiles: InkProjectile[] = [];
  private swordWaves: SwordWaveProjectile[] = [];
  private skillEffects: SkillEffect3D[] = [];
  private pickups: Pickup[] = [];
  private slashArcs: SlashArc[] = [];
  private particles: Particle[] = [];
  private floatingTexts: FloatingText[] = [];
  private ghostTrails: GhostTrail[] = [];

  private nextId = 1;
  private score = 0;
  private combo = 0;
  private comboTimer = 0;
  private maxCombo = 0;
  private severedCount = 0;
  private justDodgeCount = 0;
  private wave = 1;
  private bossHp = 5;
  private bossMaxHp = 5;
  private elapsedSeconds = 0;

  private spawnTimer = 0.6;
  private inkTimer = 4.5;
  private waveTransitionTimer = 0;
  private waveBannerTimer = 2.0;
  private hitStopTimer = 0;
  private shakeTimer = 0;
  private shakeMagnitude = 0;
  private ambientTime = 0;
  private endlessMode = false;
  private victoryCinematicTimer = 0;
  private readonly victoryCinematicDuration = 2.5;
  private victoryCompleted = false;
  private customMonster: CustomMonsterConfig = { ...DEFAULT_MONSTER_PRESETS[0] };
  private customEnding: CustomEndingConfig = { ...DEFAULT_CUSTOM_ENDING };
  private customSkill: CustomSkillConfig = { ...DEFAULT_CUSTOM_SKILL };
  private customAbility: CustomAbilityConfig = { ...DEFAULT_CUSTOM_ABILITY };
  private customDomain: CustomDomainConfig = { ...DEFAULT_CUSTOM_DOMAIN };
  private equippedSword: SwordConfig = SWORDS_CATALOG[0];
  private scalesEarned = 0;
  private coinsEarned = 0;
  private berserkTimer = 0;
  private berserkAuraTimer = 0;
  private orbitTickTimer = 0;
  private divineStrikeCounter = 0;
  private divineLightningTimer = 2.4;
  private divineRegenTimer = 10.0;
  private divineAegisCooldown = 0;
  private domainTimer = 0;
  private domainMaxDuration = 7.0;
  private domainX = 500;
  private domainY = SHIP.centerY;
  private domainRadius = 420;
  private domainTickTimer = 0;
  private domainHealTimer = 0;
  private domainParticleTimer = 0;
  private pendingMeteors: Array<{
    x: number;
    y: number;
    angle: number;
    radius: number;
    damage: number;
    empowered: boolean;
    delay: number;
    impactDelay: number;
    spawnedEffect: boolean;
    landed: boolean;
  }> = [];

  private onHudUpdate: (stats: HUDStats) => void;
  private onGameOver: (summary: RunSummary) => void;
  private onVictory: (summary: RunSummary) => void;
  private bestScoreGetter: () => number;
  private onScaleGain?: (amount: number) => void;
  private onCoinGain?: (amount: number) => void;

  public input: InputState = {
    up: false,
    down: false,
    left: false,
    right: false,
    touchMoveX: 0,
    touchMoveY: 0,
    padMoveX: 0,
    padMoveY: 0,
    padAimAngle: null,
    mouseX: ARENA_W / 2,
    mouseY: ARENA_H / 2 - 80,
    mouseActive: false,
  };

  constructor(
    onHudUpdate: (stats: HUDStats) => void,
    onGameOver: (summary: RunSummary) => void,
    onVictory: (summary: RunSummary) => void,
    bestScoreGetter: () => number,
    onScaleGain?: (amount: number) => void,
    onCoinGain?: (amount: number) => void,
  ) {
    this.onHudUpdate = onHudUpdate;
    this.onGameOver = onGameOver;
    this.onVictory = onVictory;
    this.bestScoreGetter = bestScoreGetter;
    this.onScaleGain = onScaleGain;
    this.onCoinGain = onCoinGain;
    if (typeof window !== 'undefined' && window.matchMedia) {
      this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    this.reset('normal');
  }

  public setEquippedSword(sword: SwordConfig): void {
    this.equippedSword = sword;
    if (!this.player) return;
    const cdMul = sword.cooldownMultiplier;
    this.player.slashMaxCooldown = 0.26 * cdMul;
    this.player.slashCooldown = Math.min(this.player.slashCooldown, this.player.slashMaxCooldown);
    this.player.skillMaxCooldowns = buildMaxCooldownsForSword(
      sword,
      this.customSkill,
      this.customDomain,
    );
    (Object.keys(this.player.skillCooldowns) as SkillId[]).forEach((k) => {
      this.player.skillCooldowns[k] = Math.min(
        this.player.skillCooldowns[k],
        this.player.skillMaxCooldowns[k],
      );
    });
    this.emitHud();
  }

  public setCustomSkill(skill: CustomSkillConfig): void {
    this.customSkill = { ...skill };
    if (!this.player) return;
    const cdMul = this.equippedSword.cooldownMultiplier;
    this.player.skillMaxCooldowns.custom_skill = Math.max(2.5, skill.cooldown) * cdMul;
    this.player.skillCooldowns.custom_skill = Math.min(
      this.player.skillCooldowns.custom_skill,
      this.player.skillMaxCooldowns.custom_skill,
    );
    this.emitHud();
  }

  public setCustomAbility(ability: CustomAbilityConfig): void {
    this.customAbility = { ...ability, traits: [...ability.traits] };
    if (!this.player) return;
    this.emitHud();
  }

  public setCustomDomain(domain: CustomDomainConfig): void {
    this.customDomain = { ...domain };
    if (!this.player) return;
    const cdMul = Math.max(0.55, this.equippedSword.cooldownMultiplier);
    this.player.skillMaxCooldowns.domain_expansion = Math.max(7.0, domain.cooldown) * cdMul;
    this.player.skillCooldowns.domain_expansion = Math.min(
      this.player.skillCooldowns.domain_expansion,
      this.player.skillMaxCooldowns.domain_expansion,
    );
    this.emitHud();
  }

  public isBerserkActive(): boolean {
    return this.berserkTimer > 0;
  }

  public getAttackMultiplier(): number {
    return this.berserkTimer > 0 ? BERSERK_DAMAGE_MULTIPLIER : 1;
  }

  public getCoinMultiplier(): number {
    let mul = this.berserkTimer > 0 ? BERSERK_COIN_MULTIPLIER : 1;
    if (this.customAbility.enabled && this.customAbility.traits.includes('coin_boost')) {
      mul *= 2;
    }
    if (this.domainTimer > 0 && this.customDomain.domainEffect === 'abyss_feast') {
      mul *= 2;
    }
    return mul;
  }

  private getEffectiveDamageBonus(): number {
    const customBonus = this.customAbility.enabled
      ? Math.max(0, this.customAbility.bonusDamage)
      : 0;
    return this.equippedSword.damageBonus + customBonus;
  }

  private hasCustomTrait(trait: CustomAbilityConfig['traits'][number]): boolean {
    return this.customAbility.enabled && this.customAbility.traits.includes(trait);
  }

  private formatDomainCallout(): string {
    const caster = this.customDomain.casterName.trim() || '선장';
    const dName = this.customDomain.domainName.trim() || '절대 영역';
    return `${caster}의 영역 전개 · 「${dName}」`;
  }

  private checkBerserkTrigger(): void {
    if (this.berserkTimer <= 0 && this.combo >= BERSERK_COMBO_THRESHOLD) {
      this.berserkTimer = BERSERK_DURATION;
      this.berserkAuraTimer = 0;
      soundEngine.playBerserkActivate();
      this.triggerShake(this.reducedMotion ? 0 : 9, 0.28);
      this.spawnSplashBurst(this.player.x, this.player.y, '#F43F5E', 20, 250);
      this.spawnSplashBurst(this.player.x, this.player.y, '#FBBF24', 16, 200);
      this.addFloatingText(
        this.player.x,
        this.player.y - 44,
        `광폭화 모드 발동! 공격력 ${BERSERK_DAMAGE_MULTIPLIER}배 · 코인 ${BERSERK_COIN_MULTIPLIER}배!`,
        '#FB7185',
        1.35,
      );
    } else if (this.berserkTimer > 0) {
      this.berserkTimer = Math.min(BERSERK_DURATION, this.berserkTimer + 1.2);
    }
  }

  private awardScales(baseAmount: number): number {
    if (baseAmount <= 0) return 0;
    const finalAmount = baseAmount * this.getCoinMultiplier();
    this.scalesEarned += finalAmount;
    this.onScaleGain?.(finalAmount);
    return finalAmount;
  }

  private awardCoins(baseAmount: number): number {
    if (baseAmount <= 0) return 0;
    const finalAmount = baseAmount * this.getCoinMultiplier();
    this.coinsEarned += finalAmount;
    this.onCoinGain?.(finalAmount);
    return finalAmount;
  }

  public reset(
    difficulty: Difficulty,
    monster?: CustomMonsterConfig,
    ending?: CustomEndingConfig,
    sword?: SwordConfig,
    customSkill?: CustomSkillConfig,
    customAbility?: CustomAbilityConfig,
    customDomain?: CustomDomainConfig,
  ): void {
    this.difficulty = difficulty;
    if (monster) this.customMonster = { ...monster };
    if (ending) this.customEnding = { ...ending };
    if (sword) this.equippedSword = sword;
    if (customSkill) this.customSkill = { ...customSkill };
    if (customAbility) this.customAbility = { ...customAbility, traits: [...customAbility.traits] };
    if (customDomain) this.customDomain = { ...customDomain };
    const cfg = DIFFICULTY_CONFIGS[difficulty];
    const cdMul = this.equippedSword.cooldownMultiplier;

    this.player = {
      x: 500,
      y: SHIP.centerY + 20,
      zHeight: 0,
      vx: 0,
      vy: 0,
      radius: 17,
      facingAngle: -Math.PI / 2,
      aimAngle: -Math.PI / 2,
      hp: cfg.startingHp,
      maxHp: cfg.startingHp,
      invulnTimer: 0,
      dashTimer: 0,
      dashCooldown: 0,
      dashMaxCooldown: 0.9,
      dashDir: { x: 0, y: -1 },
      slashCooldown: 0,
      slashMaxCooldown: 0.26 * cdMul,
      empoweredSlash: false,
      hitFlash: 0,
      stridePhase: 0,
      swingTimer: 0,
      swingDuration: 0.2,
      swingDir: 1,
      whirlwindTimer: 0,
      orbitTimer: 0,
      cleaverTimer: 0,
      cleaverDuration: 0.48,
      cleaverLanded: false,
      skillCooldowns: buildSkillCooldownRecord(0),
      skillMaxCooldowns: buildMaxCooldownsForSword(
        this.equippedSword,
        this.customSkill,
        this.customDomain,
      ),
    };

    this.tentacles = [];
    this.severedPieces = [];
    this.inkProjectiles = [];
    this.swordWaves = [];
    this.skillEffects = [];
    this.pendingMeteors = [];
    this.orbitTickTimer = 0;
    this.pickups = [];
    this.slashArcs = [];
    this.particles = [];
    this.floatingTexts = [];
    this.ghostTrails = [];

    this.score = 0;
    this.scalesEarned = 0;
    this.coinsEarned = 0;
    this.berserkTimer = 0;
    this.berserkAuraTimer = 0;
    this.divineStrikeCounter = 0;
    this.divineLightningTimer = 2.2;
    this.divineRegenTimer = 10.0;
    this.divineAegisCooldown = 0;
    this.domainTimer = 0;
    this.domainTickTimer = 0;
    this.domainHealTimer = 0;
    this.domainParticleTimer = 0;
    soundEngine.stopDomainAmbience();
    this.combo = 0;
    this.comboTimer = 0;
    this.maxCombo = 0;
    this.severedCount = 0;
    this.justDodgeCount = 0;
    this.wave = 1;
    this.bossMaxHp = 5;
    this.bossHp = 5;
    this.elapsedSeconds = 0;

    this.spawnTimer = 0.7;
    this.inkTimer = 5.0;
    this.waveTransitionTimer = 0;
    this.waveBannerTimer = 2.2;
    this.hitStopTimer = 0;
    this.shakeTimer = 0;
    this.shakeMagnitude = 0;
    this.endlessMode = false;
    this.victoryCinematicTimer = 0;
    this.victoryCompleted = false;

    this.emitHud();
  }

  public continueEndless(): void {
    this.endlessMode = true;
    this.victoryCinematicTimer = 0;
    this.victoryCompleted = false;
    this.wave = this.customMonster.finalWave + 1;
    this.bossMaxHp = 5 + (this.wave - 1) * 2;
    this.bossHp = this.bossMaxHp;
    this.waveTransitionTimer = 1.2;
    this.waveBannerTimer = 2.4;
    if (this.player.hp < this.player.maxHp) {
      this.player.hp += 1;
    }
    this.player.invulnTimer = 1.5;
    this.addFloatingText(this.player.x, this.player.y - 36, '무한 심해 돌입!', '#38BDF8', 1.25);
    this.emitHud();
  }

  public getSnapshot(): GameSnapshot {
    let victorySinkProgress = 0;
    if (this.victoryCompleted) {
      victorySinkProgress = 1;
    } else if (this.victoryCinematicTimer > 0) {
      victorySinkProgress = clamp(
        1 - this.victoryCinematicTimer / this.victoryCinematicDuration,
        0,
        1,
      );
    }

    const berserkActive = this.berserkTimer > 0;

    return {
      player: this.player,
      tentacles: this.tentacles,
      severedPieces: this.severedPieces,
      inkProjectiles: this.inkProjectiles,
      swordWaves: this.swordWaves,
      skillEffects: this.skillEffects,
      pickups: this.pickups,
      slashArcs: this.slashArcs,
      particles: this.particles,
      floatingTexts: this.floatingTexts,
      ghostTrails: this.ghostTrails,
      ambientTime: this.ambientTime,
      shakeTimer: this.shakeTimer,
      shakeMagnitude: this.shakeMagnitude,
      wave: this.wave,
      victorySinkProgress,
      berserkActive,
      berserkTimer: this.berserkTimer,
      berserkMaxDuration: BERSERK_DURATION,
      berserkProgress: berserkActive ? clamp(this.berserkTimer / BERSERK_DURATION, 0, 1) : 0,
      berserkDamageMultiplier: this.getAttackMultiplier(),
      berserkCoinMultiplier: this.getCoinMultiplier(),
      divinePowerActive: Boolean(this.equippedSword.divineBlessing),
      domainActive: this.domainTimer > 0,
      domainX: this.domainX,
      domainY: this.domainY,
      domainRadius: this.domainRadius,
      domainTimer: this.domainTimer,
      domainMaxDuration: this.domainMaxDuration,
    };
  }

  public getHudStats(): HUDStats {
    const berserkActive = this.berserkTimer > 0;
    const hasDivineSword =
      Boolean(this.equippedSword.divineBlessing) || this.hasCustomTrait('aegis_revive');
    return {
      hp: this.player.hp,
      maxHp: this.player.maxHp,
      score: Math.floor(this.score),
      scalesEarned: this.scalesEarned,
      coinsEarned: this.coinsEarned,
      combo: this.combo,
      maxCombo: this.maxCombo,
      severedCount: this.severedCount,
      justDodgeCount: this.justDodgeCount,
      wave: this.wave,
      finalWave: this.customMonster.finalWave,
      monsterName: this.customMonster.name,
      bossHp: this.bossHp,
      bossMaxHp: this.bossMaxHp,
      dashReadyRatio:
        this.player.dashCooldown <= 0
          ? 1
          : clamp(1 - this.player.dashCooldown / this.player.dashMaxCooldown, 0, 1),
      empoweredSlash: this.player.empoweredSlash,
      berserkActive,
      berserkTimer: this.berserkTimer,
      berserkMaxDuration: BERSERK_DURATION,
      berserkThreshold: BERSERK_COMBO_THRESHOLD,
      berserkDamageMultiplier: this.getAttackMultiplier(),
      berserkCoinMultiplier: this.getCoinMultiplier(),
      elapsedSeconds: this.elapsedSeconds,
      waveBannerTimer: this.waveBannerTimer,
      endlessMode: this.endlessMode,
      victoryCinematicActive: this.victoryCinematicTimer > 0,
      hasDivineSword,
      divineAegisReady: hasDivineSword && this.divineAegisCooldown <= 0,
      divineAegisCooldown: this.divineAegisCooldown,
      domainActive: this.domainTimer > 0,
      domainTimer: this.domainTimer,
      domainMaxDuration: this.domainMaxDuration,
      domainCallout: this.formatDomainCallout(),
      skillCooldowns: { ...this.player.skillCooldowns },
      skillMaxCooldowns: { ...this.player.skillMaxCooldowns },
    };
  }

  private emitHud(): void {
    this.onHudUpdate(this.getHudStats());
  }

  public triggerDash(): void {
    const p = this.player;
    if (p.hp <= 0 || p.dashTimer > 0 || p.dashCooldown > 0) return;

    let dx =
      (this.input.right ? 1 : 0) -
      (this.input.left ? 1 : 0) +
      this.input.touchMoveX +
      this.input.padMoveX;
    let dy =
      (this.input.down ? 1 : 0) -
      (this.input.up ? 1 : 0) +
      this.input.touchMoveY +
      this.input.padMoveY;
    const len = Math.hypot(dx, dy);

    if (len > 0.08) {
      dx /= len;
      dy /= len;
    } else {
      dx = Math.cos(p.aimAngle);
      dy = Math.sin(p.aimAngle);
    }

    const isDivine = Boolean(this.equippedSword.divineBlessing);
    p.dashDir = { x: dx, y: dy };
    p.dashTimer = 0.17;
    p.dashCooldown = isDivine ? p.dashMaxCooldown * 0.65 : p.dashMaxCooldown;
    p.invulnTimer = Math.max(p.invulnTimer, isDivine ? 0.36 : 0.24);
    p.facingAngle = Math.atan2(dy, dx);

    soundEngine.playDash();
    this.spawnSplashBurst(p.x, p.y, isDivine ? '#FDE047' : '#38BDF8', isDivine ? 16 : 9, 150);
    if (isDivine) {
      const dashDmg = Math.max(1, Math.round((4 + this.equippedSword.damageBonus * 0.5) * this.getAttackMultiplier()));
      this.damageTentaclesInArea(p.x, p.y, 125, dashDmg, p.facingAngle, '신속 천섬!');
      this.clearInkInRadius(p.x, p.y, 145);
    }
  }

  public triggerSlash(customAngle?: number): void {
    const p = this.player;
    if (p.hp <= 0 || p.slashCooldown > 0) return;

    const angle =
      customAngle !== undefined
        ? customAngle
        : this.input.mouseActive
          ? Math.atan2(this.input.mouseY - p.y, this.input.mouseX - p.x)
          : p.facingAngle;

    p.aimAngle = angle;
    p.facingAngle = angle;
    p.slashCooldown = p.slashMaxCooldown;
    p.swingTimer = p.swingDuration;
    p.swingDir = p.swingDir === 1 ? -1 : 1;

    const empowered = p.empoweredSlash;
    p.empoweredSlash = false;

    const radius = (empowered ? 118 : 96) * this.equippedSword.rangeMultiplier;
    const arcSpread = empowered ? Math.PI * 0.92 : Math.PI * 0.78;

    const arc: SlashArc = {
      x: p.x,
      y: p.y,
      angle,
      arcSpread,
      radius,
      life: 0.16,
      maxLife: 0.16,
      empowered,
      hitCount: 0,
    };
    this.slashArcs.push(arc);
    soundEngine.playSlash(empowered);

    const atkMul = this.getAttackMultiplier();
    const isDivine = Boolean(this.equippedSword.divineBlessing);
    const totalDmgBonus = this.getEffectiveDamageBonus();
    const extraCustomWaves = this.customAbility.enabled ? clamp(this.customAbility.basicWaveCount, 0, 3) : 0;

    if (this.equippedSword.basicSlashWave || extraCustomWaves > 0) {
      const speed = isDivine ? 760 : 680;
      const count = isDivine ? 3 + extraCustomWaves : Math.max(this.equippedSword.basicSlashWave ? 1 : 0, extraCustomWaves);
      for (let wi = 0; wi < count; wi++) {
        const offset = count <= 1 ? 0 : (wi - (count - 1) / 2) * 0.2;
        const wAngle = angle + offset;
        this.swordWaves.push({
          id: this.nextId++,
          x: p.x + Math.cos(wAngle) * 24,
          y: p.y + Math.sin(wAngle) * 24,
          vx: Math.cos(wAngle) * speed,
          vy: Math.sin(wAngle) * speed,
          angle: wAngle,
          radius: (empowered ? 54 : 44) * this.equippedSword.rangeMultiplier * (isDivine ? 0.85 : 0.74),
          damage: (2 + Math.floor(totalDmgBonus * 0.5)) * atkMul,
          empowered: empowered || isDivine || extraCustomWaves > 0,
          waveStyle: isDivine ? 'divine' : undefined,
          life: isDivine ? 1.15 : 0.95,
          maxLife: isDivine ? 1.15 : 0.95,
          hitTentacleIds: new Set(),
        });
      }
    }

    // Divine 4th-slash automatic Heaven's Judgement strike!
    if (isDivine) {
      this.divineStrikeCounter += 1;
      if (empowered || this.divineStrikeCounter >= 4) {
        this.divineStrikeCounter = 0;
        const activeTentacles = this.tentacles.filter((t) => t.phase !== 'retracting');
        let strikePos = clampToShip(
          p.x + Math.cos(angle) * 185,
          p.y + Math.sin(angle) * 185,
          28,
        );
        if (activeTentacles.length > 0) {
          activeTentacles.sort((a, b) => dist(p, a.cutPoint) - dist(p, b.cutPoint));
          strikePos = { ...activeTentacles[0].cutPoint };
        }
        this.pendingMeteors.push({
          x: strikePos.x,
          y: strikePos.y,
          angle,
          radius: 175,
          damage: Math.max(4, Math.round((8 + this.equippedSword.damageBonus) * atkMul)),
          empowered: true,
          delay: 0,
          impactDelay: 0.14,
          spawnedEffect: false,
          landed: false,
        });
        this.addFloatingText(strikePos.x, strikePos.y - 34, '신능력 · 태초 천벌!', '#FEF08A', 1.2);
      }
    }

    // Check hits against active tentacles
    let hitAny = false;
    for (let i = this.tentacles.length - 1; i >= 0; i--) {
      const t = this.tentacles[i];
      if (t.phase === 'retracting') continue;

      const isVulnerable = t.phase === 'vulnerable';
      const cutCheck = dist(p, t.cutPoint);
      const segCheck = distToSegment(p, t.origin, t.currentTip);
      const hitPos = isVulnerable && cutCheck <= radius + 28 ? t.cutPoint : segCheck.closest;
      const hitDist = Math.min(cutCheck - 24, segCheck.d - t.width * 0.45);

      if (hitDist <= radius) {
        const angleToHit = Math.atan2(hitPos.y - p.y, hitPos.x - p.x);
        const withinArc = Math.abs(angleDiff(angle, angleToHit)) <= arcSpread * 0.62 || hitDist < 26;
        if (!withinArc) continue;

        hitAny = true;
        arc.hitCount++;

        const isWeakSpotHit = isVulnerable && dist(p, t.cutPoint) <= radius + 34;
        const dmg =
          ((isWeakSpotHit ? (empowered ? 4 : 2) : empowered ? 2 : 1) +
            totalDmgBonus) *
          atkMul;
        // Normal attacks on non-vulnerable tentacles still feel responsive, while vulnerable cut-spot melts them
        if (t.hp - dmg <= 0) {
          this.severTentacle(t, i, angle);
        } else {
          t.hp -= dmg;
          t.hitFlash = 0.14;
          soundEngine.playHitTentacle(isWeakSpotHit);
          this.spawnSplashBurst(
            hitPos.x,
            hitPos.y,
            isWeakSpotHit ? '#FBBF24' : atkMul > 1 ? '#FB7185' : '#94A3B8',
            isWeakSpotHit ? 12 : 7,
            180,
          );
          this.addFloatingText(
            hitPos.x,
            hitPos.y - 14,
            isWeakSpotHit
              ? `약점 타격! -${dmg}`
              : atkMul > 1
                ? `광폭 -${dmg}`
                : `-${dmg}`,
            isWeakSpotHit ? '#FBBF24' : atkMul > 1 ? '#FB7185' : '#E2E8F0',
            isWeakSpotHit || atkMul > 1 ? 1.15 : 0.95,
          );
        }
      }
    }

    // Also allow slicing ink orbs out of the air for extra defense!
    for (let i = this.inkProjectiles.length - 1; i >= 0; i--) {
      const orb = this.inkProjectiles[i];
      const d = dist(p, orb);
      if (d <= radius + orb.radius) {
        const angleToOrb = Math.atan2(orb.y - p.y, orb.x - p.x);
        if (Math.abs(angleDiff(angle, angleToOrb)) <= arcSpread * 0.6) {
          this.spawnSplashBurst(orb.x, orb.y, '#818CF8', 8, 130);
          this.inkProjectiles.splice(i, 1);
          this.score += 35;
          if (!hitAny) {
            this.addFloatingText(orb.x, orb.y - 10, '먹물 베기 +35', '#A5B4FC', 0.9);
          }
        }
      }
    }
  }

  public triggerSkillSlot(slotIndex: number): void {
    const slot = this.equippedSword.skills[slotIndex];
    if (!slot) return;
    this.triggerSkill(slot.id, slot);
  }

  public triggerCustomSkill(): void {
    if (!this.customSkill.enabled) return;
    this.triggerSkill('custom_skill');
  }

  public triggerDomainExpansion(): void {
    if (!this.customDomain.enabled) return;
    this.triggerSkill('domain_expansion');
  }

  public triggerSkill(skillId: SkillId, slotOverride?: SwordSkillSlot): void {
    const p = this.player;
    if (p.hp <= 0 || p.skillCooldowns[skillId] > 0) return;

    const slot =
      slotOverride ?? this.equippedSword.skills.find((s) => s.id === skillId);
    const skillName = slot?.name;
    const dmgScale = slot?.damageScale ?? 1;
    const rangeScale = slot?.rangeScale ?? 1;

    const empowered = p.empoweredSlash;
    p.empoweredSlash = false;
    p.skillCooldowns[skillId] = p.skillMaxCooldowns[skillId];

    const angle = this.input.mouseActive
      ? Math.atan2(this.input.mouseY - p.y, this.input.mouseX - p.x)
      : p.aimAngle;
    p.aimAngle = angle;
    p.facingAngle = angle;

    const rangeMul = this.equippedSword.rangeMultiplier * rangeScale;
    const dmgBonus = this.getEffectiveDamageBonus();
    const atkMul = this.getAttackMultiplier();
    const scaleDamage = (base: number) => Math.max(1, Math.round(base * dmgScale * atkMul));

    if (skillId === 'whirlwind') {
      // 360-degree spinning blade tempest + 4 cardinal wind gusts
      p.whirlwindTimer = 0.52;
      p.invulnTimer = Math.max(p.invulnTimer, 0.35);
      const radius = (empowered ? 215 : 185) * rangeMul;
      soundEngine.playSkillWhirlwind();
      this.skillEffects.push({
        id: this.nextId++,
        type: 'whirlwind',
        x: p.x,
        y: p.y,
        angle,
        radius,
        empowered: true,
        life: 0.54,
        maxLife: 0.54,
      });
      this.damageTentaclesInArea(
        p.x,
        p.y,
        radius,
        scaleDamage((empowered ? 6 : 4) + dmgBonus),
        angle,
        skillName || '회전 검풍!',
      );
      for (let wi = 0; wi < 4; wi++) {
        const wAng = angle + (wi * Math.PI) / 2;
        this.swordWaves.push({
          id: this.nextId++,
          x: p.x + Math.cos(wAng) * 22,
          y: p.y + Math.sin(wAng) * 22,
          vx: Math.cos(wAng) * 580,
          vy: Math.sin(wAng) * 580,
          angle: wAng,
          radius: 50 * rangeMul,
          damage: scaleDamage((empowered ? 4 : 2) + dmgBonus),
          empowered: true,
          life: 0.68,
          maxLife: 0.68,
          hitTentacleIds: new Set(),
        });
      }
      this.clearInkInRadius(p.x, p.y, radius + 40);
      this.triggerShake(this.reducedMotion ? 0 : 8, 0.22);
    } else if (skillId === 'wave') {
      // High-velocity piercing crescent waves (multi-fan on high tier swords)
      soundEngine.playSkillWave();
      const speed = 740;
      const totalWaves = 1 + (this.equippedSword.extraWaves ?? 0);
      const spreadStep = 0.2;
      for (let wi = 0; wi < totalWaves; wi++) {
        const offset = (wi - (totalWaves - 1) / 2) * spreadStep;
        const wAngle = angle + offset;
        this.swordWaves.push({
          id: this.nextId++,
          x: p.x + Math.cos(wAngle) * 26,
          y: p.y + Math.sin(wAngle) * 26,
          vx: Math.cos(wAngle) * speed,
          vy: Math.sin(wAngle) * speed,
          angle: wAngle,
          radius: (empowered ? 92 : 76) * rangeMul,
          damage: scaleDamage((empowered ? 6 : 4) + dmgBonus),
          empowered: true,
          life: 1.5,
          maxLife: 1.5,
          hitTentacleIds: new Set(),
        });
      }
      p.swingTimer = p.swingDuration;
      p.swingDir = p.swingDir === 1 ? -1 : 1;
      this.spawnSplashBurst(p.x, p.y, this.equippedSword.glowColor, 18, 200);
      if (skillName) {
        this.addFloatingText(p.x, p.y - 30, skillName, this.equippedSword.glowColor, 1.15);
      }
    } else if (skillId === 'cleaver') {
      // Leap high and slam down with giant spectral broadsword pillar!
      soundEngine.playSkillCleaver();
      p.cleaverTimer = p.cleaverDuration;
      p.cleaverLanded = false;
      p.invulnTimer = Math.max(p.invulnTimer, 0.64);
      const dest = clampToShip(
        p.x + Math.cos(angle) * 105,
        p.y + Math.sin(angle) * 105,
        p.radius + 10,
      );
      p.dashDir = { x: (dest.x - p.x) / 105, y: (dest.y - p.y) / 105 };
      this.skillEffects.push({
        id: this.nextId++,
        type: 'cleaver',
        x: dest.x,
        y: dest.y,
        angle,
        radius: (empowered ? 245 : 215) * rangeMul,
        empowered: true,
        life: 0.78,
        maxLife: 0.78,
      });
    } else if (skillId === 'phantom_rush') {
      // Hyper-speed invincible dash slash + arrival shock burst
      soundEngine.playSkillRush();
      const startX = p.x;
      const startY = p.y;
      const rushDist = (empowered ? 290 : 250) * Math.min(1.45, rangeMul);
      const dest = clampToShip(
        p.x + Math.cos(angle) * rushDist,
        p.y + Math.sin(angle) * rushDist,
        p.radius + 10,
      );
      p.invulnTimer = Math.max(p.invulnTimer, 0.45);
      p.x = dest.x;
      p.y = dest.y;
      p.swingTimer = p.swingDuration;
      p.swingDir = p.swingDir === 1 ? -1 : 1;

      for (let s = 0; s < 6; s++) {
        const u = s / 5;
        this.ghostTrails.push({
          x: lerp(startX, dest.x, u),
          y: lerp(startY, dest.y, u),
          facingAngle: angle,
          alpha: 0.8 - u * 0.14,
        });
      }
      this.skillEffects.push({
        id: this.nextId++,
        type: 'phantom_rush',
        x: startX,
        y: startY,
        endX: dest.x,
        endY: dest.y,
        angle,
        radius: (empowered ? 92 : 76) * rangeMul,
        empowered: true,
        life: 0.42,
        maxLife: 0.42,
      });

      const corridorR = (empowered ? 105 : 88) * rangeMul;
      const rushDmg = scaleDamage((empowered ? 7 : 5) + dmgBonus);
      for (let i = this.tentacles.length - 1; i >= 0; i--) {
        const t = this.tentacles[i];
        if (t.phase === 'retracting') continue;
        const cutSeg = distToSegment(t.cutPoint, { x: startX, y: startY }, dest);
        const tipSeg = distToSegment(t.currentTip, { x: startX, y: startY }, dest);
        if (Math.min(cutSeg.d, tipSeg.d) <= corridorR + t.width * 0.45) {
          const isWeak = t.phase === 'vulnerable';
          const dmg = isWeak ? rushDmg + 2 : rushDmg;
          if (t.hp - dmg <= 0) {
            this.severTentacle(t, i, angle);
          } else {
            t.hp -= dmg;
            t.hitFlash = 0.18;
            soundEngine.playHitTentacle(isWeak);
            this.spawnSplashBurst(t.cutPoint.x, t.cutPoint.y, this.equippedSword.glowColor, 14, 220);
            this.addFloatingText(
              t.cutPoint.x,
              t.cutPoint.y - 16,
              `${skillName || '섬광 돌진'} -${dmg}`,
              '#E879F9',
              1.15,
            );
          }
        }
      }
      this.damageTentaclesInArea(
        dest.x,
        dest.y,
        115 * rangeMul,
        scaleDamage(3 + dmgBonus),
        angle,
        '일섬 폭발!',
      );
      this.clearInkInRadius((startX + dest.x) * 0.5, (startY + dest.y) * 0.5, rushDist * 0.7 + corridorR);
      this.spawnSplashBurst(dest.x, dest.y, this.equippedSword.glowColor, 20, 240);
      this.triggerShake(this.reducedMotion ? 0 : 9, 0.2);
    } else if (skillId === 'blade_orbit') {
      // Summon high-speed 4 orbiting swords + instant activation burst
      soundEngine.playSkillOrbit();
      p.orbitTimer = empowered ? 7.5 : 6.0;
      this.orbitTickTimer = 0;
      this.damageTentaclesInArea(
        p.x,
        p.y,
        145 * rangeMul,
        scaleDamage(3 + dmgBonus),
        angle,
        skillName || '호위 검진!',
      );
      this.spawnSplashBurst(p.x, p.y, this.equippedSword.glowColor, 22, 210);
      this.addFloatingText(p.x, p.y - 34, `${skillName || '호위 검진'} 발동!`, '#34D399', 1.25);
    } else if (skillId === 'meteor_barrage') {
      // Heavy multi-sword sky barrage
      soundEngine.playSkillMeteor();
      const targetCenter = clampToShip(
        p.x + Math.cos(angle) * 145,
        p.y + Math.sin(angle) * 145,
        42,
      );
      const count = 6 + (this.equippedSword.extraMeteors ?? 0);
      const spreadR = 125 * Math.min(1.45, rangeMul);
      const meteorDmg = scaleDamage((empowered ? 6 : 4) + dmgBonus);
      const meteorHitR = (empowered ? 175 : 148) * rangeMul;
      for (let m = 0; m < count; m++) {
        const ringAng = angle + (m * Math.PI * 2) / count;
        const distOff = m === 0 ? 0 : m >= 6 ? spreadR * 1.4 : spreadR;
        const pos = clampToShip(
          targetCenter.x + Math.cos(ringAng) * distOff,
          targetCenter.y + Math.sin(ringAng) * distOff,
          30,
        );
        this.pendingMeteors.push({
          x: pos.x,
          y: pos.y,
          angle: ringAng,
          radius: meteorHitR,
          damage: meteorDmg,
          empowered: true,
          delay: m * 0.07,
          impactDelay: 0.24,
          spawnedEffect: false,
          landed: false,
        });
      }
      this.addFloatingText(
        targetCenter.x,
        targetCenter.y - 32,
        `${skillName || '유성 검우'} 강림!`,
        '#FBBF24',
        1.3,
      );
    } else if (skillId === 'frost_nova') {
      // Icy cyan shock dome + 6 frost waves + freezes telegraph/attacking tentacles to vulnerable!
      soundEngine.playSkillCleaver();
      p.invulnTimer = Math.max(p.invulnTimer, 0.45);
      const radius = (empowered ? 260 : 225) * rangeMul;
      this.skillEffects.push({
        id: this.nextId++,
        type: 'frost_nova',
        x: p.x,
        y: p.y,
        angle,
        radius,
        empowered: true,
        life: 0.68,
        maxLife: 0.68,
      });
      for (const t of this.tentacles) {
        if ((t.phase === 'emerging' || t.phase === 'telegraph' || t.phase === 'attacking') && dist(p, t.cutPoint) <= radius + 65) {
          t.phase = 'vulnerable';
          t.phaseTimer = 0;
          t.phaseDuration = 2.2;
        }
      }
      this.damageTentaclesInArea(
        p.x,
        p.y,
        radius,
        scaleDamage((empowered ? 6 : 4) + dmgBonus),
        angle,
        skillName || '빙결 충격파!',
      );
      for (let wi = 0; wi < 6; wi++) {
        const wAng = angle + (wi * Math.PI * 2) / 6;
        this.swordWaves.push({
          id: this.nextId++,
          x: p.x + Math.cos(wAng) * 20,
          y: p.y + Math.sin(wAng) * 20,
          vx: Math.cos(wAng) * 580,
          vy: Math.sin(wAng) * 580,
          angle: wAng,
          radius: 52 * rangeMul,
          damage: scaleDamage(3 + dmgBonus),
          empowered: true,
          life: 0.95,
          maxLife: 0.95,
          hitTentacleIds: new Set(),
        });
      }
      this.clearInkInRadius(p.x, p.y, radius + 60);
      this.spawnSplashBurst(p.x, p.y, '#7DD3FC', 26, 260);
      this.triggerShake(this.reducedMotion ? 0 : 10, 0.25);
      this.addFloatingText(p.x, p.y - 36, `${skillName || '빙결 충격파'}!`, '#38BDF8', 1.25);
    } else if (skillId === 'cross_slash') {
      // Giant intersecting X-slash + twin heavy waves + center detonation
      soundEngine.playSlash(true);
      p.swingTimer = p.swingDuration;
      p.swingDir = p.swingDir === 1 ? -1 : 1;
      const radius = (empowered ? 195 : 165) * rangeMul;
      for (const offset of [-0.46, 0.46]) {
        const sAng = angle + offset;
        this.slashArcs.push({
          x: p.x,
          y: p.y,
          angle: sAng,
          arcSpread: Math.PI * 0.78,
          radius,
          life: 0.24,
          maxLife: 0.24,
          empowered: true,
          hitCount: 0,
        });
        this.swordWaves.push({
          id: this.nextId++,
          x: p.x + Math.cos(sAng) * 22,
          y: p.y + Math.sin(sAng) * 22,
          vx: Math.cos(sAng) * 680,
          vy: Math.sin(sAng) * 680,
          angle: sAng,
          radius: 66 * rangeMul,
          damage: scaleDamage((empowered ? 6 : 4) + dmgBonus),
          empowered: true,
          life: 1.15,
          maxLife: 1.15,
          hitTentacleIds: new Set(),
        });
      }
      const centerHitX = p.x + Math.cos(angle) * (radius * 0.45);
      const centerHitY = p.y + Math.sin(angle) * (radius * 0.45);
      this.damageTentaclesInArea(
        centerHitX,
        centerHitY,
        radius * 1.05,
        scaleDamage((empowered ? 7 : 5) + dmgBonus),
        angle,
        skillName || '십자 참격!',
      );
      this.clearInkInRadius(centerHitX, centerHitY, radius + 30);
      this.spawnSplashBurst(centerHitX, centerHitY, this.equippedSword.glowColor, 20, 230);
      this.triggerShake(this.reducedMotion ? 0 : 8, 0.2);
    } else if (skillId === 'tsunami_call') {
      // 5 parallel ocean-teal tsunami walls sweeping across the ship deck
      soundEngine.playSkillWave();
      p.swingTimer = p.swingDuration;
      const speed = 600;
      const perpX = -Math.sin(angle);
      const perpY = Math.cos(angle);
      for (const lane of [-96, -48, 0, 48, 96]) {
        this.swordWaves.push({
          id: this.nextId++,
          x: p.x + Math.cos(angle) * 28 + perpX * lane,
          y: p.y + Math.sin(angle) * 28 + perpY * lane,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          angle,
          radius: (empowered ? 105 : 88) * rangeMul,
          damage: scaleDamage((empowered ? 6 : 5) + dmgBonus),
          empowered: true,
          waveStyle: 'tsunami',
          life: 1.65,
          maxLife: 1.65,
          hitTentacleIds: new Set(),
        });
      }
      this.spawnSplashBurst(p.x, p.y, '#2DD4BF', 26, 240);
      this.triggerShake(this.reducedMotion ? 0 : 9, 0.24);
      this.addFloatingText(p.x, p.y - 34, `${skillName || '대범람 해일'}!`, '#2DD4BF', 1.25);
    } else if (skillId === 'creator_judgement') {
      // Creator Sword exclusive ultimate: Heal + Instant Berserk + Cyclone + 16 Emerald Waves + 9 Meteors!
      soundEngine.playBerserkActivate();
      soundEngine.playSkillMeteor();
      p.whirlwindTimer = 0.6;
      p.invulnTimer = Math.max(p.invulnTimer, 1.4);
      if (p.hp < p.maxHp) {
        p.hp += 1;
      } else {
        this.score += 1000;
      }
      this.berserkTimer = BERSERK_DURATION;

      const cycloneR = 265 * rangeMul;
      this.skillEffects.push({
        id: this.nextId++,
        type: 'creator_judgement',
        x: p.x,
        y: p.y,
        angle,
        radius: cycloneR,
        empowered: true,
        life: 0.8,
        maxLife: 0.8,
      });

      this.damageTentaclesInArea(
        p.x,
        p.y,
        cycloneR,
        scaleDamage(9 + dmgBonus),
        angle,
        skillName || '제작자의 심판!',
      );

      for (let wi = 0; wi < 16; wi++) {
        const wAng = angle + (wi * Math.PI * 2) / 16;
        this.swordWaves.push({
          id: this.nextId++,
          x: p.x + Math.cos(wAng) * 26,
          y: p.y + Math.sin(wAng) * 26,
          vx: Math.cos(wAng) * 700,
          vy: Math.sin(wAng) * 700,
          angle: wAng,
          radius: 82 * rangeMul,
          damage: scaleDamage(6 + dmgBonus),
          empowered: true,
          waveStyle: 'creator',
          life: 1.55,
          maxLife: 1.55,
          hitTentacleIds: new Set(),
        });
      }

      for (let m = 0; m < 9; m++) {
        const ringAng = angle + (m * Math.PI * 2) / 9;
        const distOff = m === 0 ? 95 : m < 5 ? 165 : 225;
        const pos = clampToShip(
          p.x + Math.cos(ringAng) * distOff,
          p.y + Math.sin(ringAng) * distOff,
          30,
        );
        this.pendingMeteors.push({
          x: pos.x,
          y: pos.y,
          angle: ringAng,
          radius: 175 * rangeMul,
          damage: scaleDamage(7 + dmgBonus),
          empowered: true,
          delay: m * 0.06,
          impactDelay: 0.24,
          spawnedEffect: false,
          landed: false,
        });
      }

      this.inkProjectiles = [];
      this.spawnSplashBurst(p.x, p.y, '#22C55E', 30, 290);
      this.spawnSplashBurst(p.x, p.y, '#FBBF24', 22, 250);
      this.triggerShake(this.reducedMotion ? 0 : 13, 0.36);
      this.addFloatingText(
        p.x,
        p.y - 46,
        `${skillName || '제작자의 오이 심판'} 발동!`,
        '#4ADE80',
        1.4,
      );
    } else if (skillId === 'custom_skill') {
      const cs = this.customSkill;
      if (!cs.enabled) return;
      const customName = cs.name.trim() || '나만의 스킬';
      const customColor = cs.effectColor || '#38bdf8';
      const powerMul = 0.92 + clamp(cs.powerLevel, 1, 5) * 0.42;
      const customRangeMul = rangeMul * (0.88 + clamp(cs.rangeLevel, 1, 5) * 0.2);
      const count = Math.round(clamp(cs.projectileCount, 3, 12));
      const pureBonus = cs.bonusEffect === 'none' ? 1.35 : 1.0;
      const customDmg = Math.max(
        2,
        Math.round(((empowered ? 4 : 3) + dmgBonus) * powerMul * pureBonus * atkMul),
      );
      const areaR = (empowered ? 230 : 195) * customRangeMul;

      if (cs.shape === 'cyclone_burst') {
        soundEngine.playSkillWhirlwind();
        p.whirlwindTimer = 0.52;
        p.invulnTimer = Math.max(p.invulnTimer, 0.4);
        this.skillEffects.push({
          id: this.nextId++,
          type: 'custom_skill',
          customShape: 'cyclone_burst',
          x: p.x,
          y: p.y,
          angle,
          radius: areaR,
          empowered: true,
          life: 0.62,
          maxLife: 0.62,
        });
        this.damageTentaclesInArea(p.x, p.y, areaR, customDmg, angle, `${customName}!`);
        const radialWaves = Math.min(8, Math.max(4, Math.floor(count / 2)));
        for (let wi = 0; wi < radialWaves; wi++) {
          const wAng = angle + (wi * Math.PI * 2) / radialWaves;
          this.swordWaves.push({
            id: this.nextId++,
            x: p.x + Math.cos(wAng) * 24,
            y: p.y + Math.sin(wAng) * 24,
            vx: Math.cos(wAng) * 600,
            vy: Math.sin(wAng) * 600,
            angle: wAng,
            radius: 56 * customRangeMul,
            damage: Math.max(2, Math.round(customDmg * 0.8)),
            empowered: true,
            life: 1.05,
            maxLife: 1.05,
            hitTentacleIds: new Set(),
          });
        }
      } else if (cs.shape === 'radial_waves') {
        soundEngine.playSkillWave();
        p.swingTimer = p.swingDuration;
        p.swingDir = p.swingDir === 1 ? -1 : 1;
        this.skillEffects.push({
          id: this.nextId++,
          type: 'custom_skill',
          customShape: 'radial_waves',
          x: p.x,
          y: p.y,
          angle,
          radius: areaR * 0.9,
          empowered: true,
          life: 0.5,
          maxLife: 0.5,
        });
        const fullCircle = count >= 6;
        const speed = 680;
        for (let wi = 0; wi < count; wi++) {
          const wAng = fullCircle
            ? angle + (wi * Math.PI * 2) / count
            : angle + (wi - (count - 1) / 2) * 0.24;
          this.swordWaves.push({
            id: this.nextId++,
            x: p.x + Math.cos(wAng) * 24,
            y: p.y + Math.sin(wAng) * 24,
            vx: Math.cos(wAng) * speed,
            vy: Math.sin(wAng) * speed,
            angle: wAng,
            radius: 64 * customRangeMul,
            damage: customDmg,
            empowered: true,
            life: 1.45,
            maxLife: 1.45,
            hitTentacleIds: new Set(),
          });
        }
      } else if (cs.shape === 'meteor_storm') {
        soundEngine.playSkillMeteor();
        const targetCenter = clampToShip(
          p.x + Math.cos(angle) * 145,
          p.y + Math.sin(angle) * 145,
          40,
        );
        this.skillEffects.push({
          id: this.nextId++,
          type: 'custom_skill',
          customShape: 'meteor_storm',
          x: targetCenter.x,
          y: targetCenter.y,
          angle,
          radius: areaR * 0.95,
          empowered: true,
          life: 0.58,
          maxLife: 0.58,
        });
        const spreadR = 120 * Math.min(1.45, customRangeMul);
        for (let m = 0; m < count; m++) {
          const ringAng = angle + (m * Math.PI * 2) / count;
          const distOff = m === 0 ? 0 : m >= 6 ? spreadR * 1.35 : spreadR;
          const pos = clampToShip(
            targetCenter.x + Math.cos(ringAng) * distOff,
            targetCenter.y + Math.sin(ringAng) * distOff,
            30,
          );
          this.pendingMeteors.push({
            x: pos.x,
            y: pos.y,
            angle: ringAng,
            radius: 152 * customRangeMul,
            damage: customDmg,
            empowered: true,
            delay: m * 0.07,
            impactDelay: 0.25,
            spawnedEffect: false,
            landed: false,
          });
        }
      } else if (cs.shape === 'lightning_dash') {
        soundEngine.playSkillRush();
        const startX = p.x;
        const startY = p.y;
        const rushDist = (empowered ? 280 : 240) * Math.min(1.45, customRangeMul);
        const dest = clampToShip(
          p.x + Math.cos(angle) * rushDist,
          p.y + Math.sin(angle) * rushDist,
          p.radius + 10,
        );
        p.invulnTimer = Math.max(p.invulnTimer, 0.45);
        p.x = dest.x;
        p.y = dest.y;
        p.swingTimer = p.swingDuration;
        p.swingDir = p.swingDir === 1 ? -1 : 1;
        for (let s = 0; s < 6; s++) {
          const u = s / 5;
          this.ghostTrails.push({
            x: lerp(startX, dest.x, u),
            y: lerp(startY, dest.y, u),
            facingAngle: angle,
            alpha: 0.8 - u * 0.14,
          });
        }
        this.skillEffects.push({
          id: this.nextId++,
          type: 'custom_skill',
          customShape: 'lightning_dash',
          x: startX,
          y: startY,
          endX: dest.x,
          endY: dest.y,
          angle,
          radius: 84 * customRangeMul,
          empowered: true,
          life: 0.46,
          maxLife: 0.46,
        });
        const corridorR = 94 * customRangeMul;
        for (let i = this.tentacles.length - 1; i >= 0; i--) {
          const t = this.tentacles[i];
          if (t.phase === 'retracting') continue;
          const cutSeg = distToSegment(t.cutPoint, { x: startX, y: startY }, dest);
          const tipSeg = distToSegment(t.currentTip, { x: startX, y: startY }, dest);
          if (Math.min(cutSeg.d, tipSeg.d) <= corridorR + t.width * 0.45) {
            const dmg = t.phase === 'vulnerable' ? customDmg + 2 : customDmg;
            if (t.hp - dmg <= 0) {
              this.severTentacle(t, i, angle);
            } else {
              t.hp -= dmg;
              t.hitFlash = 0.16;
              soundEngine.playHitTentacle(t.phase === 'vulnerable');
              this.spawnSplashBurst(t.cutPoint.x, t.cutPoint.y, customColor, 12, 200);
              this.addFloatingText(
                t.cutPoint.x,
                t.cutPoint.y - 16,
                `${customName} -${dmg}`,
                customColor,
                1.1,
              );
            }
          }
        }
        const arrivalWaves = Math.min(6, Math.max(3, Math.floor(count / 2)));
        for (let wi = 0; wi < arrivalWaves; wi++) {
          const wAng = angle + (wi * Math.PI * 2) / arrivalWaves;
          this.swordWaves.push({
            id: this.nextId++,
            x: dest.x + Math.cos(wAng) * 20,
            y: dest.y + Math.sin(wAng) * 20,
            vx: Math.cos(wAng) * 620,
            vy: Math.sin(wAng) * 620,
            angle: wAng,
            radius: 54 * customRangeMul,
            damage: Math.max(2, Math.round(customDmg * 0.78)),
            empowered: true,
            life: 0.95,
            maxLife: 0.95,
            hitTentacleIds: new Set(),
          });
        }
      } else {
        // cross_tsunami: Giant X slash + multi-lane tsunami waves
        soundEngine.playSkillWave();
        p.swingTimer = p.swingDuration;
        p.swingDir = p.swingDir === 1 ? -1 : 1;
        const slashR = 175 * customRangeMul;
        for (const offset of [-0.46, 0.46]) {
          this.slashArcs.push({
            x: p.x,
            y: p.y,
            angle: angle + offset,
            arcSpread: Math.PI * 0.76,
            radius: slashR,
            life: 0.25,
            maxLife: 0.25,
            empowered: true,
            hitCount: 0,
          });
        }
        this.skillEffects.push({
          id: this.nextId++,
          type: 'custom_skill',
          customShape: 'cross_tsunami',
          x: p.x,
          y: p.y,
          angle,
          radius: areaR * 0.9,
          empowered: true,
          life: 0.52,
          maxLife: 0.52,
        });
        const laneCount = Math.min(5, Math.max(3, Math.round(count / 2)));
        const perpX = -Math.sin(angle);
        const perpY = Math.cos(angle);
        for (let li = 0; li < laneCount; li++) {
          const laneOffset = (li - (laneCount - 1) / 2) * 48;
          this.swordWaves.push({
            id: this.nextId++,
            x: p.x + Math.cos(angle) * 28 + perpX * laneOffset,
            y: p.y + Math.sin(angle) * 28 + perpY * laneOffset,
            vx: Math.cos(angle) * 620,
            vy: Math.sin(angle) * 620,
            angle,
            radius: 84 * customRangeMul,
            damage: customDmg,
            empowered: true,
            life: 1.55,
            maxLife: 1.55,
            hitTentacleIds: new Set(),
          });
        }
        this.damageTentaclesInArea(
          p.x + Math.cos(angle) * 60,
          p.y + Math.sin(angle) * 60,
          slashR,
          customDmg,
          angle,
          `${customName}!`,
        );
      }

      if (cs.bonusEffect === 'clear_ink') {
        this.clearInkInRadius(p.x, p.y, areaR + 260);
      } else if (cs.bonusEffect === 'stagger') {
        for (const t of this.tentacles) {
          if (t.phase === 'telegraph' && dist(p, t.cutPoint) <= areaR + 150) {
            t.phaseTimer = 0;
          }
        }
      } else if (cs.bonusEffect === 'heal_one') {
        if (p.hp < p.maxHp) {
          p.hp += 1;
          soundEngine.playPickup();
        } else {
          this.score += 450;
        }
      } else if (cs.bonusEffect === 'berserk_spark') {
        if (this.berserkTimer <= 0) {
          soundEngine.playBerserkActivate();
        }
        this.berserkTimer = Math.max(this.berserkTimer, 5.5);
      } else if (cs.bonusEffect === 'orbit_blades') {
        soundEngine.playSkillOrbit();
        p.orbitTimer = Math.max(p.orbitTimer, 4.5);
      }

      this.spawnSplashBurst(p.x, p.y, customColor, 26, 260);
      this.triggerShake(this.reducedMotion ? 0 : 9, 0.25);
      this.addFloatingText(p.x, p.y - 38, `${customName} 발동!`, customColor, 1.3);
    } else if (skillId === 'vortex_pull') {
      // Gravity black-hole vortex: pulls pickups + compresses tentacles + massive implosion
      soundEngine.playSkillWhirlwind();
      p.whirlwindTimer = 0.56;
      p.invulnTimer = Math.max(p.invulnTimer, 0.45);
      const radius = (empowered ? 265 : 225) * rangeMul;
      this.skillEffects.push({
        id: this.nextId++,
        type: 'vortex_pull',
        x: p.x,
        y: p.y,
        angle,
        radius,
        empowered: true,
        life: 0.68,
        maxLife: 0.68,
      });
      for (const item of this.pickups) {
        item.x = lerp(item.x, p.x, 0.95);
        item.y = lerp(item.y, p.y, 0.95);
      }
      for (const t of this.tentacles) {
        if (t.phase !== 'retracting' && dist(p, t.cutPoint) <= radius + 90) {
          t.cutPoint.x = lerp(t.cutPoint.x, p.x, 0.22);
          t.cutPoint.y = lerp(t.cutPoint.y, p.y, 0.22);
          if (t.phase === 'telegraph') {
            t.phaseTimer = 0;
          }
        }
      }
      this.damageTentaclesInArea(
        p.x,
        p.y,
        radius,
        scaleDamage((empowered ? 7 : 5) + dmgBonus),
        angle,
        skillName || '와류 흡인!',
      );
      this.clearInkInRadius(p.x, p.y, radius + 240);
      this.spawnSplashBurst(p.x, p.y, '#A78BFA', 26, 250);
      this.triggerShake(this.reducedMotion ? 0 : 10, 0.25);
      this.addFloatingText(p.x, p.y - 36, `${skillName || '와류 흡인'}!`, '#C4B5FD', 1.3);
    } else if (skillId === 'thunder_chain') {
      // Chain lightning slashes striking up to 8 active tentacles with violet electric arcs
      soundEngine.playSkillRush();
      p.invulnTimer = Math.max(p.invulnTimer, 0.45);
      p.swingTimer = p.swingDuration;
      const targets = this.tentacles
        .filter((t) => t.phase !== 'retracting')
        .sort((a, b) => dist(p, a.cutPoint) - dist(p, b.cutPoint))
        .slice(0, 8);

      const chainDmg = scaleDamage((empowered ? 7 : 5) + dmgBonus);
      let prevPos: Vec2 = { x: p.x, y: p.y };

      if (targets.length === 0) {
        for (let f = -1; f <= 1; f++) {
          const bAng = angle + f * 0.28;
          const dest = clampToShip(
            p.x + Math.cos(bAng) * (220 * Math.min(1.35, rangeMul)),
            p.y + Math.sin(bAng) * (220 * Math.min(1.35, rangeMul)),
            p.radius + 10,
          );
          this.skillEffects.push({
            id: this.nextId++,
            type: 'thunder_chain',
            x: p.x,
            y: p.y,
            endX: dest.x,
            endY: dest.y,
            angle: bAng,
            radius: 66 * rangeMul,
            empowered: true,
            life: 0.45,
            maxLife: 0.45,
          });
        }
      } else {
        for (const t of targets) {
          const hitPt = { ...t.cutPoint };
          this.skillEffects.push({
            id: this.nextId++,
            type: 'thunder_chain',
            x: prevPos.x,
            y: prevPos.y,
            endX: hitPt.x,
            endY: hitPt.y,
            angle: Math.atan2(hitPt.y - prevPos.y, hitPt.x - prevPos.x),
            radius: 64 * rangeMul,
            empowered: true,
            life: 0.48,
            maxLife: 0.48,
          });
          prevPos = hitPt;

          const idx = this.tentacles.indexOf(t);
          if (idx === -1 || t.phase === 'retracting') continue;
          const isWeak = t.phase === 'vulnerable';
          const dmg = isWeak ? chainDmg + 2 : chainDmg;
          if (t.hp - dmg <= 0) {
            this.severTentacle(t, idx, angle);
          } else {
            t.hp -= dmg;
            t.hitFlash = 0.22;
            if (t.phase === 'telegraph' || t.phase === 'emerging') {
              t.phase = 'vulnerable';
              t.phaseTimer = 0;
              t.phaseDuration = 1.8;
            }
            soundEngine.playHitTentacle(true);
            this.spawnSplashBurst(hitPt.x, hitPt.y, '#C084FC', 14, 240);
            this.addFloatingText(hitPt.x, hitPt.y - 16, `뇌격 -${dmg}`, '#C084FC', 1.2);
          }
        }
      }
      this.clearInkInRadius(p.x, p.y, 260 * rangeMul);
      this.triggerShake(this.reducedMotion ? 0 : 10, 0.24);
      this.addFloatingText(p.x, p.y - 36, `${skillName || '연쇄 뇌격'}!`, '#C084FC', 1.3);
    } else if (skillId === 'phoenix_dive') {
      // Heroic blazing leap slam that radiates 8 radial flame waves upon impact
      soundEngine.playSkillCleaver();
      p.cleaverTimer = p.cleaverDuration;
      p.cleaverLanded = false;
      p.invulnTimer = Math.max(p.invulnTimer, 0.72);
      const jumpDist = 115;
      const dest = clampToShip(
        p.x + Math.cos(angle) * jumpDist,
        p.y + Math.sin(angle) * jumpDist,
        p.radius + 10,
      );
      p.dashDir = { x: (dest.x - p.x) / jumpDist, y: (dest.y - p.y) / jumpDist };
      this.skillEffects.push({
        id: this.nextId++,
        type: 'phoenix_dive',
        x: dest.x,
        y: dest.y,
        angle,
        radius: (empowered ? 245 : 210) * rangeMul,
        empowered: true,
        life: 0.82,
        maxLife: 0.82,
      });
      this.addFloatingText(p.x, p.y - 36, `${skillName || '불사조 강하'}!`, '#FB923C', 1.3);
    } else if (skillId === 'venom_burst') {
      // 7-wave toxic emerald fan barrage + guaranteed scale/coin bonus & extra extraction on sever!
      soundEngine.playSkillWave();
      p.swingTimer = p.swingDuration;
      p.swingDir = p.swingDir === 1 ? -1 : 1;
      const speed = 690;
      const fanOffsets = [-0.42, -0.28, -0.14, 0, 0.14, 0.28, 0.42];
      for (const offset of fanOffsets) {
        const wAngle = angle + offset;
        this.swordWaves.push({
          id: this.nextId++,
          x: p.x + Math.cos(wAngle) * 24,
          y: p.y + Math.sin(wAngle) * 24,
          vx: Math.cos(wAngle) * speed,
          vy: Math.sin(wAngle) * speed,
          angle: wAngle,
          radius: (empowered ? 66 : 56) * rangeMul,
          damage: scaleDamage((empowered ? 6 : 4) + dmgBonus),
          empowered: true,
          waveStyle: 'venom',
          life: 1.35,
          maxLife: 1.35,
          hitTentacleIds: new Set(),
        });
      }
      const severedBefore = this.severedCount;
      const frontX = p.x + Math.cos(angle) * (80 * rangeMul);
      const frontY = p.y + Math.sin(angle) * (80 * rangeMul);
      this.damageTentaclesInArea(
        frontX,
        frontY,
        140 * rangeMul,
        scaleDamage((empowered ? 6 : 4) + dmgBonus),
        angle,
        skillName || '맹독 파열!',
      );
      const baseScale = this.awardScales(this.severedCount > severedBefore ? 2 : 1);
      this.addFloatingText(p.x, p.y - 48, `맹독 비늘 추출 +${baseScale}!`, '#34D399', 1.2);
      this.spawnSplashBurst(p.x, p.y, '#34D399', 22, 230);
      this.triggerShake(this.reducedMotion ? 0 : 8, 0.2);
    } else if (skillId === 'time_freeze') {
      // Chronos teal dome: freezes every tentacle on deck for 3.5s, cuts other skill cooldowns, blasts deck!
      soundEngine.playSkillCleaver();
      p.invulnTimer = Math.max(p.invulnTimer, 1.0);
      const radius = (empowered ? 360 : 320) * rangeMul;
      this.skillEffects.push({
        id: this.nextId++,
        type: 'time_freeze',
        x: p.x,
        y: p.y,
        angle,
        radius,
        empowered: true,
        life: 0.8,
        maxLife: 0.8,
      });
      for (const t of this.tentacles) {
        if (t.phase === 'emerging' || t.phase === 'telegraph' || t.phase === 'attacking') {
          t.phase = 'vulnerable';
          t.phaseTimer = 0;
          t.phaseDuration = 3.5;
        } else if (t.phase === 'vulnerable') {
          t.phaseTimer = 0;
          t.phaseDuration = Math.max(t.phaseDuration, 3.5);
        }
      }
      (Object.keys(p.skillCooldowns) as SkillId[]).forEach((k) => {
        if (k !== 'time_freeze') {
          p.skillCooldowns[k] = Math.max(0, p.skillCooldowns[k] - 1.2);
        }
      });
      this.damageTentaclesInArea(
        p.x,
        p.y,
        radius,
        scaleDamage((empowered ? 6 : 4) + dmgBonus),
        angle,
        skillName || '시간 정지!',
      );
      this.inkProjectiles = [];
      this.spawnSplashBurst(p.x, p.y, '#5EEAD4', 28, 260);
      this.triggerShake(this.reducedMotion ? 0 : 10, 0.26);
      this.addFloatingText(p.x, p.y - 40, `${skillName || '시간 정지'} · 3.5초 봉인!`, '#5EEAD4', 1.35);
    } else if (skillId === 'dragon_breath') {
      // Roaring 7-projectile blazing dragon stream + huge frontal cleave
      soundEngine.playSkillWave();
      soundEngine.playSlash(true);
      p.swingTimer = p.swingDuration;
      p.swingDir = p.swingDir === 1 ? -1 : 1;
      const slashR = (empowered ? 195 : 165) * rangeMul;
      this.slashArcs.push({
        x: p.x,
        y: p.y,
        angle,
        arcSpread: Math.PI * 0.9,
        radius: slashR,
        life: 0.26,
        maxLife: 0.26,
        empowered: true,
        hitCount: 0,
      });
      this.skillEffects.push({
        id: this.nextId++,
        type: 'dragon_breath',
        x: p.x + Math.cos(angle) * 60,
        y: p.y + Math.sin(angle) * 60,
        angle,
        radius: slashR,
        empowered: true,
        life: 0.56,
        maxLife: 0.56,
      });
      const perpX = -Math.sin(angle);
      const perpY = Math.cos(angle);
      for (let b = 0; b < 7; b++) {
        const lateral = (b - 3) * 16;
        const forward = 22 + b * 22;
        const speed = 740 + b * 24;
        this.swordWaves.push({
          id: this.nextId++,
          x: p.x + Math.cos(angle) * forward + perpX * lateral,
          y: p.y + Math.sin(angle) * forward + perpY * lateral,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          angle,
          radius: (empowered ? 84 : 72) * rangeMul,
          damage: scaleDamage((empowered ? 6 : 4) + dmgBonus),
          empowered: true,
          waveStyle: 'dragon',
          life: 1.45,
          maxLife: 1.45,
          hitTentacleIds: new Set(),
        });
      }
      this.damageTentaclesInArea(
        p.x + Math.cos(angle) * (slashR * 0.55),
        p.y + Math.sin(angle) * (slashR * 0.55),
        slashR,
        scaleDamage((empowered ? 7 : 5) + dmgBonus),
        angle,
        skillName || '용의 숨결!',
      );
      this.clearInkInRadius(p.x + Math.cos(angle) * 100, p.y + Math.sin(angle) * 100, slashR + 90);
      this.spawnSplashBurst(p.x, p.y, '#F97316', 26, 260);
      this.triggerShake(this.reducedMotion ? 0 : 10, 0.24);
      this.addFloatingText(p.x, p.y - 36, `${skillName || '용의 숨결'}!`, '#FB923C', 1.3);
    } else if (skillId === 'galaxy_collapse') {
      // 6 intersecting cosmic slash arcs + 12 radial galaxy waves + cosmic vortex dome
      soundEngine.playSlash(true);
      soundEngine.playSkillMeteor();
      p.invulnTimer = Math.max(p.invulnTimer, 0.55);
      p.swingTimer = p.swingDuration;
      const radius = (empowered ? 245 : 210) * rangeMul;
      for (const offset of [-0.95, -0.57, -0.19, 0.19, 0.57, 0.95]) {
        this.slashArcs.push({
          x: p.x,
          y: p.y,
          angle: angle + offset,
          arcSpread: Math.PI * 0.72,
          radius: radius * 0.88,
          life: 0.28,
          maxLife: 0.28,
          empowered: true,
          hitCount: 0,
        });
      }
      this.skillEffects.push({
        id: this.nextId++,
        type: 'galaxy_collapse',
        x: p.x,
        y: p.y,
        angle,
        radius,
        empowered: true,
        life: 0.74,
        maxLife: 0.74,
      });
      for (let wi = 0; wi < 12; wi++) {
        const wAng = angle + (wi * Math.PI * 2) / 12;
        this.swordWaves.push({
          id: this.nextId++,
          x: p.x + Math.cos(wAng) * 24,
          y: p.y + Math.sin(wAng) * 24,
          vx: Math.cos(wAng) * 680,
          vy: Math.sin(wAng) * 680,
          angle: wAng,
          radius: 66 * rangeMul,
          damage: scaleDamage((empowered ? 6 : 4) + dmgBonus),
          empowered: true,
          waveStyle: 'galaxy',
          life: 1.35,
          maxLife: 1.35,
          hitTentacleIds: new Set(),
        });
      }
      this.damageTentaclesInArea(
        p.x,
        p.y,
        radius,
        scaleDamage((empowered ? 8 : 6) + dmgBonus),
        angle,
        skillName || '은하 붕괴!',
      );
      this.clearInkInRadius(p.x, p.y, radius + 150);
      this.spawnSplashBurst(p.x, p.y, '#E879F9', 30, 280);
      this.triggerShake(this.reducedMotion ? 0 : 12, 0.28);
      this.addFloatingText(p.x, p.y - 38, `${skillName || '은하 붕괴'}!`, '#E879F9', 1.35);
    } else if (skillId === 'divine_ascension') {
      // God Sword exclusive ultimate: +2 HP (or +1500 score) + Berserk + 20 divine waves + 11 meteors!
      soundEngine.playBerserkActivate();
      soundEngine.playSkillMeteor();
      p.whirlwindTimer = 0.72;
      p.invulnTimer = Math.max(p.invulnTimer, 2.0);
      if (p.hp < p.maxHp) {
        p.hp = Math.min(p.maxHp, p.hp + 2);
      } else {
        this.score += 1500;
      }
      this.berserkTimer = BERSERK_DURATION;

      const divineR = 300 * rangeMul;
      this.skillEffects.push({
        id: this.nextId++,
        type: 'divine_ascension',
        x: p.x,
        y: p.y,
        angle,
        radius: divineR,
        empowered: true,
        life: 0.9,
        maxLife: 0.9,
      });
      this.damageTentaclesInArea(
        p.x,
        p.y,
        divineR,
        scaleDamage(12 + dmgBonus),
        angle,
        skillName || '신의 강림!',
      );
      for (let wi = 0; wi < 20; wi++) {
        const wAng = angle + (wi * Math.PI * 2) / 20;
        this.swordWaves.push({
          id: this.nextId++,
          x: p.x + Math.cos(wAng) * 26,
          y: p.y + Math.sin(wAng) * 26,
          vx: Math.cos(wAng) * 760,
          vy: Math.sin(wAng) * 760,
          angle: wAng,
          radius: 88 * rangeMul,
          damage: scaleDamage(7 + dmgBonus),
          empowered: true,
          waveStyle: 'divine',
          life: 1.6,
          maxLife: 1.6,
          hitTentacleIds: new Set(),
        });
      }
      for (let m = 0; m < 11; m++) {
        const ringAng = angle + (m * Math.PI * 2) / 11;
        const distOff = m === 0 ? 85 : m < 6 ? 160 : 230;
        const pos = clampToShip(
          p.x + Math.cos(ringAng) * distOff,
          p.y + Math.sin(ringAng) * distOff,
          30,
        );
        this.pendingMeteors.push({
          x: pos.x,
          y: pos.y,
          angle: ringAng,
          radius: 190 * rangeMul,
          damage: scaleDamage(8 + dmgBonus),
          empowered: true,
          delay: m * 0.055,
          impactDelay: 0.22,
          spawnedEffect: false,
          landed: false,
        });
      }
      this.inkProjectiles = [];
      (Object.keys(p.skillCooldowns) as SkillId[]).forEach((k) => {
        if (k !== 'divine_ascension') {
          p.skillCooldowns[k] = Math.max(0, p.skillCooldowns[k] - 3.0);
        }
      });
      this.spawnSplashBurst(p.x, p.y, '#FDE047', 34, 320);
      this.spawnSplashBurst(p.x, p.y, '#FFFFFF', 24, 260);
      this.triggerShake(this.reducedMotion ? 0 : 15, 0.45);
      this.addFloatingText(
        p.x,
        p.y - 48,
        `${skillName || '신의 강림 · 태초 천벌'}!`,
        '#FEF08A',
        1.5,
      );
    } else if (skillId === 'domain_expansion') {
      const dom = this.customDomain;
      if (!dom.enabled) return;
      const domDuration = clamp(dom.duration, 4, 12);
      const domRadius = 260 + clamp(dom.radiusLevel, 1, 3) * 85;
      const domColor = dom.domainColor || '#38bdf8';
      const callout = this.formatDomainCallout();

      soundEngine.playDomainExpansion(dom.domainEffect, domDuration);
      p.invulnTimer = Math.max(p.invulnTimer, 1.4);

      this.domainTimer = domDuration;
      this.domainMaxDuration = domDuration;
      this.domainX = p.x;
      this.domainY = p.y;
      this.domainRadius = domRadius;
      this.domainTickTimer = 0.05;
      this.domainHealTimer = 2.0;
      this.domainParticleTimer = 0;

      this.inkProjectiles = [];
      this.damageTentaclesInArea(
        this.domainX,
        this.domainY,
        domRadius,
        scaleDamage(7 + dmgBonus),
        angle,
        callout,
      );
      this.spawnSplashBurst(p.x, p.y, domColor, 32, 300);
      this.spawnSplashBurst(p.x, p.y, '#FFFFFF', 20, 220);
      // Expanding underwater shockwave particle ring around domain perimeter
      for (let ri = 0; ri < 28; ri++) {
        const ringAng = (ri * Math.PI * 2) / 28;
        const ringR = domRadius * (0.28 + (ri % 3) * 0.24);
        this.particles.push({
          x: this.domainX + Math.cos(ringAng) * 28,
          y: this.domainY + Math.sin(ringAng) * 28,
          zHeight: 10 + (ri % 4) * 14,
          vx: Math.cos(ringAng) * ringR * 1.45,
          vy: Math.sin(ringAng) * ringR * 1.45,
          vz: 140 + (ri % 5) * 45,
          radius: 4.5 + (ri % 3) * 1.8,
          color: ri % 2 === 0 ? domColor : '#E0F2FE',
          alpha: 1,
          life: 0.72 + (ri % 3) * 0.14,
          maxLife: 0.72 + (ri % 3) * 0.14,
          drag: 2.2,
        });
      }
      this.triggerShake(this.reducedMotion ? 0 : 14, 0.4);
      this.addFloatingText(p.x, p.y - 52, callout, domColor, 1.45);
    }
  }

  private damageTentaclesInArea(
    cx: number,
    cy: number,
    radius: number,
    baseDmg: number,
    slashAngle: number,
    label: string,
  ): void {
    for (let i = this.tentacles.length - 1; i >= 0; i--) {
      const t = this.tentacles[i];
      if (t.phase === 'retracting') continue;
      const cutDist = dist({ x: cx, y: cy }, t.cutPoint);
      const seg = distToSegment({ x: cx, y: cy }, t.origin, t.currentTip);
      const effectiveDist = Math.min(cutDist - 18, seg.d - t.width * 0.45);
      if (effectiveDist > radius) continue;

      const isWeakSpot = t.phase === 'vulnerable';
      const dmg = isWeakSpot ? baseDmg + 1 : baseDmg;
      if (t.hp - dmg <= 0) {
        this.severTentacle(t, i, slashAngle);
      } else {
        t.hp -= dmg;
        t.hitFlash = 0.16;
        soundEngine.playHitTentacle(isWeakSpot);
        this.spawnSplashBurst(seg.closest.x, seg.closest.y, '#38BDF8', 10, 190);
        this.addFloatingText(seg.closest.x, seg.closest.y - 16, `${label} -${dmg}`, '#38BDF8', 1.05);
      }
    }
  }

  private clearInkInRadius(cx: number, cy: number, radius: number): void {
    for (let i = this.inkProjectiles.length - 1; i >= 0; i--) {
      const orb = this.inkProjectiles[i];
      if (dist({ x: cx, y: cy }, orb) <= radius + orb.radius) {
        this.spawnSplashBurst(orb.x, orb.y, '#818CF8', 8, 130);
        this.inkProjectiles.splice(i, 1);
        this.score += 35;
      }
    }
  }

  private severTentacle(t: Tentacle, index: number, slashAngle: number): void {
    const cfg = DIFFICULTY_CONFIGS[this.difficulty];
    this.combo += 1;
    this.comboTimer = 4.5;
    if (this.combo > this.maxCombo) this.maxCombo = this.combo;
    this.checkBerserkTrigger();

    this.severedCount += 1;
    const scaleDrop = this.awardScales(1 + this.equippedSword.scaleBonus);
    const coinDrop = this.awardCoins(BASE_SEVER_COINS);
    const multiplier = 1 + Math.min(this.combo - 1, 10) * 0.2;
    const gained = Math.round(250 * multiplier * cfg.scoreMultiplier);
    this.score += gained;

    soundEngine.playSever();
    this.hitStopTimer = this.reducedMotion ? 0 : 0.042;
    this.triggerShake(this.reducedMotion ? 0 : 8, 0.22);

    // Spawn severed flying tip piece
    const tipDx = t.currentTip.x - t.cutPoint.x;
    const tipDy = t.currentTip.y - t.cutPoint.y;
    const tipLen = Math.max(42, Math.hypot(tipDx, tipDy));
    const pieceAngle = Math.atan2(tipDy, tipDx);

    this.severedPieces.push({
      x: (t.cutPoint.x + t.currentTip.x) / 2,
      y: (t.cutPoint.y + t.currentTip.y) / 2,
      zHeight: 16,
      vz: 185,
      vx: Math.cos(slashAngle) * 260 + (Math.random() - 0.5) * 90,
      vy: Math.sin(slashAngle) * 260 - 40,
      angle: pieceAngle,
      angularVel: (Math.random() > 0.5 ? 1 : -1) * 7.5,
      length: tipLen,
      width: t.width * 0.8,
      alpha: 1,
      life: 1.0,
      maxLife: 1.0,
    });

    // Juice burst at cut point
    this.spawnSplashBurst(t.cutPoint.x, t.cutPoint.y, '#F59E0B', 16, 260);
    this.spawnSplashBurst(t.cutPoint.x, t.cutPoint.y, '#312E81', 14, 210);
    this.addFloatingText(
      t.cutPoint.x,
      t.cutPoint.y - 20,
      `절단! +${gained} · 비늘 +${scaleDrop} · +${coinDrop}코`,
      this.isBerserkActive() ? '#FB7185' : '#FBBF24',
      1.25,
    );

    // Drop pickup occasionally on the ship deck
    const dropPos = clampToShip(t.cutPoint.x, t.cutPoint.y, 32);
    if (this.player.hp < this.player.maxHp && Math.random() < 0.34) {
      this.pickups.push({
        id: this.nextId++,
        type: 'pearl_heal',
        x: dropPos.x,
        y: dropPos.y,
        radius: 14,
        life: 9.0,
        maxLife: 9.0,
        bobOffset: Math.random() * Math.PI * 2,
      });
    } else if (Math.random() < 0.4) {
      this.pickups.push({
        id: this.nextId++,
        type: 'gold_scale',
        x: dropPos.x,
        y: dropPos.y,
        radius: 13,
        life: 8.0,
        maxLife: 8.0,
        bobOffset: Math.random() * Math.PI * 2,
      });
    }

    // Turn tentacle into rapid retracting stump
    t.phase = 'retracting';
    t.phaseTimer = 0;
    t.phaseDuration = 0.38;
    t.currentTip = { ...t.cutPoint };
    this.tentacles[index] = t;

    // Damage Boss Wave HP
    this.bossHp = Math.max(0, this.bossHp - 1);
    if (this.bossHp === 0 && this.waveTransitionTimer <= 0) {
      this.advanceWave();
    }
  }

  private buildRunSummary(isVictory: boolean): RunSummary {
    const finalScore = Math.floor(this.score);
    const prevBest = this.bestScoreGetter();
    const isNewBest = finalScore > prevBest;
    const hpRatio = this.player.maxHp > 0 ? this.player.hp / this.player.maxHp : 0;

    let grade: EndingGrade = 'B';
    if (isVictory) {
      if (
        hpRatio >= 1 ||
        (hpRatio >= 0.65 && (this.justDodgeCount >= 4 || this.maxCombo >= 8))
      ) {
        grade = 'S';
      } else if (hpRatio >= 0.5 || this.justDodgeCount >= 2) {
        grade = 'A';
      }
    }

    const mName = this.customMonster.name.trim() || '심해의 크라켄';
    let endingTitle = `${mName}에게 삼켜진 항해`;
    let endingEpilogue = `거친 ${mName}의 포위 속에서 끝까지 검을 놓지 않았습니다. 다음 출항에서는 반드시 괴수를 베어낼 것입니다.`;
    let isCustomEnding = false;

    if (isVictory) {
      if (grade === 'S') {
        endingTitle =
          this.difficulty === 'abyss'
            ? '심해의 절대자 · 무결한 검성'
            : '심해의 전설 · 불패의 검호';
        endingEpilogue = `폭풍이 몰아치는 갑판 위에서 ${mName}의 모든 촉수를 완벽하게 베어냈습니다. 거대한 괴수는 심연 속으로 가라앉았고, 바다에는 다시 고요한 새벽빛이 찾아왔습니다.`;
      } else if (grade === 'A') {
        endingTitle = '폭풍을 가르는 황금의 칼날';
        endingEpilogue = `찰나의 회피와 화려한 검기로 거대한 ${mName}을(를) 물리쳤습니다. 갑판 위 승전고 소리와 함께 범선은 무사히 항구를 향해 돛을 올립니다.`;
      } else {
        endingTitle = '불굴의 백전노장 선장';
        endingEpilogue = `수많은 상처를 입고도 끝까지 갑판을 지켜내며 ${mName}을(를) 몰아냈습니다. 선원들의 환호 속에 긴 사투가 막을 내립니다.`;
      }
    }

    if (this.customEnding.enabled) {
      isCustomEnding = true;
      if (isVictory) {
        if (this.customEnding.victoryTitle.trim()) {
          endingTitle = this.customEnding.victoryTitle.trim();
        }
        if (this.customEnding.victoryStory.trim()) {
          endingEpilogue = this.customEnding.victoryStory.trim();
        }
      } else {
        if (this.customEnding.defeatTitle.trim()) {
          endingTitle = this.customEnding.defeatTitle.trim();
        }
        if (this.customEnding.defeatStory.trim()) {
          endingEpilogue = this.customEnding.defeatStory.trim();
        }
      }
    }

    return {
      score: finalScore,
      bestScore: Math.max(finalScore, prevBest),
      scalesEarned: this.scalesEarned,
      coinsEarned: this.coinsEarned,
      isNewBest,
      isVictory,
      isCustomEnding,
      victoryMood: this.customEnding.victoryMood,
      monsterName: mName,
      endlessMode: this.endlessMode,
      grade,
      endingTitle,
      endingEpilogue,
      remainingHp: this.player.hp,
      maxHp: this.player.maxHp,
      severedCount: this.severedCount,
      justDodgeCount: this.justDodgeCount,
      maxCombo: this.maxCombo,
      wave: this.wave,
      finalWave: this.customMonster.finalWave,
      elapsedSeconds: this.elapsedSeconds,
      difficulty: this.difficulty,
    };
  }

  private advanceWave(): void {
    const cfg = DIFFICULTY_CONFIGS[this.difficulty];
    const mName = this.customMonster.name.trim() || '크라켄';

    // Check Final Wave completion -> trigger Victory Ending 3D cinematic!
    if (!this.endlessMode && this.wave >= this.customMonster.finalWave) {
      this.victoryCinematicTimer = this.victoryCinematicDuration;
      this.player.invulnTimer = this.victoryCinematicDuration + 0.5;
      this.score += Math.round(1000 * cfg.scoreMultiplier);
      const bossScales = this.awardScales(6 + this.wave * 2 + this.equippedSword.scaleBonus);
      const bossCoins = this.awardCoins(100 + this.wave * 25);

      for (const t of this.tentacles) {
        if (t.phase !== 'retracting') {
          t.phase = 'retracting';
          t.phaseTimer = 0;
          t.phaseDuration = 0.35;
          this.spawnSplashBurst(t.cutPoint.x, t.cutPoint.y, '#FBBF24', 12, 240);
        }
      }
      this.inkProjectiles = [];
      this.spawnSplashBurst(ARENA_W / 2, 160, '#FBBF24', 28, 280);
      this.spawnSplashBurst(ARENA_W / 2, 160, '#38BDF8', 24, 240);
      this.addFloatingText(
        this.player.x,
        this.player.y - 42,
        `${mName} 격퇴! · 비늘 +${bossScales} · +${bossCoins}코인`,
        '#FBBF24',
        1.45,
      );
      soundEngine.playKrakenDefeat();
      this.triggerShake(this.reducedMotion ? 0 : 12, 0.55);
      return;
    }

    this.wave += 1;
    this.bossMaxHp = 5 + (this.wave - 1) * 2;
    this.bossHp = this.bossMaxHp;
    this.waveTransitionTimer = 1.8;
    this.waveBannerTimer = 2.4;

    // Retract remaining tentacles smoothly and clear ink
    for (const t of this.tentacles) {
      if (t.phase !== 'retracting') {
        t.phase = 'retracting';
        t.phaseTimer = 0;
        t.phaseDuration = 0.45;
      }
    }
    this.inkProjectiles = [];

    const waveScales = this.awardScales(2 + Math.floor(this.wave / 2) + Math.floor(this.equippedSword.scaleBonus / 2));
    const waveCoins = this.awardCoins(35 + this.wave * 10);
    // Restore 1 HP on wave clear
    if (this.player.hp < this.player.maxHp) {
      this.player.hp += 1;
      this.addFloatingText(
        this.player.x,
        this.player.y - 34,
        `단계 돌파! 체력 +1 · 비늘 +${waveScales} · +${waveCoins}코`,
        '#34D399',
        1.2,
      );
    } else {
      this.score += 300;
      this.addFloatingText(
        this.player.x,
        this.player.y - 34,
        `단계 돌파! +300 · 비늘 +${waveScales} · +${waveCoins}코`,
        '#34D399',
        1.2,
      );
    }

    soundEngine.playWaveClear();
    this.triggerShake(this.reducedMotion ? 0 : 10, 0.35);
  }

  private triggerShake(magnitude: number, duration: number): void {
    this.shakeMagnitude = Math.max(this.shakeMagnitude, magnitude);
    this.shakeTimer = Math.max(this.shakeTimer, duration);
  }

  private spawnSplashBurst(
    x: number,
    y: number,
    color: string,
    count: number,
    speed: number,
  ): void {
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = speed * (0.35 + Math.random() * 0.75);
      const maxLife = 0.28 + Math.random() * 0.32;
      this.particles.push({
        x,
        y,
        zHeight: 10 + Math.random() * 14,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        vz: 70 + Math.random() * 140,
        radius: 2.5 + Math.random() * 4.5,
        color,
        alpha: 1,
        life: maxLife,
        maxLife,
        drag: 3.8,
      });
    }
  }

  private addFloatingText(
    x: number,
    y: number,
    text: string,
    color: string,
    scale = 1,
  ): void {
    this.floatingTexts.push({
      x,
      y,
      vy: -52,
      text,
      color,
      life: 0.9,
      maxLife: 0.9,
      scale,
    });
  }

  private spawnTentacle(): void {
    const cfg = DIFFICULTY_CONFIGS[this.difficulty];
    const p = this.player;

    // Pick attack type weighted by custom monster attack focus
    const focus = this.customMonster.attackFocus;
    let pool: TentacleAttackType[] = ['slam', 'slam', 'sweep'];
    if (focus === 'slam_heavy') pool = ['slam', 'slam', 'slam', 'sweep'];
    else if (focus === 'sweep_heavy') pool = ['sweep', 'sweep', 'sweep', 'slam'];
    else if (focus === 'lunge_heavy') pool = ['lunge', 'lunge', 'slam', 'sweep'];

    if (this.wave >= 2 || this.elapsedSeconds > 18) pool.push('lunge');
    const attackType = pool[Math.floor(Math.random() * pool.length)];

    // Pick origin from the ocean surrounding the ship hull
    const side = Math.random();
    let origin: Vec2;
    if (side < 0.44) {
      // Top port ocean (Kraken side)
      const ox = 180 + Math.random() * 640;
      origin = {
        x: ox,
        y: SHIP.centerY - shipHalfWidthAt(ox) - 38,
      };
    } else if (side < 0.72) {
      // Bottom starboard ocean
      const ox = 180 + Math.random() * 640;
      origin = {
        x: ox,
        y: SHIP.centerY + shipHalfWidthAt(ox) + 38,
      };
    } else if (side < 0.87) {
      // Stern ocean (left)
      origin = {
        x: SHIP.sternX - 44,
        y: SHIP.centerY + (Math.random() - 0.5) * 260,
      };
    } else {
      // Bow ocean (right)
      origin = {
        x: SHIP.bowTipX + 28,
        y: SHIP.centerY + (Math.random() - 0.5) * 220,
      };
    }

    let target: Vec2 = clampToShip(
      p.x + (Math.random() - 0.5) * 90,
      p.y + (Math.random() - 0.5) * 90,
      38,
    );

    // Ensure reasonable reach from origin
    const maxReach = 470;
    const dx = target.x - origin.x;
    const dy = target.y - origin.y;
    const d = Math.hypot(dx, dy);
    if (d > maxReach) {
      target = {
        x: origin.x + (dx / d) * maxReach,
        y: origin.y + (dy / d) * maxReach,
      };
    } else if (d < 170) {
      target = {
        x: origin.x + (dx / (d || 1)) * 220,
        y: origin.y + (dy / (d || 1)) * 220,
      };
    }

    const baseHp = (attackType === 'slam' ? 2 : 2) + cfg.tentacleHpBonus + (this.wave >= 4 ? 1 : 0);
    const sweepRadius = clamp(dist(origin, target), 210, 380);
    const centerAngle = Math.atan2(target.y - origin.y, target.x - origin.x);
    const sweepHalf = 0.78;
    const dirSign = Math.random() > 0.5 ? 1 : -1;

    const telegraphBase = attackType === 'slam' ? 1.08 : attackType === 'sweep' ? 1.18 : 1.05;
    const waveSpeedup = Math.max(0.72, 1 - (this.wave - 1) * 0.055);

    const tentacle: Tentacle = {
      id: this.nextId++,
      attackType,
      phase: 'emerging',
      phaseTimer: 0,
      phaseDuration: 0.34,
      origin,
      target,
      sweepStartAngle: centerAngle - sweepHalf * dirSign,
      sweepEndAngle: centerAngle + sweepHalf * dirSign,
      sweepRadius,
      currentTip: { ...origin },
      cutPoint: { ...origin },
      hp: baseHp,
      maxHp: baseHp,
      width: Math.round((attackType === 'slam' ? 32 : 26) * clamp(this.customMonster.scale, 0.85, 1.35)),
      hitFlash: 0,
      didHitPlayer: false,
      justDodgeTriggered: false,
      hueShift: (Math.random() - 0.5) * 16,
      // store computed telegraph duration on phase switch below
    };

    // Stash custom telegraph multiplier via temporary adjustment
    void (telegraphBase * cfg.telegraphMultiplier * waveSpeedup);
    this.tentacles.push(tentacle);
  }

  private getTelegraphDuration(attackType: TentacleAttackType): number {
    const cfg = DIFFICULTY_CONFIGS[this.difficulty];
    const base = attackType === 'slam' ? 1.08 : attackType === 'sweep' ? 1.18 : 1.04;
    const waveScale = Math.max(0.72, 1 - (this.wave - 1) * 0.055);
    const speedFactor = clamp(this.customMonster.speedMultiplier, 0.75, 1.45);
    return (base * cfg.telegraphMultiplier * waveScale) / speedFactor;
  }

  private spawnInkVolley(): void {
    const count = this.wave >= 4 ? 3 : 2;
    const originX = ARENA_W / 2 + (Math.random() - 0.5) * 220;
    const originY = 98;
    const baseAngle = Math.atan2(this.player.y - originY, this.player.x - originX);

    for (let i = 0; i < count; i++) {
      const spread = (i - (count - 1) / 2) * 0.28;
      const ang = baseAngle + spread;
      const speed = (195 + this.wave * 18) * clamp(this.customMonster.speedMultiplier, 0.8, 1.35);
      this.inkProjectiles.push({
        id: this.nextId++,
        x: originX,
        y: originY,
        vx: Math.cos(ang) * speed,
        vy: Math.sin(ang) * speed,
        radius: 13,
        life: 5.5,
        justDodged: false,
      });
    }
    this.spawnSplashBurst(originX, originY, this.customMonster.inkColor || '#6366F1', 10, 120);
  }

  private triggerJustDodge(x: number, y: number): void {
    const cfg = DIFFICULTY_CONFIGS[this.difficulty];
    this.justDodgeCount += 1;
    this.combo += 1;
    this.comboTimer = 4.5;
    if (this.combo > this.maxCombo) this.maxCombo = this.combo;
    this.checkBerserkTrigger();

    const bonus = Math.round(150 * cfg.scoreMultiplier);
    this.score += bonus;

    // Reward player: empower next slash + instant slash reset + skill CD reduction!
    this.player.empoweredSlash = true;
    this.player.slashCooldown = 0;
    (Object.keys(this.player.skillCooldowns) as SkillId[]).forEach((k) => {
      this.player.skillCooldowns[k] = Math.max(0, this.player.skillCooldowns[k] - 1.5);
    });

    soundEngine.playJustDodge();
    this.spawnSplashBurst(x, y, '#FBBF24', 14, 180);
    this.addFloatingText(this.player.x, this.player.y - 32, `아슬아슬 회피! +${bonus}`, '#38BDF8', 1.15);
  }

  private damagePlayer(): void {
    const p = this.player;
    if (p.invulnTimer > 0 || p.hp <= 0) return;

    // God Sword Divine Aegis or Custom Ability Immortal Shield
    const hasAegis =
      Boolean(this.equippedSword.divineBlessing) || this.hasCustomTrait('aegis_revive');
    if (hasAegis && p.hp <= 1 && this.divineAegisCooldown <= 0) {
      this.divineAegisCooldown = 28;
      p.hp = p.maxHp;
      p.invulnTimer = 2.6;
      p.hitFlash = 0.25;
      this.berserkTimer = BERSERK_DURATION;
      this.inkProjectiles = [];

      const aegisR = 260;
      this.skillEffects.push({
        id: this.nextId++,
        type: 'divine_ascension',
        x: p.x,
        y: p.y,
        angle: p.facingAngle,
        radius: aegisR,
        empowered: true,
        life: 0.78,
        maxLife: 0.78,
      });
      this.damageTentaclesInArea(
        p.x,
        p.y,
        aegisR,
        Math.round((10 + this.getEffectiveDamageBonus()) * this.getAttackMultiplier()),
        p.facingAngle,
        '신성 가호!',
      );
      soundEngine.playBerserkActivate();
      this.triggerShake(this.reducedMotion ? 0 : 12, 0.35);
      this.spawnSplashBurst(p.x, p.y, '#FEF08A', 30, 300);
      this.spawnSplashBurst(p.x, p.y, '#FFFFFF', 20, 240);
      this.addFloatingText(p.x, p.y - 44, '불멸의 가호 발동! 100% 부활!', '#FEF08A', 1.45);
      return;
    }

    p.hp -= 1;
    p.invulnTimer = 1.25;
    p.hitFlash = 0.35;
    this.combo = 0;
    this.comboTimer = 0;

    soundEngine.playPlayerHit();
    this.triggerShake(this.reducedMotion ? 0 : 11, 0.28);
    this.spawnSplashBurst(p.x, p.y, '#EF4444', 18, 220);
    this.addFloatingText(p.x, p.y - 26, '피격! -1 HP', '#F87171', 1.15);

    if (p.hp <= 0) {
      p.hp = 0;
      soundEngine.stopDomainAmbience();
      this.emitHud();
      this.onGameOver(this.buildRunSummary(false));
    }
  }

  public update(rawDt: number): void {
    const dt = Math.min(rawDt, 0.05);
    this.ambientTime += dt;

    if (this.waveBannerTimer > 0) {
      this.waveBannerTimer = Math.max(0, this.waveBannerTimer - dt);
    }

    if (this.hitStopTimer > 0) {
      this.hitStopTimer = Math.max(0, this.hitStopTimer - dt);
      return;
    }

    if (this.shakeTimer > 0) {
      this.shakeTimer = Math.max(0, this.shakeTimer - dt);
      if (this.shakeTimer <= 0) this.shakeMagnitude = 0;
    }

    if (this.player.hp <= 0) return;

    // Victory 3D Sinking Sequence before showing Victory Ending Modal
    if (this.victoryCinematicTimer > 0) {
      this.victoryCinematicTimer = Math.max(0, this.victoryCinematicTimer - dt);
      this.updatePlayer(dt);
      this.updateTentacles(dt);
      this.updateSwordWaves(dt);
      this.updateEffects(dt);

      // Celebratory golden sparks across the deck
      if (Math.random() < dt * 10) {
        const fx = 280 + Math.random() * 560;
        const fy = SHIP.centerY + (Math.random() - 0.5) * 260;
        this.spawnSplashBurst(fx, fy, Math.random() > 0.4 ? '#FBBF24' : '#38BDF8', 4, 150);
      }

      if (this.victoryCinematicTimer <= 0 && !this.victoryCompleted) {
        this.victoryCompleted = true;
        soundEngine.stopDomainAmbience();
        soundEngine.playVictoryFanfare();
        this.emitHud();
        this.onVictory(this.buildRunSummary(true));
        return;
      }

      this.emitHud();
      return;
    }

    if (this.victoryCompleted) return;

    this.elapsedSeconds += dt;
    this.score += dt * 12 * DIFFICULTY_CONFIGS[this.difficulty].scoreMultiplier;

    if (this.combo > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.combo = 0;
      }
    }

    if (this.berserkTimer > 0) {
      const prevBerserk = this.berserkTimer;
      this.berserkTimer = Math.max(0, this.berserkTimer - dt);
      this.berserkAuraTimer -= dt;
      if (this.berserkAuraTimer <= 0) {
        this.berserkAuraTimer = 0.15;
        const auraColor = Math.random() > 0.45 ? '#F43F5E' : '#FBBF24';
        this.spawnSplashBurst(this.player.x, this.player.y, auraColor, 2, 110);
      }
      if (prevBerserk > 0 && this.berserkTimer <= 0) {
        this.addFloatingText(this.player.x, this.player.y - 34, '광폭화 종료', '#94A3B8', 1.0);
      }
    }

    const hasAegisTrait = Boolean(this.equippedSword.divineBlessing) || this.hasCustomTrait('aegis_revive');
    const hasLightningTrait = Boolean(this.equippedSword.divineBlessing) || this.hasCustomTrait('auto_lightning');
    const hasRegenTrait = Boolean(this.equippedSword.divineBlessing) || this.hasCustomTrait('auto_regen');
    const dmgBonus = this.getEffectiveDamageBonus();

    if (hasAegisTrait && this.divineAegisCooldown > 0) {
      const prevAegis = this.divineAegisCooldown;
      this.divineAegisCooldown = Math.max(0, this.divineAegisCooldown - dt);
      if (prevAegis > 0 && this.divineAegisCooldown <= 0) {
        this.addFloatingText(this.player.x, this.player.y - 36, '불멸 가호 충전 완료!', '#FEF08A', 1.15);
      }
    }

    if (hasLightningTrait) {
      this.divineLightningTimer -= dt;
      if (this.divineLightningTimer <= 0) {
        const activeTentacles = this.tentacles.filter((t) => t.phase !== 'retracting');
        if (activeTentacles.length > 0) {
          this.divineLightningTimer = 2.8;
          activeTentacles.sort((a, b) => dist(this.player, a.cutPoint) - dist(this.player, b.cutPoint));
          const target = activeTentacles[0];
          const beamAngle = Math.atan2(target.cutPoint.y - this.player.y, target.cutPoint.x - this.player.x);
          this.skillEffects.push({
            id: this.nextId++,
            type: 'thunder_chain',
            x: this.player.x,
            y: this.player.y,
            endX: target.cutPoint.x,
            endY: target.cutPoint.y,
            angle: beamAngle,
            radius: 75,
            empowered: true,
            life: 0.36,
            maxLife: 0.36,
          });
          const boltDmg = Math.max(4, Math.round((7 + dmgBonus) * this.getAttackMultiplier()));
          const idx = this.tentacles.indexOf(target);
          if (target.hp - boltDmg <= 0 && idx >= 0) {
            this.severTentacle(target, idx, beamAngle);
          } else {
            target.hp -= boltDmg;
            target.hitFlash = 0.22;
            if (target.phase === 'emerging' || target.phase === 'telegraph') {
              target.phase = 'vulnerable';
              target.phaseTimer = 0;
              target.phaseDuration = 2.4;
            }
            this.spawnSplashBurst(target.cutPoint.x, target.cutPoint.y, '#FDE047', 16, 220);
            this.addFloatingText(
              target.cutPoint.x,
              target.cutPoint.y - 22,
              `${this.equippedSword.divineBlessing ? '자동 천벌!' : '능력 낙뢰!'} -${boltDmg}`,
              '#FEF08A',
              1.15,
            );
          }
          soundEngine.playSkillRush();
        } else {
          this.divineLightningTimer = 0.5;
        }
      }
    }

    if (hasRegenTrait) {
      this.divineRegenTimer -= dt;
      if (this.divineRegenTimer <= 0) {
        this.divineRegenTimer = 10.0;
        if (this.player.hp < this.player.maxHp) {
          this.player.hp += 1;
          this.spawnSplashBurst(this.player.x, this.player.y, '#34D399', 16, 180);
          this.addFloatingText(this.player.x, this.player.y - 36, '자동 재생 +1 HP', '#34D399', 1.2);
        } else {
          this.score += 300;
          this.spawnSplashBurst(this.player.x, this.player.y, '#FEF08A', 10, 140);
          this.addFloatingText(this.player.x, this.player.y - 34, '축복 점수 +300', '#FEF08A', 1.1);
        }
      }
    }

    // Active Domain Expansion Continuous Effects
    if (this.domainTimer > 0) {
      const prevDomain = this.domainTimer;
      this.domainTimer = Math.max(0, this.domainTimer - dt);
      const dom = this.customDomain;
      const domColor = dom.domainColor || '#38bdf8';
      const atkMul = this.getAttackMultiplier();

      this.clearInkInRadius(this.domainX, this.domainY, this.domainRadius);

      this.domainParticleTimer -= dt;
      if (this.domainParticleTimer <= 0) {
        this.domainParticleTimer = 0.075;
        for (let pi = 0; pi < 2; pi++) {
          const ang = Math.random() * Math.PI * 2;
          const distR = Math.sqrt(Math.random()) * this.domainRadius * 0.92;
          const life = 0.75 + Math.random() * 0.45;
          this.particles.push({
            x: this.domainX + Math.cos(ang) * distR,
            y: this.domainY + Math.sin(ang) * distR,
            zHeight: 6 + Math.random() * 18,
            vx: -Math.sin(ang) * 48 + (Math.random() - 0.5) * 26,
            vy: Math.cos(ang) * 48 + (Math.random() - 0.5) * 26,
            vz: 185 + Math.random() * 130,
            radius: 3.2 + Math.random() * 2.8,
            color: Math.random() > 0.35 ? domColor : '#BAE6FD',
            alpha: 0.95,
            life,
            maxLife: life,
            drag: 1.4,
          });
        }
      }

      this.domainTickTimer -= dt;
      if (this.domainTickTimer <= 0) {
        const eff = dom.domainEffect;
        this.domainTickTimer = eff === 'malevolent_shrine' ? 0.28 : eff === 'celestial_judgement' ? 0.48 : 0.55;

        if (eff === 'infinite_void') {
          for (const t of this.tentacles) {
            if (t.phase !== 'retracting' && dist({ x: this.domainX, y: this.domainY }, t.cutPoint) <= this.domainRadius + 40) {
              t.phase = 'vulnerable';
              t.phaseDuration = Math.max(t.phaseDuration, 2.5);
            }
          }
          this.damageTentaclesInArea(
            this.domainX,
            this.domainY,
            this.domainRadius,
            Math.max(3, Math.round((4 + dmgBonus * 0.65) * atkMul)),
            this.player.facingAngle,
            dom.domainName || '무량공처',
          );
        } else if (eff === 'malevolent_shrine') {
          const randAng = Math.random() * Math.PI * 2;
          this.slashArcs.push({
            x: this.domainX + (Math.random() - 0.5) * 140,
            y: this.domainY + (Math.random() - 0.5) * 110,
            angle: randAng,
            arcSpread: Math.PI * 0.85,
            radius: 175,
            life: 0.16,
            maxLife: 0.16,
            empowered: true,
            hitCount: 0,
          });
          this.damageTentaclesInArea(
            this.domainX,
            this.domainY,
            this.domainRadius,
            Math.max(3, Math.round((4 + dmgBonus * 0.6) * atkMul)),
            randAng,
            dom.domainName || '필중 참격',
          );
        } else if (eff === 'celestial_judgement') {
          const inside = this.tentacles.filter(
            (t) => t.phase !== 'retracting' && dist({ x: this.domainX, y: this.domainY }, t.cutPoint) <= this.domainRadius + 40,
          );
          const pos =
            inside.length > 0
              ? { ...inside[Math.floor(Math.random() * inside.length)].cutPoint }
              : clampToShip(
                  this.domainX + (Math.random() - 0.5) * 260,
                  this.domainY + (Math.random() - 0.5) * 180,
                  32,
                );
          this.pendingMeteors.push({
            x: pos.x,
            y: pos.y,
            angle: Math.random() * Math.PI * 2,
            radius: 165,
            damage: Math.max(4, Math.round((6 + dmgBonus * 0.8) * atkMul)),
            empowered: true,
            delay: 0,
            impactDelay: 0.16,
            spawnedEffect: false,
            landed: false,
          });
        } else {
          // abyss_feast: continuous area slash + periodic heal + coin bonus
          this.damageTentaclesInArea(
            this.domainX,
            this.domainY,
            this.domainRadius,
            Math.max(3, Math.round((4 + dmgBonus * 0.65) * atkMul)),
            this.player.facingAngle,
            dom.domainName || '탐식 영역',
          );
          this.domainHealTimer -= 0.55;
          if (this.domainHealTimer <= 0) {
            this.domainHealTimer = 2.4;
            if (this.player.hp < this.player.maxHp) {
              this.player.hp += 1;
              this.addFloatingText(this.player.x, this.player.y - 34, '영역 흡혈 +1 HP', domColor, 1.15);
            }
          }
        }
      }

      if (prevDomain > 0 && this.domainTimer <= 0) {
        soundEngine.playDomainCollapse();
        this.addFloatingText(this.player.x, this.player.y - 34, '영역 전개 종료', '#94A3B8', 1.0);
      }
    }

    this.updatePlayer(dt);
    this.updateSpawners(dt);
    this.updateTentacles(dt);
    this.updateSwordWaves(dt);
    this.updateInkProjectiles(dt);
    this.updatePickups(dt);
    this.updateEffects(dt);

    this.emitHud();
  }

  private updatePlayer(dt: number): void {
    const p = this.player;
    p.invulnTimer = Math.max(0, p.invulnTimer - dt);
    p.dashCooldown = Math.max(0, p.dashCooldown - dt);
    p.slashCooldown = Math.max(0, p.slashCooldown - dt);
    p.hitFlash = Math.max(0, p.hitFlash - dt);
    p.swingTimer = Math.max(0, p.swingTimer - dt);
    p.whirlwindTimer = Math.max(0, p.whirlwindTimer - dt);
    p.orbitTimer = Math.max(0, p.orbitTimer - dt);

    (Object.keys(p.skillCooldowns) as SkillId[]).forEach((k) => {
      p.skillCooldowns[k] = Math.max(0, p.skillCooldowns[k] - dt);
    });

    const atkMul = this.getAttackMultiplier();

    if (p.orbitTimer > 0) {
      this.orbitTickTimer -= dt;
      if (this.orbitTickTimer <= 0) {
        this.orbitTickTimer = 0.22;
        const orbitR = 135 * this.equippedSword.rangeMultiplier;
        this.damageTentaclesInArea(
          p.x,
          p.y,
          orbitR,
          (2 + Math.floor(this.equippedSword.damageBonus * 0.85)) * atkMul,
          p.aimAngle,
          '검진',
        );
        this.clearInkInRadius(p.x, p.y, orbitR + 24);
      }
    }

    if (this.input.padAimAngle !== null) {
      p.aimAngle = this.input.padAimAngle;
      p.facingAngle = this.input.padAimAngle;
    } else if (this.input.mouseActive) {
      p.aimAngle = Math.atan2(this.input.mouseY - p.y, this.input.mouseX - p.x);
    }

    if (p.cleaverTimer > 0) {
      p.cleaverTimer = Math.max(0, p.cleaverTimer - dt);
      const progress = 1 - p.cleaverTimer / p.cleaverDuration;
      // 3D Parabolic jump arc
      if (progress < 0.72) {
        const u = progress / 0.72;
        p.zHeight = Math.sin(u * Math.PI) * 118;
        p.vx = p.dashDir.x * 210;
        p.vy = p.dashDir.y * 210;
      } else {
        p.zHeight = 0;
        p.vx = 0;
        p.vy = 0;
        if (!p.cleaverLanded) {
          p.cleaverLanded = true;
          const effect = this.skillEffects.find(
            (e) => e.type === 'cleaver' || e.type === 'phoenix_dive',
          );
          const radius = effect?.radius ?? 215 * this.equippedSword.rangeMultiplier;
          const dmg = ((effect?.empowered ? 8 : 6) + this.equippedSword.damageBonus) * atkMul;
          const isPhoenix = effect?.type === 'phoenix_dive';
          this.damageTentaclesInArea(
            p.x,
            p.y,
            radius,
            dmg,
            p.aimAngle,
            isPhoenix ? '불사조 강하!' : '천둥 내려베기!',
          );
          for (const t of this.tentacles) {
            if (t.phase === 'telegraph' && dist(p, t.cutPoint) <= radius + 45) {
              t.phaseTimer = 0;
            }
          }
          if (isPhoenix) {
            for (let k = 0; k < 8; k++) {
              const wAng = p.aimAngle + (k * Math.PI) / 4;
              this.swordWaves.push({
                id: this.nextId++,
                x: p.x + Math.cos(wAng) * 24,
                y: p.y + Math.sin(wAng) * 24,
                vx: Math.cos(wAng) * 660,
                vy: Math.sin(wAng) * 660,
                angle: wAng,
                radius: 64 * this.equippedSword.rangeMultiplier,
                damage: Math.max(3, Math.round(dmg * 0.78)),
                empowered: true,
                waveStyle: 'phoenix',
                life: 1.25,
                maxLife: 1.25,
                hitTentacleIds: new Set(),
              });
            }
          }
          this.clearInkInRadius(p.x, p.y, radius + 40);
          this.spawnSplashBurst(p.x, p.y, isPhoenix ? '#FB923C' : '#FBBF24', 28, 280);
          this.triggerShake(this.reducedMotion ? 0 : 13, 0.3);
        }
      }
    } else if (p.dashTimer > 0) {
      p.zHeight = 14;
      p.dashTimer -= dt;
      const dashSpeed = 760;
      p.vx = p.dashDir.x * dashSpeed;
      p.vy = p.dashDir.y * dashSpeed;
      this.ghostTrails.push({
        x: p.x,
        y: p.y,
        facingAngle: p.facingAngle,
        alpha: 0.55,
      });
    } else {
      p.zHeight = 0;
      let mx =
        (this.input.right ? 1 : 0) -
        (this.input.left ? 1 : 0) +
        this.input.touchMoveX +
        this.input.padMoveX;
      let my =
        (this.input.down ? 1 : 0) -
        (this.input.up ? 1 : 0) +
        this.input.touchMoveY +
        this.input.padMoveY;
      const len = Math.hypot(mx, my);
      if (len > 1) {
        mx /= len;
        my /= len;
      }

      const customSpeedMul = this.customAbility.enabled
        ? 1 + clamp(this.customAbility.speedBonusPct, 0, 50) / 100
        : 1;
      const baseSpeed = this.equippedSword.divineBlessing ? 362 : 290;
      const moveSpeed = baseSpeed * customSpeedMul;
      p.vx = mx * moveSpeed;
      p.vy = my * moveSpeed;

      if (len > 0.1) {
        p.stridePhase += dt * 14;
        if (!this.input.mouseActive && this.input.padAimAngle === null) {
          p.facingAngle = Math.atan2(my, mx);
          p.aimAngle = p.facingAngle;
        }
      }
    }

    const clamped = clampToShip(p.x + p.vx * dt, p.y + p.vy * dt, p.radius + 10);
    p.x = clamped.x;
    p.y = clamped.y;

    // Divine Aura or Custom Ink/Magnet Ability
    if (this.equippedSword.divineBlessing || this.hasCustomTrait('ink_magnet')) {
      this.clearInkInRadius(p.x, p.y, 95);
      for (const item of this.pickups) {
        const d = dist(p, item);
        if (d > 4 && d <= 280) {
          const pull = 360 * dt;
          item.x += ((p.x - item.x) / d) * pull;
          item.y += ((p.y - item.y) / d) * pull;
        }
      }
    }
  }

  private updateSwordWaves(dt: number): void {
    for (let i = this.swordWaves.length - 1; i >= 0; i--) {
      const w = this.swordWaves[i];
      w.x += w.vx * dt;
      w.y += w.vy * dt;
      w.life -= dt;

      // Slice tentacles along flight path
      for (let ti = this.tentacles.length - 1; ti >= 0; ti--) {
        const t = this.tentacles[ti];
        if (t.phase === 'retracting' || w.hitTentacleIds.has(t.id)) continue;

        const seg = distToSegment({ x: w.x, y: w.y }, t.origin, t.currentTip);
        const cutDist = dist({ x: w.x, y: w.y }, t.cutPoint);
        if (seg.d <= w.radius + t.width * 0.4 || cutDist <= w.radius + 20) {
          w.hitTentacleIds.add(t.id);
          const isWeakSpot = t.phase === 'vulnerable';
          const dmg = isWeakSpot ? w.damage + 1 : w.damage;
          if (t.hp - dmg <= 0) {
            this.severTentacle(t, ti, w.angle);
          } else {
            t.hp -= dmg;
            t.hitFlash = 0.15;
            soundEngine.playHitTentacle(isWeakSpot);
            this.spawnSplashBurst(w.x, w.y, '#38BDF8', 10, 180);
            this.addFloatingText(w.x, w.y - 16, `검기 파동 -${dmg}`, '#38BDF8', 1.05);
          }
        }
      }

      // Evaporate ink projectiles
      this.clearInkInRadius(w.x, w.y, w.radius * 0.85);

      if (w.life <= 0 || w.x < -80 || w.x > ARENA_W + 80 || w.y < -80 || w.y > ARENA_H + 80) {
        this.swordWaves.splice(i, 1);
      }
    }
  }

  private updateSpawners(dt: number): void {
    if (this.waveTransitionTimer > 0) {
      this.waveTransitionTimer -= dt;
      return;
    }

    const cfg = DIFFICULTY_CONFIGS[this.difficulty];
    const maxConcurrent = Math.min(5, 2 + Math.floor((this.wave + 1) / 2));
    const activeCount = this.tentacles.filter((t) => t.phase !== 'retracting').length;

    const speedMul = clamp(this.customMonster.speedMultiplier, 0.75, 1.45);
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0 && activeCount < maxConcurrent) {
      this.spawnTentacle();
      const baseInterval = Math.max(0.75, 1.85 - (this.wave - 1) * 0.14);
      this.spawnTimer = baseInterval / (cfg.spawnRateMultiplier * speedMul);
    }

    if (this.wave >= 2 || this.elapsedSeconds > 22) {
      this.inkTimer -= dt;
      if (this.inkTimer <= 0) {
        this.spawnInkVolley();
        this.inkTimer =
          Math.max(2.6, 5.2 - this.wave * 0.35) / (cfg.spawnRateMultiplier * speedMul);
      }
    }
  }

  private updateTentacles(dt: number): void {
    const p = this.player;
    const isVoidDomain =
      this.domainTimer > 0 && this.customDomain.domainEffect === 'infinite_void';

    for (let i = this.tentacles.length - 1; i >= 0; i--) {
      const t = this.tentacles[i];
      const frozenInVoid =
        isVoidDomain &&
        t.phase !== 'retracting' &&
        dist({ x: this.domainX, y: this.domainY }, t.cutPoint) <= this.domainRadius + 40;
      t.phaseTimer += frozenInVoid ? dt * 0.08 : dt;
      t.hitFlash = Math.max(0, t.hitFlash - dt);

      const progress = clamp(t.phaseTimer / t.phaseDuration, 0, 1);

      if (t.phase === 'emerging') {
        const emergePos = {
          x: lerp(t.origin.x, t.target.x, 0.14 * progress),
          y: lerp(t.origin.y, t.target.y, 0.14 * progress),
        };
        t.currentTip = emergePos;
        t.cutPoint = { ...emergePos };

        if (progress >= 1) {
          t.phase = 'telegraph';
          t.phaseTimer = 0;
          t.phaseDuration = this.getTelegraphDuration(t.attackType);
        }
      } else if (t.phase === 'telegraph') {
        // Lunge tracks player during first 55% of telegraph, then locks aim
        if (t.attackType === 'lunge' && progress < 0.55) {
          const dx = p.x - t.origin.x;
          const dy = p.y - t.origin.y;
          const d = Math.max(1, Math.hypot(dx, dy));
          const reach = clamp(d + 55, 240, 480);
          t.target = clampToShip(
            t.origin.x + (dx / d) * reach,
            t.origin.y + (dy / d) * reach,
            34,
          );
        }

        // Coil slightly back before strike
        const pullAngle = Math.atan2(t.target.y - t.origin.y, t.target.x - t.origin.x);
        const wobble = Math.sin(this.ambientTime * 16 + t.id) * 6;
        t.currentTip = {
          x: t.origin.x + Math.cos(pullAngle) * 38 + Math.cos(pullAngle + 1.57) * wobble,
          y: t.origin.y + Math.sin(pullAngle) * 38 + Math.sin(pullAngle + 1.57) * wobble,
        };
        t.cutPoint = { ...t.currentTip };

        if (progress >= 1) {
          t.phase = 'attacking';
          t.phaseTimer = 0;
          t.phaseDuration = t.attackType === 'sweep' ? 0.42 : t.attackType === 'lunge' ? 0.22 : 0.14;
        }
      } else if (t.phase === 'attacking') {
        if (t.attackType === 'slam' || t.attackType === 'lunge') {
          const ease = 1 - Math.pow(1 - progress, 3);
          t.currentTip = {
            x: lerp(t.origin.x, t.target.x, ease),
            y: lerp(t.origin.y, t.target.y, ease),
          };
          t.cutPoint = {
            x: lerp(t.origin.x, t.currentTip.x, 0.62),
            y: lerp(t.origin.y, t.currentTip.y, 0.62),
          };

          // Hit detection against slam/lunge corridor
          const seg = distToSegment(p, t.origin, t.currentTip);
          const hitThreshold = t.width * 0.56 + p.radius;
          if (seg.d <= hitThreshold) {
            if (p.dashTimer > 0 && !t.justDodgeTriggered) {
              t.justDodgeTriggered = true;
              this.triggerJustDodge(p.x, p.y);
            } else if (!t.didHitPlayer && p.invulnTimer <= 0) {
              t.didHitPlayer = true;
              this.damagePlayer();
            }
          } else if (
            p.dashTimer > 0 &&
            !t.justDodgeTriggered &&
            seg.d <= hitThreshold + 38
          ) {
            t.justDodgeTriggered = true;
            this.triggerJustDodge(p.x, p.y);
          }

          if (progress >= 1) {
            soundEngine.playSlamImpact();
            this.spawnSplashBurst(t.target.x, t.target.y, '#94A3B8', 12, 170);
            this.triggerShake(this.reducedMotion ? 0 : 4.5, 0.14);
            t.phase = 'vulnerable';
            t.phaseTimer = 0;
            t.phaseDuration = t.attackType === 'slam' ? 2.45 : 2.05;
          }
        } else {
          // Sweep attack
          const ang = lerp(t.sweepStartAngle, t.sweepEndAngle, progress);
          t.currentTip = {
            x: t.origin.x + Math.cos(ang) * t.sweepRadius,
            y: t.origin.y + Math.sin(ang) * t.sweepRadius,
          };
          t.cutPoint = {
            x: lerp(t.origin.x, t.currentTip.x, 0.65),
            y: lerp(t.origin.y, t.currentTip.y, 0.65),
          };

          const seg = distToSegment(p, t.origin, t.currentTip);
          const hitThreshold = t.width * 0.52 + p.radius;
          if (seg.d <= hitThreshold) {
            if (p.dashTimer > 0 && !t.justDodgeTriggered) {
              t.justDodgeTriggered = true;
              this.triggerJustDodge(p.x, p.y);
            } else if (!t.didHitPlayer && p.invulnTimer <= 0) {
              t.didHitPlayer = true;
              this.damagePlayer();
            }
          }

          if (progress >= 1) {
            t.phase = 'vulnerable';
            t.phaseTimer = 0;
            t.phaseDuration = 2.15;
          }
        }
      } else if (t.phase === 'vulnerable') {
        // Expose cutPoint cleanly so player can slice it!
        t.cutPoint = {
          x: lerp(t.origin.x, t.currentTip.x, 0.64),
          y: lerp(t.origin.y, t.currentTip.y, 0.64),
        };
        if (progress >= 1) {
          t.phase = 'retracting';
          t.phaseTimer = 0;
          t.phaseDuration = 0.42;
        }
      } else if (t.phase === 'retracting') {
        t.currentTip = {
          x: lerp(t.currentTip.x, t.origin.x, dt * 8),
          y: lerp(t.currentTip.y, t.origin.y, dt * 8),
        };
        if (progress >= 1) {
          this.tentacles.splice(i, 1);
        }
      }
    }
  }

  private updateInkProjectiles(dt: number): void {
    const p = this.player;
    for (let i = this.inkProjectiles.length - 1; i >= 0; i--) {
      const orb = this.inkProjectiles[i];
      orb.x += orb.vx * dt;
      orb.y += orb.vy * dt;
      orb.life -= dt;

      const d = dist(p, orb);
      if (d <= p.radius + orb.radius) {
        if (p.dashTimer > 0 && !orb.justDodged) {
          orb.justDodged = true;
          this.triggerJustDodge(p.x, p.y);
        } else if (p.invulnTimer <= 0) {
          this.inkProjectiles.splice(i, 1);
          this.damagePlayer();
          continue;
        }
      } else if (p.dashTimer > 0 && !orb.justDodged && d <= p.radius + orb.radius + 32) {
        orb.justDodged = true;
        this.triggerJustDodge(p.x, p.y);
      }

      if (
        orb.life <= 0 ||
        orb.x < -60 ||
        orb.x > ARENA_W + 60 ||
        orb.y < -60 ||
        orb.y > ARENA_H + 60
      ) {
        this.inkProjectiles.splice(i, 1);
      }
    }
  }

  private updatePickups(dt: number): void {
    const p = this.player;
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const item = this.pickups[i];
      item.life -= dt;
      if (dist(p, item) <= p.radius + item.radius + 8) {
        soundEngine.playPickup();
        if (item.type === 'pearl_heal') {
          if (p.hp < p.maxHp) {
            p.hp += 1;
            this.addFloatingText(item.x, item.y - 16, '진주 회복 +1 HP', '#34D399', 1.1);
          } else {
            this.score += 150;
            this.addFloatingText(item.x, item.y - 16, '+150', '#34D399', 1.0);
          }
          this.spawnSplashBurst(item.x, item.y, '#34D399', 12, 150);
        } else {
          this.score += 150;
          const pickupScales = this.awardScales(2 + Math.floor(this.equippedSword.scaleBonus / 2));
          const pickupCoins = this.awardCoins(40);
          this.addFloatingText(
            item.x,
            item.y - 16,
            `황금 비늘 +${pickupScales} · +${pickupCoins}코`,
            this.isBerserkActive() ? '#FB7185' : '#FBBF24',
            1.15,
          );
          this.spawnSplashBurst(item.x, item.y, '#FBBF24', 12, 150);
        }
        this.pickups.splice(i, 1);
        continue;
      }
      if (item.life <= 0) {
        this.pickups.splice(i, 1);
      }
    }
  }

  private updateEffects(dt: number): void {
    for (let i = this.severedPieces.length - 1; i >= 0; i--) {
      const s = this.severedPieces[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.zHeight += s.vz * dt;
      s.vz -= 420 * dt;
      if (s.zHeight < -25) s.zHeight = -25;
      s.angle += s.angularVel * dt;
      s.life -= dt;
      s.alpha = clamp(s.life / s.maxLife, 0, 1);
      if (s.life <= 0) this.severedPieces.splice(i, 1);
    }

    for (let i = this.pendingMeteors.length - 1; i >= 0; i--) {
      const m = this.pendingMeteors[i];
      if (!m.spawnedEffect) {
        m.delay -= dt;
        if (m.delay <= 0) {
          m.spawnedEffect = true;
          this.skillEffects.push({
            id: this.nextId++,
            type: 'cleaver',
            x: m.x,
            y: m.y,
            angle: m.angle,
            radius: m.radius,
            empowered: m.empowered,
            life: 0.72,
            maxLife: 0.72,
          });
        }
      } else if (!m.landed) {
        m.impactDelay -= dt;
        if (m.impactDelay <= 0) {
          m.landed = true;
          soundEngine.playSlamImpact();
          this.damageTentaclesInArea(m.x, m.y, m.radius, m.damage, m.angle, '유성 검우!');
          this.clearInkInRadius(m.x, m.y, m.radius);
          this.spawnSplashBurst(m.x, m.y, this.equippedSword.glowColor, 16, 220);
          this.triggerShake(this.reducedMotion ? 0 : 7, 0.16);
          this.pendingMeteors.splice(i, 1);
        }
      }
    }

    for (let i = this.skillEffects.length - 1; i >= 0; i--) {
      const e = this.skillEffects[i];
      e.life -= dt;
      if (e.life <= 0) this.skillEffects.splice(i, 1);
    }

    for (let i = this.slashArcs.length - 1; i >= 0; i--) {
      const arc = this.slashArcs[i];
      arc.life -= dt;
      if (arc.life <= 0) this.slashArcs.splice(i, 1);
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.zHeight += pt.vz * dt;
      pt.vz -= 360 * dt;
      if (pt.zHeight < 0) pt.zHeight = 0;
      pt.vx *= Math.max(0, 1 - pt.drag * dt);
      pt.vy *= Math.max(0, 1 - pt.drag * dt);
      pt.life -= dt;
      pt.alpha = clamp(pt.life / pt.maxLife, 0, 1);
      if (pt.life <= 0) this.particles.splice(i, 1);
    }

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy * dt;
      ft.life -= dt;
      if (ft.life <= 0) this.floatingTexts.splice(i, 1);
    }

    for (let i = this.ghostTrails.length - 1; i >= 0; i--) {
      const g = this.ghostTrails[i];
      g.alpha -= dt * 3.4;
      if (g.alpha <= 0) this.ghostTrails.splice(i, 1);
    }
  }

  public render(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    if (this.shakeTimer > 0 && this.shakeMagnitude > 0) {
      const sx = (Math.random() - 0.5) * 2 * this.shakeMagnitude;
      const sy = (Math.random() - 0.5) * 2 * this.shakeMagnitude;
      ctx.translate(sx, sy);
    }

    this.drawOcean(ctx);
    this.drawKrakenHead(ctx);
    this.drawShipDeck(ctx);
    this.drawTelegraphs(ctx);
    this.drawPickups(ctx);
    this.drawTentacles(ctx);
    this.drawSeveredPieces(ctx);
    this.drawInkProjectiles(ctx);
    this.drawGhostTrails(ctx);
    this.drawPlayer(ctx);
    this.drawSlashArcs(ctx);
    this.drawParticles(ctx);
    this.drawFloatingTexts(ctx);

    ctx.restore();
  }

  private drawOcean(ctx: CanvasRenderingContext2D): void {
    const grad = ctx.createLinearGradient(0, 0, 0, ARENA_H);
    grad.addColorStop(0, '#040E18');
    grad.addColorStop(0.35, '#081D31');
    grad.addColorStop(1, '#04111E');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, ARENA_W, ARENA_H);

    // Animated ocean swells moving past the sailing ship
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.1)';
    ctx.lineWidth = 2;
    for (let row = 0; row < 11; row++) {
      const y = 26 + row * 62;
      ctx.beginPath();
      for (let x = 0; x <= ARENA_W; x += 40) {
        const waveY = y + Math.sin(x * 0.018 + this.ambientTime * 2.4 + row * 0.8) * 6;
        if (x === 0) ctx.moveTo(x, waveY);
        else ctx.lineTo(x, waveY);
      }
      ctx.stroke();
    }

    // Ship bow wake & stern foam trails
    ctx.save();
    const wakePulse = Math.sin(this.ambientTime * 4) * 4;
    ctx.strokeStyle = 'rgba(186, 230, 253, 0.18)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(SHIP.bowTipX + 8, SHIP.centerY);
    ctx.quadraticCurveTo(860, SHIP.centerY - 260 - wakePulse, 60, SHIP.centerY - 245);
    ctx.moveTo(SHIP.bowTipX + 8, SHIP.centerY);
    ctx.quadraticCurveTo(860, SHIP.centerY + 260 + wakePulse, 60, SHIP.centerY + 245);
    ctx.stroke();

    // Stern rudder foam trail
    for (let i = 0; i < 4; i++) {
      const fx = SHIP.sternX - 18 - ((this.ambientTime * 55 + i * 24) % 90);
      const alpha = Math.max(0, 0.28 - (SHIP.sternX - fx) / 320);
      ctx.strokeStyle = `rgba(186, 230, 253, ${alpha})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(fx, SHIP.centerY + Math.sin(this.ambientTime * 3 + i) * 14, 18 + i * 7, -0.7, 0.7);
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawKrakenHead(ctx: CanvasRenderingContext2D): void {
    const cx = ARENA_W / 2 - 40;
    const cy = 82 + Math.sin(this.ambientTime * 2.1) * 5;
    const ragePulse = this.wave >= 3 ? Math.sin(this.ambientTime * 6) * 0.15 + 0.85 : 0.85;

    ctx.save();
    // Glowing abyssal aura behind Kraken
    const aura = ctx.createRadialGradient(cx, cy, 18, cx, cy, 175);
    aura.addColorStop(0, 'rgba(245, 158, 11, 0.22)');
    aura.addColorStop(0.55, 'rgba(30, 58, 138, 0.2)');
    aura.addColorStop(1, 'rgba(4, 14, 24, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(cx, cy, 175, 0, Math.PI * 2);
    ctx.fill();

    // Kraken mantle rising beside the ship
    ctx.fillStyle = '#1E293B';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(cx, cy - 10, 88, 56, 0, Math.PI, Math.PI * 2);
    ctx.bezierCurveTo(cx + 88, cy + 36, cx + 44, cy + 52, cx, cy + 44);
    ctx.bezierCurveTo(cx - 44, cy + 52, cx - 88, cy + 36, cx - 88, cy - 10);
    ctx.fill();
    ctx.stroke();

    // Lateral fins
    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.moveTo(cx - 72, cy - 22);
    ctx.quadraticCurveTo(cx - 122, cy - 42, cx - 102, cy + 4);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx + 72, cy - 22);
    ctx.quadraticCurveTo(cx + 122, cy - 42, cx + 102, cy + 4);
    ctx.closePath();
    ctx.fill();

    // Glowing eyes tracking player on the ship deck
    const lookX = clamp((this.player.x - cx) * 0.015, -6, 6);
    const lookY = clamp((this.player.y - cy) * 0.012, -3, 4);

    [-34, 34].forEach((offsetX, idx) => {
      const ex = cx + offsetX;
      const ey = cy + 12;
      ctx.fillStyle = '#020617';
      ctx.beginPath();
      ctx.ellipse(ex, ey, 14, 9, idx === 0 ? 0.2 : -0.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `rgba(245, 158, 11, ${ragePulse})`;
      ctx.beginPath();
      ctx.ellipse(ex + lookX, ey + lookY, 6, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      // Slit pupil
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(ex + lookX - 1.2, ey + lookY - 5, 2.4, 10);
    });

    ctx.restore();
  }

  private shipHullPath(ctx: CanvasRenderingContext2D, expand = 0): void {
    const samples = 24;
    const sternX = SHIP.sternX - expand;
    const bowX = SHIP.bowTipX + expand;

    ctx.beginPath();
    // Stern transom (slightly curved left edge)
    const sternHalf = shipHalfWidthAt(SHIP.sternX) + expand;
    ctx.moveTo(sternX, SHIP.centerY - sternHalf);

    // Port (top) gunwale from stern to bow
    for (let i = 1; i <= samples; i++) {
      const px = lerp(sternX, bowX, i / samples);
      const hw = shipHalfWidthAt(clamp(px, SHIP.sternX, SHIP.bowTipX)) + expand * 0.85;
      ctx.lineTo(px, SHIP.centerY - hw);
    }

    // Pointed bow tip
    ctx.lineTo(bowX + 6, SHIP.centerY);

    // Starboard (bottom) gunwale from bow back to stern
    for (let i = samples; i >= 0; i--) {
      const px = lerp(sternX, bowX, i / samples);
      const hw = shipHalfWidthAt(clamp(px, SHIP.sternX, SHIP.bowTipX)) + expand * 0.85;
      ctx.lineTo(px, SHIP.centerY + hw);
    }

    // Close stern curve
    ctx.quadraticCurveTo(sternX - 16, SHIP.centerY, sternX, SHIP.centerY - sternHalf);
    ctx.closePath();
  }

  private drawShipDeck(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    // Seafoam ring hugging the wooden hull
    ctx.strokeStyle = 'rgba(186, 230, 253, 0.24)';
    ctx.lineWidth = 10;
    this.shipHullPath(ctx, 8);
    ctx.stroke();

    // Outer dark hull thickness / shadow in water
    ctx.fillStyle = '#1E120B';
    this.shipHullPath(ctx, 5);
    ctx.fill();

    // Main weathered oak deck planks
    const deckGrad = ctx.createLinearGradient(SHIP.sternX, SHIP.centerY - 210, SHIP.bowTipX, SHIP.centerY + 210);
    deckGrad.addColorStop(0, '#4E3321');
    deckGrad.addColorStop(0.5, '#593B26');
    deckGrad.addColorStop(1, '#442C1C');
    ctx.fillStyle = deckGrad;
    this.shipHullPath(ctx, 0);
    ctx.fill();

    // Clip interior deck details inside the hull
    ctx.save();
    this.shipHullPath(ctx, 0);
    ctx.clip();

    // Horizontal wood plank seams
    ctx.strokeStyle = 'rgba(20, 11, 5, 0.55)';
    ctx.lineWidth = 1.5;
    for (let py = SHIP.centerY - 210; py <= SHIP.centerY + 210; py += 26) {
      ctx.beginPath();
      ctx.moveTo(SHIP.sternX - 20, py);
      ctx.lineTo(SHIP.bowTipX + 20, py);
      ctx.stroke();
    }

    // Staggered plank butt joints & iron nails
    ctx.strokeStyle = 'rgba(20, 11, 5, 0.35)';
    ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
    for (let row = 0; row < 17; row++) {
      const py = SHIP.centerY - 208 + row * 26;
      const offset = (row % 3) * 48;
      for (let px = SHIP.sternX + 40 + offset; px < SHIP.bowTipX; px += 130) {
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px, py + 26);
        ctx.stroke();
        ctx.fillRect(px - 4, py + 6, 2, 2);
        ctx.fillRect(px - 4, py + 18, 2, 2);
      }
    }

    // Raised Quarterdeck (stern wooden platform) on left
    ctx.fillStyle = 'rgba(34, 20, 11, 0.32)';
    ctx.fillRect(SHIP.sternX - 20, SHIP.centerY - 220, 128, 440);
    ctx.strokeStyle = '#785035';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(SHIP.sternX + 108, SHIP.centerY - 220);
    ctx.lineTo(SHIP.sternX + 108, SHIP.centerY + 220);
    ctx.stroke();

    // Forecastle step near the bow on right
    ctx.fillStyle = 'rgba(34, 20, 11, 0.25)';
    ctx.fillRect(830, SHIP.centerY - 180, 190, 360);
    ctx.strokeStyle = '#785035';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(830, SHIP.centerY - 180);
    ctx.lineTo(830, SHIP.centerY + 180);
    ctx.stroke();

    // Center Cargo Hatch Grate (flat wooden grate on deck)
    const hatchX = 435;
    const hatchY = SHIP.centerY - 46;
    ctx.fillStyle = '#24160D';
    ctx.strokeStyle = '#7C5438';
    ctx.lineWidth = 4;
    ctx.fillRect(hatchX, hatchY, 108, 92);
    ctx.strokeRect(hatchX, hatchY, 108, 92);
    ctx.strokeStyle = '#5B3C27';
    ctx.lineWidth = 2;
    for (let gx = hatchX + 14; gx < hatchX + 104; gx += 16) {
      ctx.beginPath();
      ctx.moveTo(gx, hatchY + 4);
      ctx.lineTo(gx, hatchY + 88);
      ctx.stroke();
    }
    for (let gy = hatchY + 14; gy < hatchY + 88; gy += 16) {
      ctx.beginPath();
      ctx.moveTo(hatchX + 4, gy);
      ctx.lineTo(hatchX + 104, gy);
      ctx.stroke();
    }

    // Main Mast Base & Coiled Rope Ring
    const mastX = 650;
    const mastY = SHIP.centerY;
    ctx.fillStyle = '#785035';
    ctx.strokeStyle = '#2B1A0F';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(mastX, mastY, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#D97706';
    ctx.beginPath();
    ctx.arc(mastX, mastY, 14, 0, Math.PI * 2);
    ctx.fill();

    // Coiled rope near mast
    ctx.strokeStyle = '#B89B72';
    ctx.lineWidth = 2.5;
    for (let r = 6; r <= 14; r += 4) {
      ctx.beginPath();
      ctx.arc(mastX - 38, mastY + 34, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Ship's Helm / Steering Wheel on the stern quarterdeck
    const helmX = SHIP.sternX + 46;
    const helmY = SHIP.centerY;
    ctx.save();
    ctx.translate(helmX, helmY);
    ctx.fillStyle = '#2B1A0F';
    ctx.fillRect(-6, -24, 12, 48);
    ctx.strokeStyle = '#A16207';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, Math.PI * 2);
    ctx.stroke();
    for (let s = 0; s < 8; s++) {
      const a = (s * Math.PI) / 4 + Math.sin(this.ambientTime * 1.5) * 0.12;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * 24, Math.sin(a) * 24);
      ctx.stroke();
    }
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Subtle warm lantern glow at stern corners
    [SHIP.centerY - 140, SHIP.centerY + 140].forEach((ly) => {
      const lx = SHIP.sternX + 18;
      const glow = ctx.createRadialGradient(lx, ly, 2, lx, ly, 46);
      glow.addColorStop(0, 'rgba(251, 191, 36, 0.35)');
      glow.addColorStop(1, 'rgba(251, 191, 36, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(lx, ly, 46, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FDE68A';
      ctx.strokeStyle = '#92400E';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(lx, ly, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });

    ctx.restore();

    // Heavy wooden gunwale railing border
    ctx.strokeStyle = '#2C1B10';
    ctx.lineWidth = 10;
    this.shipHullPath(ctx, 0);
    ctx.stroke();

    ctx.strokeStyle = '#85583A';
    ctx.lineWidth = 4;
    this.shipHullPath(ctx, 0);
    ctx.stroke();

    // Brass Cannons along top & bottom gunwales
    const cannonXs = [310, 490, 670];
    cannonXs.forEach((cx) => {
      const hw = shipHalfWidthAt(cx);
      // Top rail cannon
      this.drawCannon(ctx, cx, SHIP.centerY - hw + 10, -Math.PI / 2);
      // Bottom rail cannon
      this.drawCannon(ctx, cx, SHIP.centerY + hw - 10, Math.PI / 2);
    });

    // Bowsprit spar projecting from pointed bow into the ocean
    ctx.save();
    ctx.strokeStyle = '#3E2718';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(SHIP.bowTipX - 38, SHIP.centerY);
    ctx.lineTo(SHIP.bowspritTipX, SHIP.centerY);
    ctx.stroke();

    ctx.strokeStyle = '#7C5438';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(SHIP.bowTipX - 38, SHIP.centerY);
    ctx.lineTo(SHIP.bowspritTipX, SHIP.centerY);
    ctx.stroke();

    // Forestay ropes from bowsprit tip to bow rails
    ctx.strokeStyle = 'rgba(214, 187, 148, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(SHIP.bowspritTipX - 10, SHIP.centerY);
    ctx.lineTo(SHIP.bowTipX - 80, SHIP.centerY - shipHalfWidthAt(SHIP.bowTipX - 80));
    ctx.moveTo(SHIP.bowspritTipX - 10, SHIP.centerY);
    ctx.lineTo(SHIP.bowTipX - 80, SHIP.centerY + shipHalfWidthAt(SHIP.bowTipX - 80));
    ctx.stroke();
    ctx.restore();

    ctx.restore();
  }

  private drawCannon(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    angle: number,
  ): void {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    // Wooden carriage
    ctx.fillStyle = '#3E2718';
    ctx.fillRect(-10, -8, 20, 14);
    // Iron/brass barrel pointing outboard
    ctx.fillStyle = '#334155';
    ctx.strokeStyle = '#94A3B8';
    ctx.lineWidth = 1;
    ctx.fillRect(-4, -5, 22, 10);
    ctx.strokeRect(-4, -5, 22, 10);
    // Muzzle ring
    ctx.fillStyle = '#D97706';
    ctx.fillRect(15, -6, 4, 12);
    ctx.restore();
  }

  private drawTelegraphs(ctx: CanvasRenderingContext2D): void {
    for (const t of this.tentacles) {
      if (t.phase !== 'telegraph') continue;
      const progress = clamp(t.phaseTimer / t.phaseDuration, 0, 1);

      ctx.save();
      if (t.attackType === 'slam' || t.attackType === 'lunge') {
        const isLocked = t.attackType === 'slam' || progress >= 0.55;
        const ang = Math.atan2(t.target.y - t.origin.y, t.target.x - t.origin.x);
        const len = dist(t.origin, t.target);
        const halfW = t.width * 0.62;

        ctx.translate(t.origin.x, t.origin.y);
        ctx.rotate(ang);

        // Danger lane fill
        ctx.fillStyle = isLocked
          ? `rgba(239, 68, 68, ${0.14 + progress * 0.2})`
          : 'rgba(245, 158, 11, 0.14)';
        ctx.fillRect(0, -halfW, len, halfW * 2);

        // Progress fill inside lane
        ctx.fillStyle = isLocked ? 'rgba(239, 68, 68, 0.34)' : 'rgba(245, 158, 11, 0.22)';
        ctx.fillRect(0, -halfW, len * progress, halfW * 2);

        // Dashed boundary
        ctx.setLineDash([8, 6]);
        ctx.strokeStyle = isLocked ? 'rgba(248, 113, 113, 0.85)' : 'rgba(251, 191, 36, 0.85)';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, -halfW, len, halfW * 2);
        ctx.setLineDash([]);

        // Target warning reticle at tip
        ctx.fillStyle = isLocked ? '#FCA5A5' : '#FDE68A';
        ctx.font = '700 14px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('!', len - 18, 0);
      } else {
        // Sweep sector telegraph
        const startA = Math.min(t.sweepStartAngle, t.sweepEndAngle);
        const endA = Math.max(t.sweepStartAngle, t.sweepEndAngle);

        ctx.beginPath();
        ctx.moveTo(t.origin.x, t.origin.y);
        ctx.arc(t.origin.x, t.origin.y, t.sweepRadius, startA, endA);
        ctx.closePath();
        ctx.fillStyle = `rgba(239, 68, 68, ${0.12 + progress * 0.16})`;
        ctx.fill();

        ctx.setLineDash([8, 6]);
        ctx.strokeStyle = 'rgba(248, 113, 113, 0.8)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.setLineDash([]);

        // Sweeping progress indicator line
        const curA = lerp(t.sweepStartAngle, t.sweepEndAngle, progress);
        ctx.beginPath();
        ctx.moveTo(t.origin.x, t.origin.y);
        ctx.lineTo(
          t.origin.x + Math.cos(curA) * t.sweepRadius,
          t.origin.y + Math.sin(curA) * t.sweepRadius,
        );
        ctx.strokeStyle = 'rgba(252, 165, 165, 0.9)';
        ctx.lineWidth = 3;
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  private drawPickups(ctx: CanvasRenderingContext2D): void {
    for (const item of this.pickups) {
      const bob = Math.sin(this.ambientTime * 4.5 + item.bobOffset) * 4;
      const blink = item.life < 2.2 && Math.floor(item.life * 8) % 2 === 0 ? 0.45 : 1;

      ctx.save();
      ctx.globalAlpha = blink;
      ctx.translate(item.x, item.y + bob);

      if (item.type === 'pearl_heal') {
        const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, 22);
        glow.addColorStop(0, 'rgba(52, 211, 153, 0.45)');
        glow.addColorStop(1, 'rgba(52, 211, 153, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, 0, 22, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ECFDF5';
        ctx.strokeStyle = '#10B981';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Cross icon for clear non-hue affordance
        ctx.fillStyle = '#059669';
        ctx.fillRect(-5, -1.5, 10, 3);
        ctx.fillRect(-1.5, -5, 3, 10);
      } else {
        const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, 20);
        glow.addColorStop(0, 'rgba(251, 191, 36, 0.45)');
        glow.addColorStop(1, 'rgba(251, 191, 36, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FBBF24';
        ctx.strokeStyle = '#FEF3C7';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -10);
        ctx.lineTo(9, 0);
        ctx.lineTo(0, 10);
        ctx.lineTo(-9, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  private drawTentacles(ctx: CanvasRenderingContext2D): void {
    for (const t of this.tentacles) {
      const dx = t.currentTip.x - t.origin.x;
      const dy = t.currentTip.y - t.origin.y;
      const len = Math.max(1, Math.hypot(dx, dy));
      const nx = -dy / len;
      const ny = dx / len;

      // Natural organic curve offset
      const bend =
        Math.sin(this.ambientTime * 4 + t.id) * 16 +
        (t.phase === 'vulnerable' ? Math.sin(this.ambientTime * 20) * 3 : 0);

      const ctrl = {
        x: (t.origin.x + t.currentTip.x) / 2 + nx * bend,
        y: (t.origin.y + t.currentTip.y) / 2 + ny * bend,
      };

      // Draw segmented thick-to-thin tentacle body
      const segments = 14;
      const points: Vec2[] = [];
      for (let s = 0; s <= segments; s++) {
        const u = s / segments;
        const inv = 1 - u;
        points.push({
          x: inv * inv * t.origin.x + 2 * inv * u * ctrl.x + u * u * t.currentTip.x,
          y: inv * inv * t.origin.y + 2 * inv * u * ctrl.y + u * u * t.currentTip.y,
        });
      }

      ctx.save();
      // Drop shadow on deck
      ctx.strokeStyle = 'rgba(2, 6, 23, 0.45)';
      ctx.lineCap = 'round';
      for (let s = 0; s < segments; s++) {
        const u = s / segments;
        ctx.lineWidth = lerp(t.width, 10, u);
        ctx.beginPath();
        ctx.moveTo(points[s].x + 4, points[s].y + 8);
        ctx.lineTo(points[s + 1].x + 4, points[s + 1].y + 8);
        ctx.stroke();
      }

      // Main tentacle skin
      const bodyColor =
        t.hitFlash > 0
          ? '#F8FAFC'
          : t.phase === 'vulnerable'
            ? '#475569'
            : '#334155';

      ctx.strokeStyle = bodyColor;
      for (let s = 0; s < segments; s++) {
        const u = s / segments;
        ctx.lineWidth = lerp(t.width, 9, u);
        ctx.beginPath();
        ctx.moveTo(points[s].x, points[s].y);
        ctx.lineTo(points[s + 1].x, points[s + 1].y);
        ctx.stroke();
      }

      // Suction cups along the tentacle
      for (let s = 2; s < segments; s += 2) {
        const u = s / segments;
        const r = lerp(t.width * 0.24, 3, u);
        ctx.fillStyle = t.hitFlash > 0 ? '#E2E8F0' : '#94A3B8';
        ctx.beginPath();
        ctx.arc(points[s].x, points[s].y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Exposed Cut-Line Indicator when vulnerable!
      if (t.phase === 'vulnerable') {
        const pulse = 0.75 + Math.sin(this.ambientTime * 12) * 0.25;
        const ang = Math.atan2(dy, dx);

        ctx.save();
        ctx.translate(t.cutPoint.x, t.cutPoint.y);

        // Pulsing amber target circle
        ctx.strokeStyle = `rgba(251, 191, 36, ${pulse})`;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, 22 + Math.sin(this.ambientTime * 10) * 3, 0, Math.PI * 2);
        ctx.stroke();

        // Cut slash line across tentacle
        ctx.rotate(ang + Math.PI / 2);
        ctx.strokeStyle = '#FEF08A';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.moveTo(-24, 0);
        ctx.lineTo(24, 0);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        // Tentacle HP notches floating cleanly near cut point
        for (let h = 0; h < t.maxHp; h++) {
          const ox = t.cutPoint.x + (h - (t.maxHp - 1) / 2) * 12;
          const oy = t.cutPoint.y - 30;
          ctx.fillStyle = h < t.hp ? '#F59E0B' : 'rgba(15, 23, 42, 0.8)';
          ctx.strokeStyle = '#FDE68A';
          ctx.lineWidth = 1.2;
          ctx.fillRect(ox - 4, oy - 3, 8, 6);
          ctx.strokeRect(ox - 4, oy - 3, 8, 6);
        }
      }

      ctx.restore();
    }
  }

  private drawSeveredPieces(ctx: CanvasRenderingContext2D): void {
    for (const s of this.severedPieces) {
      ctx.save();
      ctx.globalAlpha = s.alpha;
      ctx.translate(s.x, s.y);
      ctx.rotate(s.angle);

      const grad = ctx.createLinearGradient(-s.length / 2, 0, s.length / 2, 0);
      grad.addColorStop(0, '#F59E0B');
      grad.addColorStop(0.25, '#475569');
      grad.addColorStop(1, '#1E293B');

      ctx.strokeStyle = grad;
      ctx.lineWidth = s.width;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-s.length / 2, 0);
      ctx.lineTo(s.length / 2, 0);
      ctx.stroke();

      ctx.restore();
    }
  }

  private drawInkProjectiles(ctx: CanvasRenderingContext2D): void {
    for (const orb of this.inkProjectiles) {
      ctx.save();
      ctx.translate(orb.x, orb.y);

      const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, orb.radius + 8);
      glow.addColorStop(0, 'rgba(129, 140, 248, 0.7)');
      glow.addColorStop(1, 'rgba(49, 46, 129, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, 0, orb.radius + 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#1E1B4B';
      ctx.strokeStyle = '#A5B4FC';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, orb.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    }
  }

  private drawGhostTrails(ctx: CanvasRenderingContext2D): void {
    for (const g of this.ghostTrails) {
      ctx.save();
      ctx.globalAlpha = g.alpha * 0.6;
      ctx.translate(g.x, g.y);
      ctx.fillStyle = '#38BDF8';
      ctx.beginPath();
      ctx.arc(0, 0, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  private drawPlayer(ctx: CanvasRenderingContext2D): void {
    const p = this.player;
    const blinkSkip = p.invulnTimer > 0 && p.dashTimer <= 0 && Math.floor(p.invulnTimer * 18) % 2 === 0;

    ctx.save();
    ctx.translate(p.x, p.y);

    // Dash cooldown / Empowered ring under player
    const dashReady = p.dashCooldown <= 0;
    const dashRatio = dashReady ? 1 : clamp(1 - p.dashCooldown / p.dashMaxCooldown, 0, 1);

    ctx.strokeStyle = p.empoweredSlash
      ? 'rgba(251, 191, 36, 0.85)'
      : dashReady
        ? 'rgba(16, 185, 129, 0.45)'
        : 'rgba(148, 163, 184, 0.35)';
    ctx.lineWidth = p.empoweredSlash ? 3 : 2;
    ctx.beginPath();
    ctx.arc(0, 0, 24, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * dashRatio);
    ctx.stroke();

    if (blinkSkip) {
      ctx.globalAlpha = 0.45;
    }

    // Shadow
    ctx.fillStyle = 'rgba(2, 6, 23, 0.55)';
    ctx.beginPath();
    ctx.ellipse(0, 12, 16, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Cutlass blade pointing toward aimAngle
    ctx.save();
    ctx.rotate(p.aimAngle);
    ctx.fillStyle = p.empoweredSlash ? '#FBBF24' : '#E2E8F0';
    ctx.strokeStyle = p.empoweredSlash ? '#FEF3C7' : '#94A3B8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(14, -3);
    ctx.quadraticCurveTo(32, -6, 38, 0);
    ctx.quadraticCurveTo(30, 5, 14, 3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Brass hilt guard
    ctx.fillStyle = '#D97706';
    ctx.fillRect(11, -7, 4, 14);
    ctx.restore();

    // Captain coat torso
    ctx.fillStyle = p.hitFlash > 0 ? '#FCA5A5' : '#0F172A';
    ctx.strokeStyle = p.empoweredSlash ? '#FBBF24' : '#38BDF8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Bandana / Captain crest
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.arc(0, -2, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private drawSlashArcs(ctx: CanvasRenderingContext2D): void {
    for (const arc of this.slashArcs) {
      const t = 1 - arc.life / arc.maxLife;
      const alpha = clamp(arc.life / arc.maxLife, 0, 1);

      ctx.save();
      ctx.translate(arc.x, arc.y);
      ctx.globalAlpha = alpha;

      const startA = arc.angle - arc.arcSpread / 2;
      const endA = arc.angle + arc.arcSpread / 2;

      ctx.strokeStyle = arc.empowered ? '#FBBF24' : '#F8FAFC';
      ctx.lineWidth = arc.empowered ? 16 * (1 - t * 0.4) : 11 * (1 - t * 0.4);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(0, 0, arc.radius * (0.88 + t * 0.14), startA, endA);
      ctx.stroke();

      ctx.strokeStyle = arc.empowered ? '#FEF08A' : '#38BDF8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, arc.radius * (0.95 + t * 0.14), startA, endA);
      ctx.stroke();

      ctx.restore();
    }
  }

  private drawParticles(ctx: CanvasRenderingContext2D): void {
    for (const pt of this.particles) {
      ctx.save();
      ctx.globalAlpha = pt.alpha;
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  private drawFloatingTexts(ctx: CanvasRenderingContext2D): void {
    for (const ft of this.floatingTexts) {
      const alpha = clamp(ft.life / ft.maxLife, 0, 1);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = `700 ${Math.round(15 * ft.scale)}px "Noto Sans KR", Outfit, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(2, 6, 23, 0.85)';
      ctx.strokeText(ft.text, ft.x, ft.y);
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }
  }
}

export { KrakenGameEngine as GameEngine };
