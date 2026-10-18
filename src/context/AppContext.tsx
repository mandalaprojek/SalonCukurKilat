import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  ApplicantStatus,
  Barber,
  Booking,
  BookingStatus,
  Customer,
  PaymentMethod,
  Pembayaran,
  PendaftaranPegawai,
  PengaturanLoyalty,
  RiwayatPotong,
  ServiceItem,
  StokProduk,
  UserRole,
} from '../types';
import {
  INITIAL_BARBERS,
  INITIAL_BOOKINGS,
  INITIAL_CUSTOMERS,
  INITIAL_LOYALTY_SETTINGS,
  INITIAL_PEMBAYARAN,
  INITIAL_PENDAFTARAN,
  INITIAL_RIWAYAT_POTONG,
  INITIAL_SERVICES,
  INITIAL_STOK,
} from '../data/mockData';

// Declaration for Google Apps Script HtmlService environment
declare global {
  interface Window {
    google?: {
      script?: {
        run?: {
          withSuccessHandler: (cb: (res: unknown) => void) => {
            withFailureHandler: (errCb: (err: unknown) => void) => {
              gasGetInitialData: () => void;
              gasDispatchAction: (action: string, payload: unknown) => void;
            };
          };
        };
      };
    };
  }
}

interface AppContextType {
  // Authentication & Roles
  isLoggedIn: boolean;
  setIsLoggedIn: (val: boolean) => void;
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  selectedBarberId: string;
  setSelectedBarberId: (barberId: string) => void;
  activeCustomer: Customer;
  setActiveCustomerId: (id: string) => void;
  loginWithCustomerWa: (nama: string, noWa: string) => void;
  logout: () => void;

  // GAS Cloud Sync
  gasWebAppUrl: string;
  setGasWebAppUrl: (url: string) => void;
  gasSyncStatus: 'local' | 'syncing' | 'connected' | 'error';
  gasLastError: string | null;
  syncFromGas: (customUrl?: string) => Promise<boolean>;

  // Data
  services: ServiceItem[];
  barbers: Barber[];
  customers: Customer[];
  bookings: Booking[];
  riwayatPotong: RiwayatPotong[];
  pembayaran: Pembayaran[];
  stok: StokProduk[];
  pendaftaran: PendaftaranPegawai[];
  loyaltySettings: PengaturanLoyalty;

