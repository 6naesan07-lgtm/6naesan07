import {
  Clock,
  Crosshair,
  Crown,
  Flame,
  Orbit,
  Skull,
  Snowflake,
  Sparkles,
  Sun,
  Swords,
  Tornado,
  Wand2,
  Waves,
  Zap,
} from 'lucide-react';
import { CustomDomainConfig, CustomSkillConfig, SkillId, SwordSkillSlot } from '../game/types';

interface SkillBarProps {
  skills: SwordSkillSlot[];
  cooldowns: Record<SkillId, number>;
  maxCooldowns: Record<SkillId, number>;
  empowered: boolean;
  customSkill?: CustomSkillConfig;
  customDomain?: CustomDomainConfig;
  onUseSkillSlot: (slotIndex: number) => void;
  onUseCustomSkill?: () => void;
  onUseDomainExpansion?: () => void;
}

const HOTKEYS = ['Q', 'E', 'R', 'Z', 'X', 'C'];

const SKILL_VISUALS: Record<
  SkillId,
  { accent: string; icon: typeof Tornado }
> = {
  whirlwind: {
    accent: 'border-sky-400/75 text-sky-200 bg-[#0D2238]/95 hover:bg-[#13304D]',
    icon: Tornado,
  },
  wave: {
    accent: 'border-cyan-400/75 text-cyan-200 bg-[#0D2238]/95 hover:bg-[#13304D]',
    icon: Waves,
  },
  cleaver: {
    accent: 'border-amber-400/80 text-amber-200 bg-[#1B1D2C]/95 hover:bg-[#292B3E]',
    icon: Flame,
  },
  phantom_rush: {
    accent: 'border-fuchsia-400/75 text-fuchsia-200 bg-[#1E1530]/95 hover:bg-[#2B1F45]',
    icon: Zap,
  },
  blade_orbit: {
    accent: 'border-emerald-400/75 text-emerald-200 bg-[#0D2824]/95 hover:bg-[#143B35]',
    icon: Orbit,
  },
  meteor_barrage: {
    accent: 'border-orange-400/80 text-orange-200 bg-[#261816]/95 hover:bg-[#38231E]',
    icon: Sparkles,
  },
  frost_nova: {
    accent: 'border-sky-300/80 text-sky-100 bg-[#0D253A]/95 hover:bg-[#153957]',
    icon: Snowflake,
  },
  cross_slash: {
    accent: 'border-rose-400/75 text-rose-200 bg-[#27131D]/95 hover:bg-[#3A1C2B]',
    icon: Swords,
  },
  tsunami_call: {
    accent: 'border-teal-400/80 text-teal-200 bg-[#0A262D]/95 hover:bg-[#113A44]',
    icon: Waves,
  },
  creator_judgement: {
    accent: 'border-emerald-400/90 text-emerald-200 bg-[#0B2B1C]/95 hover:bg-[#12402A]',
    icon: Crown,
  },
  vortex_pull: {
    accent: 'border-violet-400/80 text-violet-200 bg-[#1A1332]/95 hover:bg-[#281E4D]',
    icon: Crosshair,
  },
  thunder_chain: {
    accent: 'border-indigo-400/80 text-indigo-200 bg-[#141736]/95 hover:bg-[#1F2452]',
    icon: Zap,
  },
  phoenix_dive: {
    accent: 'border-orange-400/85 text-orange-200 bg-[#2B1410]/95 hover:bg-[#401E18]',
    icon: Flame,
  },
  venom_burst: {
    accent: 'border-emerald-400/80 text-emerald-200 bg-[#0B261C]/95 hover:bg-[#123B2B]',
    icon: Skull,
  },
  time_freeze: {
    accent: 'border-teal-300/85 text-teal-100 bg-[#0A2528]/95 hover:bg-[#113B40]',
    icon: Clock,
  },
  dragon_breath: {
    accent: 'border-amber-400/85 text-amber-200 bg-[#291B0E]/95 hover:bg-[#3D2815]',
    icon: Flame,
  },
  galaxy_collapse: {
    accent: 'border-fuchsia-400/85 text-fuchsia-100 bg-[#231233]/95 hover:bg-[#351B4D]',
    icon: Sparkles,
  },
  divine_ascension: {
    accent: 'border-yellow-300/95 text-yellow-100 bg-[#2B2209]/95 hover:bg-[#40330E]',
    icon: Sun,
  },
  custom_skill: {
    accent: 'border-amber-300/90 text-amber-100 bg-[#181B32]/95 hover:bg-[#24284A]',
    icon: Wand2,
  },
  domain_expansion: {
    accent: 'border-sky-300/95 text-sky-100 bg-[#0D1A33]/95 hover:bg-[#172C54]',
    icon: Sparkles,
  },
};

