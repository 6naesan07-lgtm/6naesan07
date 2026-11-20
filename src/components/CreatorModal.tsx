import { useState } from 'react';
import { BookOpen, Flame, RotateCcw, Sparkles, Swords, Wand2, X } from 'lucide-react';
import {
  CustomAbilityConfig,
  CustomDomainConfig,
  CustomEndingConfig,
  CustomMonsterConfig,
  CustomPassiveTrait,
  CustomSkillBonus,
  CustomSkillConfig,
  CustomSkillShape,
  DEFAULT_CUSTOM_ABILITY,
  DEFAULT_CUSTOM_DOMAIN,
  DEFAULT_CUSTOM_ENDING,
  DEFAULT_CUSTOM_SKILL,
  DEFAULT_MONSTER_PRESETS,
  DomainEffectType,
  EndingMood,
  MonsterAttackFocus,
  MonsterBodyStyle,
} from '../game/types';

interface CreatorModalProps {
  initialMonster: CustomMonsterConfig;
  initialEnding: CustomEndingConfig;
  initialSkill: CustomSkillConfig;
  initialAbility: CustomAbilityConfig;
  initialDomain: CustomDomainConfig;
  initialTab?: 'monster' | 'ending' | 'skill' | 'domain';
  onSave: (
    monster: CustomMonsterConfig,
    ending: CustomEndingConfig,
    skill: CustomSkillConfig,
    ability: CustomAbilityConfig,
    domain: CustomDomainConfig,
  ) => void;
  onSaveAndPlay: (
    monster: CustomMonsterConfig,
    ending: CustomEndingConfig,
    skill: CustomSkillConfig,
    ability: CustomAbilityConfig,
    domain: CustomDomainConfig,
  ) => void;
  onClose: () => void;
}

const BODY_STYLE_OPTIONS: Array<{ id: MonsterBodyStyle; label: string }> = [
  { id: 'kraken', label: '문어형 크라켄' },
  { id: 'horned_leviathan', label: '뿔 해룡형' },
  { id: 'abyss_serpent', label: '바다뱀형' },
  { id: 'armored_crab', label: '갑각 거수형' },
];

const ATTACK_FOCUS_OPTIONS: Array<{ id: MonsterAttackFocus; label: string }> = [
  { id: 'balanced', label: '균형형' },
  { id: 'slam_heavy', label: '내려찍기 특화' },
  { id: 'sweep_heavy', label: '휩쓸기 특화' },
  { id: 'lunge_heavy', label: '돌진 특화' },
];

const MOOD_OPTIONS: Array<{ id: EndingMood; label: string }> = [
  { id: 'triumph', label: '위대한 승리' },
  { id: 'legend', label: '전설의 서사' },
  { id: 'mystery', label: '신비로운 여운' },
  { id: 'comedy', label: '유쾌한 반전' },
];

const COLOR_SWATCHES = [
  '#4c2876',
  '#991b1b',
  '#0f766e',
  '#92400e',
  '#1e3a8a',
  '#be185d',
  '#374151',
];

const TENTACLE_SWATCHES = [
  '#7c5cbf',
  '#dc2626',
  '#14b8a6',
  '#d97706',
  '#3b82f6',
  '#ec4899',
  '#64748b',
];

const EYE_SWATCHES = ['#fde047', '#fb923c', '#67e8f9', '#f43f5e', '#4ade80', '#e879f9'];

const SKILL_SHAPE_OPTIONS: Array<{ id: CustomSkillShape; label: string; summary: string }> = [
  { id: 'cyclone_burst', label: '회전 폭풍형', summary: '360° 칼바람 + 충격파' },
  { id: 'radial_waves', label: '방사 검기형', summary: '다방향 3D 검기 발사' },
  { id: 'meteor_storm', label: '유성 폭격형', summary: '거대 천검 동시 낙하' },
  { id: 'lightning_dash', label: '섬광 돌진형', summary: '무적 차원 관통 베기' },
  { id: 'cross_tsunami', label: '십자 해일형', summary: 'X자 참격 + 다중 해일' },
];

const SKILL_BONUS_OPTIONS: Array<{ id: CustomSkillBonus; label: string }> = [
  { id: 'none', label: '순수 극딜 (+25% 피해)' },
  { id: 'clear_ink', label: '전장 먹물 일괄 정화' },
  { id: 'stagger', label: '공격 예고 촉수 경직' },
  { id: 'heal_one', label: '사용 시 체력 +1 회복' },
  { id: 'berserk_spark', label: '광폭화 4.5초 발동' },
  { id: 'orbit_blades', label: '3D 수호 검진 소환' },
];

const SKILL_COLOR_SWATCHES = [
  '#38bdf8',
  '#f43f5e',
  '#fbbf24',
  '#22c55e',
  '#a855f7',
  '#22d3ee',
  '#fb923c',
];

const SKILL_PRESETS: Array<{ label: string; config: CustomSkillConfig }> = [
  {
    label: '폭풍 회전 비기',
    config: {
      enabled: true,
      name: '나만의 폭풍 비기',
      desc: '360° 회오리 + 방사 검기',
      shape: 'cyclone_burst',
      effectColor: '#38bdf8',
      powerLevel: 3,
      rangeLevel: 4,
      projectileCount: 6,
      cooldown: 5.5,
      bonusEffect: 'clear_ink',
    },
  },
  {
    label: '12방 별빛 검기',
    config: {
      enabled: true,
      name: '12방 별빛 난무',
      desc: '전방위 12방향 검기 폭발',
      shape: 'radial_waves',
      effectColor: '#a855f7',
      powerLevel: 4,
      rangeLevel: 3,
      projectileCount: 12,
      cooldown: 6.0,
      bonusEffect: 'stagger',
    },
  },
  {
    label: '천검 유성 폭격',
    config: {
      enabled: true,
      name: '심판의 유성 폭격',
      desc: '9연 거대 천검 낙하',
      shape: 'meteor_storm',
      effectColor: '#fbbf24',
      powerLevel: 5,
      rangeLevel: 4,
      projectileCount: 9,
      cooldown: 8.5,
      bonusEffect: 'berserk_spark',
    },
  },
  {
    label: '번개 차원 일섬',
    config: {
      enabled: true,
      name: '초광속 차원 일섬',
      desc: '무적 관통 + 수호 검진',
      shape: 'lightning_dash',
      effectColor: '#22c55e',
      powerLevel: 4,
      rangeLevel: 4,
      projectileCount: 6,
      cooldown: 4.5,
      bonusEffect: 'orbit_blades',
    },
  },
];

