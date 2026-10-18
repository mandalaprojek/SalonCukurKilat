import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  BookingStatus,
  PaymentMethod,
} from '../../types';
import {
  formatRupiah,
  formatTanggalIndonesia,
  generateWhatsAppReceiptUrl,
  GAS_CODE_GS,
  downloadTextFile,
} from '../../utils/gasScriptTemplate';
import { ScissorsIcon } from '../common/BrandIcon';
import {
  TrendingUp,
  Calendar,
  Users,
  CheckCircle2,
  Send,
  AlertTriangle,
  Upload,
  FileText,
  DollarSign,
  Copy,
  Sliders,
  Eye,
  Plus,
  Minus,
  Sparkles,
  Download,
  Cloud,
  RefreshCw,
} from 'lucide-react';

export const ManagementView: React.FC = () => {
  const {
    currentRole,
    selectedBarberId,
    barbers,
    bookings,
    updateBookingStatus,
    pembayaran,
    processPayment,
    stok,
    updateStock,
    pendaftaran,
    updateApplicantStatus,
    submitJobApplication,
    riwayatPotong,
    addRiwayatPotong,
    toggleGaleriVisibility,
    loyaltySettings,
    updateLoyaltySettings,
    gasWebAppUrl,
    setGasWebAppUrl,
    gasSyncStatus,
    gasLastError,
    syncFromGas,
  } = useApp();

  // Active section tab for Admin
  const [adminTab, setAdminTab] = useState<'keuangan' | 'jadwal' | 'stok' | 'pelamar' | 'loyalty' | 'gas'>('keuangan');

  // GAS URL input state
  const [gasUrlInput, setGasUrlInput] = useState<string>(gasWebAppUrl);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // Payment Modal State
  const [payingBookingId, setPayingBookingId] = useState<string | null>(null);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('QRIS');
  const [payAmount, setPayAmount] = useState<number>(50000);
  const [payNote, setPayNote] = useState<string>('');
  const [lastReceiptUrl, setLastReceiptUrl] = useState<string | null>(null);

  // Upload Photo State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadCustName, setUploadCustName] = useState('');
  const [uploadModel, setUploadModel] = useState('');
  const [uploadNotes, setUploadNotes] = useState('');
  const [uploadPhotoUrl, setUploadPhotoUrl] = useState('');

  // Job Application Form State (for Public)
  const [appNama, setAppNama] = useState('');
  const [appWa, setAppWa] = useState('');
  const [appAlamat, setAppAlamat] = useState('');
  const [appExp, setAppExp] = useState(2);
  const [appSpecialty, setAppSpecialty] = useState('');
  const [appKtp, setAppKtp] = useState('KTP_Dokumen.pdf');
  const [appKk, setAppKk] = useState('KK_Dokumen.pdf');
  const [appSuccess, setAppSuccess] = useState(false);

  // Loyalty Settings State
  const [loyaltyVisitsInput, setLoyaltyVisitsInput] = useState(loyaltySettings.jumlahKunjunganReward);
  const [loyaltySavedToast, setLoyaltySavedToast] = useState(false);

  // Copy GAS Code Toast
  const [isCopied, setIsCopied] = useState(false);

  // Current active barber for barber mode
  const currentBarber = barbers.find((b) => b.id === selectedBarberId) || barbers[0];

  // Financial calculations
  const totalOmset = pembayaran.reduce((acc, p) => acc + p.nominal, 0);
  const totalKomisiAll = pembayaran.reduce((acc, p) => acc + p.komisiBarber, 0);
  const totalNetSalon = totalOmset - totalKomisiAll;

  // Barber's own commission & bookings
  const myBookings = bookings.filter((b) => b.kapsterId === selectedBarberId);
  const myPayments = pembayaran.filter((p) => p.barberId === selectedBarberId);
  const myCommissionToday = myPayments.reduce((acc, p) => acc + p.komisiBarber, 0);
  const myTotalCuts = myBookings.filter((b) => b.status === 'Selesai').length;

  // Stock low alerts
  const lowStockItems = stok.filter((s) => s.stokSaatIni <= s.minimumStok);

  const handleOpenPayment = (bookingId: string) => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) return;
    setPayingBookingId(bookingId);
    setPayAmount(booking.biaya);
    setPayNote(booking.jenisLayanan === 'Home Service' ? 'Home service lunas' : 'Cukur studio lunas');
    setLastReceiptUrl(null);
  };

  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingBookingId) return;

    const booking = bookings.find((b) => b.id === payingBookingId);
    if (!booking) return;

    const res = processPayment(payingBookingId, payMethod, payAmount, payNote);
    if (res.success) {
      // Generate WhatsApp digital receipt URL using accurate updatedVisits
      const waUrl = generateWhatsAppReceiptUrl({
        phone: booking.pelangganWa,
        trxId: res.trxId,
        customerName: booking.pelangganNama,
        barberName: booking.kapsterNama,
        serviceName: booking.layananNama,
        serviceType: booking.jenisLayanan,
        nominal: payAmount,
        paymentMethod: payMethod,
        haircutNotes: booking.catatanKhusus,
        loyaltyVisits: res.updatedVisits,
        loyaltyTarget: loyaltySettings.jumlahKunjunganReward,
      });

      setLastReceiptUrl(waUrl);
    }
  };

  const handleSaveCutPhoto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadCustName || !uploadModel) return;

    addRiwayatPotong({
      pelangganId: `CUST-EXT-${Date.now().toString().slice(-3)}`,
      pelangganNama: uploadCustName,
      barberId: currentBarber.id,
      barberNama: currentBarber.nickname,
      tanggal: new Date().toISOString().slice(0, 10),
      modelPotongan: uploadModel,
      catatanGaya: uploadNotes || 'Potongan rapi, clipper guard #1-2 fade',
      fotoUrl:
        uploadPhotoUrl ||
        'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=500&q=80',
      rating: 5,
      review: 'Potongan rambut presisi oleh ' + currentBarber.nickname,
      tampilkanDiGaleri: true,
    });

    setIsUploadModalOpen(false);
    setUploadCustName('');
    setUploadModel('');
    setUploadNotes('');
    setUploadPhotoUrl('');
  };

  const handleJobSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitJobApplication({
      nama: appNama,
      noWa: appWa,
      alamat: appAlamat,
      pengalamanTahun: appExp,
      spesialisasi: appSpecialty || 'Fade & Hot Shave',
      ktpFileName: appKtp,
      kkFileName: appKk,
    });
    setAppSuccess(true);
  };

  const handleCopyGas = () => {
    navigator.clipboard.writeText(GAS_CODE_GS);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownloadGas = () => {
    downloadTextFile('Code.gs', GAS_CODE_GS);
  };

  const handleSaveAndSyncGasUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    setGasWebAppUrl(gasUrlInput);
    if (!gasUrlInput.trim()) {
      setSyncMessage('Mode Database Lokal diaktifkan.');
      return;
    }
    setSyncMessage('Menghubungkan ke Google Sheets...');
    const ok = await syncFromGas(gasUrlInput);
    if (ok) {
      setSyncMessage('Berhasil terhubung & sinkron dengan Google Sheets Anda!');
    } else {
      setSyncMessage(null);
    }
  };

  /* =======================================================================
     VIEW 1: BARBER PERSONAL DASHBOARD
     ======================================================================= */
  if (currentRole === 'barber') {
    return (
      <div className="space-y-6 pb-24">
        {/* Barber Header Info */}
        <div className="bg-gradient-to-r from-[#0c3832] to-[#0b322c] border border-emerald-500/30 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-800 border-2 border-emerald-400">
                <img
                  src={currentBarber.avatar}
                  alt={currentBarber.nama}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                  Panel Barber
                </div>
                <h1 className="text-base font-bold text-white">
                  {currentBarber.nama}
                </h1>
                <div className="text-xs text-slate-300">
                  Komisi: <strong className="text-[#e5a93c]">{currentBarber.persentaseKomisi}%</strong> per potongan
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all min-h-[44px]"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Unggah Hasil Potong</span>
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-white/10">
            <div className="bg-black/30 rounded-xl p-2.5">
              <div className="text-[10px] text-slate-400">Komisi Saya Hari Ini</div>
              <div className="text-base font-bold text-[#e5a93c] font-mono mt-0.5">
                {formatRupiah(myCommissionToday)}
              </div>
            </div>
            <div className="bg-black/30 rounded-xl p-2.5">
              <div className="text-[10px] text-slate-400">Total Selesai Cukur</div>
              <div className="text-base font-bold text-white font-mono mt-0.5">
                {myTotalCuts} Sesi
              </div>
            </div>
          </div>
        </div>

        {/* Jadwal Saya Hari Ini */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#e5a93c]" />
              Jadwal & Antrean Saya Hari Ini
            </h2>
            <span className="text-[11px] text-slate-400">
              {myBookings.length} booking tercatat
            </span>
          </div>

          {myBookings.length === 0 ? (
            <div className="bg-[#0b322c] border border-white/10 rounded-xl p-5 text-center text-xs text-slate-400">
              Belum ada antrean jadwal untuk Anda hari ini. Santai sejenak!
            </div>
          ) : (
            <div className="space-y-2.5">
              {myBookings.map((b) => (
                <div
                  key={b.id}
                  className="bg-[#0b322c] border border-white/10 rounded-xl p-3.5 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">
                          {b.pelangganNama}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            b.status === 'Selesai'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : b.status === 'Dikonfirmasi'
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {b.status}
                        </span>
                      </div>
                      <div className="text-xs text-[#e5a93c] font-medium mt-0.5">
                        {b.layananNama} ({b.jenisLayanan})
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                        <span>🕒 {b.jam} WIB</span>
                        <span>·</span>
                        <span>📅 {formatTanggalIndonesia(b.tanggal)}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-bold text-[#e5a93c] font-mono">
                        {formatRupiah(b.biaya)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Est. Komisi: {formatRupiah(Math.round(b.biaya * (currentBarber.persentaseKomisi / 100)))}
                      </div>
                    </div>
                  </div>

                  {b.jenisLayanan === 'Home Service' && b.alamatHomeService && (
                    <div className="bg-black/30 rounded-lg p-2 text-[11px] text-amber-200/90 border border-amber-500/20">
                      📍 <strong>Lokasi Home Service:</strong> {b.alamatHomeService}
                    </div>
                  )}

                  {b.catatanKhusus && (
                    <div className="text-[11px] text-slate-300 bg-white/5 p-2 rounded-lg italic">
                      ✂️ Catatan Pelanggan: "{b.catatanKhusus}"
                    </div>
                  )}

                  {/* Action Buttons for Barber */}
                  <div className="pt-2 border-t border-white/10 flex items-center justify-end gap-2">
                    {b.status === 'Menunggu' && (
                      <button
                        onClick={() => updateBookingStatus(b.id, 'Dikonfirmasi')}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
                      >
                        Konfirmasi Jadwal
                      </button>
                    )}
                    {b.status !== 'Selesai' && (
                      <button
                        onClick={() => handleOpenPayment(b.id)}
                        className="px-3.5 py-1.5 rounded-lg bg-[#e5a93c] hover:bg-[#f5b73d] text-[#062320] font-bold text-xs flex items-center gap-1.5"
                      >
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>Selesaikan & Bayar</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upload Modal */}
        {isUploadModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4">
            <form
              onSubmit={handleSaveCutPhoto}
              className="w-full max-w-md bg-[#0b322c] border border-white/20 rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl text-slate-100 space-y-3"
            >
              <h3 className="font-bold text-sm text-white">Unggah Hasil Potongan Rambut</h3>
              <p className="text-[11px] text-slate-400">
                Foto akan otomatis diarsipkan ke folder Google Drive dan galeri portofolio.
              </p>

              <div>
                <label className="text-[11px] text-slate-300 block mb-1">Nama Pelanggan:</label>
                <input
                  type="text"
                  required
                  value={uploadCustName}
                  onChange={(e) => setUploadCustName(e.target.value)}
                  placeholder="Contoh: Dimas Kurniawan"
                  className="w-full bg-[#062320] border border-white/10 rounded-lg p-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-300 block mb-1">Model Potongan:</label>
                <input
                  type="text"
                  required
                  value={uploadModel}
                  onChange={(e) => setUploadModel(e.target.value)}
                  placeholder="Contoh: Low Fade + Textured Quiff"
                  className="w-full bg-[#062320] border border-white/10 rounded-lg p-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-300 block mb-1">Catatan Gaya / Clipper Guard:</label>
                <textarea
                  rows={2}
                  value={uploadNotes}
                  onChange={(e) => setUploadNotes(e.target.value)}
                  placeholder="Catatan nomor pisau clipper, arah sisir, pomade yang digunakan..."
                  className="w-full bg-[#062320] border border-white/10 rounded-lg p-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-300 block mb-1">Pilih File Foto (Kamera / Drive):</label>
                <div className="border border-dashed border-white/20 rounded-lg p-3 text-center text-xs text-slate-300 bg-white/5">
                  <Upload className="w-5 h-5 mx-auto mb-1 text-[#e5a93c]" />
                  <span>Ambil foto langsung atau pilih dari galeri</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={() => {
                      setUploadPhotoUrl(
                        'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=500&q=80'
                      );
                    }}
                    className="mt-2 text-[10px] w-full"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/10 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#e5a93c] text-[#062320] text-xs font-bold"
                >
                  Simpan ke Drive
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Payment Confirmation Modal */}
        {payingBookingId && (
          <PaymentModal
            bookingId={payingBookingId}
            amount={payAmount}
            method={payMethod}
            note={payNote}
            lastReceiptUrl={lastReceiptUrl}
            onMethodChange={setPayMethod}
            onAmountChange={setPayAmount}
            onNoteChange={setPayNote}
            onSubmit={handleConfirmPayment}
            onClose={() => setPayingBookingId(null)}
          />
        )}
      </div>
    );
  }

  /* =======================================================================
     VIEW 2: PUBLIC / CALON PEGAWAI (Form Pendaftaran Pegawai Baru)
     ======================================================================= */
  if (currentRole === 'customer') {
    return (
      <div className="space-y-6 pb-24">
        {/* Header */}
        <div className="px-1">
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <ScissorsIcon className="w-5 h-5 text-[#e5a93c]" />
            Karir Barber & Otomatisasi GAS
          </h1>
          <p className="text-xs text-slate-300">
            Bergabunglah dengan tim barber SalonCukurKilat atau pasang backend Google Apps Script.
          </p>
        </div>

        {/* 1. Form Pendaftaran Calon Pegawai (PRD Section 5.5) */}
        <div className="bg-[#0b322c] border border-white/10 rounded-2xl p-4 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-white/10">
            <Users className="w-4 h-4 text-[#e5a93c]" />
            <div>
              <h2 className="text-xs font-bold text-white">Formulir Rekrutmen Barber Baru</h2>
              <p className="text-[10px] text-slate-400">
                Pendaftaran publik dengan upload berkas KTP & Kartu Keluarga ke Google Drive aman
              </p>
            </div>
          </div>

          {appSuccess ? (
            <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-xl p-4 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <h3 className="font-bold text-sm text-white">Lamaran Berhasil Terkirim!</h3>
              <p className="text-xs text-slate-300">
                Data Anda telah masuk ke Sheet `Pendaftaran_Pegawai` dan dokumen KTP/KK tersimpan di folder Drive rahasia pemilik. Admin akan segera menghubungi via WhatsApp.
              </p>
              <button
                onClick={() => setAppSuccess(false)}
                className="mt-2 px-4 py-2 rounded-lg bg-white/10 text-xs font-medium text-slate-200"
              >
                Kirim Lamaran Lain
              </button>
            </div>
          ) : (
            <form onSubmit={handleJobSubmit} className="space-y-3">
              <div>
                <label className="text-[11px] text-slate-300 block mb-1">
                  Nama Lengkap: <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={appNama}
                  onChange={(e) => setAppNama(e.target.value)}
                  placeholder="Contoh: Yusuf Arifin"
                  className="w-full bg-[#062320] border border-white/10 rounded-lg p-2.5 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-slate-300 block mb-1">
                    No. WhatsApp: <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={appWa}
                    onChange={(e) => setAppWa(e.target.value)}
                    placeholder="0812xxxxxxx"
                    className="w-full bg-[#062320] border border-white/10 rounded-lg p-2.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-300 block mb-1">
                    Pengalaman (Tahun):
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={30}
                    value={appExp}
                    onChange={(e) => setAppExp(Number(e.target.value))}
                    className="w-full bg-[#062320] border border-white/10 rounded-lg p-2.5 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-300 block mb-1">
                  Domisili / Alamat:
                </label>
                <input
                  type="text"
                  value={appAlamat}
                  onChange={(e) => setAppAlamat(e.target.value)}
                  placeholder="Kota / Daerah domisili..."
                  className="w-full bg-[#062320] border border-white/10 rounded-lg p-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-300 block mb-1">
                  Spesialisasi Potongan:
                </label>
                <input
                  type="text"
                  value={appSpecialty}
                  onChange={(e) => setAppSpecialty(e.target.value)}
                  placeholder="Misal: Low Skin Fade, Classic Razor, Korean Comma Hair"
                  className="w-full bg-[#062320] border border-white/10 rounded-lg p-2.5 text-xs text-white"
                />
              </div>

              {/* Upload KTP & KK */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="border border-dashed border-white/20 rounded-xl p-3 bg-white/5 text-center">
                  <FileText className="w-5 h-5 mx-auto text-[#e5a93c] mb-1" />
                  <span className="text-[10px] font-bold block text-white">Unggah KTP</span>
                  <span className="text-[9px] text-slate-400 block truncate">{appKtp}</span>
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    onChange={(e) => setAppKtp(e.target.files?.[0]?.name || 'KTP_Uploaded.pdf')}
                    className="mt-2 text-[9px] w-full"
                  />
                </div>

                <div className="border border-dashed border-white/20 rounded-xl p-3 bg-white/5 text-center">
                  <FileText className="w-5 h-5 mx-auto text-[#e5a93c] mb-1" />
                  <span className="text-[10px] font-bold block text-white">Unggah KK</span>
                  <span className="text-[9px] text-slate-400 block truncate">{appKk}</span>
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    onChange={(e) => setAppKk(e.target.files?.[0]?.name || 'KK_Uploaded.pdf')}
                    className="mt-2 text-[9px] w-full"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#e5a93c] hover:bg-[#f5b73d] text-[#062320] font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md min-h-[44px]"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Kirim Berkas Lamaran</span>
              </button>
            </form>
          )}
        </div>

        {/* 2. Google Apps Script Architecture Preview */}
        <div className="bg-[#0b322c] border border-white/10 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#e5a93c]" />
              <h2 className="text-xs font-bold text-white">Google Apps Script (GAS) Engine</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadGas}
                className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
              >
                <Download className="w-3 h-3" />
                <span>Unduh Code.gs</span>
              </button>
              <button
                onClick={handleCopyGas}
                className="text-[11px] text-[#e5a93c] hover:underline flex items-center gap-1 font-semibold"
              >
                <Copy className="w-3 h-3" />
                <span>{isCopied ? 'Tersalin!' : 'Salin Code.gs'}</span>
              </button>
            </div>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            SalonCukurKilat dirancang untuk berjalan di atas Google Apps Script dengan database Google Sheets (8 lembar otomatis) dan Google Drive. Fitur locking <code>LockService.getScriptLock()</code> menjamin pencegahan tabrakan antrean secara real-time.
          </p>

          <pre className="bg-[#062320] text-amber-200/90 text-[10px] font-mono p-3 rounded-xl overflow-x-auto max-h-48 border border-white/5">
            {GAS_CODE_GS.slice(0, 800)}...
          </pre>
        </div>
      </div>
    );
  }

  /* =======================================================================
     VIEW 3: ADMIN / SUPERADMIN (PEMILIK) DASHBOARD
     ======================================================================= */
  return (
    <div className="space-y-5 pb-24">
      {/* Admin Title */}
      <div className="px-1 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Sliders className="w-5 h-5 text-[#e5a93c]" />
            Dashboard Pemilik (Superadmin)
          </h1>
          <p className="text-xs text-slate-300">
            Kendali operasional, omset, stok, pelamar, dan integrasi GAS
          </p>
        </div>
      </div>

      {/* Admin Subnav Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-[#0b322c] rounded-xl border border-white/10 overflow-x-auto">
        <button
          onClick={() => setAdminTab('keuangan')}
          className={`px-3 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
            adminTab === 'keuangan'
              ? 'bg-[#e5a93c] text-[#062320] shadow-sm'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          Keuangan & Komisi
        </button>
        <button
          onClick={() => setAdminTab('jadwal')}
          className={`px-3 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
            adminTab === 'jadwal'
              ? 'bg-[#e5a93c] text-[#062320] shadow-sm'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          Semua Jadwal ({bookings.length})
        </button>
        <button
          onClick={() => setAdminTab('stok')}
          className={`relative px-3 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
            adminTab === 'stok'
              ? 'bg-[#e5a93c] text-[#062320] shadow-sm'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          Stok Produk
          {lowStockItems.length > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[9px]">
              {lowStockItems.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setAdminTab('pelamar')}
          className={`px-3 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
            adminTab === 'pelamar'
              ? 'bg-[#e5a93c] text-[#062320] shadow-sm'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          Pelamar ({pendaftaran.length})
        </button>
        <button
          onClick={() => setAdminTab('loyalty')}
          className={`px-3 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
            adminTab === 'loyalty'
              ? 'bg-[#e5a93c] text-[#062320] shadow-sm'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          Pengaturan
        </button>
        <button
          onClick={() => setAdminTab('gas')}
          className={`px-3 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
            adminTab === 'gas'
              ? 'bg-[#e5a93c] text-[#062320] shadow-sm'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          Pasang GAS
        </button>
      </div>

      {/* 1. Keuangan & Komisi Tab */}
      {adminTab === 'keuangan' && (
        <div className="space-y-4">
          {/* Top Summary Cards */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-[#0b322c] border border-white/10 rounded-xl p-3">
              <div className="text-[10px] text-slate-400">Total Omset</div>
              <div className="text-sm font-bold text-[#e5a93c] font-mono mt-0.5 truncate">
                {formatRupiah(totalOmset)}
              </div>
            </div>
            <div className="bg-[#0b322c] border border-white/10 rounded-xl p-3">
              <div className="text-[10px] text-slate-400">Total Komisi</div>
              <div className="text-sm font-bold text-emerald-400 font-mono mt-0.5 truncate">
                {formatRupiah(totalKomisiAll)}
              </div>
            </div>
            <div className="bg-[#0b322c] border border-white/10 rounded-xl p-3">
              <div className="text-[10px] text-slate-400">Net Salon</div>
              <div className="text-sm font-bold text-white font-mono mt-0.5 truncate">
                {formatRupiah(totalNetSalon)}
              </div>
            </div>
          </div>

          {/* Breakdown Komisi per Barber */}
          <div className="bg-[#0b322c] border border-white/10 rounded-2xl p-4 space-y-3">
            <h2 className="text-xs font-bold text-white flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-[#e5a93c]" />
              Rekap Komisi Barber (Otomatis Sesuai Persentase)
            </h2>

            <div className="space-y-2">
              {barbers.map((barber) => {
                const bPayments = pembayaran.filter((p) => p.barberId === barber.id);
                const bTotalRevenue = bPayments.reduce((acc, p) => acc + p.nominal, 0);
                const bCommission = bPayments.reduce((acc, p) => acc + p.komisiBarber, 0);

                return (
                  <div
                    key={barber.id}
                    className="p-3 bg-black/20 rounded-xl border border-white/5 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-800 border border-white/10">
                        <img
                          src={barber.avatar}
                          alt={barber.nama}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">
                          {barber.nama}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Tarif Komisi: {barber.persentaseKomisi}% · {bPayments.length} transaksi
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-bold text-[#e5a93c] font-mono">
                        {formatRupiah(bCommission)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Omset: {formatRupiah(bTotalRevenue)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Log Transaksi Terkini */}
          <div className="bg-[#0b322c] border border-white/10 rounded-2xl p-4 space-y-3">
            <h2 className="text-xs font-bold text-white">Riwayat Transaksi Masuk (Sheet `Pembayaran`)</h2>
            <div className="space-y-2">
              {pembayaran.map((p) => (
                <div
                  key={p.id}
                  className="p-2.5 rounded-lg bg-black/20 border border-white/5 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-semibold text-white">
                      {p.pelangganNama} · <span className="text-[#e5a93c]">{p.metodeBayar}</span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Barber: {p.barberNama} · {p.tanggal}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-white font-mono">
                      {formatRupiah(p.nominal)}
                    </div>
                    <div className="text-[10px] text-emerald-400">
                      Komisi: {formatRupiah(p.komisiBarber)} ({p.persentaseKomisi}%)
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. Jadwal Booking Tab */}
      {adminTab === 'jadwal' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold text-white">Semua Jadwal Studio & Home Service</h2>
            <span className="text-[11px] text-slate-400 font-mono">
              Total {bookings.length}
            </span>
          </div>

          <div className="space-y-2.5">
            {bookings.map((b) => (
              <div
                key={b.id}
                className="bg-[#0b322c] border border-white/10 rounded-xl p-3.5 space-y-2.5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">{b.pelangganNama}</span>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                          b.status === 'Selesai'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : b.status === 'Dikonfirmasi'
                            ? 'bg-blue-500/20 text-blue-400'
                            : b.status === 'Batal'
                            ? 'bg-rose-500/20 text-rose-400'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {b.status}
                      </span>
                    </div>
                    <div className="text-xs text-[#e5a93c] font-medium mt-0.5">
                      {b.layananNama} · <span className="text-white">{b.jenisLayanan}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Kapster: <strong>{b.kapsterNama}</strong> · {formatTanggalIndonesia(b.tanggal)} pukul {b.jam}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-bold text-[#e5a93c] font-mono">
                      {formatRupiah(b.biaya)}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">{b.id}</div>
                  </div>
                </div>

                {b.alamatHomeService && (
                  <div className="text-[11px] text-amber-200/90 bg-black/30 p-2 rounded-lg">
                    📍 {b.alamatHomeService}
                  </div>
                )}

                {/* Status Switcher & WhatsApp Receipt Trigger */}
                <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-400">Ubah:</span>
                    <select
                      value={b.status}
                      onChange={(e) =>
                        updateBookingStatus(b.id, e.target.value as BookingStatus)
                      }
                      className="bg-[#062320] border border-white/10 rounded px-2 py-1 text-xs text-white"
                    >
                      <option value="Menunggu">Menunggu</option>
                      <option value="Dikonfirmasi">Dikonfirmasi</option>
                      <option value="Selesai">Selesai</option>
                      <option value="Batal">Batal</option>
                    </select>
                  </div>

                  {b.status !== 'Selesai' && (
                    <button
                      onClick={() => handleOpenPayment(b.id)}
                      className="px-3 py-1.5 rounded-lg bg-[#e5a93c] hover:bg-[#f5b73d] text-[#062320] font-bold text-xs"
                    >
                      Bayar & Struk WA
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Stok Produk Tab */}
      {adminTab === 'stok' && (
        <div className="space-y-4">
          {/* Low Stock Warning Alert */}
          {lowStockItems.length > 0 && (
            <div className="bg-amber-950/60 border border-amber-500/40 rounded-xl p-3.5 flex items-start gap-2.5 text-amber-200 text-xs">
              <AlertTriangle className="w-5 h-5 text-[#e5a93c] shrink-0" />
              <div>
                <strong className="block font-bold">
                  Peringatan: {lowStockItems.length} Produk Mencapai Batas Minimum!
                </strong>
                <span className="text-[11px] opacity-90">
                  Segera pesan ulang pasokan pomade, shaving cream, atau konsumabel untuk kelancaran operasional.
                </span>
              </div>
            </div>
          )}

          <div className="space-y-2.5">
            {stok.map((item) => {
              const isLow = item.stokSaatIni <= item.minimumStok;
              return (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isLow
                      ? 'bg-[#0b322c] border-amber-500/40'
                      : 'bg-[#0b322c] border-white/10'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        {item.namaProduk}
                        {isLow && (
                          <span className="bg-rose-500/20 text-rose-400 text-[9px] font-bold px-1.5 py-0.2 rounded border border-rose-500/30">
                            MENIPIS
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Kategori: {item.kategori} · Min. Stok: {item.minimumStok} {item.satuan}
                      </div>
                      <div className="text-xs text-[#e5a93c] font-bold font-mono mt-1">
                        {formatRupiah(item.harga)}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateStock(item.id, -1)}
                        className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-300 active:scale-95"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-mono font-bold text-sm text-white w-7 text-center">
                        {item.stokSaatIni}
                      </span>
                      <button
                        onClick={() => updateStock(item.id, 1)}
                        className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 flex items-center justify-center active:scale-95"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Pelamar Pegawai Baru Tab */}
      {adminTab === 'pelamar' && (
        <div className="space-y-3">
          <div className="px-1">
            <h2 className="text-xs font-bold text-white">Daftar Pelamar Barber (Sheet `Pendaftaran_Pegawai`)</h2>
            <p className="text-[11px] text-slate-400">
              Jika lamaran diterima, akun barber baru otomatis aktif dalam sistem
            </p>
          </div>

          <div className="space-y-3">
            {pendaftaran.map((pelamar) => (
              <div
                key={pelamar.id}
                className="bg-[#0b322c] border border-white/10 rounded-xl p-3.5 space-y-2.5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-white">
                        {pelamar.nama}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                          pelamar.statusLamaran === 'Diterima'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : pelamar.statusLamaran === 'Ditolak'
                            ? 'bg-rose-500/20 text-rose-400'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {pelamar.statusLamaran}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-300 mt-0.5">
                      WA: <strong>{pelamar.noWa}</strong> · Pengalaman: {pelamar.pengalamanTahun} Tahun
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Spesialisasi: {pelamar.spesialisasi}
                    </div>
                  </div>
                </div>

                {/* Drive Files Simulation */}
                <div className="flex items-center gap-2 text-[10px] text-[#e5a93c] bg-black/20 p-2 rounded-lg">
                  <FileText className="w-3.5 h-3.5" />
                  <span>KTP: {pelamar.ktpFileName}</span>
                  <span>·</span>
                  <span>KK: {pelamar.kkFileName}</span>
                </div>

                {pelamar.catatanInterview && (
                  <p className="text-[11px] text-slate-300 italic">
                    Catatan: "{pelamar.catatanInterview}"
                  </p>
                )}

                {/* Decision Actions */}
                <div className="pt-2 border-t border-white/10 flex items-center justify-end gap-2">
                  <button
                    onClick={() => updateApplicantStatus(pelamar.id, 'Ditolak')}
                    className="px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 text-xs font-semibold"
                  >
                    Tolak
                  </button>
                  <button
                    onClick={() => updateApplicantStatus(pelamar.id, 'Diproses')}
                    className="px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 text-xs font-semibold"
                  >
                    Jadwal Tes
                  </button>
                  <button
                    onClick={() => updateApplicantStatus(pelamar.id, 'Diterima')}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                  >
                    Terima Jadi Barber
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Pengaturan Loyalty & Kontrol Galeri Tab */}
      {adminTab === 'loyalty' && (
        <div className="space-y-5">
          <div className="bg-[#0b322c] border border-white/10 rounded-2xl p-4 space-y-4">
            <h2 className="text-xs font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#e5a93c]" />
              Pengaturan Aturan Loyalty Member (Sheet `Pengaturan_Loyalty`)
            </h2>
            <p className="text-[11px] text-slate-300">
              Admin dapat menentukan berapa kali kunjungan sebelum pelanggan berhak mendapatkan 1x potong gratis tanpa mengubah baris kode apapun.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-slate-300 block mb-1">
                  Jumlah Kunjungan untuk Reward Gratis:
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={3}
                    max={30}
                    value={loyaltyVisitsInput}
                    onChange={(e) => setLoyaltyVisitsInput(Number(e.target.value))}
                    className="w-24 bg-[#062320] border border-white/10 rounded-lg p-2 text-xs text-[#e5a93c] font-bold font-mono"
                  />
                  <button
                    onClick={() => {
                      updateLoyaltySettings({
                        ...loyaltySettings,
                        jumlahKunjunganReward: loyaltyVisitsInput,
                      });
                      setLoyaltySavedToast(true);
                      setTimeout(() => setLoyaltySavedToast(false), 2500);
                    }}
                    className="px-4 py-2 rounded-lg bg-[#e5a93c] text-[#062320] font-bold text-xs"
                  >
                    {loyaltySavedToast ? 'Tersimpan!' : 'Simpan Aturan'}
                  </button>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 bg-white/5 p-3 rounded-xl space-y-1">
                <div>• Syarat Rating Minimum: 5.0 Bintang Konsisten</div>
                <div>• Review Wajib: Ya (harus menulis ulasan)</div>
                <div>• Nominal Nilai Reward: Gratis 1x Potongan Studio</div>
              </div>
            </div>
          </div>

          {/* Kontrol Galeri Depan */}
          <div className="bg-[#0b322c] border border-white/10 rounded-2xl p-4 space-y-3">
            <h2 className="text-xs font-bold text-white flex items-center gap-2">
              <Eye className="w-4 h-4 text-[#e5a93c]" />
              Kontrol Tampilan Galeri Depan (Running Marquee)
            </h2>
            <div className="space-y-2">
              {riwayatPotong.map((r) => (
                <div
                  key={r.id}
                  className="p-2.5 rounded-lg bg-black/20 border border-white/5 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <img
                      src={r.fotoUrl}
                      alt={r.modelPotongan}
                      referrerPolicy="no-referrer"
                      className="w-8 h-8 rounded object-cover"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                    <div>
                      <div className="font-semibold text-white">{r.modelPotongan}</div>
                      <div className="text-[10px] text-slate-400">
                        {r.pelangganNama} · Oleh {r.barberNama}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleGaleriVisibility(r.id)}
                    className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all ${
                      r.tampilkanDiGaleri
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-white/5 text-slate-400 border border-white/10'
                    }`}
                  >
                    {r.tampilkanDiGaleri ? 'Tampil di Depan' : 'Disembunyikan'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 6. Google Apps Script Setup & Cloud Sync Tab */}
      {adminTab === 'gas' && (
        <div className="space-y-4">
          {/* Live Cloud Connection Card */}
          <form
            onSubmit={handleSaveAndSyncGasUrl}
            className="bg-[#0b322c] border border-[#e5a93c]/40 rounded-2xl p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cloud className="w-4 h-4 text-[#e5a93c]" />
                <h2 className="text-xs font-bold text-white">
                  Koneksi Live ke Google Apps Script Web App
                </h2>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  gasSyncStatus === 'connected'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : gasSyncStatus === 'syncing'
                    ? 'bg-blue-500/20 text-blue-300'
                    : gasSyncStatus === 'error'
                    ? 'bg-rose-500/20 text-rose-400'
                    : 'bg-white/10 text-slate-300'
                }`}
              >
                {gasSyncStatus === 'connected'
                  ? 'Terkoneksi Sheets'
                  : gasSyncStatus === 'syncing'
                  ? 'Sinkronisasi...'
                  : gasSyncStatus === 'error'
                  ? 'Gagal Koneksi'
                  : 'Mode Lokal'}
              </span>
            </div>

            <p className="text-[11px] text-slate-300">
              Tempel URL Web App (berakhiran <code>/exec</code>) dari hasil Deploy Google Apps Script Anda agar semua booking, pembayaran, dan stok tersimpan langsung di Google Sheets Anda.
            </p>

            <div>
              <input
                type="url"
                value={gasUrlInput}
                onChange={(e) => setGasUrlInput(e.target.value)}
                placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                className="w-full bg-[#062320] border border-white/15 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#e5a93c]"
              />
            </div>

            {syncMessage && (
              <div className="text-[11px] text-emerald-400 font-medium">
                {syncMessage}
              </div>
            )}
            {gasLastError && (
              <div className="text-[11px] text-rose-400 font-medium">
                {gasLastError}
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="flex-1 py-2.5 px-3 rounded-xl bg-[#e5a93c] hover:bg-[#f5b73d] text-[#062320] font-bold text-xs flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Simpan & Sinkronkan</span>
              </button>
            </div>
          </form>

          {/* Step-by-Step Guide Card */}
          <div className="bg-[#0b322c] border border-white/10 rounded-2xl p-4 space-y-2.5">
            <h3 className="text-xs font-bold text-[#e5a93c]">
              Panduan 4 Langkah Pasang di Google Apps Script:
            </h3>
            <ol className="text-[11px] text-slate-300 space-y-2 list-decimal list-inside leading-relaxed">
              <li>
                Buka <strong>Google Sheets baru</strong> (ketik <code>sheets.new</code> di browser), lalu klik menu <strong>Ekstensi &gt; Apps Script</strong>.
              </li>
              <li>
                Hapus isi <code>Kode.gs</code> bawaan, lalu klik tombol <strong>Salin Skrip</strong> di bawah dan tempelkan ke editor Apps Script, lalu tekan <strong>Ctrl+S (Simpan)</strong>.
              </li>
              <li>
                Pilih fungsi <code>setupSalonSheets</code> di dropdown atas editor, lalu klik <strong>Jalankan (Run)</strong> dan berikan izin akses (Review Permissions &gt; Advanced &gt; Go to project). Otomatis 8 Sheet database langsung terbuat!
              </li>
              <li>
                Klik <strong>Terapkan (Deploy) &gt; Deployment Baru</strong>, pilih jenis <strong>Aplikasi Web (Web App)</strong>, setel <em>Jalankan sebagai: Saya (Me)</em> dan <em>Yang memiliki akses: Siapa saja (Anyone)</em>. Salin URL <code>/exec</code> ke kotak di atas!
              </li>
            </ol>
          </div>

          {/* Code.gs Box */}
          <div className="bg-[#0b322c] border border-white/10 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xs font-bold text-white">Script Backend Lengkap (Code.gs)</h2>
                <p className="text-[10px] text-slate-400">
                  Sudah teruji bebas error & dilengkapi LockService anti-bentrok
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadGas}
                  className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-emerald-400 font-bold text-xs flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh</span>
                </button>
                <button
                  onClick={handleCopyGas}
                  className="px-3 py-1.5 rounded-lg bg-[#e5a93c] text-[#062320] font-bold text-xs flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{isCopied ? 'Tersalin!' : 'Salin Skrip'}</span>
                </button>
              </div>
            </div>

            <pre className="bg-[#062320] text-emerald-300 font-mono text-[10px] p-3.5 rounded-xl overflow-x-auto max-h-80 border border-white/10">
              {GAS_CODE_GS}
            </pre>
          </div>
        </div>
      )}

      {/* Payment Confirmation Modal */}
      {payingBookingId && (
        <PaymentModal
          bookingId={payingBookingId}
          amount={payAmount}
          method={payMethod}
          note={payNote}
          lastReceiptUrl={lastReceiptUrl}
          onMethodChange={setPayMethod}
          onAmountChange={setPayAmount}
          onNoteChange={setPayNote}
          onSubmit={handleConfirmPayment}
          onClose={() => setPayingBookingId(null)}
        />
      )}
    </div>
  );
};

// Reusable Payment & WhatsApp Receipt Modal
interface PaymentModalProps {
  bookingId: string;
  amount: number;
  method: PaymentMethod;
  note: string;
  lastReceiptUrl: string | null;
  onMethodChange: (m: PaymentMethod) => void;
  onAmountChange: (a: number) => void;
  onNoteChange: (n: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  amount,
  method,
  note,
  lastReceiptUrl,
  onMethodChange,
  onAmountChange,
  onNoteChange,
  onSubmit,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in">
      <div className="w-full max-w-md bg-[#0b322c] border-t sm:border border-white/20 rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl text-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <div>
            <h3 className="font-bold text-sm text-white">Pencatatan Pembayaran & Struk WA</h3>
            <p className="text-[10px] text-slate-400">
              Otomatis menghitung komisi barber dan kirim struk digital
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-white"
          >
            Tutup
          </button>
        </div>

        {lastReceiptUrl ? (
          <div className="space-y-4 text-center py-2">
            <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white">Pembayaran Sukses Dicatat!</h4>
              <p className="text-xs text-slate-300 mt-1">
                Komisi barber telah dihitung secara otomatis dan kunjungan pelanggan bertambah +1.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <a
                href={lastReceiptUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md"
              >
                <Send className="w-4 h-4" />
                <span>Kirim Struk Digital via WhatsApp (wa.me)</span>
              </a>
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-white/10 text-xs font-semibold text-slate-200"
              >
                Selesai
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-3">
            <div>
              <label className="text-[11px] text-slate-300 block mb-1">Metode Bayar:</label>
              <div className="grid grid-cols-3 gap-2">
                {(['QRIS', 'Cash', 'Transfer'] as PaymentMethod[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => onMethodChange(m)}
                    className={`py-2 rounded-lg text-xs font-bold border transition-all ${
                      method === m
                        ? 'bg-[#e5a93c] text-[#062320] border-[#e5a93c]'
                        : 'bg-white/5 border-white/10 text-slate-300'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[11px] text-slate-300 block mb-1">Nominal (Rp):</label>
              <input
                type="number"
                required
                value={amount}
                onChange={(e) => onAmountChange(Number(e.target.value))}
                className="w-full bg-[#062320] border border-white/10 rounded-lg p-2.5 text-xs text-[#e5a93c] font-bold font-mono"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-300 block mb-1">Catatan Struk:</label>
              <input
                type="text"
                value={note}
                onChange={(e) => onNoteChange(e.target.value)}
                placeholder="Misal: Diskon promo member, potong gratis ke-15, dll"
                className="w-full bg-[#062320] border border-white/10 rounded-lg p-2.5 text-xs text-white"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#e5a93c] hover:bg-[#f5b73d] text-[#062320] font-bold text-xs shadow-md mt-2"
            >
              Simpan & Generate Struk WA
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
