/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { CreatorModal } from './components/CreatorModal';
import { GameHUD } from './components/GameHUD';
import { GameOverModal, PauseModal, VictoryEndingModal } from './components/GameModals';
import { ShopModal } from './components/ShopModal';
import { SkillBar } from './components/SkillBar';
import { TitleOverlay } from './components/TitleOverlay';
import { TouchControls } from './components/TouchControls';
import { soundEngine } from './game/audio';
import { KrakenGameEngine } from './game/engine';
import { KrakenScene3D } from './game/scene3d';
import {
  CREATOR_SWORD_PASSWORD,
  CameraMode,
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
  Difficulty,
  GameState,
  HUDStats,
  RunSummary,
  SCALE_COIN_RATE,
  SWORDS_CATALOG,
  SwordId,
  getSwordConfig,
} from './game/types';

const BEST_SCORE_STORAGE_KEY = 'kraken_slash_best_score_v1';
const VICTORY_COUNT_STORAGE_KEY = 'kraken_slash_victories_v1';
const CUSTOM_MONSTER_STORAGE_KEY = 'kraken_slash_custom_monster_v1';
const CUSTOM_ENDING_STORAGE_KEY = 'kraken_slash_custom_ending_v1';
const CUSTOM_SKILL_STORAGE_KEY = 'kraken_slash_custom_skill_v1';
const CUSTOM_ABILITY_STORAGE_KEY = 'kraken_slash_custom_ability_v1';
const CUSTOM_DOMAIN_STORAGE_KEY = 'kraken_slash_custom_domain_v1';
const SCALES_STORAGE_KEY = 'kraken_slash_scales_v1';
const COINS_STORAGE_KEY = 'kraken_slash_coins_v1';
const OWNED_SWORDS_STORAGE_KEY = 'kraken_slash_owned_swords_v1';
const EQUIPPED_SWORD_STORAGE_KEY = 'kraken_slash_equipped_sword_v1';

const INITIAL_HUD: HUDStats = {
  hp: 4,
  maxHp: 4,
  score: 0,
  scalesEarned: 0,
  coinsEarned: 0,
  combo: 0,
  maxCombo: 0,
  severedCount: 0,
  justDodgeCount: 0,
  wave: 1,
  finalWave: 3,
  monsterName: '심해의 크라켄',
  bossHp: 5,
  bossMaxHp: 5,
  dashReadyRatio: 1,
  empoweredSlash: false,
  berserkActive: false,
  berserkTimer: 0,
  berserkMaxDuration: 10,
  berserkThreshold: 5,
  berserkDamageMultiplier: 1,
  berserkCoinMultiplier: 1,
  elapsedSeconds: 0,
  waveBannerTimer: 0,
  endlessMode: false,
  victoryCinematicActive: false,
  hasDivineSword: false,
  divineAegisReady: false,
  divineAegisCooldown: 0,
  domainActive: false,
  domainTimer: 0,
  domainMaxDuration: 7,
  domainCallout: '',
  skillCooldowns: {
    whirlwind: 0,
    wave: 0,
    cleaver: 0,
    phantom_rush: 0,
    blade_orbit: 0,
    meteor_barrage: 0,
    frost_nova: 0,
    cross_slash: 0,
    tsunami_call: 0,
    creator_judgement: 0,
    vortex_pull: 0,
    thunder_chain: 0,
    phoenix_dive: 0,
    venom_burst: 0,
    time_freeze: 0,
    dragon_breath: 0,
    galaxy_collapse: 0,
    divine_ascension: 0,
    custom_skill: 0,
    domain_expansion: 0,
  },
  skillMaxCooldowns: {
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
  },
};

const CAMERA_ORDER: CameraMode[] = ['action', 'tactical', 'hero'];

function readBestScore(): number {
  try {
    const raw = window.localStorage.getItem(BEST_SCORE_STORAGE_KEY);
    const parsed = raw ? Number.parseInt(raw, 10) : 0;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  } catch {
    return 0;
  }
}

function writeBestScore(score: number): void {
  try {
    window.localStorage.setItem(BEST_SCORE_STORAGE_KEY, String(score));
  } catch {
    // Ignore storage quota errors
  }
}

function readVictoryCount(): number {
  try {
    const raw = window.localStorage.getItem(VICTORY_COUNT_STORAGE_KEY);
    const parsed = raw ? Number.parseInt(raw, 10) : 0;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  } catch {
    return 0;
  }
}

function writeVictoryCount(count: number): void {
  try {
    window.localStorage.setItem(VICTORY_COUNT_STORAGE_KEY, String(count));
  } catch {
    // Ignore storage quota errors
  }
}

function readStoredMonster(): CustomMonsterConfig {
  try {
    const raw = window.localStorage.getItem(CUSTOM_MONSTER_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_MONSTER_PRESETS[0] };
    return { ...DEFAULT_MONSTER_PRESETS[0], ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_MONSTER_PRESETS[0] };
  }
}

function writeStoredMonster(m: CustomMonsterConfig): void {
  try {
    window.localStorage.setItem(CUSTOM_MONSTER_STORAGE_KEY, JSON.stringify(m));
  } catch {
    // Ignore
  }
}

function readStoredEnding(): CustomEndingConfig {
  try {
    const raw = window.localStorage.getItem(CUSTOM_ENDING_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_CUSTOM_ENDING };
    return { ...DEFAULT_CUSTOM_ENDING, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_CUSTOM_ENDING };
  }
}

function writeStoredEnding(e: CustomEndingConfig): void {
  try {
    window.localStorage.setItem(CUSTOM_ENDING_STORAGE_KEY, JSON.stringify(e));
  } catch {
    // Ignore
  }
}

function readStoredSkill(): CustomSkillConfig {
  try {
    const raw = window.localStorage.getItem(CUSTOM_SKILL_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_CUSTOM_SKILL };
    return { ...DEFAULT_CUSTOM_SKILL, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_CUSTOM_SKILL };
  }
}