const ABILITY_TRAIT_OPTIONS: Array<{ id: CustomPassiveTrait; label: string; desc: string }> = [
  { id: 'auto_lightning', label: '자동 천벌 낙뢰', desc: '2.8초마다 촉수 자동 번개' },
  { id: 'auto_regen', label: '자동 체력 재생', desc: '10초마다 체력 +1 회복' },
  { id: 'ink_magnet', label: '먹물 정화 & 자석', desc: '근처 먹물 증발 + 전리품 흡인' },
  { id: 'coin_boost', label: '코인·비늘 2배', desc: '획득 보상 2배 증폭' },
  { id: 'aegis_revive', label: '불멸 부활 가호', desc: '치명 피해 방어 + 100% 부활' },
];

const DOMAIN_EFFECT_OPTIONS: Array<{
  id: DomainEffectType;
  label: string;
  desc: string;
}> = [
  {
    id: 'infinite_void',
    label: '무량공처 · 시공 정지',
    desc: '영역 안 촉수 행동 정지 + 약점 노출 + 지속 피해',
  },
  {
    id: 'malevolent_shrine',
    label: '복마어주자 · 필중 참격',
    desc: '0.28초마다 사방 필중 참격 난사',
  },
  {
    id: 'celestial_judgement',
    label: '천벌 성역 · 유성 낙뢰',
    desc: '영역 안 촉수에 하늘의 유성우 연속 강타',
  },
  {
    id: 'abyss_feast',
    label: '탐식 영역 · 흡혈 보물',
    desc: '타격 피해 + 주기적 체력 회복 + 보상 2배',
  },
];

const DOMAIN_PRESETS: Array<{ label: string; config: CustomDomainConfig }> = [
  {
    label: '무량공처 스타일',
    config: {
      enabled: true,
      casterName: '오이',
      domainName: '무량공처',
      domainEffect: 'infinite_void',
      domainColor: '#38bdf8',
      duration: 7.5,
      cooldown: 14.0,
      radiusLevel: 3,
    },
  },
  {
    label: '복마어주자 스타일',
    config: {
      enabled: true,
      casterName: '선장',
      domainName: '복마어주자',
      domainEffect: 'malevolent_shrine',
      domainColor: '#dc2626',
      duration: 7.0,
      cooldown: 13.0,
      radiusLevel: 3,
    },
  },
  {
    label: '태초 신의 영역',
    config: {
      enabled: true,
      casterName: '태초의 신',
      domainName: '황금 천벌계',
      domainEffect: 'celestial_judgement',
      domainColor: '#fbbf24',
      duration: 8.0,
      cooldown: 15.0,
      radiusLevel: 3,
    },
  },
  {
    label: '심해 제왕의 영역',
    config: {
      enabled: true,
      casterName: '나',
      domainName: '심해의 절대 옥좌',
      domainEffect: 'abyss_feast',
      domainColor: '#a855f7',
      duration: 8.0,
      cooldown: 14.0,
      radiusLevel: 2,
    },
  },
];

function SkillPreviewCard({ skill }: { skill: CustomSkillConfig }) {
  const color = skill.effectColor || '#38bdf8';
  const bonusLabel =
    SKILL_BONUS_OPTIONS.find((b) => b.id === skill.bonusEffect)?.label ?? '부가 효과 없음';
  const shapeInfo =
    SKILL_SHAPE_OPTIONS.find((s) => s.id === skill.shape) ?? SKILL_SHAPE_OPTIONS[0];

  return (
    <div className="rounded-xl bg-[#06111D] border border-slate-700/70 p-4 flex flex-col justify-between gap-3">
      <div className="w-full flex items-center justify-between text-xs text-slate-400">
        <span>나만의 스킬 미리보기</span>
        <span className="font-mono-num text-amber-300 font-semibold">
          T / 7키 · {skill.cooldown.toFixed(1)}초
        </span>
      </div>

      <div className="relative w-full h-40 rounded-lg bg-gradient-to-b from-[#07182B] via-[#0B233C] to-[#051322] border border-slate-800 flex items-center justify-center overflow-hidden">
        <div
          className="absolute w-28 h-28 rounded-full opacity-25 blur-xl"
          style={{ backgroundColor: color }}
        />

        <svg viewBox="0 0 200 140" className="w-48 h-36" aria-hidden="true">
          <circle cx="100" cy="72" r="10" fill="#e2e8f0" stroke={color} strokeWidth="3" />
          {skill.shape === 'cyclone_burst' && (
            <>
              <circle
                cx="100"
                cy="72"
                r={26 + skill.rangeLevel * 4}
                fill="none"
                stroke={color}
                strokeWidth="4"
                strokeDasharray="18 8"
              />
              <circle
                cx="100"
                cy="72"
                r={18 + skill.rangeLevel * 2}
                fill="none"
                stroke="#ffffff"
                strokeOpacity="0.65"
                strokeWidth="2"
                strokeDasharray="10 6"
              />
            </>
          )}
          {skill.shape === 'radial_waves' &&
            Array.from({ length: Math.min(12, Math.max(3, skill.projectileCount)) }).map(
              (_, i, arr) => {
                const ang = (i * Math.PI * 2) / arr.length;
                const x1 = 100 + Math.cos(ang) * 18;
                const y1 = 72 + Math.sin(ang) * 18;
                const x2 = 100 + Math.cos(ang) * (40 + skill.rangeLevel * 4);
                const y2 = 72 + Math.sin(ang) * (40 + skill.rangeLevel * 4);
                return (
                  <line
                    key={i}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={color}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                );
              },
            )}
          {skill.shape === 'meteor_storm' &&
            [-36, -12, 12, 36].map((ox, idx) => (
              <g key={idx} transform={`translate(${100 + ox}, ${26 + (idx % 2) * 16})`}>
                <line x1="0" y1="0" x2="0" y2="34" stroke={color} strokeWidth="4" strokeLinecap="round" />
                <circle cx="0" cy="38" r="6" fill="#ffffff" fillOpacity="0.8" />
              </g>
            ))}
          {skill.shape === 'lightning_dash' && (
            <>
              <line
                x1="28"
                y1="96"
                x2="170"
                y2="46"
                stroke={color}
                strokeWidth="7"
                strokeLinecap="round"
                strokeOpacity="0.85"
              />
              <line
                x1="28"
                y1="96"
                x2="170"
                y2="46"
                stroke="#ffffff"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </>
          )}
          {skill.shape === 'cross_tsunami' && (
            <>
              <line x1="52" y1="36" x2="148" y2="108" stroke={color} strokeWidth="5" strokeLinecap="round" />
              <line x1="148" y1="36" x2="52" y2="108" stroke={color} strokeWidth="5" strokeLinecap="round" />
              <path
                d="M 42 72 Q 100 32 158 72"
                fill="none"
                stroke="#ffffff"
                strokeOpacity="0.7"
                strokeWidth="3"
              />
            </>
          )}
        </svg>
      </div>

      <div className="space-y-1 text-center">
        <p className="font-display text-base font-bold text-white truncate">
          {skill.name.trim() || '나만의 스킬'}
        </p>
        <p className="text-xs text-slate-300 truncate">
          {shapeInfo.label} · {bonusLabel}
        </p>
        <p className="text-[11px] font-mono-num text-slate-400">
          위력 Lv.{skill.powerLevel} · 범위 Lv.{skill.rangeLevel} · {skill.projectileCount}연격
        </p>
      </div>
    </div>
  );
}

