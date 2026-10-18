import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ScissorsIcon } from '../common/BrandIcon';
import {
  Award,
  Sparkles,
  Star,
  CheckCircle2,
  Calendar,
  User,
  MessageSquare,
  Gift,
} from 'lucide-react';
import { formatTanggalIndonesia } from '../../utils/gasScriptTemplate';

export const HistoryMemberView: React.FC = () => {
  const {
    activeCustomer,
    customers,
    setActiveCustomerId,
    riwayatPotong,
    loyaltySettings,
    submitReview,
  } = useApp();

  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [ratingInput, setRatingInput] = useState<number>(5);
  const [reviewTextInput, setReviewTextInput] = useState<string>('');

  const targetVisits = loyaltySettings.jumlahKunjunganReward;
  const currentVisits = activeCustomer.totalKunjungan;
  const isRewardUnlocked =
    currentVisits >= targetVisits && activeCustomer.riwayatBintang5Konsisten;

  // Filter history for current customer
  const myHistories = riwayatPotong.filter(
    (r) =>
      r.pelangganId === activeCustomer.id ||
      r.pelangganNama.toLowerCase().includes(activeCustomer.nama.toLowerCase().split(' ')[0])
  );

  const handleOpenReview = (riwayatId: string, currentRating: number, currentReview: string) => {
    setReviewingId(riwayatId);
    setRatingInput(currentRating || 5);
    setReviewTextInput(currentReview || '');
  };

  const handleSaveReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingId) return;

    submitReview(reviewingId, ratingInput, reviewTextInput);
    setReviewingId(null);
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Header with Customer Switcher for Testing */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Award className="w-5 h-5 text-[#e5a93c]" />
            Member & Riwayat Potong
          </h1>
          <p className="text-xs text-slate-300">
            Kartu stempel loyalitas & arsip model rambut pribadi
          </p>
        </div>

        {/* Quick customer profile selector for preview */}
        <select
          value={activeCustomer.id}
          onChange={(e) => setActiveCustomerId(e.target.value)}
          className="bg-[#0b322c] border border-white/10 rounded-lg px-2.5 py-1 text-xs text-[#e5a93c] font-semibold focus:outline-none"
        >
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nama} ({c.totalKunjungan}x)
            </option>
          ))}
        </select>
      </div>

      {/* 1. Digital Loyalty Stamp Card (15 Slots) */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0c3832] via-[#092c27] to-[#051c19] border border-[#e5a93c]/40 p-4 shadow-xl">
        <div className="flex items-start justify-between pb-3 border-b border-white/10">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#e5a93c] tracking-wide uppercase">
              <Gift className="w-3.5 h-3.5" />
              <span>Kartu Member Resmi SalonCukurKilat</span>
            </div>
            <h2 className="text-base font-bold text-white mt-0.5">
              {activeCustomer.nama}
            </h2>
            <div className="text-[11px] text-slate-300 mt-0.5">
              No. WhatsApp: {activeCustomer.noWa}
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] text-slate-400">Total Kunjungan</div>
            <div className="text-xl font-bold font-mono text-[#e5a93c]">
              {currentVisits} / {targetVisits}
            </div>
          </div>
        </div>

        {/* Reward Status Banner */}
        <div className="my-3 py-2 px-3 rounded-xl bg-black/30 border border-white/10 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#e5a93c]" />
            <span className="text-slate-200">
              Syarat: <strong>{targetVisits}x potong</strong> + konsisten rating 5 bintang
            </span>
          </div>
          {isRewardUnlocked ? (
            <span className="bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded text-[10px] border border-emerald-500/30">
              REWARD AKTIF!
            </span>
          ) : (
            <span className="text-slate-400 text-[11px]">
              {Math.max(0, targetVisits - currentVisits)}x lagi
            </span>
          )}
        </div>

        {/* 15 Stamp Slots Grid */}
        <div className="grid grid-cols-5 gap-2 my-2">
          {[...Array(targetVisits)].map((_, i) => {
            const slotNumber = i + 1;
            const isStamped = slotNumber <= currentVisits;
            const isLastTarget = slotNumber === targetVisits;

            return (
              <div
                key={slotNumber}
                className={`relative aspect-square rounded-xl flex flex-col items-center justify-center p-1 text-center transition-all ${
                  isLastTarget
                    ? isStamped
                      ? 'bg-gradient-to-tr from-[#e5a93c] to-amber-300 text-slate-950 font-black shadow-lg shadow-[#e5a93c]/30'
                      : 'border-2 border-dashed border-[#e5a93c] bg-[#e5a93c]/10 text-[#e5a93c]'
                    : isStamped
                    ? 'bg-[#e5a93c]/20 border border-[#e5a93c]/60 text-[#e5a93c]'
                    : 'bg-black/20 border border-white/5 text-slate-600'
                }`}
              >
                {isLastTarget ? (
                  <>
                    <Gift className="w-4 h-4" />
                    <span className="text-[9px] font-bold leading-tight mt-0.5">
                      GRATIS!
                    </span>
                  </>
                ) : isStamped ? (
                  <>
                    <ScissorsIcon className="w-4 h-4" />
                    <span className="text-[9px] font-bold font-mono mt-0.5">
                      #{slotNumber}
                    </span>
                  </>
                ) : (
                  <span className="text-[10px] font-mono opacity-50">
                    {slotNumber}
                  </span>
                )}

                {isStamped && !isLastTarget && (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#e5a93c]" />
                )}
              </div>
            );
          })}
        </div>

        {isRewardUnlocked && (
          <div className="mt-3 p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/50 flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
            <div className="text-xs">
              <div className="font-bold text-white">
                Klaim 1x Potongan Rambut Gratis Anda!
              </div>
              <div className="text-emerald-200/90 text-[11px] mt-0.5">
                Tunjukkan layar ini ke kasir/kapster saat kunjungan berikutnya.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Riwayat Model Potongan Rambut & Catatan Gaya */}
      <div className="space-y-3">
        <div className="px-1">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <ScissorsIcon className="w-4 h-4 text-[#e5a93c]" />
            Riwayat Gaya & Catatan Barber
          </h2>
          <p className="text-[11px] text-slate-400">
            Kapster dapat membaca catatan ini sebelum memotong rambut Anda lagi
          </p>
        </div>

        {myHistories.length === 0 ? (
          <div className="bg-[#0b322c] border border-white/10 rounded-xl p-5 text-center text-xs text-slate-400">
            Belum ada riwayat potongan rambut yang tercatat. Silakan lakukan booking pertama Anda!
          </div>
        ) : (
          <div className="space-y-3">
            {myHistories.map((item) => (
              <div
                key={item.id}
                className="bg-[#0b322c] border border-white/10 rounded-xl p-3.5 space-y-3 hover:border-white/20 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-[#062320] border border-white/10 shrink-0">
                      <div className="absolute inset-0 flex items-center justify-center text-[#e5a93c]">
                        <ScissorsIcon className="w-6 h-6 opacity-60" />
                      </div>
                      <img
                        src={item.fotoUrl}
                        alt={item.modelPotongan}
                        referrerPolicy="no-referrer"
                        className="relative z-10 w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>

                    <div>
                      <h3 className="font-bold text-xs text-white">
                        {item.modelPotongan}
                      </h3>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3 text-[#e5a93c]" /> {item.barberNama}
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {formatTanggalIndonesia(item.tanggal)}
                        </span>
                      </div>

                      {/* Rating Stars */}
                      <div className="flex items-center gap-1 text-[#e5a93c] mt-1.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < item.rating
                                ? 'fill-[#e5a93c] text-[#e5a93c]'
                                : 'text-slate-600'
                            }`}
                          />
                        ))}
                        <span className="text-[10px] text-slate-400 ml-1">
                          ({item.rating}.0)
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenReview(item.id, item.rating, item.review)}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-[#e5a93c] text-xs font-medium border border-white/10 shrink-0 flex items-center gap-1 min-h-[44px]"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Review</span>
                  </button>
                </div>

                {/* Barber Cut Notes */}
                <div className="bg-black/30 rounded-lg p-2.5 text-[11px] border border-white/5 space-y-1">
                  <div className="text-slate-400 font-semibold flex items-center gap-1">
                    <span>✂️ Catatan Barber untuk sesi potong berikutnya:</span>
                  </div>
                  <p className="text-slate-200 italic leading-relaxed">
                    "{item.catatanGaya}"
                  </p>
                </div>

                {item.review && (
                  <div className="text-[11px] text-slate-300 italic pt-1 border-t border-white/5 flex items-start gap-1.5">
                    <span className="text-[#e5a93c]">Ulasan Anda:</span>
                    <span>"{item.review}"</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Modal Form */}
      {reviewingId && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in">
          <form
            onSubmit={handleSaveReview}
            className="w-full max-w-md bg-[#0b322c] border-t sm:border border-white/20 rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl text-slate-100 space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="font-bold text-sm text-white">Beri Rating & Review</h3>
              <button
                type="button"
                onClick={() => setReviewingId(null)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Batal
              </button>
            </div>

            <div className="space-y-1.5 text-center">
              <label className="text-xs text-slate-300">
                Pilih Bintang (Rating 5 bintang konsisten membuka potongan gratis!):
              </label>
              <div className="flex items-center justify-center gap-2 pt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRatingInput(star)}
                    className="p-1 transition-transform active:scale-125"
                  >
                    <Star
                      className={`w-7 h-7 ${
                        star <= ratingInput
                          ? 'fill-[#e5a93c] text-[#e5a93c]'
                          : 'text-slate-600'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-slate-300">
                Ulasan / Komentar Anda:
              </label>
              <textarea
                required
                rows={3}
                value={reviewTextInput}
                onChange={(e) => setReviewTextInput(e.target.value)}
                placeholder="Bagaimana hasil cukuran dan kenyamanan kapster?"
                className="w-full bg-[#062320] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#e5a93c]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#e5a93c] hover:bg-[#f5b73d] text-[#062320] font-bold text-xs shadow-md min-h-[44px]"
            >
              Simpan Ulasan
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
