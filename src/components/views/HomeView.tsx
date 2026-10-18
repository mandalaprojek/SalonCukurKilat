import React from 'react';
import { useApp } from '../../context/AppContext';
import { formatRupiah } from '../../utils/gasScriptTemplate';
import { ScissorsIcon, RazorIcon } from '../common/BrandIcon';
import {
  Calendar,
  Sparkles,
  MapPin,
  Star,
  CheckCircle2,
  ChevronRight,
  Shield,
  Smartphone,
  Flame,
} from 'lucide-react';

interface HomeViewProps {
  onNavigateToBooking: (serviceId?: string, serviceType?: 'Studio' | 'Home Service') => void;
  onNavigateToMember: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onNavigateToBooking,
  onNavigateToMember,
}) => {
  const { services, barbers, riwayatPotong, activeCustomer, loyaltySettings } = useApp();

  // Public gallery items (flagged for front display)
  const galleryItems = riwayatPotong.filter((r) => r.tampilkanDiGaleri);
  // Duplicate for seamless infinite marquee loop
  const marqueeItems = [...galleryItems, ...galleryItems];

  const visitsNeeded = loyaltySettings.jumlahKunjunganReward;
  const currentVisits = activeCustomer.totalKunjungan;
  const visitsLeft = Math.max(0, visitsNeeded - currentVisits);
  const isRewardUnlocked = currentVisits >= visitsNeeded && activeCustomer.riwayatBintang5Konsisten;

  return (
    <div className="space-y-6 pb-24">
      {/* 1. Hero Card */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0c3832] via-[#092c27] to-[#041a18] border border-[#e5a93c]/25 p-5 shadow-lg">
        {/* Subtle background ornamentation */}
        <div className="absolute -top-12 -right-12 w-44 h-44 bg-[#e5a93c]/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 right-3 opacity-10 pointer-events-none text-white">
          <ScissorsIcon className="w-36 h-36" />
        </div>

        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#e5a93c]/15 border border-[#e5a93c]/30 text-[#e5a93c] text-xs font-semibold">
            <Flame className="w-3.5 h-3.5" />
            <span>Gentlemen Grooming & Home Service</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-white leading-tight">
            Potongan Presisi, <br />
            <span className="text-[#e5a93c]">Jadwal Pasti Tanpa Antre.</span>
          </h1>

          <p className="text-xs text-slate-300 leading-relaxed max-w-[280px]">
            Sistem booking studio dan panggil ke rumah berbasis otomatisasi real-time. Anti bentrok jadwal & komisi transparan.
          </p>

          {/* Dual Action Booking Buttons */}
          <div className="pt-2 grid grid-cols-2 gap-2.5">
            <button
              onClick={() => onNavigateToBooking(undefined, 'Studio')}
              className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-[#e5a93c] text-[#062320] font-bold text-xs shadow-md shadow-[#e5a93c]/20 hover:bg-[#f5b73d] active:scale-95 transition-all min-h-[44px]"
            >
              <ScissorsIcon className="w-4 h-4 shrink-0" />
              <span>Cukur di Studio</span>
            </button>
            <button
              onClick={() => onNavigateToBooking(undefined, 'Home Service')}
              className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs border border-white/15 active:scale-95 transition-all min-h-[44px]"
            >
              <MapPin className="w-4 h-4 text-[#e5a93c] shrink-0" />
              <span>Home Service</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. Interactive Member Stamp Widget */}
      <section className="bg-[#0b322c] border border-white/10 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-[#e5a93c] flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Kartu Loyalitas Member</div>
              <div className="text-[11px] text-slate-400">
                {activeCustomer.nama} · {currentVisits}/{visitsNeeded} Kunjungan
              </div>
            </div>
          </div>
          <button
            onClick={onNavigateToMember}
            className="text-[11px] font-semibold text-[#e5a93c] hover:underline flex items-center gap-0.5"
          >
            Buka Kartu <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-black/40 rounded-full h-2.5 overflow-hidden p-0.5 border border-white/5">
          <div
            className="bg-gradient-to-r from-amber-500 to-[#e5a93c] h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, (currentVisits / visitsNeeded) * 100)}%` }}
          />
        </div>

        <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-300">
          <span>
            {isRewardUnlocked ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Kupon Gratis 1x Siap Digunakan!
              </span>
            ) : (
              <span>Kurang <strong>{visitsLeft}x potong lagi</strong> untuk Cukur Gratis!</span>
            )}
          </span>
          <span className="font-mono text-slate-400">{Math.round((currentVisits / visitsNeeded) * 100)}%</span>
        </div>
      </section>

      {/* 3. Galeri Animasi Running Text (PRD 5.2: bergerak dari kiri ke kanan secara otomatis) */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#e5a93c]" />
              Galeri Hasil Potong Terkini
            </h2>
            <p className="text-[11px] text-slate-400">
              Inspirasi model rambut asli pelanggan SalonCukurKilat
            </p>
          </div>
          <span className="text-[10px] text-slate-400 font-medium">Live Feed</span>
        </div>

        {/* Marquee Container with smooth CSS marquee */}
        <div className="overflow-hidden py-1 -mx-4 px-4 bg-black/20 border-y border-white/5">
          <div className="animate-marquee flex items-center gap-3">
            {marqueeItems.map((item, index) => (
              <div
                key={`${item.id}-${index}`}
                className="w-64 shrink-0 bg-[#0b322c] border border-white/10 rounded-xl p-3 shadow-md hover:border-[#e5a93c]/50 transition-all flex flex-col justify-between"
              >
                <div className="flex items-start gap-3">
                  <div className="w-14 h-14 rounded-lg overflow-hidden bg-[#062320] shrink-0 border border-white/10 relative">
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
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 text-[#e5a93c]">
                      {[...Array(item.rating)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-[#e5a93c]" />
                      ))}
                    </div>
                    <div className="font-bold text-xs text-white truncate mt-0.5">
                      {item.modelPotongan}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate mt-0.5">
                      Oleh {item.barberNama}
                    </div>
                  </div>
                </div>
                <p className="text-[11px] text-slate-300 italic mt-2.5 line-clamp-2">
                  "{item.review}"
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Layanan & Tarif (Our Services) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <RazorIcon className="w-4 h-4 text-[#e5a93c]" />
              Menu Layanan & Harga
            </h2>
            <p className="text-[11px] text-slate-400">Pilihan treatment lengkap salon & home service</p>
          </div>
        </div>

        <div className="space-y-2.5">
          {services.map((service) => (
            <div
              key={service.id}
              className="bg-[#0b322c] border border-white/10 rounded-xl p-3.5 transition-all hover:border-[#e5a93c]/40"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">{service.name}</span>
                    {service.popular && (
                      <span className="bg-[#e5a93c]/15 text-[#e5a93c] border border-[#e5a93c]/30 text-[9px] font-bold px-1.5 py-0.5 rounded">
                        FAVORIT
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                    {service.description}
                  </p>
                  <div className="text-[10px] text-slate-400">
                    Durasi: ~{service.durationMinutes} menit
                  </div>
                </div>
              </div>

              {/* Price comparison & Quick Book */}
              <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-[11px] text-slate-400">
                    Studio:{' '}
                    <span className="font-bold text-[#e5a93c] font-mono">
                      {formatRupiah(service.priceStudio)}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Home Service:{' '}
                    <span className="font-bold text-white font-mono">
                      {formatRupiah(service.priceHomeService)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => onNavigateToBooking(service.id)}
                  className="px-3.5 py-2 rounded-lg bg-[#e5a93c] hover:bg-[#f5b73d] text-[#062320] font-bold text-xs flex items-center gap-1.5 active:scale-95 transition-all min-h-[44px]"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Pilih</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Profil Kapster Pilihan */}
      <section className="space-y-3">
        <div className="px-1">
          <h2 className="text-sm font-bold text-white">Kapster Unggulan</h2>
          <p className="text-[11px] text-slate-400">Pilih barber spesialis sesuai style favoritmu</p>
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          {barbers.map((barber) => (
            <div
              key={barber.id}
              className="bg-[#0b322c] border border-white/10 rounded-xl p-3 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 rounded-full overflow-hidden bg-[#062320] border border-[#e5a93c]/40 shrink-0">
                  <div className="absolute inset-0 flex items-center justify-center text-[#e5a93c] font-bold text-sm">
                    {barber.nickname.charAt(0)}
                  </div>
                  <img
                    src={barber.avatar}
                    alt={barber.nama}
                    referrerPolicy="no-referrer"
                    className="relative z-10 w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
                <div>
                  <div className="font-bold text-xs text-white flex items-center gap-1.5">
                    {barber.nickname}
                    <span className="flex items-center text-[10px] text-[#e5a93c]">
                      <Star className="w-3 h-3 fill-[#e5a93c] mr-0.5" />
                      {barber.rating}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-300 mt-0.5">{barber.spesialisasi}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {barber.totalPotong}+ potongan · Jam: {barber.jamMulai} - {barber.jamSelesai}
                  </div>
                </div>
              </div>

              <button
                onClick={() => onNavigateToBooking()}
                className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-[#e5a93c] text-xs font-semibold border border-white/10 active:scale-95 transition-all shrink-0 min-h-[44px]"
              >
                Booking
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Keunggulan Sistem Automasi GAS */}
      <section className="bg-black/25 rounded-2xl p-4 border border-white/10 space-y-2.5">
        <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
          <Shield className="w-4 h-4 text-emerald-400" />
          Standar Pelayanan SalonCukurKilat
        </h3>
        <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
          <div className="flex items-start gap-1.5 bg-white/5 p-2 rounded-lg">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#e5a93c] shrink-0 mt-0.5" />
            <span>Anti-bentrok jadwal otomatis (LockService)</span>
          </div>
          <div className="flex items-start gap-1.5 bg-white/5 p-2 rounded-lg">
            <Smartphone className="w-3.5 h-3.5 text-[#e5a93c] shrink-0 mt-0.5" />
            <span>Struk digital WhatsApp resmi otomatis</span>
          </div>
          <div className="flex items-start gap-1.5 bg-white/5 p-2 rounded-lg">
            <Sparkles className="w-3.5 h-3.5 text-[#e5a93c] shrink-0 mt-0.5" />
            <span>Riwayat model potong tersimpan selamanya</span>
          </div>
          <div className="flex items-start gap-1.5 bg-white/5 p-2 rounded-lg">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#e5a93c] shrink-0 mt-0.5" />
            <span>Peralatan higienis & disterilkan tiap sesi</span>
          </div>
        </div>
      </section>
    </div>
  );
};