function DomainPreviewCard({ domain }: { domain: CustomDomainConfig }) {
  const color = domain.domainColor || '#38bdf8';
  const caster = domain.casterName.trim() || '선장';
  const dName = domain.domainName.trim() || '절대 영역';
  const effInfo =
    DOMAIN_EFFECT_OPTIONS.find((e) => e.id === domain.domainEffect) ?? DOMAIN_EFFECT_OPTIONS[0];

  return (
    <div className="rounded-xl bg-[#06111D] border border-slate-700/70 p-4 flex flex-col justify-between gap-3">
      <div className="w-full flex items-center justify-between text-xs text-slate-400">
        <span>3D 영역 전개 미리보기</span>
        <span className="font-mono-num text-sky-300 font-semibold">
          G키 · {domain.duration.toFixed(1)}초 지속 / 쿨 {domain.cooldown.toFixed(0)}초
        </span>
      </div>

      <div className="relative w-full h-44 rounded-lg bg-gradient-to-b from-[#061224] via-[#0A1E38] to-[#040D1A] border border-slate-800 flex items-center justify-center overflow-hidden">
        <div
          className="absolute w-40 h-40 rounded-full opacity-25 blur-xl"
          style={{ backgroundColor: color }}
        />
        <svg viewBox="0 0 220 150" className="w-56 h-40" aria-hidden="true">
          <ellipse
            cx="110"
            cy="112"
            rx={48 + domain.radiusLevel * 16}
            ry={16 + domain.radiusLevel * 5}
            fill={color}
            fillOpacity="0.14"
            stroke={color}
            strokeWidth="2.5"
          />
          <ellipse
            cx="110"
            cy="112"
            rx={32 + domain.radiusLevel * 10}
            ry={10 + domain.radiusLevel * 3}
            fill="none"
            stroke="#ffffff"
            strokeOpacity="0.55"
            strokeWidth="1.5"
            strokeDasharray="6 4"
          />
          <path
            d={`M ${110 - (48 + domain.radiusLevel * 16)} 112 A ${48 + domain.radiusLevel * 16} ${56 + domain.radiusLevel * 12} 0 0 1 ${110 + (48 + domain.radiusLevel * 16)} 112`}
            fill={color}
            fillOpacity="0.16"
            stroke={color}
            strokeWidth="2"
          />
          <circle cx="110" cy="96" r="8" fill="#fef08a" stroke={color} strokeWidth="2.5" />
        </svg>
      </div>

      <div className="space-y-1 text-center">
        <p className="font-display text-base font-bold text-white truncate">
          {caster}의 영역 전개 · 「{dName}」
        </p>
        <p className="text-xs text-slate-300 truncate">{effInfo.label}</p>
        <p className="text-[11px] text-slate-400 truncate">{effInfo.desc}</p>
      </div>
    </div>
  );
}

function MonsterPreviewCard({ monster }: { monster: CustomMonsterConfig }) {
  const s = monster.scale;
  return (
    <div className="rounded-xl bg-[#06111D] border border-slate-700/70 p-4 flex flex-col items-center justify-between gap-3">
      <div className="w-full flex items-center justify-between text-xs text-slate-400">
        <span>실시간 3D 외형 미리보기</span>
        <span className="font-mono-num text-amber-300">
          {monster.finalWave}단계 결전 · {Math.round(s * 100)}%
        </span>
      </div>

      <div className="relative w-full h-44 rounded-lg bg-gradient-to-b from-[#07182B] via-[#0B233C] to-[#051322] border border-slate-800 flex items-center justify-center overflow-hidden">
        {/* Glow halo behind monster */}
        <div
          className="absolute w-32 h-32 rounded-full opacity-25 blur-xl"
          style={{ backgroundColor: monster.eyeColor }}
        />

        <svg
          viewBox="0 0 200 160"
          className="w-48 h-40 transition-transform duration-150"
          style={{ transform: `scale(${0.86 + (s - 1) * 0.45})` }}
        >
          {/* Tentacles */}
          <path
            d="M35,145 Q42,100 66,95"
            stroke={monster.tentacleColor}
            strokeWidth="12"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M165,145 Q158,100 134,95"
            stroke={monster.tentacleColor}
            strokeWidth="12"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M62,150 Q68,112 82,106"
            stroke={monster.tentacleColor}
            strokeWidth="10"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M138,150 Q132,112 118,106"
            stroke={monster.tentacleColor}
            strokeWidth="10"
            strokeLinecap="round"
            fill="none"
          />

          {/* Body silhouette by style */}
          {monster.bodyStyle === 'kraken' && (
            <>
              <polygon points="56,55 32,36 52,72" fill={monster.bodyColor} />
              <polygon points="144,55 168,36 148,72" fill={monster.bodyColor} />
              <ellipse cx="100" cy="68" rx="40" ry="48" fill={monster.bodyColor} />
            </>
          )}

          {monster.bodyStyle === 'horned_leviathan' && (
            <>
              <polygon points="74,48 44,12 62,62" fill={monster.tentacleColor} />
              <polygon points="126,48 156,12 138,62" fill={monster.tentacleColor} />
              <polygon points="100,18 138,52 128,106 72,106 62,52" fill={monster.bodyColor} />
            </>
          )}

          {monster.bodyStyle === 'abyss_serpent' && (
            <>
              <ellipse cx="100" cy="66" rx="54" ry="38" fill={monster.bodyColor} />
              <polygon points="100,12 116,44 84,44" fill={monster.tentacleColor} />
              <rect x="76" y="42" width="48" height="68" rx="22" fill={monster.bodyColor} />
            </>
          )}

          {monster.bodyStyle === 'armored_crab' && (
            <>
              <polygon points="46,72 24,42 56,54" fill={monster.tentacleColor} />
              <polygon points="154,72 176,42 144,54" fill={monster.tentacleColor} />
              <ellipse cx="100" cy="70" rx="56" ry="38" fill={monster.bodyColor} />
            </>
          )}

          {/* Glowing eyes + slit pupils */}
          <circle cx="82" cy="74" r="9.5" fill={monster.eyeColor} />
          <rect x="80.5" y="67" width="3" height="14" rx="1" fill="#090d16" />
          <circle cx="118" cy="74" r="9.5" fill={monster.eyeColor} />
          <rect x="116.5" y="67" width="3" height="14" rx="1" fill="#090d16" />

          {/* Ink orb */}
          <circle cx="164" cy="34" r="7" fill={monster.inkColor} />
        </svg>
      </div>

      <div className="w-full text-center space-y-0.5">
        <p className="font-display text-base font-bold text-white truncate">
          {monster.name.trim() || '이름 없는 괴수'}
        </p>
        <p className="text-xs text-slate-400 truncate">
          {monster.subtitle.trim() || '심해에서 올라온 미지의 괴수'}
        </p>
      </div>
    </div>
  );
}

