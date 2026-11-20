import { Award, Compass, Crown, RotateCcw, ShoppingBag } from 'lucide-react';
import { DIFFICULTY_CONFIGS, RunSummary } from '../game/types';

interface PauseModalProps {
  onResume: () => void;
  onOpenShop: () => void;
  onRestart: () => void;
  onMainMenu: () => void;
}

export function PauseModal({ onResume, onOpenShop, onRestart, onMainMenu }: PauseModalProps) {
  return (
    <div
      className="fixed inset-0 z-30 bg-[#040D16]/85 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pause-title"
    >
      <div className="w-full max-w-sm bg-[#0D1E30] border border-slate-700/70 rounded-xl p-6 space-y-5 shadow-2xl">
        <div className="space-y-1">
          <h2 id="pause-title" className="font-display text-2xl font-bold text-white">
            일시정지
          </h2>
          <p className="text-xs text-slate-400">
            ESC 키를 누르면 즉시 전투로 복귀합니다.
          </p>
        </div>

        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onResume}
            className="w-full min-h-[44px] py-2.5 px-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm whitespace-nowrap transition-colors cursor-pointer"
          >
            계속하기
          </button>
          <button
            type="button"
            onClick={onOpenShop}
            className="w-full min-h-[44px] py-2.5 px-4 rounded-lg bg-[#152C44] hover:bg-[#1B3754] border border-amber-400/50 text-amber-200 font-semibold text-sm flex items-center justify-center gap-2 whitespace-nowrap transition-colors cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4 text-amber-300" />
            상점 (비늘 팔기 · 검 구매)
          </button>
          <button
            type="button"
            onClick={onRestart}
            className="w-full min-h-[44px] py-2.5 px-4 rounded-lg bg-[#152C44] hover:bg-[#1B3754] border border-slate-700 text-slate-100 font-semibold text-sm whitespace-nowrap transition-colors cursor-pointer"
          >
            다시 시작
          </button>
          <button
            type="button"
            onClick={onMainMenu}
            className="w-full min-h-[44px] py-2.5 px-4 rounded-lg bg-transparent hover:bg-slate-800/70 text-slate-300 font-medium text-sm whitespace-nowrap transition-colors cursor-pointer"
          >
            메인 메뉴
          </button>
        </div>
      </div>
    </div>
  );
}

interface VictoryEndingModalProps {
  summary: RunSummary;
  onContinueEndless: () => void;
  onOpenShop: () => void;
  onPlayAgain: () => void;
  onMainMenu: () => void;
}

const GRADE_STYLE = {
  S: 'border-amber-400/80 bg-amber-500/20 text-amber-300',
  A: 'border-sky-400/80 bg-sky-500/20 text-sky-300',
  B: 'border-emerald-400/75 bg-emerald-500/20 text-emerald-300',
};

const MOOD_BORDER: Record<string, string> = {
  triumph: 'border-amber-400/50',
  legend: 'border-emerald-400/50',
  mystery: 'border-sky-400/55',
  comedy: 'border-rose-400/55',
};

