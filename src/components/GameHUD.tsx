import {
  Camera,
  Flame,
  Gamepad2,
  Heart,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { CameraMode, GameState, HUDStats } from '../game/types';

interface GameHUDProps {
  stats: HUDStats;
  gameState: GameState;
  muted: boolean;
  isExpanded: boolean;
  showTouchPad: boolean;
  cameraMode: CameraMode;
  onToggleMute: () => void;
  onTogglePause: () => void;
  onToggleExpand: () => void;
  onToggleTouchPad: () => void;
  onCycleCamera: () => void;
}

const CAMERA_LABELS: Record<CameraMode, string> = {
  action: '역동 시점',
  tactical: '조감 시점',
  hero: '박진 시점',
};

export function GameHUD({
  stats,
  gameState,
  muted,
  isExpanded,
  showTouchPad,
  cameraMode,
  onToggleMute,
  onTogglePause,
  onToggleExpand,
  onToggleTouchPad,
  onCycleCamera,
}: GameHUDProps) {
  const hpStateLabel = stats.hp <= 1 ? '위험' : stats.hp === 2 ? '주의' : '안정';
  const hpStateColor =
    stats.hp <= 1 ? 'text-rose-400' : stats.hp === 2 ? 'text-amber-400' : 'text-emerald-400';

  const bossProgressPct =
    stats.bossMaxHp > 0
      ? Math.max(0, Math.min(100, Math.round((stats.bossHp / stats.bossMaxHp) * 100)))
      : 0;

  return (
    <header
      className={`w-full mx-auto px-4 pt-2.5 pb-2 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 bg-[#07131F]/95 ${
        isExpanded ? 'max-w-none' : 'max-w-[1160px]'
      }`}
    >
      {/* Left: Player Vitality & Dash/Slash Readiness */}
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1" aria-label={`체력 ${stats.hp} / ${stats.maxHp}`}>
            {Array.from({ length: stats.maxHp }).map((_, idx) => {
              const filled = idx < stats.hp;
              return (
                <Heart
                  key={idx}
                  className={`w-4 h-4 transition-transform duration-150 ${
                    filled
                      ? 'text-rose-500 fill-rose-500'
                      : 'text-slate-700 fill-slate-800/50'
                  }`}
                />
              );
            })}
          </div>
          <span className={`font-mono-num text-xs font-semibold whitespace-nowrap ${hpStateColor}`}>
            HP {stats.hp}/{stats.maxHp} · {hpStateLabel}
          </span>
        </div>

        <span className="hidden sm:inline text-slate-700" aria-hidden="true">
          |
        </span>

        <div className="hidden sm:flex items-center gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 whitespace-nowrap">대시</span>
            <div className="w-16 h-1.5 bg-slate-800 rounded-sm overflow-hidden">
              <div
                className={`h-full transition-all duration-75 ${
                  stats.dashReadyRatio >= 1 ? 'bg-emerald-400' : 'bg-slate-500'
                }`}
                style={{ width: `${Math.round(stats.dashReadyRatio * 100)}%` }}
              />
            </div>
          </div>
          {stats.empoweredSlash && !stats.berserkActive && (
            <span className="text-amber-300 font-semibold whitespace-nowrap">
              · 강화 베기 준비
            </span>
          )}
          {stats.berserkActive ? (
            <div className="flex items-center gap-2 pl-2 border-l border-rose-500/40">
              <Flame className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span className="font-semibold text-rose-300 whitespace-nowrap">
                광폭화 공×{stats.berserkDamageMultiplier} · 코인×{stats.berserkCoinMultiplier}
              </span>
              <div className="w-14 h-1.5 bg-slate-800 rounded-sm overflow-hidden">
                <div
                  className="h-full bg-rose-500 transition-all duration-75"
                  style={{
                    width: `${Math.max(0, Math.min(100, Math.round((stats.berserkTimer / Math.max(1, stats.berserkMaxDuration)) * 100)))}%`,
                  }}
                />
              </div>
              <span className="font-mono-num text-rose-300 font-bold whitespace-nowrap">
                {stats.berserkTimer.toFixed(1)}s
              </span>
            </div>
          ) : (
            stats.combo > 0 && (
              <span className="text-slate-400 font-mono-num whitespace-nowrap">
                · 광폭화 {Math.min(stats.combo, stats.berserkThreshold)}/{stats.berserkThreshold}
              </span>
            )
          )}
          {stats.hasDivineSword && (
            <span
              className={`font-semibold whitespace-nowrap pl-2 border-l border-yellow-400/40 ${
                stats.divineAegisReady ? 'text-yellow-300' : 'text-yellow-200/70'
              }`}
              title="신의 검 태초 신능력: 불멸 부활 가호 · 자동 천벌 낙뢰 · 3연 신성검기 · 신성 오라"
            >
              {stats.divineAegisReady
                ? '천신 가호 대기'
                : `천신 가호 ${Math.ceil(stats.divineAegisCooldown)}s`}
            </span>
          )}
        </div>
      </div>

      {/* Center: Kraken Wave & Remaining Tentacles */}
      <div className="flex items-center gap-4 min-w-[190px]">
        <div className="flex flex-col gap-1 flex-1">
          <div className="flex items-center justify-between gap-4 text-xs">
            <span className="font-semibold text-slate-200 whitespace-nowrap">
              {stats.endlessMode
                ? `무한 심해 ${stats.wave}단계`
                : stats.wave === stats.finalWave
                  ? `최종 결전 · ${stats.monsterName} (${stats.wave}/${stats.finalWave})`
                  : `${stats.monsterName} · ${stats.wave}/${stats.finalWave}단계`}
            </span>
            <span className="font-mono-num text-slate-400 whitespace-nowrap">
              남은 촉수 {stats.bossHp}/{stats.bossMaxHp}
            </span>
          </div>
          <div className="w-40 sm:w-52 h-2 bg-slate-800/90 rounded-sm overflow-hidden border border-slate-700/60">
            <div
              className="h-full bg-amber-500 transition-all duration-150"
              style={{ width: `${bossProgressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Right: Score, Combo, Severed Count, Controls */}
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-2.5 sm:gap-3 text-xs sm:text-sm">
          <span className="text-slate-400 whitespace-nowrap">
            절단{' '}
            <strong className="font-mono-num text-amber-400 font-bold">
              {stats.severedCount}
            </strong>
          </span>
          <span className="text-slate-700" aria-hidden="true">
            ·
          </span>
          <span className="text-slate-400 whitespace-nowrap">
            비늘{' '}
            <strong className="font-mono-num text-sky-300 font-bold">
              +{stats.scalesEarned}
            </strong>
          </span>
          <span className="text-slate-700" aria-hidden="true">
            ·
          </span>
          <span className="text-slate-400 whitespace-nowrap">
            코인{' '}
            <strong className="font-mono-num text-amber-300 font-bold">
              +{stats.coinsEarned.toLocaleString('ko-KR')}
            </strong>
          </span>
          <span className="text-slate-700" aria-hidden="true">
            ·
          </span>
          <span className="text-slate-400 whitespace-nowrap">
            점수{' '}
            <strong className="font-mono-num text-slate-100 font-bold">
              {stats.score.toLocaleString('ko-KR')}
            </strong>
          </span>
          {stats.combo > 1 && (
            <>
              <span className="text-slate-700" aria-hidden="true">
                ·
              </span>
              <span
                className={`font-mono-num font-bold whitespace-nowrap ${
                  stats.berserkActive ? 'text-rose-400' : 'text-amber-300'
                }`}
              >
                {stats.combo} 콤보
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onCycleCamera}
            aria-label={`시점 전환 (${CAMERA_LABELS[cameraMode]})`}
            title={`3D 시점 전환 (V) · 현재: ${CAMERA_LABELS[cameraMode]}`}
            className="min-h-[40px] px-2.5 flex items-center gap-1.5 rounded-lg border border-slate-700/70 bg-[#112438] text-slate-200 hover:text-white hover:border-sky-400/70 transition-colors focus-visible:outline-2 focus-visible:outline-amber-400 cursor-pointer text-xs font-semibold whitespace-nowrap"
          >
            <Camera className="w-4 h-4 text-sky-400" />
            <span className="hidden md:inline">{CAMERA_LABELS[cameraMode]}</span>
          </button>

          <button
            type="button"
            onClick={onToggleTouchPad}
            aria-label={showTouchPad ? '터치 패드 숨기기' : '터치 패드 켜기'}
            title={showTouchPad ? '터치 패드 숨기기' : '터치 패드 켜기'}
            className={`min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg border transition-colors focus-visible:outline-2 focus-visible:outline-amber-400 cursor-pointer ${
              showTouchPad
                ? 'border-amber-400/70 bg-amber-500/20 text-amber-300'
                : 'border-slate-700/70 bg-[#112438] text-slate-300 hover:text-white hover:border-slate-500'
            }`}
          >
            <Gamepad2 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onToggleExpand}
            aria-label={isExpanded ? '화면 축소' : '화면 확대'}
            title={isExpanded ? '화면 축소 (F)' : '화면 확대 (F)'}
            className={`min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg border transition-colors focus-visible:outline-2 focus-visible:outline-amber-400 cursor-pointer ${
              isExpanded
                ? 'border-sky-400/70 bg-sky-500/20 text-sky-300'
                : 'border-slate-700/70 bg-[#112438] text-slate-300 hover:text-white hover:border-slate-500'
            }`}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={onToggleMute}
            aria-label={muted ? '소리 켜기' : '음소거'}
            title={muted ? '소리 켜기' : '음소거'}
            className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg border border-slate-700/70 bg-[#112438] text-slate-300 hover:text-white hover:border-slate-500 transition-colors focus-visible:outline-2 focus-visible:outline-amber-400 cursor-pointer"
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {(gameState === 'PLAYING' || gameState === 'PAUSED') && (
            <button
              type="button"
              onClick={onTogglePause}
              aria-label={gameState === 'PAUSED' ? '계속하기' : '일시정지'}
              title={gameState === 'PAUSED' ? '계속하기 (ESC)' : '일시정지 (ESC)'}
              className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg border border-slate-700/70 bg-[#112438] text-slate-300 hover:text-white hover:border-slate-500 transition-colors focus-visible:outline-2 focus-visible:outline-amber-400 cursor-pointer"
            >
              {gameState === 'PAUSED' ? (
                <Play className="w-4 h-4" />
              ) : (
                <Pause className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