export function SkillBar({
  skills,
  cooldowns,
  maxCooldowns,
  empowered,
  customSkill,
  customDomain,
  onUseSkillSlot,
  onUseCustomSkill,
  onUseDomainExpansion,
}: SkillBarProps) {
  const showCustom = Boolean(customSkill?.enabled && onUseCustomSkill);
  const customCd = cooldowns.custom_skill ?? 0;
  const customMaxCd = maxCooldowns.custom_skill || customSkill?.cooldown || 6;
  const customReady = customCd <= 0.01;
  const customPct = customReady
    ? 0
    : Math.min(100, Math.max(0, (customCd / customMaxCd) * 100));

  const showDomain = Boolean(customDomain?.enabled && onUseDomainExpansion);
  const domainCd = cooldowns.domain_expansion ?? 0;
  const domainMaxCd = maxCooldowns.domain_expansion || customDomain?.cooldown || 14;
  const domainReady = domainCd <= 0.01;
  const domainPct = domainReady
    ? 0
    : Math.min(100, Math.max(0, (domainCd / domainMaxCd) * 100));

  return (
    <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
      {skills.map((sk, idx) => {
        const cd = cooldowns[sk.id] ?? 0;
        const maxCd = maxCooldowns[sk.id] || sk.cooldown || 1;
        const ready = cd <= 0.01;
        const pct = ready ? 0 : Math.min(100, Math.max(0, (cd / maxCd) * 100));
        const visual = SKILL_VISUALS[sk.id] ?? SKILL_VISUALS.whirlwind;
        const Icon = visual.icon;
        const hotkey = HOTKEYS[idx] ?? String(idx + 1);

        return (
          <button
            key={`${sk.id}-${idx}`}
            type="button"
            onClick={() => onUseSkillSlot(idx)}
            disabled={!ready}
            title={`${sk.name} (${hotkey}) · ${sk.desc}`}
            className={`relative overflow-hidden min-w-[104px] sm:min-w-[122px] px-2.5 py-1.5 sm:py-2 rounded-lg border text-left transition-colors cursor-pointer disabled:cursor-not-allowed ${
              ready
                ? visual.accent
                : 'border-slate-700/70 bg-[#0A1624]/95 text-slate-500'
            }`}
          >
            {/* Cooldown wipe */}
            {!ready && (
              <div
                className="pointer-events-none absolute inset-y-0 left-0 bg-slate-900/75 transition-all duration-75"
                style={{ width: `${pct}%` }}
              />
            )}

            <div className="relative flex items-center justify-between gap-1.5">
              <div className="flex items-center gap-1.5 min-w-0">
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="text-xs font-bold whitespace-nowrap">{sk.name}</span>
              </div>
              <span className="font-mono-num text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-950/65 text-slate-200 whitespace-nowrap">
                {ready ? hotkey : `${cd.toFixed(1)}s`}
              </span>
            </div>
            <div className="relative flex items-center justify-between gap-1 mt-0.5 text-[10px] opacity-80 whitespace-nowrap">
              <span>{sk.desc}</span>
              {ready && empowered && (
                <span className="text-amber-300 font-bold">강화</span>
              )}
            </div>
          </button>
        );
      })}

      {showCustom && customSkill && (
        <button
          type="button"
          onClick={onUseCustomSkill}
          disabled={!customReady}
          title={`${customSkill.name || '나만의 스킬'} (T) · ${customSkill.desc || '커스텀 스킬'}`}
          style={customReady ? { borderColor: customSkill.effectColor } : undefined}
          className={`relative overflow-hidden min-w-[116px] sm:min-w-[132px] px-2.5 py-1.5 sm:py-2 rounded-lg border-2 text-left transition-colors cursor-pointer disabled:cursor-not-allowed ${
            customReady
              ? 'text-white bg-[#141E36]/95 hover:bg-[#1C2A4A]'
              : 'border-slate-700/70 bg-[#0A1624]/95 text-slate-500'
          }`}
        >
          {!customReady && (
            <div
              className="pointer-events-none absolute inset-y-0 left-0 bg-slate-900/75 transition-all duration-75"
              style={{ width: `${customPct}%` }}
            />
          )}

          <div className="relative flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <Wand2
                className="w-3.5 h-3.5 shrink-0"
                style={customReady ? { color: customSkill.effectColor } : undefined}
              />
              <span className="text-xs font-bold whitespace-nowrap">
                {customSkill.name.trim() || '나만의 스킬'}
              </span>
            </div>
            <span className="font-mono-num text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-950/75 text-amber-300 whitespace-nowrap">
              {customReady ? 'T' : `${customCd.toFixed(1)}s`}
            </span>
          </div>
          <div className="relative flex items-center justify-between gap-1 mt-0.5 text-[10px] opacity-85 whitespace-nowrap">
            <span>{customSkill.desc.trim() || '내 커스텀 필살기'}</span>
            {customReady && empowered && (
              <span className="text-amber-300 font-bold">강화</span>
            )}
          </div>
        </button>
      )}

      {showDomain && customDomain && (
        <button
          type="button"
          onClick={onUseDomainExpansion}
          disabled={!domainReady}
          title={`${customDomain.casterName || '선장'}의 영역 전개 · ${customDomain.domainName || '무량 심해'} (G)`}
          style={domainReady ? { borderColor: customDomain.domainColor } : undefined}
          className={`relative overflow-hidden min-w-[126px] sm:min-w-[144px] px-2.5 py-1.5 sm:py-2 rounded-lg border-2 text-left transition-colors cursor-pointer disabled:cursor-not-allowed ${
            domainReady
              ? 'text-white bg-[#111936]/95 hover:bg-[#192550]'
              : 'border-slate-700/70 bg-[#0A1624]/95 text-slate-500'
          }`}
        >
          {!domainReady && (
            <div
              className="pointer-events-none absolute inset-y-0 left-0 bg-slate-900/75 transition-all duration-75"
              style={{ width: `${domainPct}%` }}
            />
          )}

          <div className="relative flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <Sparkles
                className="w-3.5 h-3.5 shrink-0"
                style={domainReady ? { color: customDomain.domainColor } : undefined}
              />
              <span className="text-xs font-bold whitespace-nowrap">
                {customDomain.domainName.trim() || '영역 전개'}
              </span>
            </div>
            <span className="font-mono-num text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-950/75 text-sky-300 whitespace-nowrap">
              {domainReady ? 'G' : `${domainCd.toFixed(1)}s`}
            </span>
          </div>
          <div className="relative flex items-center justify-between gap-1 mt-0.5 text-[10px] opacity-85 whitespace-nowrap">
            <span>{customDomain.casterName.trim() || '선장'}의 영역 전개</span>
          </div>
        </button>
      )}
    </div>
  );
}