  // Handlers
  createBooking: (
    bookingData: Omit<Booking, 'id' | 'createdAt' | 'status'>
  ) => { success: boolean; message: string; bookingId?: string };
  updateBookingStatus: (id: string, status: BookingStatus) => void;
  processPayment: (
    bookingId: string,
    metode: PaymentMethod,
    nominal: number,
    catatan?: string
  ) => { success: boolean; trxId: string; komisi: number; updatedVisits: number };
  addRiwayatPotong: (riwayat: Omit<RiwayatPotong, 'id'>) => void;
  toggleGaleriVisibility: (id: string) => void;
  submitReview: (id: string, rating: number, review: string) => void;
  updateStock: (id: string, delta: number) => void;
  submitJobApplication: (
    data: Omit<PendaftaranPegawai, 'id' | 'statusLamaran' | 'tanggalDaftar'>
  ) => { success: boolean; id: string };
  updateApplicantStatus: (
    id: string,
    status: ApplicantStatus,
    catatan?: string
  ) => void;
  updateLoyaltySettings: (settings: PengaturanLoyalty) => void;
  resetAllData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = 'saloncukurkilat_state_v1';
const DEFAULT_GAS_WEB_APP_URL =
  'https://script.google.com/macros/s/AKfycbwRaYx4eaGcI_4e4pDj_lYxQQJmwTNL82ia7xyrq-xxfDTnnqe_dLWNBr6aY7WI5-DXRg/exec';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_logged_in`);
    return saved ? JSON.parse(saved) : false;
  });
  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_role`) as UserRole | null;
    return saved || 'customer';
  });
  const [selectedBarberId, setSelectedBarberId] = useState<string>('BRB-01');
  const [activeCustomerId, setActiveCustomerId] = useState<string>('CUST-001');

  // GAS Web App URL & Sync Status (Defaulted to user's live Apps Script Web App URL)
  const [gasWebAppUrl, setGasWebAppUrlState] = useState<string>(() => {
    return localStorage.getItem(`${STORAGE_KEY}_gas_url`) || DEFAULT_GAS_WEB_APP_URL;
  });
  const [gasSyncStatus, setGasSyncStatus] = useState<'local' | 'syncing' | 'connected' | 'error'>('local');
  const [gasLastError, setGasLastError] = useState<string | null>(null);

  // Datasets initialized from localStorage or defaults
  const [services] = useState<ServiceItem[]>(INITIAL_SERVICES);
  const [barbers, setBarbers] = useState<Barber[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_barbers`);
    return saved ? JSON.parse(saved) : INITIAL_BARBERS;
  });
  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_customers`);
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
  });
  const [bookings, setBookings] = useState<Booking[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_bookings`);
    return saved ? JSON.parse(saved) : INITIAL_BOOKINGS;
  });
  const [riwayatPotong, setRiwayatPotong] = useState<RiwayatPotong[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_riwayat`);
    return saved ? JSON.parse(saved) : INITIAL_RIWAYAT_POTONG;
  });
  const [pembayaran, setPembayaran] = useState<Pembayaran[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_pembayaran`);
    return saved ? JSON.parse(saved) : INITIAL_PEMBAYARAN;
  });
  const [stok, setStok] = useState<StokProduk[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_stok`);
    return saved ? JSON.parse(saved) : INITIAL_STOK;
  });
  const [pendaftaran, setPendaftaran] = useState<PendaftaranPegawai[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_pendaftaran`);
    return saved ? JSON.parse(saved) : INITIAL_PENDAFTARAN;
  });
  const [loyaltySettings, setLoyaltySettings] = useState<PengaturanLoyalty>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_loyalty`);
    return saved ? JSON.parse(saved) : INITIAL_LOYALTY_SETTINGS;
  });

  // Save state to localStorage
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_logged_in`, JSON.stringify(isLoggedIn));
  }, [isLoggedIn]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_role`, currentRole);
  }, [currentRole]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_barbers`, JSON.stringify(barbers));
  }, [barbers]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_customers`, JSON.stringify(customers));
  }, [customers]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_bookings`, JSON.stringify(bookings));
  }, [bookings]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_riwayat`, JSON.stringify(riwayatPotong));
  }, [riwayatPotong]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_pembayaran`, JSON.stringify(pembayaran));
  }, [pembayaran]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_stok`, JSON.stringify(stok));
  }, [stok]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_pendaftaran`, JSON.stringify(pendaftaran));
  }, [pendaftaran]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_loyalty`, JSON.stringify(loyaltySettings));
  }, [loyaltySettings]);

  const setGasWebAppUrl = (url: string) => {
    const trimmed = url.trim();
    setGasWebAppUrlState(trimmed);
    localStorage.setItem(`${STORAGE_KEY}_gas_url`, trimmed);
    if (!trimmed) {
      setGasSyncStatus('local');
      setGasLastError(null);
    }
  };

  const applyServerDataset = useCallback((data: Record<string, unknown>) => {
    if (Array.isArray(data.customers) && data.customers.length > 0) setCustomers(data.customers as Customer[]);
    if (Array.isArray(data.barbers) && data.barbers.length > 0) setBarbers(data.barbers as Barber[]);
    if (Array.isArray(data.bookings)) setBookings(data.bookings as Booking[]);
    if (Array.isArray(data.riwayatPotong)) setRiwayatPotong(data.riwayatPotong as RiwayatPotong[]);
    if (Array.isArray(data.pembayaran)) setPembayaran(data.pembayaran as Pembayaran[]);
    if (Array.isArray(data.stok) && data.stok.length > 0) setStok(data.stok as StokProduk[]);
    if (Array.isArray(data.pendaftaran)) setPendaftaran(data.pendaftaran as PendaftaranPegawai[]);
    if (data.loyaltySettings && typeof data.loyaltySettings === 'object') {
      setLoyaltySettings(data.loyaltySettings as PengaturanLoyalty);
    }
  }, []);

  // Sync from GAS (supports both native google.script.run and fetch URL)
  const syncFromGas = useCallback(async (customUrl?: string): Promise<boolean> => {
    const targetUrl = (customUrl !== undefined ? customUrl : gasWebAppUrl).trim();

    // 1. Check native Google Apps Script HtmlService runtime
    if (window.google?.script?.run) {
      setGasSyncStatus('syncing');
      return new Promise((resolve) => {
        window.google!.script!.run!
          .withSuccessHandler((res) => {
            if (res && typeof res === 'object') {
              applyServerDataset(res as Record<string, unknown>);
              setGasSyncStatus('connected');
              setGasLastError(null);
              resolve(true);
            } else {
              setGasSyncStatus('error');
              setGasLastError('Respons server GAS kosong');
              resolve(false);
            }
          })
          .withFailureHandler((err) => {
            setGasSyncStatus('error');
            setGasLastError(String(err));
            resolve(false);
          })
          .gasGetInitialData();
      });
    }

    // 2. Check Web App URL via fetch
    if (!targetUrl) {
      setGasSyncStatus('local');
      return false;
    }

    try {
      setGasSyncStatus('syncing');
      setGasLastError(null);
      const separator = targetUrl.includes('?') ? '&' : '?';
      const response = await fetch(`${targetUrl}${separator}action=getAllData`, {
        method: 'GET',
        redirect: 'follow',
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      if (data && typeof data === 'object') {
        applyServerDataset(data);
        setGasSyncStatus('connected');
        return true;
      }
      throw new Error('Format JSON tidak dikenali');
    } catch (err) {
      setGasSyncStatus('error');
      setGasLastError(
        err instanceof Error
          ? err.message
          : 'Gagal terhubung ke URL Google Apps Script. Pastikan akses disetel ke "Anyone" (Siapa saja).'
      );
      return false;
    }
  }, [gasWebAppUrl, applyServerDataset]);

  // Helper to send mutations to GAS in background without blocking UI
  const dispatchToGas = useCallback(
    async (action: string, payload: unknown) => {
      if (window.google?.script?.run) {
        window.google.script.run
          .withSuccessHandler(() => setGasSyncStatus('connected'))
          .withFailureHandler((err) => {
            setGasSyncStatus('error');
            setGasLastError(String(err));
          })
          .gasDispatchAction(action, payload);
        return;
      }

      if (!gasWebAppUrl.trim()) return;

      try {
        setGasSyncStatus('syncing');
        // Use text/plain;charset=utf-8 to prevent CORS preflight rejection on script.google.com
        const res = await fetch(gasWebAppUrl.trim(), {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8',
          },
          body: JSON.stringify({ action, payload }),
          redirect: 'follow',
        });
        if (res.ok) {
          setGasSyncStatus('connected');
          setGasLastError(null);
        }
      } catch (err) {
        setGasSyncStatus('error');
        setGasLastError(err instanceof Error ? err.message : 'Gagal sinkronisasi ke GAS');
      }
    },
    [gasWebAppUrl]
  );

  // Auto-init if running inside GAS iframe or if gasWebAppUrl is saved
  useEffect(() => {
    if (window.google?.script?.run || gasWebAppUrl.trim()) {
      syncFromGas();
    }
  }, [gasWebAppUrl, syncFromGas]);

  const activeCustomer =
    customers.find((c) => c.id === activeCustomerId) || customers[0];

  const loginWithCustomerWa = (nama: string, noWa: string) => {
    const cleanWa = noWa.trim();
    const existing = customers.find((c) => c.noWa === cleanWa);
    if (existing) {
      setActiveCustomerId(existing.id);
    } else {
      const newId = `CUST-00${customers.length + 1}`;
      const newCust: Customer = {
        id: newId,
        nama: nama.trim() || 'Pelanggan Baru',
        noWa: cleanWa,
        alamat: '',
        totalKunjungan: 0,
        statusMember: 'Aktif',
        riwayatBintang5Konsisten: true,
        poinTerkumpul: 0,
      };
      setCustomers((prev) => [...prev, newCust]);
      setActiveCustomerId(newId);
    }
    setCurrentRole('customer');
    setIsLoggedIn(true);
  };

  const logout = () => {
    setIsLoggedIn(false);
  };

  // 1. Anti-Bentrok Booking Create
  const createBooking = (
    bookingData: Omit<Booking, 'id' | 'createdAt' | 'status'>
  ) => {
    const isConflict = bookings.some(
      (b) =>
        b.kapsterId === bookingData.kapsterId &&
        b.tanggal === bookingData.tanggal &&
        b.jam === bookingData.jam &&
        b.status !== 'Batal'
    );

    if (isConflict) {
      return {
        success: false,
        message: `Waduh! Slot jam ${bookingData.jam} bersama ${bookingData.kapsterNama} pada tanggal ini baru saja diisi. Silakan pilih slot jam lain.`,
      };
    }

    const newId = `BKG-${Date.now().toString().slice(-4)}`;
    const now = new Date();
    const createdAt = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newBookingItem: Booking = {
      ...bookingData,
      id: newId,
      status: 'Menunggu',
      createdAt,
    };

    setBookings((prev) => [newBookingItem, ...prev]);

    setCustomers((prev) => {
      const existing = prev.find((c) => c.noWa === bookingData.pelangganWa);
      if (existing) {
        return prev.map((c) =>
          c.id === existing.id
            ? { ...c, nama: bookingData.pelangganNama, alamat: bookingData.alamatHomeService || c.alamat }
            : c
        );
      }
      const newCustId = `CUST-00${prev.length + 1}`;
      return [
        ...prev,
        {
          id: newCustId,
          nama: bookingData.pelangganNama,
          noWa: bookingData.pelangganWa,
          alamat: bookingData.alamatHomeService,
          totalKunjungan: 1,
          statusMember: 'Aktif',
          riwayatBintang5Konsisten: true,
          poinTerkumpul: 1,
        },
      ];
    });

    dispatchToGas('createBooking', bookingData);

    return {
      success: true,
      message: 'Booking berhasil dibuat dan disimpan ke antrean!',
      bookingId: newId,
    };
  };

  const updateBookingStatus = (id: string, status: BookingStatus) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status } : b))
    );
    dispatchToGas('updateBookingStatus', { id, status });
  };

  // 2. Process Payment & Barber Commission
  const processPayment = (
    bookingId: string,
    metode: PaymentMethod,
    nominal: number,
    catatan?: string
  ) => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) {
      return { success: false, trxId: '', komisi: 0, updatedVisits: 1 };
    }

    const barber = barbers.find((b) => b.id === booking.kapsterId);
    const commissionRate = barber?.persentaseKomisi || 40;
    const komisi = Math.round(nominal * (commissionRate / 100));
    const trxId = `TRX-${Date.now().toString().slice(-4)}`;
    const noReferensi = `${metode.toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const adminName = currentRole === 'admin' ? 'Admin (Pemilik)' : booking.kapsterNama;

    const newTrx: Pembayaran = {
      id: trxId,
      bookingId,
      pelangganNama: booking.pelangganNama,
      barberId: booking.kapsterId,
      barberNama: booking.kapsterNama,
      tanggal: new Date().toISOString().replace('T', ' ').slice(0, 16),
      metodeBayar: metode,
      nominal,
      status: 'Lunas',
      noReferensi,
      catatan: catatan || 'Pembayaran layanan SalonCukurKilat',
      persentaseKomisi: commissionRate,
      komisiBarber: komisi,
      adminPencatat: adminName,
    };

    setPembayaran((prev) => [newTrx, ...prev]);

    updateBookingStatus(bookingId, 'Selesai');

    // Calculate real customer updated visits
    const matchedCust = customers.find(
      (c) => c.noWa === booking.pelangganWa || c.id === booking.pelangganId
    );
    const updatedVisits = (matchedCust ? matchedCust.totalKunjungan : 0) + 1;

    setCustomers((prev) =>
      prev.map((c) => {
        if (c.noWa === booking.pelangganWa || c.id === booking.pelangganId) {
          return {
            ...c,
            totalKunjungan: updatedVisits,
            poinTerkumpul: updatedVisits,
          };
        }
        return c;
      })
    );

    setBarbers((prev) =>
      prev.map((b) =>
        b.id === booking.kapsterId ? { ...b, totalPotong: b.totalPotong + 1 } : b
      )
    );

    dispatchToGas('processPayment', {
      bookingId,
      pelangganNama: booking.pelangganNama,
      barberId: booking.kapsterId,
      barberNama: booking.kapsterNama,
      metodeBayar: metode,
      nominal,
      noReferensi,
      catatan: catatan || 'Pembayaran layanan SalonCukurKilat',
      adminPencatat: adminName,
    });

    return { success: true, trxId, komisi, updatedVisits };
  };

  const addRiwayatPotong = (riwayat: Omit<RiwayatPotong, 'id'>) => {
    const newId = `RWY-${Date.now().toString().slice(-4)}`;
    setRiwayatPotong((prev) => [{ ...riwayat, id: newId }, ...prev]);
    dispatchToGas('addRiwayatPotong', riwayat);
  };

  const toggleGaleriVisibility = (id: string) => {
    setRiwayatPotong((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, tampilkanDiGaleri: !r.tampilkanDiGaleri } : r
      )
    );
    dispatchToGas('toggleGaleri', { id });
  };

  const submitReview = (id: string, rating: number, review: string) => {
    setRiwayatPotong((prev) =>
      prev.map((r) => (r.id === id ? { ...r, rating, review } : r))
    );
    dispatchToGas('submitReview', { id, rating, review });
  };

  const updateStock = (id: string, delta: number) => {
    setStok((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, stokSaatIni: Math.max(0, s.stokSaatIni + delta) }
          : s
      )
    );
    dispatchToGas('updateStock', { id, delta });
  };

  const submitJobApplication = (
    data: Omit<PendaftaranPegawai, 'id' | 'statusLamaran' | 'tanggalDaftar'>
  ) => {
    const id = `PEL-${Date.now().toString().slice(-4)}`;
    const newApp: PendaftaranPegawai = {
      ...data,
      id,
      statusLamaran: 'Baru',
      tanggalDaftar: new Date().toISOString().slice(0, 10),
    };
    setPendaftaran((prev) => [newApp, ...prev]);
    dispatchToGas('applyJob', data);
    return { success: true, id };
  };

  const updateApplicantStatus = (
    id: string,
    status: ApplicantStatus,
    catatan?: string
  ) => {
    setPendaftaran((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, statusLamaran: status, catatanInterview: catatan || a.catatanInterview }
          : a
      )
    );

    if (status === 'Diterima') {
      const applicant = pendaftaran.find((a) => a.id === id);
      if (applicant) {
        const newBarberId = `BRB-0${barbers.length + 1}`;
        const newBarber: Barber = {
          id: newBarberId,
          nama: applicant.nama,
          nickname: applicant.nama.split(' ')[0],
          noWa: applicant.noWa,
          spesialisasi: applicant.spesialisasi,
          status: 'Aktif',
          persentaseKomisi: 40,
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
          rating: 5.0,
          totalPotong: 0,
          jamMulai: '10:00',
          jamSelesai: '21:00',
        };
        setBarbers((prev) => [...prev, newBarber]);
      }
    }

    dispatchToGas('updateApplicantStatus', { id, status, catatan });
  };

  const updateLoyaltySettings = (settings: PengaturanLoyalty) => {
    setLoyaltySettings(settings);
    dispatchToGas('updateLoyalty', settings);
  };

  const resetAllData = () => {
    localStorage.removeItem(`${STORAGE_KEY}_barbers`);
    localStorage.removeItem(`${STORAGE_KEY}_customers`);
    localStorage.removeItem(`${STORAGE_KEY}_bookings`);
    localStorage.removeItem(`${STORAGE_KEY}_riwayat`);
    localStorage.removeItem(`${STORAGE_KEY}_pembayaran`);
    localStorage.removeItem(`${STORAGE_KEY}_stok`);
    localStorage.removeItem(`${STORAGE_KEY}_pendaftaran`);
    localStorage.removeItem(`${STORAGE_KEY}_loyalty`);
    setBarbers(INITIAL_BARBERS);
    setCustomers(INITIAL_CUSTOMERS);
    setBookings(INITIAL_BOOKINGS);
    setRiwayatPotong(INITIAL_RIWAYAT_POTONG);
    setPembayaran(INITIAL_PEMBAYARAN);
    setStok(INITIAL_STOK);
    setPendaftaran(INITIAL_PENDAFTARAN);
    setLoyaltySettings(INITIAL_LOYALTY_SETTINGS);
  };

  return (
    <AppContext.Provider
      value={{
        isLoggedIn,
        setIsLoggedIn,
        currentRole,
        setCurrentRole,
        selectedBarberId,
        setSelectedBarberId,
        activeCustomer,
        setActiveCustomerId,
        loginWithCustomerWa,
        logout,
        gasWebAppUrl,
        setGasWebAppUrl,
        gasSyncStatus,
        gasLastError,
        syncFromGas,
        services,
        barbers,
        customers,
        bookings,
        riwayatPotong,
        pembayaran,
        stok,
        pendaftaran,
        loyaltySettings,
        createBooking,
        updateBookingStatus,
        processPayment,
        addRiwayatPotong,
        toggleGaleriVisibility,
        submitReview,
        updateStock,
        submitJobApplication,
        updateApplicantStatus,
        updateLoyaltySettings,
        resetAllData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
