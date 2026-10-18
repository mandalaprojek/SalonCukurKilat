import React, { useState, useEffect } from 'react';
import { ScissorsIcon } from './BrandIcon';
import { Download, X, CheckCircle2, Smartphone, Share2, MoreVertical, Copy, Sparkles } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface PwaInstallBarProps {
  hasBottomNav?: boolean;
}

const PWA_DISMISSED_KEY = 'saloncukurkilat_pwa_installed_v1';

export const PwaInstallBar: React.FC<PwaInstallBarProps> = ({ hasBottomNav = true }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [isSheetOpen, setIsSheetOpen] = useState<boolean>(false);
  const [deviceOS, setDeviceOS] = useState<'android' | 'ios'>('android');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  useEffect(() => {
    // Check if already running in standalone PWA mode or previously marked installed
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    const isInstalledFlag = localStorage.getItem(PWA_DISMISSED_KEY) === 'true';

    if (isStandalone || isInstalledFlag) {
      setIsVisible(false);
      return;
    }

    // Detect iOS vs Android for smart instructions
    const ua = window.navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) {
      setDeviceOS('ios');
    } else {
      setDeviceOS('android');
    }

    setIsVisible(true);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    const handleAppInstalled = () => {
      localStorage.setItem(PWA_DISMISSED_KEY, 'true');
      setIsVisible(false);
      setIsSheetOpen(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          localStorage.setItem(PWA_DISMISSED_KEY, 'true');
          setIsVisible(false);
        }
        setDeferredPrompt(null);
        return;
      } catch {
        // Fallback to visual guide sheet
      }
    }
    setIsSheetOpen(true);
  };

  const handleMarkInstalled = () => {
    localStorage.setItem(PWA_DISMISSED_KEY, 'true');
    setIsSheetOpen(false);
    setIsVisible(false);
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Floating Bottom Pill (Thumb Zone) */}
      <div
        className={`fixed left-0 right-0 z-30 px-3 pointer-events-none flex justify-center ${
          hasBottomNav ? 'bottom-[70px]' : 'bottom-4'
        }`}
      >
        <div className="w-full max-w-[420px] pointer-events-auto bg-[#0b322c]/95 backdrop-blur-md border border-[#e5a93c]/50 rounded-2xl p-2.5 shadow-2xl shadow-black/70 flex items-center justify-between gap-2.5 animate-in fade-in duration-200">
          <div
            onClick={handleInstallClick}
            className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#e5a93c] to-amber-500 text-[#062320] flex items-center justify-center shrink-0 shadow-md">
              <ScissorsIcon className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-extrabold text-white truncate flex items-center gap-1">
                <span>📲 Pasang Aplikasi (Hanya 1 MB)</span>
              </div>
              <div className="text-[10px] text-amber-200/90 truncate">
                Akses cepat booking & kartu member 1 klik
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={handleInstallClick}
              className="px-3.5 py-2 rounded-xl bg-[#e5a93c] hover:bg-[#f5b73d] text-[#062320] font-extrabold text-xs flex items-center gap-1 shadow-md active:scale-95 transition-all min-h-[38px]"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Pasang</span>
            </button>
            <button
              type="button"
              onClick={() => setIsVisible(false)}
              className="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors"
              title="Sembunyikan sementara"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Smart Install Bottom Sheet */}
      {isSheetOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#0b322c] border-t sm:border border-[#e5a93c]/40 rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl text-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Drag Handle */}
            <div className="w-10 h-1.5 bg-white/20 rounded-full mx-auto -mt-1 mb-1 sm:hidden" />

            {/* App Header Info */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-[#062320] border-2 border-[#e5a93c] flex items-center justify-center text-[#e5a93c] shadow-lg shrink-0">
                  <ScissorsIcon className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-extrabold text-base text-white">SalonCukurKilat</h3>
                    <span className="text-[10px] font-mono font-bold text-[#062320] bg-[#e5a93c] px-1.5 py-0.5 rounded">
                      1.0 MB
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Aplikasi Web Ringan (PWA) · Tanpa Play Store
                  </p>
                  <div className="text-[10px] text-emerald-400 font-semibold mt-0.5 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Hemat memori HP & layar penuh otomatis</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSheetOpen(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Device OS Selector Tabs */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#062320] rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => setDeviceOS('android')}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  deviceOS === 'android'
                    ? 'bg-[#e5a93c] text-[#062320] shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>HP Android (Chrome)</span>
              </button>
              <button
                type="button"
                onClick={() => setDeviceOS('ios')}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  deviceOS === 'ios'
                    ? 'bg-[#e5a93c] text-[#062320] shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>iPhone (Safari iOS)</span>
              </button>
            </div>

            {/* Step-by-Step Visual Instructions */}
            {deviceOS === 'android' ? (
              <div className="bg-[#062320]/90 border border-white/10 rounded-2xl p-4 space-y-3 text-xs">
                <div className="font-bold text-[#e5a93c] flex items-center gap-1.5">
                  <span>Cara Pasang di Layar Utama Android (3 Detik):</span>
                </div>
                <div className="space-y-2.5 text-slate-200">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#e5a93c]/20 border border-[#e5a93c] text-[#e5a93c] font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </span>
                    <div>
                      Ketuk ikon <strong>Titik Tiga</strong>{' '}
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-white/10 text-[#e5a93c]">
                        <MoreVertical className="w-3 h-3" />
                      </span>{' '}
                      di pojok kanan atas browser Chrome Anda.
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#e5a93c]/20 border border-[#e5a93c] text-[#e5a93c] font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </span>
                    <div>
                      Pilih menu <strong>"Tambahkan ke layar utama"</strong> (<em>Add to Home screen</em>) atau <strong>"Instal aplikasi"</strong>.
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#e5a93c]/20 border border-[#e5a93c] text-[#e5a93c] font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </span>
                    <div>
                      Ketuk <strong>Tambahkan / Instal</strong>. Ikon emas <strong>SalonCukurKilat</strong> siap dibuka kapan saja dari layar HP Anda!
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-[#062320]/90 border border-white/10 rounded-2xl p-4 space-y-3 text-xs">
                <div className="font-bold text-[#e5a93c] flex items-center gap-1.5">
                  <span>Cara Pasang di iPhone / iPad (Safari):</span>
                </div>
                <div className="space-y-2.5 text-slate-200">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#e5a93c]/20 border border-[#e5a93c] text-[#e5a93c] font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </span>
                    <div>
                      Ketuk ikon <strong>Share / Bagikan</strong>{' '}
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-white/10 text-[#e5a93c]">
                        <Share2 className="w-3 h-3" />
                      </span>{' '}
                      di bar bagian bawah browser Safari.
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#e5a93c]/20 border border-[#e5a93c] text-[#e5a93c] font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </span>
                    <div>
                      Geser menu ke bawah lalu ketuk <strong>"Tambah ke Layar Utama"</strong> (<em>Add to Home Screen</em>).
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#e5a93c]/20 border border-[#e5a93c] text-[#e5a93c] font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </span>
                    <div>
                      Ketuk <strong>Tambah (Add)</strong> di pojok kanan atas. Aplikasi siap diakses 1 klik!
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleMarkInstalled}
                className="w-full py-3 px-4 rounded-xl bg-[#e5a93c] hover:bg-[#f5b73d] text-[#062320] font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all min-h-[44px]"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Sudah Saya Pasang (Sembunyikan Banner)</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleCopyUrl}
                  className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5 text-[#e5a93c]" />
                  <span>{copiedLink ? 'Link Tersalin!' : 'Salin Link App'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsSheetOpen(false)}
                  className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium"
                >
                  Nanti Saja
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
