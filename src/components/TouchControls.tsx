import { useRef, useState } from 'react';
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
  Wind,
  Zap,
} from 'lucide-react';
import { CustomDomainConfig, CustomSkillConfig, SkillId, SwordSkillSlot } from '../game/types';

interface TouchControlsProps {
  floating?: boolean;
  skills?: SwordSkillSlot[];
  skillCooldowns?: Record<SkillId, number>;
  customSkill?: CustomSkillConfig;
  customDomain?: CustomDomainConfig;
  onMoveVector: (dx: number, dy: number) => void;
  onDash: () => void;
  onSlash: () => void;
  onUseSkillSlot?: (slotIndex: number) => void;
  onUseCustomSkill?: () => void;
  onUseDomainExpansion?: () => void;
}

const SKILL_TOUCH_VISUALS: Record<
  SkillId,
  { icon: typeof Tornado; readyStyle: string }
> = {
  whirlwind: {
    icon: Tornado,
    readyStyle: 'border-sky-400/75 bg-[#0D253E]/95 text-sky-200 active:bg-sky-600',
  },
  wave: {
    icon: Waves,
    readyStyle: 'border-cyan-400/75 bg-[#0D253E]/95 text-cyan-200 active:bg-cyan-600',
  },
  cleaver: {
    icon: Flame,
    readyStyle: 'border-amber-400/80 bg-[#231E2D]/95 text-amber-200 active:bg-amber-600',
  },
  phantom_rush: {
    icon: Zap,
    readyStyle: 'border-fuchsia-400/75 bg-[#1F1532]/95 text-fuchsia-200 active:bg-fuchsia-600',
  },
  blade_orbit: {
    icon: Orbit,
    readyStyle: 'border-emerald-400/75 bg-[#0E2B26]/95 text-emerald-200 active:bg-emerald-600',
  },
  meteor_barrage: {
    icon: Sparkles,
    readyStyle: 'border-orange-400/80 bg-[#291815]/95 text-orange-200 active:bg-orange-600',
  },
  frost_nova: {
    icon: Snowflake,
    readyStyle: 'border-sky-300/80 bg-[#0D253A]/95 text-sky-100 active:bg-sky-600',
  },
  cross_slash: {
    icon: Swords,
    readyStyle: 'border-rose-400/75 bg-[#27131D]/95 text-rose-200 active:bg-rose-600',
  },
  tsunami_call: {
    icon: Waves,
    readyStyle: 'border-teal-400/80 bg-[#0A262D]/95 text-teal-200 active:bg-teal-600',
  },
  creator_judgement: {
    icon: Crown,
    readyStyle: 'border-emerald-400/90 bg-[#0B2B1C]/95 text-emerald-200 active:bg-emerald-600',
  },
  vortex_pull: {
    icon: Crosshair,
    readyStyle: 'border-violet-400/80 bg-[#1A1332]/95 text-violet-200 active:bg-violet-600',
  },
  thunder_chain: {
    icon: Zap,
    readyStyle: 'border-indigo-400/80 bg-[#141736]/95 text-indigo-200 active:bg-indigo-600',
  },
  phoenix_dive: {
    icon: Flame,
    readyStyle: 'border-orange-400/85 bg-[#2B1410]/95 text-orange-200 active:bg-orange-600',
  },
  venom_burst: {
    icon: Skull,
    readyStyle: 'border-emerald-400/80 bg-[#0B261C]/95 text-emerald-200 active:bg-emerald-600',
  },
  time_freeze: {
    icon: Clock,
    readyStyle: 'border-teal-300/85 bg-[#0A2528]/95 text-teal-100 active:bg-teal-600',
  },
  dragon_breath: {
    icon: Flame,
    readyStyle: 'border-amber-400/85 bg-[#291B0E]/95 text-amber-200 active:bg-amber-600',
  },
  galaxy_collapse: {
    icon: Sparkles,
    readyStyle: 'border-fuchsia-400/85 bg-[#231233]/95 text-fuchsia-100 active:bg-fuchsia-600',
  },
  divine_ascension: {
    icon: Sun,
    readyStyle: 'border-yellow-300/95 bg-[#2B2209]/95 text-yellow-100 active:bg-yellow-600',
  },
  custom_skill: {
    icon: Wand2,
    readyStyle: 'border-amber-300/90 bg-[#141E36]/95 text-amber-100 active:bg-amber-600',
  },
  domain_expansion: {
    icon: Sparkles,
    readyStyle: 'border-sky-300/95 bg-[#101A36]/95 text-sky-100 active:bg-sky-600',
  },
};

