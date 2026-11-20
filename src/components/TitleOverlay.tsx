import { useState } from 'react';
import { Anchor, Coins, Gem, ShieldAlert, ShoppingBag, Sparkles, Swords, Wand2 } from 'lucide-react';
import {
  CustomAbilityConfig,
  CustomDomainConfig,
  CustomEndingConfig,
  CustomMonsterConfig,
  CustomSkillConfig,
  DIFFICULTY_CONFIGS,
  Difficulty,
} from '../game/types';

interface TitleOverlayProps {
  difficulty: Difficulty;
  bestScore: number;
  victoryCount: number;
  scales: number;
  coins: number;
  equippedSwordName: string;
  customMonster: CustomMonsterConfig;
  customEnding: CustomEndingConfig;
  customSkill: CustomSkillConfig;
  customAbility: CustomAbilityConfig;
  customDomain: CustomDomainConfig;
  onSelectDifficulty: (d: Difficulty) => void;
  onOpenCreator: () => void;
  onOpenSkillCreator: () => void;
  onOpenDomainCreator: () => void;
  onOpenShop: () => void;
  onStartGame: () => void;
}

const BANNER_SRC = '/src/assets/images/kraken_abyss_banner_1794808851042.jpg';

export function TitleOverlay({
  difficulty,
  bestScore,
  victoryCount,
  scales,
  coins,
  equippedSwordName,
  customMonster,
  customEnding,
  customSkill,
  customAbility,
  customDomain,
  onSelectDifficulty,
  onOpenCreator,
  onOpenSkillCreator,
  onOpenDomainCreator,
  onOpenShop,
  onStartGame,
}: TitleOverlayProps) {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6 flex-1 flex items-center justify-center">
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 bg-[#0D1E30] border border-slate-700/60 rounded-xl overflow-hidden shadow-2xl">
        {/* Left Visual Key Art Panel */}
        <div className="lg:col-span-6 relative min-h-[260px] lg:min-h-[480px] bg-gradient-to-br from-[#071524] via-[#0F2740] to-[#081726]">
          {!imgError ? (
            <img
              src={BANNER_SRC}
              alt="거대한 크라켄의 촉수를 피하며 검을 휘두르는 선장"
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              className="w-full h-full object-cover object-center"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center">
              <Anchor className="w-14 h-14 text-amber-400/80 mb-3" />
              <p className="font-display text-xl font-bold text-slate-200">
                심해의 크라켄 결전
              </p>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#07131F]/90 via-[#07131F]/35 to-transparent" />
          <div className="absolute bottom-5 left-6 right-6">
            <p className="text-xs font-medium text-amber-300/90 mb-1">
              3D 삼점도 시점 &amp; 선상 검술 액션
            </p>
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-white text-balance">
              크라켄 다리 베기
            </h1>
          </div>
        </div>

        {/* Right Controls, Rules & Launch Panel */}
        <div className="lg:col-span-6 p-6 sm:p-8 flex flex-col justify-between gap-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4 pb-3 border-b border-slate-800">
              <span className="text-sm text-slate-300 font-medium truncate">
                목표: {customMonster.name} ({customMonster.finalWave}단계)
                {customEnding.enabled ? ' · 커스텀 엔딩' : ''}
                {customSkill.enabled ? ` · [${customSkill.name}]` : ''}
                {customAbility.enabled ? ` · [${customAbility.name}]` : ''}
                {customDomain.enabled ? ` · [${customDomain.casterName}의 영역 전개]` : ''}
              </span>
              <span className="font-mono-num text-sm text-amber-400 font-semibold whitespace-nowrap">
                최고 {bestScore.toLocaleString('ko-KR')}
                {victoryCount > 0 ? ` · 토벌 ${victoryCount}회` : ''}
              </span>
            </div>

            {/* Armory & Currency Strip */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 rounded-lg bg-[#081523] border border-slate-800 text-xs">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <Gem className="w-3.5 h-3.5 text-sky-400" />
                  비늘 <strong className="font-mono-num text-sky-300">{scales}개</strong>
                </span>
                <span className="flex items-center gap-1.5 text-slate-300">
                  <Coins className="w-3.5 h-3.5 text-amber-400" />
                  코인{' '}
                  <strong className="font-mono-num text-amber-300">
                    {coins.toLocaleString('ko-KR')}
                  </strong>
                </span>
              </div>
              <span className="text-slate-300 font-medium truncate">
                무기: <strong className="text-white">{equippedSwordName}</strong>
              </span>
            </div>

            {/* Concise 3-step Rules */}
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#152D45] border border-slate-700/70 flex items-center justify-center shrink-0 text-sky-400">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-slate-100">
                    예고 선을 보고 대시로 회피하세요
                  </p>
                  <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">
                    WASD/방향키 이동 · Space/Shift 또는 우클릭 대시(무적 판정). 공격 직전 피하면 강화 베기가 충전됩니다.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#152D45] border border-slate-700/70 flex items-center justify-center shrink-0 text-amber-400">
                  <Swords className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-slate-100">
                    촉수를 베어 비늘을 모으고 상점에서 검을 사세요
                  </p>
                  <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">
                    클릭/J 기본 베기 · Q/E/R 3D 검술 스킬 · 모은 비늘을 상점에서 코인으로 팔아 새 검을 구매할 수 있습니다.
                  </p>
                </div>
              </div>
            </div>

            {/* Difficulty Segmented Tabs */}
            <div className="space-y-2 pt-1">
              <label className="block text-xs font-medium text-slate-400">
                난이도 선택
              </label>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#081523] rounded-lg border border-slate-800">
                {(['normal', 'hard', 'abyss'] as Difficulty[]).map((d) => {
                  const cfg = DIFFICULTY_CONFIGS[d];
                  const active = difficulty === d;
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => onSelectDifficulty(d)}
                      className={`py-2 px-3 rounded-md text-xs font-semibold whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-amber-400 cursor-pointer ${
                        active
                          ? 'bg-amber-500 text-slate-950'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-slate-400">
                {DIFFICULTY_CONFIGS[difficulty].description}
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onOpenShop}
                className="min-h-[44px] py-2.5 px-3 rounded-lg bg-[#142B43] hover:bg-[#1B3957] border border-amber-400/50 text-amber-200 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-amber-300 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4 text-amber-300 shrink-0" />
                상점 · 검 구매
              </button>
              <button
                type="button"
                onClick={onOpenCreator}
                className="min-h-[44px] py-2.5 px-3 rounded-lg bg-[#142B43] hover:bg-[#1B3957] border border-sky-400/50 text-sky-200 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-sky-300 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-sky-300 shrink-0" />
                괴물 · 엔딩 만들기
              </button>
              <button
                type="button"
                onClick={onOpenSkillCreator}
                className="min-h-[44px] py-2.5 px-3 rounded-lg bg-[#142B43] hover:bg-[#1B3957] border border-emerald-400/55 text-emerald-200 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-emerald-300 cursor-pointer"
              >
                <Wand2 className="w-4 h-4 text-emerald-300 shrink-0" />
                나만의 능력 · 스킬 만들기
              </button>
              <button
                type="button"
                onClick={onOpenDomainCreator}
                className="min-h-[44px] py-2.5 px-3 rounded-lg bg-[#142B43] hover:bg-[#1B3957] border border-fuchsia-400/55 text-fuchsia-200 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-fuchsia-300 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-fuchsia-300 shrink-0" />
                누구의 영역 전개 만들기
              </button>
            </div>
            <button
              type="button"
              onClick={onStartGame}
              className="w-full min-h-[48px] py-3.5 px-6 rounded-lg bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-slate-950 font-bold text-base tracking-tight transition-all whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300 cursor-pointer"
            >
              게임 시작
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