export function VictoryEndingModal({
  summary,
  onContinueEndless,
  onOpenShop,
  onPlayAgain,
  onMainMenu,
}: VictoryEndingModalProps) {
  const mins = Math.floor(summary.elapsedSeconds / 60);
  const secs = Math.floor(summary.elapsedSeconds % 60);
  const timeText = `${mins}:${secs.toString().padStart(2, '0')}`;
  const cardBorder = summary.isCustomEnding
    ? MOOD_BORDER[summary.victoryMood] || 'border-amber-400/50'
    : 'border-amber-400/50';

  return (
    <div
      className="fixed inset-0 z-30 bg-[#040D16]/88 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="victory-title"
    >
      <div
        className={`w-full max-w-lg bg-[#0C1D2F] border ${cardBorder} rounded-xl p-6 sm:p-7 space-y-5 shadow-2xl`}
      >
        {/* Victory Header & Grade */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5" />
              {summary.isCustomEnding ? '나만의 커스텀 엔딩' : '항해 승리 엔딩'} ·{' '}
              {summary.monsterName} 토벌 · {DIFFICULTY_CONFIGS[summary.difficulty].label}
            </p>
            <h2 id="victory-title" className="font-display text-2xl font-extrabold text-white">
              {summary.endingTitle}
            </h2>
          </div>

          <div
            className={`w-14 h-14 rounded-lg border flex flex-col items-center justify-center shrink-0 ${GRADE_STYLE[summary.grade]}`}
          >
            <span className="text-[10px] font-semibold opacity-85">등급</span>
            <span className="font-display text-2xl font-black leading-none">{summary.grade}</span>
          </div>
        </div>

        {/* Epilogue Story */}
        <div className="rounded-lg bg-[#081523] border border-slate-800/90 p-4 space-y-2">
          <p className="text-xs font-semibold text-sky-300 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5" />
            항해 일지 에필로그
          </p>
          <p className="text-sm text-slate-200 leading-relaxed">{summary.endingEpilogue}</p>
        </div>

        {/* Score Highlight */}
        <div className="flex items-baseline justify-between">
          <div>
            <span className="text-xs text-slate-400 block">
              최종 점수 {summary.isNewBest ? '· 최고 기록 경신' : ''}
            </span>
            <span className="font-mono-num text-3xl font-bold text-amber-400">
              {summary.score.toLocaleString('ko-KR')}
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 block">최고 기록</span>
            <span className="font-mono-num text-lg font-semibold text-slate-200">
              {summary.bestScore.toLocaleString('ko-KR')}
            </span>
          </div>
        </div>

        {/* Combat Breakdown */}
        <div className="grid grid-cols-2 gap-y-2.5 gap-x-6 py-3.5 border-y border-slate-800 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">자른 다리</span>
            <span className="font-mono-num font-bold text-white">
              {summary.severedCount}개
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">아슬아슬 회피</span>
            <span className="font-mono-num font-bold text-sky-400">
              {summary.justDodgeCount}회
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">획득 비늘 · 코인</span>
            <span className="font-mono-num font-bold text-sky-300">
              +{summary.scalesEarned}개 ·{' '}
              <span className="text-amber-300">+{summary.coinsEarned.toLocaleString('ko-KR')}</span>
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">남은 체력 · 콤보</span>
            <span className="font-mono-num font-bold text-emerald-300">
              {summary.remainingHp}/{summary.maxHp} · {summary.maxCombo}회
            </span>
          </div>
          <div className="flex items-center justify-between col-span-2">
            <span className="text-slate-400">토벌 시간</span>
            <span className="font-mono-num font-bold text-slate-200">{timeText}</span>
          </div>
        </div>

        {/* Actions: Continue Endless vs Shop vs Restart vs Menu */}
        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onContinueEndless}
            className="w-full min-h-[44px] py-3 px-5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 whitespace-nowrap transition-colors cursor-pointer"
          >
            <Compass className="w-4 h-4" />
            무한 심해 모드 계속 도전 ({summary.finalWave + 1}단계+)
          </button>
          <button
            type="button"
            onClick={onOpenShop}
            className="w-full min-h-[44px] py-2.5 px-4 rounded-lg bg-[#152C44] hover:bg-[#1B3754] border border-amber-400/50 text-amber-200 font-bold text-sm flex items-center justify-center gap-2 whitespace-nowrap transition-colors cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4 text-amber-300" />
            상점 (비늘 팔기 · 검 구매)
          </button>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={onPlayAgain}
              className="min-h-[44px] py-2.5 px-4 rounded-lg bg-[#152C44] hover:bg-[#1B3754] border border-slate-700 text-slate-100 font-semibold text-sm flex items-center justify-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              처음부터 다시
            </button>
            <button
              type="button"
              onClick={onMainMenu}
              className="min-h-[44px] py-2.5 px-4 rounded-lg bg-[#0F2032] hover:bg-slate-800/80 border border-slate-700/70 text-slate-300 font-medium text-sm whitespace-nowrap transition-colors cursor-pointer"
            >
              메인 메뉴
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface GameOverModalProps {
  summary: RunSummary;
  onOpenShop: () => void;
  onPlayAgain: () => void;
  onMainMenu: () => void;
}

export function GameOverModal({
  summary,
  onOpenShop,
  onPlayAgain,
  onMainMenu,
}: GameOverModalProps) {
  const mins = Math.floor(summary.elapsedSeconds / 60);
  const secs = Math.floor(summary.elapsedSeconds % 60);
  const timeText = `${mins}:${secs.toString().padStart(2, '0')}`;

  return (
    <div
      className="fixed inset-0 z-30 bg-[#040D16]/90 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="gameover-title"
    >
      <div className="w-full max-w-md bg-[#0D1E30] border border-slate-700/70 rounded-xl p-6 sm:p-7 space-y-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <p className="text-xs font-medium text-rose-400 mb-1">
              {summary.endlessMode ? '무한 심해 항해 종료' : '항해 종료'} ·{' '}
              {summary.monsterName} · {DIFFICULTY_CONFIGS[summary.difficulty].label}
            </p>
            <h2 id="gameover-title" className="font-display text-2xl font-bold text-white">
              {summary.endingTitle}
            </h2>
          </div>
          {summary.isNewBest && (
            <span className="text-xs font-bold text-amber-400 whitespace-nowrap pt-1">
              최고 기록 경신
            </span>
          )}
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">{summary.endingEpilogue}</p>

        {/* Score Highlight */}
        <div className="flex items-baseline justify-between">
          <div>
            <span className="text-xs text-slate-400 block">최종 점수</span>
            <span className="font-mono-num text-3xl font-bold text-amber-400">
              {summary.score.toLocaleString('ko-KR')}
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 block">최고 기록</span>
            <span className="font-mono-num text-lg font-semibold text-slate-200">
              {summary.bestScore.toLocaleString('ko-KR')}
            </span>
          </div>
        </div>

        {/* Breakdown Grid */}
        <div className="grid grid-cols-2 gap-y-3 gap-x-6 py-4 border-y border-slate-800 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">자른 다리</span>
            <span className="font-mono-num font-bold text-white">
              {summary.severedCount}개
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">아슬아슬 회피</span>
            <span className="font-mono-num font-bold text-sky-400">
              {summary.justDodgeCount}회
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">획득 비늘 · 코인</span>
            <span className="font-mono-num font-bold text-sky-300">
              +{summary.scalesEarned}개 ·{' '}
              <span className="text-amber-300">+{summary.coinsEarned.toLocaleString('ko-KR')}</span>
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">도달 심해 · 시간</span>
            <span className="font-mono-num font-bold text-slate-200">
              {summary.wave}단계 · {timeText}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onOpenShop}
            className="w-full min-h-[44px] py-2.5 px-4 rounded-lg bg-[#152C44] hover:bg-[#1B3754] border border-amber-400/50 text-amber-200 font-bold text-sm flex items-center justify-center gap-2 whitespace-nowrap transition-colors cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4 text-amber-300" />
            상점 (비늘 팔기 · 검 구매)
          </button>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <button
              type="button"
              onClick={onPlayAgain}
              className="flex-1 min-h-[44px] py-3 px-5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm whitespace-nowrap transition-colors cursor-pointer"
            >
              다시 플레이
            </button>
            <button
              type="button"
              onClick={onMainMenu}
              className="min-h-[44px] py-3 px-5 rounded-lg bg-[#152C44] hover:bg-[#1B3754] border border-slate-700 text-slate-200 font-semibold text-sm whitespace-nowrap transition-colors cursor-pointer"
            >
              메인 메뉴
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