export function CreatorModal({
  initialMonster,
  initialEnding,
  initialSkill,
  initialAbility,
  initialDomain,
  initialTab = 'monster',
  onSave,
  onSaveAndPlay,
  onClose,
}: CreatorModalProps) {
  const [tab, setTab] = useState<'monster' | 'ending' | 'skill' | 'domain'>(initialTab);
  const [monster, setMonster] = useState<CustomMonsterConfig>({ ...initialMonster });
  const [ending, setEnding] = useState<CustomEndingConfig>({ ...initialEnding });
  const [skill, setSkill] = useState<CustomSkillConfig>({ ...initialSkill });
  const [ability, setAbility] = useState<CustomAbilityConfig>({
    ...initialAbility,
    traits: [...initialAbility.traits],
  });
  const [domain, setDomain] = useState<CustomDomainConfig>({ ...initialDomain });

  const toggleAbilityTrait = (trait: CustomPassiveTrait) => {
    setAbility((prev) => {
      const exists = prev.traits.includes(trait);
      const nextTraits = exists
        ? prev.traits.filter((t) => t !== trait)
        : [...prev.traits, trait];
      return { ...prev, enabled: true, traits: nextTraits };
    });
  };

  const applyStoryTemplate = (kind: 'hero' | 'mystery' | 'comedy') => {
    const mName = monster.name.trim() || '심해 괴수';
    if (kind === 'hero') {
      setEnding({
        enabled: true,
        victoryMood: 'legend',
        victoryTitle: `${mName} 토벌 · 바다의 수호자`,
        victoryStory: `긴 사투 끝에 마침내 ${mName}을(를) 쓰러뜨렸습니다! 부서진 돛대 너머로 떠오르는 황금빛 여명 아래, 항해의 전설이 새롭게 기록됩니다.`,
        defeatTitle: `${mName} 앞에서 멈춘 깃발`,
        defeatStory: `거대한 파도와 ${mName}의 일격에 배가 기울고 말았습니다. 하지만 선장의 검은 아직 꺾이지 않았습니다.`,
      });
    } else if (kind === 'mystery') {
      setEnding({
        enabled: true,
        victoryMood: 'mystery',
        victoryTitle: `가라앉은 ${mName}의 비밀`,
        victoryStory: `검을 거두자 ${mName}이(가) 푸른 빛을 남기며 조용히 심해로 돌아갑니다. 갑판 위에는 정체 모를 고대 진주 하나만이 남아 빛나고 있었습니다.`,
        defeatTitle: '심연의 부름',
        defeatStory: `${mName}의 눈빛이 어둠 속에서 번뜩이며 배를 깊은 바다 속으로 이끌어 갑니다.`,
      });
    } else {
      setEnding({
        enabled: true,
        victoryMood: 'comedy',
        victoryTitle: `오늘 저녁은 ${mName} 통구이!`,
        victoryStory: `치열한 전투가 끝나고 갑판 위에는 산더미처럼 쌓인 다리 고기가 남았습니다. 선원들은 당장 냄비와 숯불을 꺼내 축제를 열기 시작했습니다!`,
        defeatTitle: '배보다 배꼽이 더 큰 괴수',
        defeatStory: `${mName}에게 배를 내어주고 구명보트로 긴급 탈출했습니다. 다음엔 양념통 대신 더 큰 검을 챙겨야겠습니다.`,
      });
    }
  };

  const resetDefaults = () => {
    setMonster({ ...DEFAULT_MONSTER_PRESETS[0] });
    setEnding({ ...DEFAULT_CUSTOM_ENDING });
    setSkill({ ...DEFAULT_CUSTOM_SKILL });
    setAbility({ ...DEFAULT_CUSTOM_ABILITY, traits: [...DEFAULT_CUSTOM_ABILITY.traits] });
    setDomain({ ...DEFAULT_CUSTOM_DOMAIN });
  };

  return (
    <div
      className="fixed inset-0 z-40 bg-[#040D16]/90 flex items-center justify-center p-3 sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="creator-title"
    >
      <div className="w-full max-w-4xl max-h-[92vh] bg-[#0D1E30] border border-slate-700/70 rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between gap-4 bg-[#0A1827]">
          <div>
            <h2 id="creator-title" className="font-display text-xl font-bold text-white">
              괴물 · 엔딩 · 나만의 능력 · 영역 전개 공방
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              직접 만드는 나만의 초능력(패시브+액티브)과 누구의 영역 전개를 자유롭게 설계하세요.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="w-10 h-10 rounded-lg border border-slate-700/70 bg-[#112438] text-slate-300 hover:text-white flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="px-5 pt-3 pb-2 border-b border-slate-800/80 bg-[#0B1A2B] flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setTab('monster')}
            className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              tab === 'monster'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-[#12263B] text-slate-300 hover:text-white'
            }`}
          >
            <Flame className="w-4 h-4" />
            1. 괴물 만들기
          </button>
          <button
            type="button"
            onClick={() => setTab('ending')}
            className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              tab === 'ending'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-[#12263B] text-slate-300 hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            2. 엔딩 만들기 {ending.enabled ? '(ON)' : ''}
          </button>
          <button
            type="button"
            onClick={() => setTab('skill')}
            className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              tab === 'skill'
                ? 'bg-emerald-500 text-slate-950'
                : 'bg-[#12263B] text-slate-300 hover:text-white'
            }`}
          >
            <Wand2 className="w-4 h-4" />
            3. 나만의 능력·스킬 {ability.enabled || skill.enabled ? '(ON)' : ''}
          </button>
          <button
            type="button"
            onClick={() => setTab('domain')}
            className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              tab === 'domain'
                ? 'bg-fuchsia-500 text-slate-950'
                : 'bg-[#12263B] text-slate-300 hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            4. 영역 전개 만들기 {domain.enabled ? '(장착 중)' : ''}
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {tab === 'monster' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left Preview + Presets */}
              <div className="lg:col-span-5 space-y-4">
                <MonsterPreviewCard monster={monster} />

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-300">
                    빠른 기본 괴물 불러오기
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {DEFAULT_MONSTER_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setMonster({ ...preset })}
                        className={`px-3 py-2 rounded-lg border text-xs font-semibold text-left transition-colors cursor-pointer ${
                          monster.id === preset.id
                            ? 'border-amber-400/80 bg-amber-500/15 text-amber-200'
                            : 'border-slate-700/70 bg-[#091726] text-slate-300 hover:text-white'
                        }`}
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Customization Controls */}
              <div className="lg:col-span-7 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      괴물 이름
                    </label>
                    <input
                      type="text"
                      maxLength={24}
                      value={monster.name}
                      onChange={(e) =>
                        setMonster({ ...monster, id: 'custom', name: e.target.value })
                      }
                      placeholder="예: 심해의 제왕"
                      className="w-full px-3 py-2 rounded-lg bg-[#081421] border border-slate-700 text-sm text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      괴물 소개 문구
                    </label>
                    <input
                      type="text"
                      maxLength={40}
                      value={monster.subtitle}
                      onChange={(e) =>
                        setMonster({ ...monster, id: 'custom', subtitle: e.target.value })
                      }
                      placeholder="예: 붉은 번개를 뿜는 바다 괴수"
                      className="w-full px-3 py-2 rounded-lg bg-[#081421] border border-slate-700 text-sm text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                {/* 3D Body Style */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    3D 괴물 외형 형태
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {BODY_STYLE_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() =>
                          setMonster({ ...monster, id: 'custom', bodyStyle: opt.id })
                        }
                        className={`py-2 px-2.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                          monster.bodyStyle === opt.id
                            ? 'border-sky-400 bg-sky-500/20 text-sky-200'
                            : 'border-slate-700/70 bg-[#091726] text-slate-300 hover:text-white'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Colors */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-300">몸통 색상</span>
                      <input
                        type="color"
                        value={monster.bodyColor}
                        onChange={(e) =>
                          setMonster({ ...monster, id: 'custom', bodyColor: e.target.value })
                        }
                        className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                      />
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {COLOR_SWATCHES.map((c) => (
                        <button
                          key={c}
                          type="button"
                          aria-label={`몸통 색상 ${c}`}
                          onClick={() => setMonster({ ...monster, id: 'custom', bodyColor: c })}
                          className={`w-6 h-6 rounded-md border cursor-pointer ${
                            monster.bodyColor.toLowerCase() === c
                              ? 'border-white scale-110'
                              : 'border-slate-600'
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-300">촉수 색상</span>
                      <input
                        type="color"
                        value={monster.tentacleColor}
                        onChange={(e) =>
                          setMonster({ ...monster, id: 'custom', tentacleColor: e.target.value })
                        }
                        className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                      />
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {TENTACLE_SWATCHES.map((c) => (
                        <button
                          key={c}
                          type="button"
                          aria-label={`촉수 색상 ${c}`}
                          onClick={() =>
                            setMonster({ ...monster, id: 'custom', tentacleColor: c })
                          }
                          className={`w-6 h-6 rounded-md border cursor-pointer ${
                            monster.tentacleColor.toLowerCase() === c
                              ? 'border-white scale-110'
                              : 'border-slate-600'
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-300">눈 · 먹물 빛</span>
                      <input
                        type="color"
                        value={monster.eyeColor}
                        onChange={(e) =>
                          setMonster({
                            ...monster,
                            id: 'custom',
                            eyeColor: e.target.value,
                            inkColor: e.target.value,
                          })
                        }
                        className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                      />
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {EYE_SWATCHES.map((c) => (
                        <button
                          key={c}
                          type="button"
                          aria-label={`발광 색상 ${c}`}
                          onClick={() =>
                            setMonster({ ...monster, id: 'custom', eyeColor: c, inkColor: c })
                          }
                          className={`w-6 h-6 rounded-md border cursor-pointer ${
                            monster.eyeColor.toLowerCase() === c
                              ? 'border-white scale-110'
                              : 'border-slate-600'
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Sliders & Combat Focus */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="p-2.5 rounded-lg bg-[#081421] border border-slate-800 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300">덩치 크기</span>
                      <span className="font-mono-num text-amber-300 font-bold">
                        {Math.round(monster.scale * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0.85}
                      max={1.32}
                      step={0.01}
                      value={monster.scale}
                      onChange={(e) =>
                        setMonster({
                          ...monster,
                          id: 'custom',
                          scale: Number.parseFloat(e.target.value),
                        })
                      }
                      className="w-full accent-amber-400 cursor-pointer"
                    />
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#081421] border border-slate-800 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300">공격 속도</span>
                      <span className="font-mono-num text-sky-300 font-bold">
                        {monster.speedMultiplier.toFixed(2)}x
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0.8}
                      max={1.35}
                      step={0.05}
                      value={monster.speedMultiplier}
                      onChange={(e) =>
                        setMonster({
                          ...monster,
                          id: 'custom',
                          speedMultiplier: Number.parseFloat(e.target.value),
                        })
                      }
                      className="w-full accent-sky-400 cursor-pointer"
                    />
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#081421] border border-slate-800 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300">엔딩 목표 단계</span>
                      <span className="font-mono-num text-emerald-300 font-bold">
                        {monster.finalWave}단계
                      </span>
                    </div>
                    <input
                      type="range"
                      min={2}
                      max={5}
                      step={1}
                      value={monster.finalWave}
                      onChange={(e) =>
                        setMonster({
                          ...monster,
                          id: 'custom',
                          finalWave: Number.parseInt(e.target.value, 10),
                        })
                      }
                      className="w-full accent-emerald-400 cursor-pointer"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    주력 공격 성향
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {ATTACK_FOCUS_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() =>
                          setMonster({ ...monster, id: 'custom', attackFocus: opt.id })
                        }
                        className={`py-2 px-2.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                          monster.attackFocus === opt.id
                            ? 'border-amber-400 bg-amber-500/20 text-amber-200'
                            : 'border-slate-700/70 bg-[#091726] text-slate-300 hover:text-white'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : tab === 'ending' ? (
            <div className="space-y-4">
              {/* Ending Enable Toggle & Story Templates */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-[#081523] border border-slate-800">
                <div className="space-y-0.5">
                  <p className="text-sm font-bold text-white">직접 만든 엔딩 사용하기</p>
                  <p className="text-xs text-slate-400">
                    켜면 승리/패배 시 아래에 작성한 나만의 제목과 에필로그가 펼쳐집니다.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEnding({ ...ending, enabled: !ending.enabled })}
                    className={`px-4 py-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer whitespace-nowrap ${
                      ending.enabled
                        ? 'border-emerald-400/80 bg-emerald-500/20 text-emerald-300'
                        : 'border-slate-700 bg-[#122437] text-slate-300'
                    }`}
                  >
                    {ending.enabled ? '커스텀 엔딩 사용 중' : '자동 등급 엔딩 사용 중'}
                  </button>
                </div>
              </div>

              {/* One-click Story Ideas */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-400 flex items-center gap-1 mr-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  예시 이야기 채우기:
                </span>
                <button
                  type="button"
                  onClick={() => applyStoryTemplate('hero')}
                  className="px-3 py-1.5 rounded-lg border border-slate-700 bg-[#0A1928] hover:border-amber-400/70 text-xs font-semibold text-slate-200 cursor-pointer"
                >
                  영웅 서사
                </button>
                <button
                  type="button"
                  onClick={() => applyStoryTemplate('mystery')}
                  className="px-3 py-1.5 rounded-lg border border-slate-700 bg-[#0A1928] hover:border-sky-400/70 text-xs font-semibold text-slate-200 cursor-pointer"
                >
                  신비로운 결말
                </button>
                <button
                  type="button"
                  onClick={() => applyStoryTemplate('comedy')}
                  className="px-3 py-1.5 rounded-lg border border-slate-700 bg-[#0A1928] hover:border-rose-400/70 text-xs font-semibold text-slate-200 cursor-pointer"
                >
                  유쾌한 반전
                </button>
              </div>

              {/* Mood */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  엔딩 분위기 테마
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {MOOD_OPTIONS.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setEnding({ ...ending, enabled: true, victoryMood: m.id })}
                      className={`py-2 px-3 rounded-lg border text-xs font-semibold cursor-pointer whitespace-nowrap ${
                        ending.victoryMood === m.id
                          ? 'border-amber-400 bg-amber-500/20 text-amber-200'
                          : 'border-slate-700 bg-[#091726] text-slate-300 hover:text-white'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Victory & Defeat Editors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[#081523] border border-amber-500/30 space-y-3">
                  <p className="text-xs font-bold text-amber-300">승리 엔딩 (보스 격퇴 시)</p>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">엔딩 제목</label>
                    <input
                      type="text"
                      maxLength={36}
                      value={ending.victoryTitle}
                      onChange={(e) =>
                        setEnding({ ...ending, enabled: true, victoryTitle: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-[#0D1E30] border border-slate-700 text-sm text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">에필로그 이야기</label>
                    <textarea
                      rows={4}
                      maxLength={220}
                      value={ending.victoryStory}
                      onChange={(e) =>
                        setEnding({ ...ending, enabled: true, victoryStory: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-[#0D1E30] border border-slate-700 text-sm text-white resize-none focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#081523] border border-rose-500/30 space-y-3">
                  <p className="text-xs font-bold text-rose-300">패배 엔딩 (체력 0일 때)</p>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">패배 제목</label>
                    <input
                      type="text"
                      maxLength={36}
                      value={ending.defeatTitle}
                      onChange={(e) =>
                        setEnding({ ...ending, enabled: true, defeatTitle: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-[#0D1E30] border border-slate-700 text-sm text-white focus:outline-none focus:border-rose-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">패배 이야기</label>
                    <textarea
                      rows={4}
                      maxLength={220}
                      value={ending.defeatStory}
                      onChange={(e) =>
                        setEnding({ ...ending, enabled: true, defeatStory: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-[#0D1E30] border border-slate-700 text-sm text-white resize-none focus:outline-none focus:border-rose-400"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : tab === 'skill' ? (
            <div className="space-y-6">
              {/* Self-Made Passive Ability Designer */}
              <div className="rounded-xl bg-[#071A1C] border border-emerald-500/45 p-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-display text-base font-bold text-emerald-200">
                      직접 만드는 나만의 상시 능력 (패시브 초능력)
                    </h3>
                    <p className="text-xs text-slate-400">
                      원하는 이름·공격력·이동속도·평타 검기·특수 권능을 직접 조합하세요!
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAbility({ ...ability, enabled: !ability.enabled })}
                    className={`px-3.5 py-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer whitespace-nowrap ${
                      ability.enabled
                        ? 'border-emerald-400 bg-emerald-500/25 text-emerald-200'
                        : 'border-slate-700 bg-[#122437] text-slate-300'
                    }`}
                  >
                    {ability.enabled ? '나만의 능력 발동 (ON)' : '미사용 (OFF)'}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      나만의 능력 이름
                    </label>
                    <input
                      type="text"
                      maxLength={20}
                      value={ability.name}
                      onChange={(e) =>
                        setAbility({ ...ability, enabled: true, name: e.target.value })
                      }
                      placeholder="예: 나의 절대 각성"
                      className="w-full px-3 py-2 rounded-lg bg-[#081421] border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#081421] border border-slate-800 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300">추가 공격력</span>
                      <span className="font-mono-num text-rose-300 font-bold">
                        +{ability.bonusDamage}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={20}
                      step={2}
                      value={ability.bonusDamage}
                      onChange={(e) =>
                        setAbility({
                          ...ability,
                          enabled: true,
                          bonusDamage: Number.parseInt(e.target.value, 10),
                        })
                      }
                      className="w-full accent-rose-400 cursor-pointer"
                    />
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#081421] border border-slate-800 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300">이동 속도 보너스</span>
                      <span className="font-mono-num text-sky-300 font-bold">
                        +{ability.speedBonusPct}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={40}
                      step={5}
                      value={ability.speedBonusPct}
                      onChange={(e) =>
                        setAbility({
                          ...ability,
                          enabled: true,
                          speedBonusPct: Number.parseInt(e.target.value, 10),
                        })
                      }
                      className="w-full accent-sky-400 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-300">평타 발사 검기:</span>
                    {[0, 1, 2, 3].map((cnt) => (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() =>
                          setAbility({ ...ability, enabled: true, basicWaveCount: cnt })
                        }
                        className={`px-3 py-1.5 rounded-lg border text-xs font-bold cursor-pointer ${
                          ability.basicWaveCount === cnt
                            ? 'border-emerald-400 bg-emerald-500/25 text-emerald-200'
                            : 'border-slate-700 bg-[#081421] text-slate-300'
                        }`}
                      >
                        {cnt === 0 ? '없음' : `${cnt}갈래`}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    특수 초능력 조합 (원하는 만큼 다중 선택 가능)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {ABILITY_TRAIT_OPTIONS.map((opt) => {
                      const active = ability.traits.includes(opt.id);
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => toggleAbilityTrait(opt.id)}
                          className={`p-2.5 rounded-lg border text-left transition-colors cursor-pointer ${
                            active
                              ? 'border-emerald-400 bg-emerald-500/20 text-emerald-100'
                              : 'border-slate-700/70 bg-[#081421] text-slate-300 hover:text-white'
                          }`}
                        >
                          <div className="text-xs font-bold flex items-center justify-between">
                            <span>{opt.label}</span>
                            <span className="text-[10px]">
                              {active ? '선택됨' : '추가'}
                            </span>
                          </div>
                          <p className="text-[11px] opacity-80 mt-0.5">{opt.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left Preview + Presets */}
              <div className="lg:col-span-5 space-y-4">
                <SkillPreviewCard skill={skill} />

                <div className="p-3.5 rounded-xl bg-[#081523] border border-slate-800 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-white">전투 스킬 바 장착</p>
                    <p className="text-[11px] text-slate-400">
                      켜면 어떤 검을 들어도 T (또는 7) 키로 발동됩니다.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSkill({ ...skill, enabled: !skill.enabled })}
                    className={`px-3.5 py-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer whitespace-nowrap ${
                      skill.enabled
                        ? 'border-emerald-400/80 bg-emerald-500/20 text-emerald-300'
                        : 'border-slate-700 bg-[#122437] text-slate-300'
                    }`}
                  >
                    {skill.enabled ? '장착 중 (ON)' : '미사용 (OFF)'}
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-300">
                    추천 스킬 설계 불러오기
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {SKILL_PRESETS.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setSkill({ ...preset.config, enabled: true })}
                        className="px-3 py-2 rounded-lg border border-slate-700/70 bg-[#091726] hover:border-amber-400/70 text-xs font-semibold text-slate-200 text-left transition-colors cursor-pointer"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Skill Customization Controls */}
              <div className="lg:col-span-7 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      스킬 이름
                    </label>
                    <input
                      type="text"
                      maxLength={16}
                      value={skill.name}
                      onChange={(e) =>
                        setSkill({ ...skill, enabled: true, name: e.target.value })
                      }
                      placeholder="예: 나만의 용오름 참격"
                      className="w-full px-3 py-2 rounded-lg bg-[#081421] border border-slate-700 text-sm text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      스킬 한 줄 설명
                    </label>
                    <input
                      type="text"
                      maxLength={28}
                      value={skill.desc}
                      onChange={(e) =>
                        setSkill({ ...skill, enabled: true, desc: e.target.value })
                      }
                      placeholder="예: 360° 폭풍과 유성"
                      className="w-full px-3 py-2 rounded-lg bg-[#081421] border border-slate-700 text-sm text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                {/* 3D Shape */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    3D 스킬 발동 형태
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {SKILL_SHAPE_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setSkill({ ...skill, enabled: true, shape: opt.id })}
                        className={`py-2 px-2 rounded-lg border text-xs font-semibold transition-colors cursor-pointer text-center ${
                          skill.shape === opt.id
                            ? 'border-sky-400 bg-sky-500/20 text-sky-200'
                            : 'border-slate-700/70 bg-[#091726] text-slate-300 hover:text-white'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Effect Color */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-[#081421] border border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-semibold text-slate-300">스킬 빛 색상</span>
                    <input
                      type="color"
                      value={skill.effectColor}
                      onChange={(e) =>
                        setSkill({ ...skill, enabled: true, effectColor: e.target.value })
                      }
                      className="w-7 h-7 rounded cursor-pointer bg-transparent border-0"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {SKILL_COLOR_SWATCHES.map((c) => (
                      <button
                        key={c}
                        type="button"
                        aria-label={`스킬 색상 ${c}`}
                        onClick={() => setSkill({ ...skill, enabled: true, effectColor: c })}
                        className={`w-6 h-6 rounded-md border cursor-pointer ${
                          skill.effectColor.toLowerCase() === c
                            ? 'border-white scale-110'
                            : 'border-slate-600'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                {/* Sliders */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-2.5 rounded-lg bg-[#081421] border border-slate-800 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300">공격 위력</span>
                      <span className="font-mono-num text-rose-300 font-bold">
                        Lv.{skill.powerLevel}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      step={1}
                      value={skill.powerLevel}
                      onChange={(e) =>
                        setSkill({
                          ...skill,
                          enabled: true,
                          powerLevel: Number.parseInt(e.target.value, 10),
                        })
                      }
                      className="w-full accent-rose-400 cursor-pointer"
                    />
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#081421] border border-slate-800 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300">스킬 범위 · 크기</span>
                      <span className="font-mono-num text-sky-300 font-bold">
                        Lv.{skill.rangeLevel}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      step={1}
                      value={skill.rangeLevel}
                      onChange={(e) =>
                        setSkill({
                          ...skill,
                          enabled: true,
                          rangeLevel: Number.parseInt(e.target.value, 10),
                        })
                      }
                      className="w-full accent-sky-400 cursor-pointer"
                    />
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#081421] border border-slate-800 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300">검기 / 유성 개수</span>
                      <span className="font-mono-num text-amber-300 font-bold">
                        {skill.projectileCount}개
                      </span>
                    </div>
                    <input
                      type="range"
                      min={3}
                      max={12}
                      step={1}
                      value={skill.projectileCount}
                      onChange={(e) =>
                        setSkill({
                          ...skill,
                          enabled: true,
                          projectileCount: Number.parseInt(e.target.value, 10),
                        })
                      }
                      className="w-full accent-amber-400 cursor-pointer"
                    />
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#081421] border border-slate-800 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300">재사용 대기시간</span>
                      <span className="font-mono-num text-emerald-300 font-bold">
                        {skill.cooldown.toFixed(1)}초
                      </span>
                    </div>
                    <input
                      type="range"
                      min={3.0}
                      max={12.0}
                      step={0.5}
                      value={skill.cooldown}
                      onChange={(e) =>
                        setSkill({
                          ...skill,
                          enabled: true,
                          cooldown: Number.parseFloat(e.target.value),
                        })
                      }
                      className="w-full accent-emerald-400 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Special Bonus Effect */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    특수 부가 효과
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {SKILL_BONUS_OPTIONS.map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() =>
                          setSkill({ ...skill, enabled: true, bonusEffect: b.id })
                        }
                        className={`py-2 px-2.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                          skill.bonusEffect === b.id
                            ? 'border-amber-400 bg-amber-500/20 text-amber-200'
                            : 'border-slate-700/70 bg-[#091726] text-slate-300 hover:text-white'
                        }`}
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left Domain Preview + Presets */}
              <div className="lg:col-span-5 space-y-4">
                <DomainPreviewCard domain={domain} />

                <div className="p-3.5 rounded-xl bg-[#081523] border border-slate-800 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-white">영역 전개 스킬 장착</p>
                    <p className="text-[11px] text-slate-400">
                      전투 중 G (또는 8) 키 / 영역 버튼으로 전장에 전개됩니다.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDomain({ ...domain, enabled: !domain.enabled })}
                    className={`px-3.5 py-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer whitespace-nowrap ${
                      domain.enabled
                        ? 'border-fuchsia-400/80 bg-fuchsia-500/20 text-fuchsia-200'
                        : 'border-slate-700 bg-[#122437] text-slate-300'
                    }`}
                  >
                    {domain.enabled ? '장착 중 (ON)' : '미사용 (OFF)'}
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-300">
                    인기 영역 전개 프리셋 불러오기
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {DOMAIN_PRESETS.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setDomain({ ...preset.config, enabled: true })}
                        className="px-3 py-2 rounded-lg border border-slate-700/70 bg-[#091726] hover:border-fuchsia-400/70 text-xs font-semibold text-slate-200 text-left transition-colors cursor-pointer"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Domain Controls */}
              <div className="lg:col-span-7 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      누구의 영역 전개 (시전자 이름)
                    </label>
                    <input
                      type="text"
                      maxLength={14}
                      value={domain.casterName}
                      onChange={(e) =>
                        setDomain({ ...domain, enabled: true, casterName: e.target.value })
                      }
                      placeholder="예: 고죠, 스쿠나, 오이, 선장"
                      className="w-full px-3 py-2 rounded-lg bg-[#081421] border border-slate-700 text-sm text-white focus:outline-none focus:border-fuchsia-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      영역 전개 이름
                    </label>
                    <input
                      type="text"
                      maxLength={18}
                      value={domain.domainName}
                      onChange={(e) =>
                        setDomain({ ...domain, enabled: true, domainName: e.target.value })
                      }
                      placeholder="예: 무량공처, 복마어주자"
                      className="w-full px-3 py-2 rounded-lg bg-[#081421] border border-slate-700 text-sm text-white focus:outline-none focus:border-fuchsia-400"
                    />
                  </div>
                </div>

                <div className="rounded-lg bg-[#0A1628] border border-fuchsia-500/40 px-3.5 py-2 text-xs text-fuchsia-200">
                  게임 내 발동 대사:{' '}
                  <strong className="text-white">
                    “{domain.casterName.trim() || '선장'}의 영역 전개 · 「
                    {domain.domainName.trim() || '절대 영역'}」”
                  </strong>
                </div>

                {/* Domain Law / Effect */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    영역 내부 필중 법칙
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {DOMAIN_EFFECT_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() =>
                          setDomain({ ...domain, enabled: true, domainEffect: opt.id })
                        }
                        className={`p-2.5 rounded-lg border text-left transition-colors cursor-pointer ${
                          domain.domainEffect === opt.id
                            ? 'border-fuchsia-400 bg-fuchsia-500/20 text-fuchsia-100'
                            : 'border-slate-700/70 bg-[#091726] text-slate-300 hover:text-white'
                        }`}
                      >
                        <div className="text-xs font-bold">{opt.label}</div>
                        <p className="text-[11px] opacity-80 mt-0.5">{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-[#081421] border border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-semibold text-slate-300">영역 결계 색상</span>
                    <input
                      type="color"
                      value={domain.domainColor}
                      onChange={(e) =>
                        setDomain({ ...domain, enabled: true, domainColor: e.target.value })
                      }
                      className="w-7 h-7 rounded cursor-pointer bg-transparent border-0"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {SKILL_COLOR_SWATCHES.map((c) => (
                      <button
                        key={c}
                        type="button"
                        aria-label={`영역 색상 ${c}`}
                        onClick={() => setDomain({ ...domain, enabled: true, domainColor: c })}
                        className={`w-6 h-6 rounded-md border cursor-pointer ${
                          domain.domainColor.toLowerCase() === c
                            ? 'border-white scale-110'
                            : 'border-slate-600'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                {/* Duration / Cooldown / Radius */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-2.5 rounded-lg bg-[#081421] border border-slate-800 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300">영역 지속시간</span>
                      <span className="font-mono-num text-sky-300 font-bold">
                        {domain.duration.toFixed(1)}초
                      </span>
                    </div>
                    <input
                      type="range"
                      min={5}
                      max={10}
                      step={0.5}
                      value={domain.duration}
                      onChange={(e) =>
                        setDomain({
                          ...domain,
                          enabled: true,
                          duration: Number.parseFloat(e.target.value),
                        })
                      }
                      className="w-full accent-sky-400 cursor-pointer"
                    />
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#081421] border border-slate-800 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300">재사용 대기시간</span>
                      <span className="font-mono-num text-emerald-300 font-bold">
                        {domain.cooldown.toFixed(0)}초
                      </span>
                    </div>
                    <input
                      type="range"
                      min={9}
                      max={20}
                      step={1}
                      value={domain.cooldown}
                      onChange={(e) =>
                        setDomain({
                          ...domain,
                          enabled: true,
                          cooldown: Number.parseFloat(e.target.value),
                        })
                      }
                      className="w-full accent-emerald-400 cursor-pointer"
                    />
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#081421] border border-slate-800 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300">영역 크기</span>
                      <span className="font-mono-num text-fuchsia-300 font-bold">
                        Lv.{domain.radiusLevel}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={3}
                      step={1}
                      value={domain.radiusLevel}
                      onChange={(e) =>
                        setDomain({
                          ...domain,
                          enabled: true,
                          radiusLevel: Number.parseInt(e.target.value, 10),
                        })
                      }
                      className="w-full accent-fuchsia-400 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-slate-800 bg-[#0A1827] flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={resetDefaults}
            className="px-3 py-2 rounded-lg border border-slate-700/80 bg-[#112438] hover:bg-slate-800 text-xs font-semibold text-slate-300 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            기본값 초기화
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => onSave(monster, ending, skill, ability, domain)}
              className="px-4 py-2.5 rounded-lg border border-slate-600 bg-[#152C44] hover:bg-[#1B3754] text-sm font-semibold text-slate-100 cursor-pointer whitespace-nowrap"
            >
              저장만 하기
            </button>
            <button
              type="button"
              onClick={() => onSaveAndPlay(monster, ending, skill, ability, domain)}
              className="px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-bold flex items-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <Swords className="w-4 h-4" />
              저장하고 출항하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