export function TouchControls({
  floating = true,
  skills = [],
  skillCooldowns,
  customSkill,
  customDomain,
  onMoveVector,
  onDash,
  onSlash,
  onUseSkillSlot,
  onUseCustomSkill,
  onUseDomainExpansion,
}: TouchControlsProps) {
  const padRef = useRef<HTMLDivElement | null>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const activePointerId = useRef<number | null>(null);

  const updateStick = (clientX: number, clientY: number) => {
    const el = padRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const maxR = rect.width * 0.36;
    const dx = clientX - cx;
    const dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    const clamped = Math.min(dist, maxR);
    const angle = Math.atan2(dy, dx);
    const kx = dist > 2 ? Math.cos(angle) * clamped : 0;
    const ky = dist > 2 ? Math.sin(angle) * clamped : 0;
    setKnob({ x: kx, y: ky });
    onMoveVector(kx / maxR, ky / maxR);
  };

  const resetStick = () => {
    activePointerId.current = null;
    setKnob({ x: 0, y: 0 });
    onMoveVector(0, 0);
  };

  return (
    <div
      className={
        floating
          ? 'pointer-events-none fixed inset-x-0 bottom-0 z-20 px-4 sm:px-8 pb-4 sm:pb-7 flex items-end justify-between select-none touch-none'
          : 'w-full max-w-[1160px] mx-auto px-4 pt-2 pb-3 flex items-center justify-between select-none touch-none'
      }
    >
      {/* Virtual Joystick */}
      <div
        ref={padRef}
        onPointerDown={(e) => {
          e.stopPropagation();
          activePointerId.current = e.pointerId;
          e.currentTarget.setPointerCapture(e.pointerId);
          updateStick(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => {
          if (activePointerId.current === e.pointerId) {
            updateStick(e.clientX, e.clientY);
          }
        }}
        onPointerUp={resetStick}
        onPointerCancel={resetStick}
        className="pointer-events-auto relative w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-[#091828]/90 border border-slate-600/70 flex items-center justify-center shadow-lg"
        aria-label="이동 조이스틱"
      >
        <div
          className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-slate-200/90 border border-white/60 shadow-md"
          style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }}
        />
      </div>

      {/* Right Cluster: Equipped Sword Skills + Dash + Slash (>= 44px touch targets) */}
      <div className="pointer-events-auto flex flex-col items-end gap-2">
        {onUseSkillSlot &&
          (skills.length > 0 ||
            (customSkill?.enabled && onUseCustomSkill) ||
            (customDomain?.enabled && onUseDomainExpansion)) && (
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
            {skills.map((sk, idx) => {
              const cd = skillCooldowns?.[sk.id] ?? 0;
              const ready = cd <= 0.01;
              const visual = SKILL_TOUCH_VISUALS[sk.id] ?? SKILL_TOUCH_VISUALS.whirlwind;
              const Icon = visual.icon;
              const shortLabel = sk.name.slice(0, 2);
              return (
                <button
                  key={`${sk.id}-${idx}`}
                  type="button"
                  disabled={!ready}
                  title={sk.name}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (ready) onUseSkillSlot(idx);
                  }}
                  className={`min-w-[46px] min-h-[46px] sm:min-w-[52px] sm:min-h-[52px] rounded-full border flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold shadow-lg cursor-pointer disabled:cursor-not-allowed ${
                    ready
                      ? visual.readyStyle
                      : 'border-slate-700/70 bg-[#081320]/90 text-slate-500'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="font-mono-num">
                    {ready ? shortLabel : `${cd.toFixed(0)}s`}
                  </span>
                </button>
              );
            })}
            {customSkill?.enabled && onUseCustomSkill && (() => {
              const cd = skillCooldowns?.custom_skill ?? 0;
              const ready = cd <= 0.01;
              const label = (customSkill.name.trim() || 'MY').slice(0, 2);
              return (
                <button
                  key="custom_skill"
                  type="button"
                  disabled={!ready}
                  title={customSkill.name || '나만의 스킬'}
                  style={ready ? { borderColor: customSkill.effectColor } : undefined}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (ready) onUseCustomSkill();
                  }}
                  className={`min-w-[46px] min-h-[46px] sm:min-w-[52px] sm:min-h-[52px] rounded-full border-2 flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold shadow-lg cursor-pointer disabled:cursor-not-allowed ${
                    ready
                      ? 'bg-[#141E36]/95 text-white active:bg-amber-600'
                      : 'border-slate-700/70 bg-[#081320]/90 text-slate-500'
                  }`}
                >
                  <Wand2
                    className="w-3.5 h-3.5"
                    style={ready ? { color: customSkill.effectColor } : undefined}
                  />
                  <span className="font-mono-num">{ready ? label : `${cd.toFixed(0)}s`}</span>
                </button>
              );
            })()}
            {customDomain?.enabled && onUseDomainExpansion && (() => {
              const cd = skillCooldowns?.domain_expansion ?? 0;
              const ready = cd <= 0.01;
              return (
                <button
                  key="domain_expansion"
                  type="button"
                  disabled={!ready}
                  title={`${customDomain.casterName || '선장'}의 영역 전개`}
                  style={ready ? { borderColor: customDomain.domainColor } : undefined}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (ready) onUseDomainExpansion();
                  }}
                  className={`min-w-[46px] min-h-[46px] sm:min-w-[52px] sm:min-h-[52px] rounded-full border-2 flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold shadow-lg cursor-pointer disabled:cursor-not-allowed ${
                    ready
                      ? 'bg-[#101A36]/95 text-white active:bg-sky-600'
                      : 'border-slate-700/70 bg-[#081320]/90 text-slate-500'
                  }`}
                >
                  <Sparkles
                    className="w-3.5 h-3.5"
                    style={ready ? { color: customDomain.domainColor } : undefined}
                  />
                  <span className="font-mono-num">{ready ? '영역' : `${cd.toFixed(0)}s`}</span>
                </button>
              );
            })()}
          </div>
        )}

        <div className="flex items-center gap-3 sm:gap-4">
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDash();
            }}
            className="min-w-[68px] min-h-[68px] sm:min-w-[76px] sm:min-h-[76px] rounded-full bg-[#0F2740]/95 active:bg-sky-600 border border-sky-400/60 text-sky-200 flex flex-col items-center justify-center gap-0.5 text-xs sm:text-sm font-bold shadow-lg cursor-pointer"
          >
            <Wind className="w-5 h-5 sm:w-6 sm:h-6" />
            <span>대시</span>
          </button>
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSlash();
            }}
            className="min-w-[76px] min-h-[76px] sm:min-w-[84px] sm:min-h-[84px] rounded-full bg-amber-500 active:bg-amber-400 text-slate-950 flex flex-col items-center justify-center gap-0.5 text-xs sm:text-sm font-extrabold shadow-xl cursor-pointer"
          >
            <Swords className="w-5 h-5 sm:w-6 sm:h-6" />
            <span>베기</span>
          </button>
        </div>
      </div>
    </div>
  );
}
