import { FormEvent, useState } from 'react';
import { Check, Coins, Gem, KeyRound, Lock, ShoppingBag, Swords, X } from 'lucide-react';
import {
  SCALE_COIN_RATE,
  SWORDS_CATALOG,
  SwordConfig,
  SwordId,
  getSwordConfig,
} from '../game/types';

interface ShopModalProps {
  scales: number;
  coins: number;
  ownedSwordIds: SwordId[];
  equippedSwordId: SwordId;
  onSellScales: (count: number) => void;
  onBuySword: (id: SwordId) => void;
  onEquipSword: (id: SwordId) => void;
  onUnlockCreatorSword: (password: string) => boolean;
  onClose: () => void;
}

type ShopFilter = 'all' | 'affordable' | 'owned';

const TIER_TEXT_STYLE: Record<string, string> = {
  기본: 'text-slate-400',
  입문: 'text-pink-300',
  숙련: 'text-sky-300',
  희귀: 'text-emerald-300',
  영웅: 'text-purple-300',
  전설: 'text-amber-300',
  신화: 'text-cyan-300',
  초월: 'text-violet-300',
  태초: 'text-yellow-300',
  창세: 'text-blue-300',
  절대: 'text-rose-300',
  신격: 'text-fuchsia-300',
  제작자: 'text-emerald-300',
  천신: 'text-yellow-200',
};

