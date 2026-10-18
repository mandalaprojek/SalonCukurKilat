import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ServiceType } from '../../types';
import { formatRupiah, formatTanggalIndonesia } from '../../utils/gasScriptTemplate';
import { ScissorsIcon } from '../common/BrandIcon';
import {
  MapPin,
  User,
  Phone,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

interface BookingViewProps {
  initialServiceId?: string;
  initialServiceType?: ServiceType;
  onBookingSuccess: () => void;
}

export const BookingView: React.FC<BookingViewProps> = ({
  initialServiceId,
  initialServiceType = 'Studio',
  onBookingSuccess,
}) => {
  const {
    services,
    barbers,
    bookings,
    activeCustomer,
    createBooking,
  } = useApp();

  const [serviceType, setServiceType] = useState<ServiceType>(initialServiceType);
  const [selectedServiceId, setSelectedServiceId] = useState<string>(
    initialServiceId || services[0]?.id || ''
  );
  const [selectedBarberId, setSelectedBarberId] = useState<string>(
    barbers[0]?.id || ''
  );

  // Default to today's date so live anti-collision slots are immediately visible
  const todayStr = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('09:00');
  const [customerName, setCustomerName] = useState<string>(activeCustomer.nama);
  const [customerPhone, setCustomerPhone] = useState<string>(activeCustomer.noWa);
  const [homeAddress, setHomeAddress] = useState<string>(activeCustomer.alamat || '');
  const [specialNotes, setSpecialNotes] = useState<string>('');

  const [bookingResult, setBookingResult] = useState<{
    success: boolean;
    message: string;
    bookingId?: string;
  } | null>(null);

  const selectedService =
    services.find((s) => s.id === selectedServiceId) || services[0];
  const selectedBarber =
    barbers.find((b) => b.id === selectedBarberId) || barbers[0];

  const currentPrice =
    serviceType === 'Studio'
      ? selectedService.priceStudio
      : selectedService.priceHomeService;

  // Aligned Time Slots matching Code.gs & initial bookings
  const timeSlots = [
    '09:00',
    '10:00',
    '11:00',
    '13:00',
    '14:00',
    '15:00',
    '16:30',
    '17:30',
    '19:00',
    '20:00',
  ];

  // Anti-collision check helper
  const isSlotBooked = (time: string) => {
    return bookings.some(
      (b) =>
        b.kapsterId === selectedBarberId &&
        b.tanggal === selectedDate &&
        b.jam === time &&
        b.status !== 'Batal'
    );
  };

  const handleBookSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim() || !customerPhone.trim()) {
      setBookingResult({
        success: false,
        message: 'Mohon lengkapi nama dan nomor WhatsApp Anda.',
      });
      return;
    }

    if (serviceType === 'Home Service' && !homeAddress.trim()) {
      setBookingResult({
        success: false,
        message: 'Layanan Home Service mewajibkan alamat lengkap.',
      });
      return;
    }

    const result = createBooking({
      pelangganId: activeCustomer.id,
      pelangganNama: customerName.trim(),
      pelangganWa: customerPhone.trim(),
      jenisLayanan: serviceType,
      alamatHomeService: serviceType === 'Home Service' ? homeAddress.trim() : undefined,
      tanggal: selectedDate,
      jam: selectedTimeSlot,
      layananId: selectedService.id,
      layananNama: selectedService.name,
      biaya: currentPrice,
      kapsterId: selectedBarber.id,
      kapsterNama: selectedBarber.nickname,
      catatanKhusus: specialNotes.trim(),
    });

    setBookingResult(result);
  };

  const openWhatsAppConfirmation = (bookingId: string) => {
    const adminPhone = '6281234567890';
    const message = `Halo SalonCukurKilat! Saya telah melakukan booking dengan ID *${bookingId}*:
Nama: *${customerName}*
Layanan: *${selectedService.name}* (${serviceType})
Kapster: *${selectedBarber.nickname}*
Jadwal: *${formatTanggalIndonesia(selectedDate)} jam ${selectedTimeSlot}*
${serviceType === 'Home Service' ? `Alamat: *${homeAddress}*` : 'Lokasi: Studio Barbershop'}

Mohon konfirmasi booking saya. Terima kasih!`;

    window.open(`https://wa.me/${adminPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="space-y-5 pb-24">
      {/* Header */}
      <div className="px-1">
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <ScissorsIcon className="w-5 h-5 text-[#e5a93c]" />
          Booking Jadwal Cukur
        </h1>
        <p className="text-xs text-slate-300">
          Sistem anti-bentrok langsung terkoneksi ke Google Sheets
        </p>
      </div>

      {bookingResult && bookingResult.success ? (
        /* Success Screen */
        <div className="bg-[#0b322c] border border-emerald-500/40 rounded-2xl p-5 text-center space-y-4 animate-in fade-in">
          <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
              Booking Berhasil Dibuat
            </span>
            <h2 className="text-lg font-bold text-white mt-1">
              {bookingResult.bookingId}
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Data Anda telah dicatat di antrean Sheet `Booking`. Kapster kami siap melayani Anda!
            </p>
          </div>

          <div className="bg-black/30 rounded-xl p-3.5 text-left text-xs space-y-2 border border-white/5">
            <div className="flex justify-between">
              <span className="text-slate-400">Layanan:</span>
              <span className="font-semibold text-white">{selectedService.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Tipe:</span>
              <span className="font-semibold text-[#e5a93c]">{serviceType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Kapster:</span>
              <span className="font-semibold text-white">{selectedBarber.nickname}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Waktu:</span>
              <span className="font-semibold text-white">
                {formatTanggalIndonesia(selectedDate)} pukul {selectedTimeSlot}
              </span>
            </div>
            <div className="flex justify-between border-t border-white/10 pt-2">
              <span className="text-slate-400">Estimasi Biaya:</span>
              <span className="font-bold text-[#e5a93c] font-mono">
                {formatRupiah(currentPrice)}
              </span>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <button
              onClick={() => openWhatsAppConfirmation(bookingResult.bookingId || '')}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all min-h-[44px]"
            >
              <Phone className="w-4 h-4" />
              <span>Konfirmasi via WhatsApp Sekarang</span>
            </button>
            <button
              onClick={() => {
                setBookingResult(null);
                onBookingSuccess();
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-semibold"
            >
              Kembali ke Beranda
            </button>
          </div>
        </div>
      ) : (
        /* Booking Form */
        <form onSubmit={handleBookSubmit} className="space-y-5">
          {bookingResult && !bookingResult.success && (
            <div className="bg-rose-950/60 border border-rose-500/40 rounded-xl p-3 flex items-start gap-2.5 text-rose-200 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{bookingResult.message}</span>
            </div>
          )}

          {/* 1. Pilih Tipe Layanan (Studio vs Home Service) */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-200">
              1. Pilih Tempat Layanan
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-[#0b322c] rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => setServiceType('Studio')}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all min-h-[44px] ${
                  serviceType === 'Studio'
                    ? 'bg-[#e5a93c] text-[#062320] shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <ScissorsIcon className="w-4 h-4" />
                <span>Di Studio Salon</span>
              </button>
              <button
                type="button"
                onClick={() => setServiceType('Home Service')}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all min-h-[44px] ${
                  serviceType === 'Home Service'
                    ? 'bg-[#e5a93c] text-[#062320] shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <MapPin className="w-4 h-4" />
                <span>Home Service</span>
              </button>
            </div>
            {serviceType === 'Home Service' && (
              <p className="text-[11px] text-amber-300/90 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                Kapster membawa perlengkapan steril lengkap, cermin & vacuum pembersih ke lokasi Anda.
              </p>
            )}
          </div>

          {/* 2. Pilih Menu Layanan */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-200">
              2. Pilih Paket Potongan / Treatment
            </label>
            <div className="space-y-2">
              {services.map((srv) => {
                const isSelected = selectedServiceId === srv.id;
                const price =
                  serviceType === 'Studio' ? srv.priceStudio : srv.priceHomeService;
                return (
                  <div
                    key={srv.id}
                    onClick={() => setSelectedServiceId(srv.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#e5a93c] bg-[#e5a93c]/10'
                        : 'border-white/10 bg-[#0b322c] hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-xs text-white">
                        {srv.name}
                      </div>
                      <span className="font-bold text-xs text-[#e5a93c] font-mono">
                        {formatRupiah(price)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                      {srv.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Pilih Kapster */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-200">
              3. Pilih Kapster / Barber
            </label>
            <div className="grid grid-cols-3 gap-2">
              {barbers.map((barber) => {
                const isSelected = selectedBarberId === barber.id;
                return (
                  <button
                    key={barber.id}
                    type="button"
                    onClick={() => setSelectedBarberId(barber.id)}
                    className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center min-h-[44px] ${
                      isSelected
                        ? 'border-[#e5a93c] bg-[#e5a93c]/15 text-white'
                        : 'border-white/10 bg-[#0b322c] text-slate-300 hover:border-white/20'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-800 border border-white/20 mb-1.5">
                      <img
                        src={barber.avatar}
                        alt={barber.nama}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                      />
                    </div>
                    <span className="font-bold text-[11px] truncate w-full">
                      {barber.nickname}
                    </span>
                    <span className="text-[10px] text-[#e5a93c]">★ {barber.rating}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Pilih Tanggal & Slot Jam */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
              <span>4. Jadwal & Jam (Anti-Bentrok)</span>
              <span className="text-[10px] text-slate-400 font-normal">
                Merah = Sudah Terisi
              </span>
            </label>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">
                  Pilih Tanggal:
                </label>
                <input
                  type="date"
                  min={todayStr}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full bg-[#0b322c] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#e5a93c]"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">
                  Tanggal Terpilih:
                </label>
                <div className="bg-[#0b322c] border border-white/10 rounded-lg px-3 py-2 text-xs text-[#e5a93c] font-medium truncate">
                  {formatTanggalIndonesia(selectedDate)}
                </div>
              </div>
            </div>

            {/* Time Slot Grid */}
            <div className="pt-1">
              <label className="text-[10px] text-slate-400 block mb-1.5">
                Slot Jam Tersedia ({selectedBarber.nickname}):
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {timeSlots.map((time) => {
                  const booked = isSlotBooked(time);
                  const isSelected = selectedTimeSlot === time;

                  return (
                    <button
                      key={time}
                      type="button"
                      disabled={booked}
                      onClick={() => setSelectedTimeSlot(time)}
                      className={`py-2 rounded-lg text-xs font-mono font-medium transition-all min-h-[40px] ${
                        booked
                          ? 'bg-rose-950/40 text-rose-400/60 line-through cursor-not-allowed border border-rose-900/40'
                          : isSelected
                          ? 'bg-[#e5a93c] text-[#062320] font-bold shadow-sm'
                          : 'bg-[#0b322c] text-slate-200 border border-white/10 hover:border-[#e5a93c]/50'
                      }`}
                    >
                      {time}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 5. Data Pelanggan & Alamat */}
          <div className="space-y-3 bg-[#0b322c] p-3.5 rounded-xl border border-white/10">
            <h3 className="text-xs font-bold text-slate-200">5. Data Pelanggan</h3>

            <div className="space-y-2">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  Nama Lengkap:
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Contoh: Andi Prasetyo"
                    className="w-full bg-[#062320] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-[#e5a93c]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  Nomor WhatsApp (untuk struk & notifikasi):
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Contoh: 081234567890"
                    className="w-full bg-[#062320] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-[#e5a93c]"
                  />
                </div>
              </div>

              {serviceType === 'Home Service' && (
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">
                    Alamat Lengkap Home Service: <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                    <textarea
                      required
                      rows={2}
                      value={homeAddress}
                      onChange={(e) => setHomeAddress(e.target.value)}
                      placeholder="Jalan, nomor rumah, RT/RW, kelurahan, patokan lokasi..."
                      className="w-full bg-[#062320] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-[#e5a93c]"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  Catatan Gaya Rambut (Opsional):
                </label>
                <input
                  type="text"
                  value={specialNotes}
                  onChange={(e) => setSpecialNotes(e.target.value)}
                  placeholder="Misal: Fade tipis 0.5 samping, atas rapikan sedikit saja"
                  className="w-full bg-[#062320] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#e5a93c]"
                />
              </div>
            </div>
          </div>

          {/* Total & Submit Button */}
          <div className="bg-[#0b322c] border border-[#e5a93c]/30 rounded-xl p-4 flex items-center justify-between">
            <div>
              <div className="text-[10px] text-slate-400">Total Biaya</div>
              <div className="text-lg font-bold text-[#e5a93c] font-mono">
                {formatRupiah(currentPrice)}
              </div>
            </div>

            <button
              type="submit"
              className="py-3 px-6 rounded-xl bg-[#e5a93c] hover:bg-[#f5b73d] text-[#062320] font-bold text-xs flex items-center gap-2 shadow-lg shadow-[#e5a93c]/20 active:scale-95 transition-all min-h-[44px]"
            >
              <span>Booking Sekarang</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