function writeStoredSkill(s: CustomSkillConfig): void {
  try {
    window.localStorage.setItem(CUSTOM_SKILL_STORAGE_KEY, JSON.stringify(s));
  } catch {
    // Ignore
  }
}

function readStoredAbility(): CustomAbilityConfig {
  try {
    const raw = window.localStorage.getItem(CUSTOM_ABILITY_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_CUSTOM_ABILITY, traits: [...DEFAULT_CUSTOM_ABILITY.traits] };
    const parsed = JSON.parse(raw) as Partial<CustomAbilityConfig>;
    return {
      ...DEFAULT_CUSTOM_ABILITY,
      ...parsed,
      traits: Array.isArray(parsed.traits) ? parsed.traits : [...DEFAULT_CUSTOM_ABILITY.traits],
    };
  } catch {
    return { ...DEFAULT_CUSTOM_ABILITY, traits: [...DEFAULT_CUSTOM_ABILITY.traits] };
  }
}

function writeStoredAbility(a: CustomAbilityConfig): void {
  try {
    window.localStorage.setItem(CUSTOM_ABILITY_STORAGE_KEY, JSON.stringify(a));
  } catch {
    // Ignore
  }
}

function readStoredDomain(): CustomDomainConfig {
  try {
    const raw = window.localStorage.getItem(CUSTOM_DOMAIN_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_CUSTOM_DOMAIN };
    return { ...DEFAULT_CUSTOM_DOMAIN, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_CUSTOM_DOMAIN };
  }
}

function writeStoredDomain(d: CustomDomainConfig): void {
  try {
    window.localStorage.setItem(CUSTOM_DOMAIN_STORAGE_KEY, JSON.stringify(d));
  } catch {
    // Ignore
  }
}

function readStoredInt(key: string): number {
  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? Number.parseInt(raw, 10) : 0;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  } catch {
    return 0;
  }
}

function writeStoredInt(key: string, val: number): void {
  try {
    window.localStorage.setItem(key, String(Math.max(0, Math.floor(val))));
  } catch {
    // Ignore
  }
}

function readOwnedSwords(): SwordId[] {
  try {
    const raw = window.localStorage.getItem(OWNED_SWORDS_STORAGE_KEY);
    if (!raw) return ['captain_cutlass'];
    const arr = JSON.parse(raw) as SwordId[];
    if (!Array.isArray(arr) || !arr.includes('captain_cutlass')) {
      return ['captain_cutlass', ...(Array.isArray(arr) ? arr : [])];
    }
    return arr;
  } catch {
    return ['captain_cutlass'];
  }
}