function SwordPreviewSvg({ sword }: { sword: SwordConfig }) {
  const len = Math.round(70 + (sword.lengthScale - 1) * 34);
  const wid = Math.round(7 + (sword.widthScale - 1) * 5.5);
  const cy = 22;

  let bladePoints = `36,${cy - wid / 2} ${36 + len - 12},${cy - wid * 0.42} ${36 + len},${cy} ${36 + len - 12},${cy + wid * 0.42} 36,${cy + wid / 2}`;
  if (sword.bladeStyle === 'rapier') {
    bladePoints = `36,${cy - 2.6} ${36 + len},${cy} 36,${cy + 2.6}`;
  } else if (sword.bladeStyle === 'katana') {
    bladePoints = `36,${cy - wid * 0.4} ${36 + len * 0.6},${cy - wid * 0.55} ${36 + len},${cy - 2.5} ${36 + len - 8},${cy + wid * 0.3} 36,${cy + wid * 0.35}`;
  } else if (sword.bladeStyle === 'serrated') {
    const segs = 5;
    const pts: string[] = [`36,${cy - wid * 0.48}`];
    for (let i = 1; i <= segs; i++) {
      const px = 36 + ((len - 10) * i) / segs;
      pts.push(`${px - 4},${cy - wid * 0.66}`);
      pts.push(`${px},${cy - wid * 0.38}`);
    }
    pts.push(`${36 + len},${cy}`);
    for (let i = segs; i >= 1; i--) {
      const px = 36 + ((len - 10) * i) / segs;
      pts.push(`${px},${cy + wid * 0.38}`);
      pts.push(`${px - 4},${cy + wid * 0.66}`);
    }
    pts.push(`36,${cy + wid * 0.48}`);
    bladePoints = pts.join(' ');
  } else if (sword.bladeStyle === 'royal') {
    bladePoints = `36,${cy - wid * 0.52} ${36 + len * 0.3},${cy - wid * 0.42} ${36 + len * 0.78},${cy - wid * 0.56} ${36 + len},${cy} ${36 + len * 0.78},${cy + wid * 0.56} ${36 + len * 0.3},${cy + wid * 0.42} 36,${cy + wid * 0.52}`;
  }

  return (
    <svg viewBox="0 0 150 44" className="w-32 h-10 shrink-0" aria-hidden="true">
      <defs>
        <linearGradient id={`blade-${sword.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={sword.bladeColor} />
          <stop offset="100%" stopColor={sword.glowColor} />
        </linearGradient>
      </defs>
      {/* Pommel & Grip */}
      <circle cx="13" cy={cy} r="4.2" fill={sword.glowColor} />
      <rect x="16" y={cy - 2.6} width="16" height="5.2" rx="2" fill="#78350f" />
      {/* Guard */}
      <rect
        x="31"
        y={sword.bladeStyle === 'royal' ? 7 : 10}
        width="5"
        height={sword.bladeStyle === 'royal' ? 30 : 24}
        rx="2"
        fill="#fbbf24"
      />
      {/* Blade */}
      <polygon
        points={bladePoints}
        fill={`url(#blade-${sword.id})`}
        stroke="#ffffff"
        strokeOpacity="0.45"
        strokeWidth="0.9"
      />
    </svg>
  );
}

export function ShopModal({
  scales,
  coins,
  ownedSwordIds,
  equippedSwordId,
  onSellScales,
  onBuySword,
  onEquipSword,
  onUnlockCreatorSword,
  onClose,
}: ShopModalProps) {
  const [notice, setNotice] = useState<string | null>(null);
  const [noticeError, setNoticeError] = useState<boolean>(false);
  const [filter, setFilter] = useState<ShopFilter>('all');
  const [secretInput, setSecretInput] = useState<string>('');
  const equippedSword = getSwordConfig(equippedSwordId);
  const allSecretUnlocked =
    ownedSwordIds.includes('creator_sword') && ownedSwordIds.includes('god_sword');

  const handleSell = (count: number) => {
    const actual = Math.min(scales, count);
    if (actual <= 0) return;
    onSellScales(actual);
    setNoticeError(false);
    setNotice(
      `비늘 ${actual}개를 ${(actual * SCALE_COIN_RATE).toLocaleString('ko-KR')} 코인으로 교환했습니다.`,
    );
  };

  const handleBuy = (sword: SwordConfig) => {
    if (sword.secretLocked || coins < sword.price) return;
    onBuySword(sword.id);
    setNoticeError(false);
    setNotice(`${sword.name}을(를) 구매하고 즉시 장착했습니다!`);
  };

  const handleEquip = (sword: SwordConfig) => {
    onEquipSword(sword.id);
    setNoticeError(false);
    setNotice(`${sword.name}을(를) 손에 쥐었습니다.`);
  };

  const handleUnlockSecret = (e: FormEvent) => {
    e.preventDefault();
    const ok = onUnlockCreatorSword(secretInput);
    if (ok) {
      setSecretInput('');
      setNoticeError(false);
      setNotice(
        '비밀번호 확인! [제작자의 검]과 [신의 검 · 태초 천신검]이 해금되어 즉시 장착되었습니다!',
      );
    } else {
      setNoticeError(true);
      setNotice('비밀번호가 일치하지 않습니다. 정확한 암호를 입력해 주세요.');
    }
  };

  const visibleSwords = SWORDS_CATALOG.filter((sword) => {
    const owned = ownedSwordIds.includes(sword.id);
    if (filter === 'owned') return owned;
    if (filter === 'affordable') return !owned && !sword.secretLocked && coins >= sword.price;
    return true;
  });

  return (
    <div
      className="fixed inset-0 z-40 bg-[#040D16]/90 flex items-center justify-center p-3 sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="shop-modal-title"
    >
      <div className="w-full max-w-4xl max-h-[92vh] bg-[#0B1B2B] border border-slate-700/80 rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-800 flex items-center justify-between gap-4 bg-[#081523]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/15 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 id="shop-modal-title" className="font-display text-lg sm:text-xl font-bold text-white">
                선상 상점 · 비늘 교환소 &amp; 검 대장간
              </h2>
              <p className="text-xs text-slate-400">
                총 {SWORDS_CATALOG.length}종의 3D 명검 · 비늘을 코인으로 팔아 원하는 검을 수집하세요.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="상점 닫기"
            className="min-w-[44px] min-h-[44px] rounded-lg border border-slate-700/70 bg-[#112438] text-slate-300 hover:text-white flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wallet & Equipped Summary Bar */}
        <div className="px-5 sm:px-6 py-3 bg-[#091826] border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-sm">
          <div className="flex flex-wrap items-center gap-5">
            <div className="flex items-center gap-2">
              <Gem className="w-4 h-4 text-sky-400" />
              <span className="text-slate-400">보유 비늘</span>
              <strong className="font-mono-num text-sky-300 font-bold">
                {scales.toLocaleString('ko-KR')}개
              </strong>
            </div>
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-amber-400" />
              <span className="text-slate-400">보유 코인</span>
              <strong className="font-mono-num text-amber-300 font-bold">
                {coins.toLocaleString('ko-KR')} G
              </strong>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <Swords className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-400">장착 중:</span>
            <strong className="text-white font-semibold">{equippedSword.name}</strong>
            <span className="font-mono-num text-xs text-slate-400">
              ({ownedSwordIds.length}/{SWORDS_CATALOG.length} 보유)
            </span>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {notice && (
            <div
              className={`px-4 py-2.5 rounded-lg border text-xs sm:text-sm font-medium ${
                noticeError
                  ? 'bg-rose-500/15 border-rose-400/45 text-rose-200'
                  : 'bg-emerald-500/15 border-emerald-400/40 text-emerald-200'
              }`}
            >
              {notice}
            </div>
          )}

          {/* Section 1: Scale -> Coin Exchange */}
          <section className="rounded-xl bg-[#081523] border border-slate-700/70 p-4 sm:p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-display text-base font-bold text-white flex items-center gap-2">
                  <Gem className="w-4 h-4 text-sky-400" />
                  비늘 → 코인 환전소
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  촉수를 자르거나 갑판의 황금 비늘을 주우면 비늘을 얻습니다. (시세: 비늘 1개 ={' '}
                  <strong className="text-amber-300 font-mono-num">{SCALE_COIN_RATE} 코인</strong>)
                </p>
              </div>
              <div className="text-right font-mono-num text-xs text-slate-300">
                최대 환전 가능: +{(scales * SCALE_COIN_RATE).toLocaleString('ko-KR')} 코인
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                disabled={scales < 1}
                onClick={() => handleSell(1)}
                className="min-h-[44px] px-4 py-2.5 rounded-lg bg-[#142B43] hover:bg-[#1C3B5B] disabled:opacity-40 disabled:cursor-not-allowed border border-slate-600/70 text-slate-100 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
              >
                비늘 1개 팔기 (+{SCALE_COIN_RATE} 코인)
              </button>
              <button
                type="button"
                disabled={scales < 5}
                onClick={() => handleSell(5)}
                className="min-h-[44px] px-4 py-2.5 rounded-lg bg-[#142B43] hover:bg-[#1C3B5B] disabled:opacity-40 disabled:cursor-not-allowed border border-slate-600/70 text-slate-100 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
              >
                비늘 5개 팔기 (+{5 * SCALE_COIN_RATE} 코인)
              </button>
              <button
                type="button"
                disabled={scales < 1}
                onClick={() => handleSell(scales)}
                className="min-h-[44px] px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed text-slate-950 text-xs sm:text-sm font-bold transition-colors cursor-pointer"
              >
                비늘 모두 팔기 (+{(scales * SCALE_COIN_RATE).toLocaleString('ko-KR')} 코인)
              </button>
            </div>
          </section>

          {/* Section 2: 3D Sword Armory */}
          <section className="space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-display text-base font-bold text-white flex items-center gap-2">
                <Swords className="w-4 h-4 text-amber-400" />
                전설의 검 대장간 (총 {SWORDS_CATALOG.length}종)
              </h3>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 p-1 bg-[#081523] border border-slate-800 rounded-lg text-xs">
                {(
                  [
                    { id: 'all', label: `전체 (${SWORDS_CATALOG.length})` },
                    { id: 'affordable', label: '구매 가능' },
                    { id: 'owned', label: `보유 중 (${ownedSwordIds.length})` },
                  ] as Array<{ id: ShopFilter; label: string }>
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setFilter(tab.id)}
                    className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
                      filter === tab.id
                        ? 'bg-amber-500 text-slate-950'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Secret Vault Password Unlock (Creator Sword + God Sword) */}
            <form
              onSubmit={handleUnlockSecret}
              className="rounded-xl bg-[#071A17] border border-emerald-500/40 p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shrink-0">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-emerald-200">
                    비밀 금고 · 제작자의 검 &amp; 신의 검
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {allSecretUnlocked
                      ? '제작자의 검과 신의 검이 모두 해금되었습니다. 아래 대장간에서 언제든 장착할 수 있습니다.'
                      : '비밀번호를 입력하면 [제작자의 검]과 [신의 검 · 태초 천신검]이 즉시 해금됩니다.'}
                  </p>
                </div>
              </div>
              {!allSecretUnlocked ? (
                <div className="flex items-center gap-2 shrink-0">
                  <input
                    type="password"
                    value={secretInput}
                    onChange={(e) => setSecretInput(e.target.value)}
                    placeholder="비밀번호 입력..."
                    aria-label="비밀 금고 비밀번호"
                    className="w-36 sm:w-40 min-h-[40px] px-3 py-1.5 rounded-lg bg-[#051018] border border-emerald-500/45 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-400"
                  />
                  <button
                    type="submit"
                    className="min-h-[40px] px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm whitespace-nowrap transition-colors cursor-pointer"
                  >
                    해금하기
                  </button>
                </div>
              ) : (
                <span className="text-xs font-bold text-emerald-300 whitespace-nowrap">
                  해금 완료
                </span>
              )}
            </form>

            {visibleSwords.length === 0 ? (
              <div className="rounded-xl bg-[#081523] border border-slate-800 p-8 text-center text-sm text-slate-400">
                현재 보유 코인으로 새로 구매할 수 있는 검이 없습니다. 비늘을 더 팔거나 모아보세요!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {visibleSwords.map((sword) => {
                  const owned = ownedSwordIds.includes(sword.id);
                  const equipped = equippedSwordId === sword.id;
                  const canAfford = coins >= sword.price;
                  const rangeBonusPct = Math.round((sword.rangeMultiplier - 1) * 100);
                  const cdReductionPct = Math.round((1 - sword.cooldownMultiplier) * 100);
                  const tierColor = TIER_TEXT_STYLE[sword.tierLabel] ?? 'text-slate-300';

                  return (
                    <div
                      key={sword.id}
                      className={`rounded-xl p-4 border flex flex-col justify-between gap-3.5 transition-colors ${
                        equipped
                          ? 'bg-[#10253A] border-amber-400/75'
                          : 'bg-[#081523] border-slate-700/70'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[11px] font-bold ${tierColor} whitespace-nowrap`}>
                              [{sword.tierLabel}]
                            </span>
                            <h4 className="font-display text-base font-bold text-white truncate">
                              {sword.name}
                            </h4>
                            {equipped && (
                              <span className="text-[11px] font-bold text-amber-300 whitespace-nowrap">
                                · 장착 중
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 leading-relaxed">
                            {sword.description}
                          </p>
                        </div>

                        <div className="rounded-lg bg-[#050E18] border border-slate-800 px-2 py-1 flex items-center justify-center shrink-0">
                          <SwordPreviewSvg sword={sword} />
                        </div>
                      </div>

                      {/* Stat Summary Line */}
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-mono-num text-slate-300 border-t border-slate-800/80 pt-2.5">
                        <span>
                          피해{' '}
                          <strong className={sword.damageBonus > 0 ? 'text-rose-300' : 'text-slate-400'}>
                            +{sword.damageBonus}
                          </strong>
                        </span>
                        <span className="text-slate-700">·</span>
                        <span>
                          범위{' '}
                          <strong className={rangeBonusPct > 0 ? 'text-sky-300' : 'text-slate-400'}>
                            +{rangeBonusPct}%
                          </strong>
                        </span>
                        <span className="text-slate-700">·</span>
                        <span>
                          대기시간{' '}
                          <strong className={cdReductionPct > 0 ? 'text-emerald-300' : 'text-slate-400'}>
                            -{cdReductionPct}%
                          </strong>
                        </span>
                        {sword.scaleBonus > 0 && (
                          <>
                            <span className="text-slate-700">·</span>
                            <span className="text-amber-300 font-semibold">
                              비늘 +{sword.scaleBonus}
                            </span>
                          </>
                        )}
                        {(sword.extraWaves ?? 0) > 0 && (
                          <>
                            <span className="text-slate-700">·</span>
                            <span className="text-cyan-300 font-semibold">
                              {1 + (sword.extraWaves ?? 0)}갈래 검기
                            </span>
                          </>
                        )}
                        {(sword.extraMeteors ?? 0) > 0 && (
                          <>
                            <span className="text-slate-700">·</span>
                            <span className="text-orange-300 font-semibold">
                              {5 + (sword.extraMeteors ?? 0)}연 유성
                            </span>
                          </>
                        )}
                        {sword.basicSlashWave && (
                          <>
                            <span className="text-slate-700">·</span>
                            <span className="text-rose-300 font-semibold">
                              평타 검기 발사
                            </span>
                          </>
                        )}
                      </div>

                      {/* Unique Skills Preview */}
                      <div className="rounded-lg bg-[#06111D] border border-slate-800/80 px-3 py-2 space-y-1">
                        <p className="text-[11px] font-semibold text-sky-300">
                          고유 스킬 ({sword.skills.length}종)
                        </p>
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          {sword.skills.map((sk) => sk.name).join(' · ')}
                        </p>
                      </div>

                      {sword.divineBlessing && sword.divineTraits && sword.divineTraits.length > 0 && (
                        <div className="rounded-lg bg-[#211A07] border border-yellow-400/55 px-3 py-2 space-y-1">
                          <p className="text-[11px] font-bold text-yellow-300">
                            태초 천신 권능 · 신능력 ({sword.divineTraits.length}종 상시 발동)
                          </p>
                          <ul className="space-y-0.5 text-[11px] text-yellow-100/90 leading-relaxed">
                            {sword.divineTraits.map((trait) => (
                              <li key={trait}>· {trait}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Purchase / Equip / Secret Lock Action */}
                      <div>
                        {equipped ? (
                          <button
                            type="button"
                            disabled
                            className="w-full min-h-[44px] py-2 px-4 rounded-lg bg-amber-500/20 border border-amber-400/60 text-amber-300 font-bold text-sm flex items-center justify-center gap-1.5"
                          >
                            <Check className="w-4 h-4" />
                            현재 장착 중
                          </button>
                        ) : owned ? (
                          <button
                            type="button"
                            onClick={() => handleEquip(sword)}
                            className="w-full min-h-[44px] py-2 px-4 rounded-lg bg-[#163452] hover:bg-[#1E466E] border border-sky-400/50 text-sky-200 font-bold text-sm transition-colors cursor-pointer"
                          >
                            이 검 장착하기
                          </button>
                        ) : sword.secretLocked ? (
                          <div className="w-full min-h-[44px] py-2 px-4 rounded-lg bg-[#09211B] border border-emerald-500/40 text-emerald-300 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2">
                            <Lock className="w-4 h-4 shrink-0" />
                            상단 비밀 금고에서 비밀번호 입력 시 해금
                          </div>
                        ) : (
                          <button
                            type="button"
                            disabled={!canAfford}
                            onClick={() => handleBuy(sword)}
                            className={`w-full min-h-[44px] py-2 px-4 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors ${
                              canAfford
                                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer'
                                : 'bg-slate-800/80 border border-slate-700 text-slate-400 cursor-not-allowed'
                            }`}
                          >
                            <Coins className="w-4 h-4" />
                            {canAfford
                              ? `구매하기 (${sword.price.toLocaleString('ko-KR')} 코인)`
                              : `코인 부족 (${sword.price.toLocaleString('ko-KR')} 코인 필요)`}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-slate-800 bg-[#081523] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-6 py-2 rounded-lg bg-[#142B43] hover:bg-[#1C3B5B] border border-slate-600 text-white font-semibold text-sm transition-colors cursor-pointer"
          >
            상점 나가기
          </button>
        </div>
      </div>
    </div>
  );
}
