export type UserRole = 'customer' | 'barber' | 'admin';

export type ServiceType = 'Studio' | 'Home Service';

export type BookingStatus = 'Menunggu' | 'Dikonfirmasi' | 'Selesai' | 'Batal';

export type PaymentMethod = 'Cash' | 'QRIS' | 'Transfer';

export type PaymentStatus = 'Lunas' | 'Belum' | 'Cicilan';

export type ApplicantStatus = 'Baru' | 'Diproses' | 'Diterima' | 'Ditolak';

export interface ServiceItem {
  id: string;
  name: string;
  durationMinutes: number;
  priceStudio: number;
  priceHomeService: number;
  description: string;
  popular?: boolean;
}

export interface Customer {
  id: string;
  nama: string;
  noWa: string;
  alamat?: string;
  totalKunjungan: number;
  statusMember: 'Aktif' | 'Non-aktif';
  riwayatBintang5Konsisten: boolean;
  poinTerkumpul: number;
}

export interface Barber {
  id: string;
  nama: string;
  nickname: string;
  noWa: string;
  spesialisasi: string;
  status: 'Aktif' | 'Nonaktif';
  persentaseKomisi: number; // e.g. 40
  avatar: string;
  rating: number;
  totalPotong: number;
  jamMulai: string;
  jamSelesai: string;
}

export interface Booking {
  id: string;
  pelangganId: string;
  pelangganNama: string;
  pelangganWa: string;
  jenisLayanan: ServiceType;
  alamatHomeService?: string;
  tanggal: string; // YYYY-MM-DD
  jam: string; // HH:mm
  layananId: string;
  layananNama: string;
  biaya: number;
  kapsterId: string;
  kapsterNama: string;
  status: BookingStatus;
  catatanKhusus?: string;
  createdAt: string;
}

export interface RiwayatPotong {
  id: string;
  pelangganId: string;
  pelangganNama: string;
  barberId: string;
  barberNama: string;
  tanggal: string;
  modelPotongan: string;
  catatanGaya: string;
  fotoUrl: string;
  rating: number;
  review: string;
  tampilkanDiGaleri: boolean;
}

export interface Pembayaran {
  id: string;
  bookingId: string;
  pelangganNama: string;
  barberId: string;
  barberNama: string;
  tanggal: string;
  metodeBayar: PaymentMethod;
  nominal: number;
  status: PaymentStatus;
  noReferensi: string;
  catatan?: string;
  persentaseKomisi: number;
  komisiBarber: number;
  adminPencatat: string;
}

export interface PendaftaranPegawai {
  id: string;
  nama: string;
  noWa: string;
  alamat: string;
  pengalamanTahun: number;
  spesialisasi: string;
  ktpFileName: string;
  kkFileName: string;
  statusLamaran: ApplicantStatus;
  tanggalDaftar: string;
  catatanInterview?: string;
}

export interface StokProduk {
  id: string;
  namaProduk: string;
  kategori: string;
  stokSaatIni: number;
  minimumStok: number;
  harga: number;
  satuan: string;
}

export interface PengaturanLoyalty {
  jumlahKunjunganReward: number;
  syaratRatingMin: number;
  syaratReviewWajib: boolean;
  diskonGratisNominal: number;
}