function writeOwnedSwords(ids: SwordId[]): void {
  try {
    window.localStorage.setItem(OWNED_SWORDS_STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Ignore
  }
}

function readEquippedSwordId(): SwordId {
  try {
    const raw = window.localStorage.getItem(EQUIPPED_SWORD_STORAGE_KEY) as SwordId | null;
    if (raw && SWORDS_CATALOG.some((s) => s.id === raw)) return raw;
    return 'captain_cutlass';
  } catch {
    return 'captain_cutlass';
  }
}

function writeEquippedSwordId(id: SwordId): void {
  try {
    window.localStorage.setItem(EQUIPPED_SWORD_STORAGE_KEY, id);
  } catch {
    // Ignore
  }
}

export default function App() {
  const [gameState, setGameState] = useState<GameState>('TITLE_MENU');
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [bestScore, setBestScore] = useState<number>(() => readBestScore());
  const [victoryCount, setVictoryCount] = useState<number>(() => readVictoryCount());
  const [scales, setScales] = useState<number>(() => readStoredInt(SCALES_STORAGE_KEY));
  const [coins, setCoins] = useState<number>(() => readStoredInt(COINS_STORAGE_KEY));
  const [ownedSwordIds, setOwnedSwordIds] = useState<SwordId[]>(() => readOwnedSwords());
  const [equippedSwordId, setEquippedSwordId] = useState<SwordId>(() => readEquippedSwordId());
  const [customMonster, setCustomMonster] = useState<CustomMonsterConfig>(() => readStoredMonster());
  const [customEnding, setCustomEnding] = useState<CustomEndingConfig>(() => readStoredEnding());
  const [customSkill, setCustomSkill] = useState<CustomSkillConfig>(() => readStoredSkill());
  const [customAbility, setCustomAbility] = useState<CustomAbilityConfig>(() => readStoredAbility());
  const [customDomain, setCustomDomain] = useState<CustomDomainConfig>(() => readStoredDomain());
  const [creatorTab, setCreatorTab] = useState<'monster' | 'ending' | 'skill' | 'domain'>('monster');
  const [showCreator, setShowCreator] = useState<boolean>(false);
  const [showShop, setShowShop] = useState<boolean>(false);
  const [hudStats, setHudStats] = useState<HUDStats>(INITIAL_HUD);
  const [summary, setSummary] = useState<RunSummary | null>(null);
  const [muted, setMuted] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [cameraMode, setCameraMode] = useState<CameraMode>('action');
  const [webglError, setWebglError] = useState<boolean>(false);
  const [showTouchPad, setShowTouchPad] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false;
    const hasTouch = (navigator.maxTouchPoints ?? 0) > 0;
    return coarse || hasTouch;
  });

  const rootRef = useRef<HTMLDivElement | null>(null);
  const threeMountRef = useRef<HTMLDivElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const scene3dRef = useRef<KrakenScene3D | null>(null);
  const engineRef = useRef<KrakenGameEngine | null>(null);
  const gameStateRef = useRef<GameState>(gameState);
  const bestScoreRef = useRef<number>(bestScore);
  const cameraModeRef = useRef<CameraMode>(cameraMode);
  const customMonsterRef = useRef<CustomMonsterConfig>(customMonster);
  const customSkillRef = useRef<CustomSkillConfig>(customSkill);
  const customDomainRef = useRef<CustomDomainConfig>(customDomain);
  const equippedSwordIdRef = useRef<SwordId>(equippedSwordId);
  const prevPadButtonsRef = useRef<boolean[]>([]);

  useEffect(() => {
    gameStateRef.current = gameState;
    if (gameState !== 'PLAYING') {
      soundEngine.stopDomainAmbience();
    }
  }, [gameState]);

  useEffect(() => {
    bestScoreRef.current = bestScore;
  }, [bestScore]);

  useEffect(() => {
    cameraModeRef.current = cameraMode;
    scene3dRef.current?.setCameraMode(cameraMode);
  }, [cameraMode]);

  useEffect(() => {
    customMonsterRef.current = customMonster;
    scene3dRef.current?.applyCustomMonster(customMonster);
  }, [customMonster]);

  useEffect(() => {
    customSkillRef.current = customSkill;
    engineRef.current?.setCustomSkill(customSkill);
    scene3dRef.current?.applyCustomSkill(customSkill);
  }, [customSkill]);

  useEffect(() => {
    engineRef.current?.setCustomAbility(customAbility);
  }, [customAbility]);

  useEffect(() => {
    customDomainRef.current = customDomain;
    engineRef.current?.setCustomDomain(customDomain);
    scene3dRef.current?.applyCustomDomain(customDomain);
  }, [customDomain]);

  useEffect(() => {
    equippedSwordIdRef.current = equippedSwordId;
    const sword = getSwordConfig(equippedSwordId);
    engineRef.current?.setEquippedSword(sword);
    scene3dRef.current?.applySwordVisual(sword);
  }, [equippedSwordId]);

  const handleGameOver = useCallback((runSummary: RunSummary) => {
    if (runSummary.bestScore > bestScoreRef.current) {
      bestScoreRef.current = runSummary.bestScore;
      setBestScore(runSummary.bestScore);
      writeBestScore(runSummary.bestScore);
    }
    setSummary(runSummary);
    setGameState('GAME_OVER');
  }, []);

  const handleVictory = useCallback((runSummary: RunSummary) => {
    if (runSummary.bestScore > bestScoreRef.current) {
      bestScoreRef.current = runSummary.bestScore;
      setBestScore(runSummary.bestScore);
      writeBestScore(runSummary.bestScore);
    }
    setVictoryCount((prev) => {
      const next = prev + 1;
      writeVictoryCount(next);
      return next;
    });
    setSummary(runSummary);
    setGameState('VICTORY');
  }, []);

  const handleScaleGain = useCallback((amount: number) => {
    setScales((prev) => {
      const next = prev + amount;
      writeStoredInt(SCALES_STORAGE_KEY, next);
      return next;
    });
  }, []);

  const handleCoinGain = useCallback((amount: number) => {
    setCoins((prev) => {
      const next = prev + amount;
      writeStoredInt(COINS_STORAGE_KEY, next);
      return next;
    });
  }, []);

  if (!engineRef.current) {
    engineRef.current = new KrakenGameEngine(
      (nextStats) => setHudStats(nextStats),
      handleGameOver,
      handleVictory,
      () => bestScoreRef.current,
      handleScaleGain,
      handleCoinGain,
    );
    engineRef.current.setEquippedSword(getSwordConfig(equippedSwordId));
    engineRef.current.setCustomSkill(customSkill);
    engineRef.current.setCustomAbility(customAbility);
    engineRef.current.setCustomDomain(customDomain);
  }

  const handleContinueEndless = useCallback(() => {
    soundEngine.unlock();
    engineRef.current?.continueEndless();
    setSummary(null);
    setGameState('PLAYING');
  }, []);

  const startNewGame = useCallback(
    (
      selectedDiff?: Difficulty,
      monsterOverride?: CustomMonsterConfig,
      endingOverride?: CustomEndingConfig,
      skillOverride?: CustomSkillConfig,
      abilityOverride?: CustomAbilityConfig,
      domainOverride?: CustomDomainConfig,
    ) => {
      const targetDiff = selectedDiff ?? difficulty;
      const targetMonster = monsterOverride ?? customMonster;
      const targetEnding = endingOverride ?? customEnding;
      const targetSkill = skillOverride ?? customSkill;
      const targetAbility = abilityOverride ?? customAbility;
      const targetDomain = domainOverride ?? customDomain;
      const targetSword = getSwordConfig(equippedSwordId);
      soundEngine.unlock();
      engineRef.current?.reset(
        targetDiff,
        targetMonster,
        targetEnding,
        targetSword,
        targetSkill,
        targetAbility,
        targetDomain,
      );
      scene3dRef.current?.applyCustomMonster(targetMonster);
      scene3dRef.current?.applySwordVisual(targetSword);
      scene3dRef.current?.applyCustomSkill(targetSkill);
      scene3dRef.current?.applyCustomDomain(targetDomain);
      setSummary(null);
      setGameState('PLAYING');
    },
    [difficulty, customMonster, customEnding, customSkill, customAbility, customDomain, equippedSwordId],
  );

  const handleSellScales = useCallback(
    (count: number) => {
      const sellCount = Math.max(0, Math.min(scales, Math.floor(count)));
      if (sellCount <= 0) return;
      soundEngine.unlock();
      soundEngine.playCoinExchange();
      setScales((prev) => {
        const next = Math.max(0, prev - sellCount);
        writeStoredInt(SCALES_STORAGE_KEY, next);
        return next;
      });
      setCoins((prev) => {
        const next = prev + sellCount * SCALE_COIN_RATE;
        writeStoredInt(COINS_STORAGE_KEY, next);
        return next;
      });
    },
    [scales],
  );

  const handleBuySword = useCallback(
    (id: SwordId) => {
      const sword = getSwordConfig(id);
      if (ownedSwordIds.includes(id) || coins < sword.price) return;
      soundEngine.unlock();
      soundEngine.playSwordForge();
      setCoins((prev) => {
        const next = Math.max(0, prev - sword.price);
        writeStoredInt(COINS_STORAGE_KEY, next);
        return next;
      });
      setOwnedSwordIds((prev) => {
        const next = prev.includes(id) ? prev : [...prev, id];
        writeOwnedSwords(next);
        return next;
      });
      setEquippedSwordId(id);
      writeEquippedSwordId(id);
    },
    [ownedSwordIds, coins],
  );

  const handleEquipSword = useCallback(
    (id: SwordId) => {
      if (!ownedSwordIds.includes(id)) return;
      soundEngine.unlock();
      soundEngine.playSwordForge();
      setEquippedSwordId(id);
      writeEquippedSwordId(id);
    },
    [ownedSwordIds],
  );

  const handleUnlockCreatorSword = useCallback((password: string): boolean => {
    if (password.trim() !== CREATOR_SWORD_PASSWORD) return false;
    soundEngine.unlock();
    soundEngine.playSwordForge();
    setOwnedSwordIds((prev) => {
      const next: SwordId[] = [...prev];
      if (!next.includes('creator_sword')) next.push('creator_sword');
      if (!next.includes('god_sword')) next.push('god_sword');
      writeOwnedSwords(next);
      return next;
    });
    setEquippedSwordId('god_sword');
    writeEquippedSwordId('god_sword');
    return true;
  }, []);

  const handleSaveCreation = useCallback(
    (
      monster: CustomMonsterConfig,
      ending: CustomEndingConfig,
      skill: CustomSkillConfig,
      ability: CustomAbilityConfig,
      domain: CustomDomainConfig,
    ) => {
      setCustomMonster(monster);
      setCustomEnding(ending);
      setCustomSkill(skill);
      setCustomAbility(ability);
      setCustomDomain(domain);
      writeStoredMonster(monster);
      writeStoredEnding(ending);
      writeStoredSkill(skill);
      writeStoredAbility(ability);
      writeStoredDomain(domain);
      setShowCreator(false);
    },
    [],
  );

  const handleSaveAndPlay = useCallback(
    (
      monster: CustomMonsterConfig,
      ending: CustomEndingConfig,
      skill: CustomSkillConfig,
      ability: CustomAbilityConfig,
      domain: CustomDomainConfig,
    ) => {
      setCustomMonster(monster);
      setCustomEnding(ending);
      setCustomSkill(skill);
      setCustomAbility(ability);
      setCustomDomain(domain);
      writeStoredMonster(monster);
      writeStoredEnding(ending);
      writeStoredSkill(skill);
      writeStoredAbility(ability);
      writeStoredDomain(domain);
      setShowCreator(false);
      startNewGame(difficulty, monster, ending, skill, ability, domain);
    },
    [difficulty, startNewGame],
  );

  const togglePause = useCallback(() => {
    setGameState((prev) => {
      if (prev === 'PLAYING') return 'PAUSED';
      if (prev === 'PAUSED') return 'PLAYING';
      return prev;
    });
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      soundEngine.setMuted(next);
      return next;
    });
  }, []);

  const toggleExpand = useCallback(() => {
    setIsExpanded((prev) => {
      const next = !prev;
      if (typeof document !== 'undefined') {
        if (next) {
          const target = rootRef.current ?? document.documentElement;
          if (!document.fullscreenElement && target.requestFullscreen) {
            void target.requestFullscreen().catch(() => {});
          }
        } else if (document.fullscreenElement && document.exitFullscreen) {
          void document.exitFullscreen().catch(() => {});
        }
      }
      return next;
    });
  }, []);

  const toggleTouchPad = useCallback(() => {
    setShowTouchPad((prev) => !prev);
  }, []);

  const cycleCamera = useCallback(() => {
    setCameraMode((prev) => {
      const idx = CAMERA_ORDER.indexOf(prev);
      return CAMERA_ORDER[(idx + 1) % CAMERA_ORDER.length];
    });
  }, []);

  const triggerSkillSlot = useCallback((slotIndex: number) => {
    if (gameStateRef.current !== 'PLAYING') return;
    soundEngine.unlock();
    engineRef.current?.triggerSkillSlot(slotIndex);
  }, []);

  const triggerCustomSkill = useCallback(() => {
    if (gameStateRef.current !== 'PLAYING') return;
    soundEngine.unlock();
    engineRef.current?.triggerCustomSkill();
  }, []);

  const triggerDomainExpansion = useCallback(() => {
    if (gameStateRef.current !== 'PLAYING') return;
    soundEngine.unlock();
    engineRef.current?.triggerDomainExpansion();
  }, []);

  // Sync with native browser fullscreen exit (e.g. ESC on desktop)
  useEffect(() => {
    const onFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsExpanded(false);
      }
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  // Three.js 3D Scene Lifecycle + Gamepad Polling + Projected Floating Text Overlay
  useEffect(() => {
    if (gameState === 'TITLE_MENU') return;

    const mount = threeMountRef.current;
    if (!mount) return;

    let scene3d: KrakenScene3D;
    try {
      scene3d = new KrakenScene3D(mount);
      scene3d.setCameraMode(cameraModeRef.current);
      scene3d.applyCustomMonster(customMonsterRef.current);
      scene3d.applySwordVisual(getSwordConfig(equippedSwordIdRef.current));
      scene3d.applyCustomSkill(customSkillRef.current);
      scene3d.applyCustomDomain(customDomainRef.current);
      scene3dRef.current = scene3d;
      setWebglError(false);
    } catch {
      setWebglError(true);
      return;
    }

    const canvasEl = scene3d.renderer.domElement;
    const onContextLost = (e: Event) => {
      e.preventDefault();
      setWebglError(true);
    };
    const onContextRestored = () => {
      setWebglError(false);
    };
    canvasEl.addEventListener('webglcontextlost', onContextLost);
    canvasEl.addEventListener('webglcontextrestored', onContextRestored);

    const syncSizes = () => {
      const w = Math.max(1, mount.clientWidth);
      const h = Math.max(1, mount.clientHeight);
      scene3d.resize(w, h);
      const overlay = overlayCanvasRef.current;
      if (overlay) {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const tw = Math.round(w * dpr);
        const th = Math.round(h * dpr);
        if (overlay.width !== tw || overlay.height !== th) {
          overlay.width = tw;
          overlay.height = th;
        }
      }
    };
    syncSizes();

    const resizeObserver = new ResizeObserver(syncSizes);
    resizeObserver.observe(mount);

    let cancelled = false;
    let lastTime = performance.now();

    const pollGamepad = (engine: KrakenGameEngine) => {
      const pads = navigator.getGamepads?.();
      if (!pads) return;

      const pad = Array.from(pads).find((p): p is Gamepad => Boolean(p && p.connected));
      if (!pad) {
        engine.input.padMoveX = 0;
        engine.input.padMoveY = 0;
        engine.input.padAimAngle = null;
        return;
      }

      const deadzone = 0.18;
      const ax0 = pad.axes[0] ?? 0;
      const ax1 = pad.axes[1] ?? 0;
      const dpadX = (pad.buttons[15]?.pressed ? 1 : 0) - (pad.buttons[14]?.pressed ? 1 : 0);
      const dpadY = (pad.buttons[13]?.pressed ? 1 : 0) - (pad.buttons[12]?.pressed ? 1 : 0);

      let mx = Math.abs(ax0) > deadzone ? ax0 : 0;
      let my = Math.abs(ax1) > deadzone ? ax1 : 0;
      if (dpadX !== 0 || dpadY !== 0) {
        mx = dpadX;
        my = dpadY;
      }
      engine.input.padMoveX = mx;
      engine.input.padMoveY = my;

      const rx = pad.axes[2] ?? 0;
      const ry = pad.axes[3] ?? 0;
      if (Math.hypot(rx, ry) > 0.25) {
        engine.input.padAimAngle = Math.atan2(ry, rx);
        engine.input.mouseActive = false;
      } else {
        engine.input.padAimAngle = null;
      }

      const prev = prevPadButtonsRef.current;
      const isPressed = (idx: number) => Boolean(pad.buttons[idx]?.pressed);
      const justPressed = (idx: number) => isPressed(idx) && !prev[idx];

      if (justPressed(9)) {
        if (gameStateRef.current === 'PLAYING' || gameStateRef.current === 'PAUSED') {
          togglePause();
        }
      }
      if (justPressed(8)) {
        cycleCamera();
      }

      if (gameStateRef.current === 'PLAYING') {
        // Basic Slash: A(0) or RT(7)
        if (justPressed(0) || justPressed(7)) {
          soundEngine.unlock();
          engine.triggerSlash();
        }
        // Dash: B(1) or LT(6)
        if (justPressed(1) || justPressed(6)) {
          soundEngine.unlock();
          engine.triggerDash();
        }
        // 3D Sword Skills: Y(3)->Slot 0, X(2)->Slot 1, RB/LB->Slot 2
        if (justPressed(3)) {
          soundEngine.unlock();
          engine.triggerSkillSlot(0);
        }
        if (justPressed(2)) {
          soundEngine.unlock();
          engine.triggerSkillSlot(1);
        }
        if (justPressed(4) || justPressed(5)) {
          soundEngine.unlock();
          engine.triggerSkillSlot(2);
        }
      }

      prevPadButtonsRef.current = pad.buttons.map((b) => Boolean(b?.pressed));
    };

    const drawFloatingOverlay = (snap: ReturnType<KrakenGameEngine['getSnapshot']>) => {
      const overlay = overlayCanvasRef.current;
      if (!overlay) return;
      const ctx = overlay.getContext('2d');
      if (!ctx) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = overlay.width / dpr;
      const h = overlay.height / dpr;
      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      if (snap.floatingTexts.length > 0) {
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        for (const ft of snap.floatingTexts) {
          const projected = scene3d.projectToScreen(ft.x, ft.y, 44);
          if (!projected) continue;
          const alpha = Math.max(0, Math.min(1, ft.life / ft.maxLife));
          ctx.globalAlpha = alpha;
          ctx.font = `800 ${Math.round(15 * ft.scale)}px "Noto Sans KR", sans-serif`;
          ctx.lineWidth = 4;
          ctx.strokeStyle = 'rgba(4, 13, 22, 0.9)';
          ctx.strokeText(ft.text, projected.x, projected.y);
          ctx.fillStyle = ft.color;
          ctx.fillText(ft.text, projected.x, projected.y);
        }
      }
      ctx.restore();
    };

    const tick = (now: number) => {
      if (cancelled) return;
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const engine = engineRef.current;
      if (engine) {
        pollGamepad(engine);
        if (gameStateRef.current === 'PLAYING') {
          engine.update(dt);
        }
        const snap = engine.getSnapshot();
        scene3d.renderFrame(snap, dt);
        drawFloatingOverlay(snap);
      }

      scene3d.afterDraw(tick);
    };

    scene3d.afterDraw(tick);

    return () => {
      cancelled = true;
      resizeObserver.disconnect();
      canvasEl.removeEventListener('webglcontextlost', onContextLost);
      canvasEl.removeEventListener('webglcontextrestored', onContextRestored);
      scene3d.dispose();
      scene3dRef.current = null;
    };
  }, [gameState === 'TITLE_MENU', togglePause, cycleCamera]);

  // Keyboard Controls
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }

      const engine = engineRef.current;
      if (!engine) return;

      if (e.key === 'Escape') {
        if (gameStateRef.current === 'PLAYING' || gameStateRef.current === 'PAUSED') {
          e.preventDefault();
          togglePause();
        }
        return;
      }

      const key = e.key.toLowerCase();
      if (key === 'f' && gameStateRef.current !== 'TITLE_MENU') {
        e.preventDefault();
        toggleExpand();
        return;
      }
      if (key === 'v' && gameStateRef.current !== 'TITLE_MENU') {
        e.preventDefault();
        cycleCamera();
        return;
      }

      if (gameStateRef.current !== 'PLAYING') return;

      if (key === 'w' || e.key === 'ArrowUp') {
        e.preventDefault();
        engine.input.up = true;
      } else if (key === 's' || e.key === 'ArrowDown') {
        e.preventDefault();
        engine.input.down = true;
      } else if (key === 'a' || e.key === 'ArrowLeft') {
        e.preventDefault();
        engine.input.left = true;
      } else if (key === 'd' || e.key === 'ArrowRight') {
        e.preventDefault();
        engine.input.right = true;
      } else if (e.code === 'Space' || e.key === 'Shift') {
        e.preventDefault();
        soundEngine.unlock();
        engine.triggerDash();
      } else if (key === 'j' || e.key === 'Enter') {
        e.preventDefault();
        soundEngine.unlock();
        engine.triggerSlash();
      } else if (key === 'q' || key === '1') {
        e.preventDefault();
        soundEngine.unlock();
        engine.triggerSkillSlot(0);
      } else if (key === 'e' || key === '2') {
        e.preventDefault();
        soundEngine.unlock();
        engine.triggerSkillSlot(1);
      } else if (key === 'r' || key === '3') {
        e.preventDefault();
        soundEngine.unlock();
        engine.triggerSkillSlot(2);
      } else if (key === 'z' || key === '4') {
        e.preventDefault();
        soundEngine.unlock();
        engine.triggerSkillSlot(3);
      } else if (key === 'x' || key === '5') {
        e.preventDefault();
        soundEngine.unlock();
        engine.triggerSkillSlot(4);
      } else if (key === 'c' || key === '6') {
        e.preventDefault();
        soundEngine.unlock();
        engine.triggerSkillSlot(5);
      } else if (key === 't' || key === '7') {
        e.preventDefault();
        soundEngine.unlock();
        engine.triggerCustomSkill();
      } else if (key === 'g' || key === '8') {
        e.preventDefault();
        soundEngine.unlock();
        engine.triggerDomainExpansion();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const engine = engineRef.current;
      if (!engine) return;

      const key = e.key.toLowerCase();
      if (key === 'w' || e.key === 'ArrowUp') engine.input.up = false;
      else if (key === 's' || e.key === 'ArrowDown') engine.input.down = false;
      else if (key === 'a' || e.key === 'ArrowLeft') engine.input.left = false;
      else if (key === 'd' || e.key === 'ArrowRight') engine.input.right = false;
    };

    const onBlur = () => {
      const engine = engineRef.current;
      if (!engine) return;
      engine.input.up = false;
      engine.input.down = false;
      engine.input.left = false;
      engine.input.right = false;
      engine.input.touchMoveX = 0;
      engine.input.touchMoveY = 0;
      engine.input.padMoveX = 0;
      engine.input.padMoveY = 0;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [togglePause, toggleExpand, cycleCamera]);

  return (
    <div
      ref={rootRef}
      className={
        isExpanded && gameState !== 'TITLE_MENU'
          ? 'fixed inset-0 z-20 bg-[#07131F] text-slate-100 flex flex-col overflow-hidden'
          : 'min-h-screen bg-[#07131F] text-slate-100 flex flex-col'
      }
    >
      {gameState === 'TITLE_MENU' ? (
        <main className="flex-1 flex flex-col justify-center">
          <TitleOverlay
            difficulty={difficulty}
            bestScore={bestScore}
            victoryCount={victoryCount}
            scales={scales}
            coins={coins}
            equippedSwordName={getSwordConfig(equippedSwordId).name}
            customMonster={customMonster}
            customEnding={customEnding}
            customSkill={customSkill}
            customAbility={customAbility}
            customDomain={customDomain}
            onSelectDifficulty={setDifficulty}
            onOpenCreator={() => {
              setCreatorTab('monster');
              setShowCreator(true);
            }}
            onOpenSkillCreator={() => {
              setCreatorTab('skill');
              setShowCreator(true);
            }}
            onOpenDomainCreator={() => {
              setCreatorTab('domain');
              setShowCreator(true);
            }}
            onOpenShop={() => setShowShop(true)}
            onStartGame={() => startNewGame(difficulty)}
          />
          {showCreator && (
            <CreatorModal
              initialMonster={customMonster}
              initialEnding={customEnding}
              initialSkill={customSkill}
              initialAbility={customAbility}
              initialDomain={customDomain}
              initialTab={creatorTab}
              onSave={handleSaveCreation}
              onSaveAndPlay={handleSaveAndPlay}
              onClose={() => setShowCreator(false)}
            />
          )}
        </main>
      ) : (
        <>
          <GameHUD
            stats={hudStats}
            gameState={gameState}
            muted={muted}
            isExpanded={isExpanded}
            showTouchPad={showTouchPad}
            cameraMode={cameraMode}
            onToggleMute={toggleMute}
            onTogglePause={togglePause}
            onToggleExpand={toggleExpand}
            onToggleTouchPad={toggleTouchPad}
            onCycleCamera={cycleCamera}
          />

          <main
            className={`flex-1 flex flex-col items-center justify-center min-h-0 ${
              isExpanded ? 'p-1.5 sm:p-3' : 'px-3 sm:px-4 py-2'
            }`}
          >
            <div
              className={
                isExpanded
                  ? 'relative w-full h-full flex-1 min-h-0 flex items-center justify-center [container-type:size]'
                  : 'relative w-full max-w-[1120px] aspect-[1120/660] rounded-xl overflow-hidden border border-slate-700/70 shadow-2xl bg-[#040E18]'
              }
            >
              <div
                onPointerMove={(e) => {
                  if (e.pointerType === 'touch') return;
                  const engine = engineRef.current;
                  const scene3d = scene3dRef.current;
                  if (!engine || !scene3d) return;
                  const deckPt = scene3d.screenToDeck(e.clientX, e.clientY);
                  if (deckPt) {
                    engine.input.mouseX = deckPt.x;
                    engine.input.mouseY = deckPt.y;
                    engine.input.mouseActive = true;
                  }
                }}
                onPointerDown={(e) => {
                  if (e.pointerType === 'touch' || gameState !== 'PLAYING') return;
                  const engine = engineRef.current;
                  const scene3d = scene3dRef.current;
                  if (!engine || !scene3d) return;
                  soundEngine.unlock();
                  const deckPt = scene3d.screenToDeck(e.clientX, e.clientY);
                  if (deckPt) {
                    engine.input.mouseX = deckPt.x;
                    engine.input.mouseY = deckPt.y;
                    engine.input.mouseActive = true;
                  }
                  if (e.button === 0) {
                    engine.triggerSlash();
                  } else if (e.button === 2) {
                    engine.triggerDash();
                  }
                }}
                onContextMenu={(e) => e.preventDefault()}
                className={
                  isExpanded
                    ? 'relative aspect-[1120/660] rounded-xl overflow-hidden border border-slate-700/70 shadow-2xl bg-[#040E18] cursor-crosshair select-none touch-none'
                    : 'relative w-full h-full cursor-crosshair select-none touch-none'
                }
                style={
                  isExpanded
                    ? { width: 'min(100cqw, calc(100cqh * 1120 / 660))' }
                    : undefined
                }
              >
                {/* Dedicated isolated container for WebGL canvas */}
                <div ref={threeMountRef} className="w-full h-full" />

                {/* Projected Korean floating combat texts */}
                <canvas
                  ref={overlayCanvasRef}
                  className="pointer-events-none absolute inset-0 w-full h-full"
                />

                {webglError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#061320]/95 p-6 text-center">
                    <p className="font-display text-lg font-bold text-amber-300">
                      3D 그래픽 컨텍스트를 초기화할 수 없습니다
                    </p>
                    <p className="text-xs text-slate-400 mt-2">
                      브라우저의 WebGL 가속이 꺼져 있거나 일시 중단되었습니다. 페이지를 새로고침해 주세요.
                    </p>
                  </div>
                )}

                {/* Brief Non-Obstructive Wave Transition / Victory Banner */}
                {gameState === 'PLAYING' &&
                  (hudStats.waveBannerTimer > 0 || hudStats.victoryCinematicActive) && (
                    <div className="pointer-events-none absolute top-4 left-1/2 -translate-x-1/2 px-5 py-1.5 rounded-lg bg-[#07131F]/90 border border-amber-400/50 text-center">
                      <span className="font-display text-sm sm:text-base font-bold text-amber-300 tracking-wide whitespace-nowrap">
                        {hudStats.victoryCinematicActive
                          ? `${hudStats.monsterName} 본체 격퇴 · 심해의 승리`
                          : hudStats.endlessMode
                            ? `무한 심해 ${hudStats.wave}단계 · 끝없는 혈투`
                            : hudStats.wave === hudStats.finalWave
                              ? `최종 결전 ${hudStats.wave}단계 · ${hudStats.monsterName} 총공세`
                              : `${hudStats.wave}단계 · ${hudStats.monsterName} 출현`}
                      </span>
                    </div>
                  )}

                {/* Active Berserk Mode Arena Banner */}
                {gameState === 'PLAYING' &&
                  hudStats.berserkActive &&
                  hudStats.waveBannerTimer <= 0 &&
                  !hudStats.victoryCinematicActive && (
                    <div className="pointer-events-none absolute top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-lg bg-[#1A0810]/90 border border-rose-500/70 flex flex-col items-center gap-1 min-w-[230px]">
                      <span className="font-display text-xs sm:text-sm font-extrabold text-rose-300 tracking-wide whitespace-nowrap">
                        광폭화 모드 · 공격력 {hudStats.berserkDamageMultiplier}배 · 코인 {hudStats.berserkCoinMultiplier}배 ·{' '}
                        <span className="font-mono-num text-amber-300">
                          {hudStats.berserkTimer.toFixed(1)}초
                        </span>
                      </span>
                      <div className="w-full h-1 bg-slate-800 rounded-sm overflow-hidden">
                        <div
                          className="h-full bg-rose-500 transition-all duration-75"
                          style={{
                            width: `${Math.max(0, Math.min(100, Math.round((hudStats.berserkTimer / Math.max(1, hudStats.berserkMaxDuration)) * 100)))}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                {/* Active Domain Expansion Banner */}
                {gameState === 'PLAYING' &&
                  hudStats.domainActive &&
                  hudStats.waveBannerTimer <= 0 &&
                  !hudStats.victoryCinematicActive && (
                    <div
                      className={`pointer-events-none absolute ${
                        hudStats.berserkActive ? 'top-[72px]' : 'top-4'
                      } left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-lg bg-[#0A081B]/90 border flex flex-col items-center gap-1 min-w-[250px]`}
                      style={{ borderColor: customDomain.domainColor }}
                    >
                      <span className="font-display text-xs sm:text-sm font-extrabold text-white tracking-wide whitespace-nowrap">
                        {hudStats.domainCallout ||
                          `${customDomain.casterName}의 영역 전개 · 「${customDomain.domainName}」`}{' '}
                        <span className="font-mono-num text-amber-300 ml-1">
                          {hudStats.domainTimer.toFixed(1)}초
                        </span>
                      </span>
                      <div className="w-full h-1 bg-slate-800 rounded-sm overflow-hidden">
                        <div
                          className="h-full transition-all duration-75"
                          style={{
                            backgroundColor: customDomain.domainColor,
                            width: `${Math.max(0, Math.min(100, Math.round((hudStats.domainTimer / Math.max(1, hudStats.domainMaxDuration)) * 100)))}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                {/* Expanded Desktop Skill Bar */}
                {isExpanded && !showTouchPad && gameState === 'PLAYING' && (
                  <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 z-10">
                    <SkillBar
                      skills={getSwordConfig(equippedSwordId).skills}
                      cooldowns={hudStats.skillCooldowns}
                      maxCooldowns={hudStats.skillMaxCooldowns}
                      empowered={hudStats.empoweredSlash}
                      customSkill={customSkill}
                      customDomain={customDomain}
                      onUseSkillSlot={triggerSkillSlot}
                      onUseCustomSkill={triggerCustomSkill}
                      onUseDomainExpansion={triggerDomainExpansion}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Normal Mode Sword Skill Bar + Subtle Desktop Controls Footer */}
            {!isExpanded && (
              <div className="w-full max-w-[1120px] flex flex-col items-center gap-2 pt-2.5">
                {!showTouchPad && (
                  <SkillBar
                    skills={getSwordConfig(equippedSwordId).skills}
                    cooldowns={hudStats.skillCooldowns}
                    maxCooldowns={hudStats.skillMaxCooldowns}
                    empowered={hudStats.empoweredSlash}
                    customSkill={customSkill}
                    customDomain={customDomain}
                    onUseSkillSlot={triggerSkillSlot}
                    onUseCustomSkill={triggerCustomSkill}
                    onUseDomainExpansion={triggerDomainExpansion}
                  />
                )}
                <div className="hidden md:flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-slate-400">
                  <span>WASD / 방향키 이동</span>
                  <span aria-hidden="true">·</span>
                  <span>클릭 / J 기본 베기</span>
                  <span aria-hidden="true">·</span>
                  <span>Q·E·R·Z·X·C (1~6) 검 고유 스킬</span>
                  {customSkill.enabled && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="text-emerald-300">T (7) 나만의 스킬</span>
                    </>
                  )}
                  {customDomain.enabled && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="text-violet-300">G (8) 영역 전개</span>
                    </>
                  )}
                  <span aria-hidden="true">·</span>
                  <span>Space / Shift / 우클릭 대시</span>
                  <span aria-hidden="true">·</span>
                  <span>V 시점 전환</span>
                  <span aria-hidden="true">·</span>
                  <span>F 화면 확대</span>
                </div>
              </div>
            )}

            {/* Touch Pad Controls (iPad, Tablet, Mobile, or Manual Toggle — works in normal and expanded mode) */}
            {gameState === 'PLAYING' && showTouchPad && (
              <TouchControls
                floating
                skills={getSwordConfig(equippedSwordId).skills}
                skillCooldowns={hudStats.skillCooldowns}
                customSkill={customSkill}
                customDomain={customDomain}
                onMoveVector={(dx, dy) => {
                  const engine = engineRef.current;
                  if (!engine) return;
                  engine.input.touchMoveX = dx;
                  engine.input.touchMoveY = dy;
                  engine.input.mouseActive = false;
                }}
                onDash={() => {
                  soundEngine.unlock();
                  engineRef.current?.triggerDash();
                }}
                onSlash={() => {
                  soundEngine.unlock();
                  engineRef.current?.triggerSlash();
                }}
                onUseSkillSlot={triggerSkillSlot}
                onUseCustomSkill={triggerCustomSkill}
                onUseDomainExpansion={triggerDomainExpansion}
              />
            )}
          </main>

          {gameState === 'PAUSED' && (
            <PauseModal
              onResume={() => setGameState('PLAYING')}
              onOpenShop={() => setShowShop(true)}
              onRestart={() => startNewGame(difficulty)}
              onMainMenu={() => {
                setIsExpanded(false);
                if (document.fullscreenElement && document.exitFullscreen) {
                  void document.exitFullscreen().catch(() => {});
                }
                setGameState('TITLE_MENU');
              }}
            />
          )}

          {gameState === 'VICTORY' && summary && (
            <VictoryEndingModal
              summary={summary}
              onContinueEndless={handleContinueEndless}
              onOpenShop={() => setShowShop(true)}
              onPlayAgain={() => startNewGame(difficulty)}
              onMainMenu={() => {
                setIsExpanded(false);
                if (document.fullscreenElement && document.exitFullscreen) {
                  void document.exitFullscreen().catch(() => {});
                }
                setGameState('TITLE_MENU');
              }}
            />
          )}

          {gameState === 'GAME_OVER' && summary && (
            <GameOverModal
              summary={summary}
              onOpenShop={() => setShowShop(true)}
              onPlayAgain={() => startNewGame(difficulty)}
              onMainMenu={() => {
                setIsExpanded(false);
                if (document.fullscreenElement && document.exitFullscreen) {
                  void document.exitFullscreen().catch(() => {});
                }
                setGameState('TITLE_MENU');
              }}
            />
          )}
        </>
      )}

      {showShop && (
        <ShopModal
          scales={scales}
          coins={coins}
          ownedSwordIds={ownedSwordIds}
          equippedSwordId={equippedSwordId}
          onSellScales={handleSellScales}
          onBuySword={handleBuySword}
          onEquipSword={handleEquipSword}
          onUnlockCreatorSword={handleUnlockCreatorSword}
          onClose={() => setShowShop(false)}
        />
      )}
    </div>
  );
}
