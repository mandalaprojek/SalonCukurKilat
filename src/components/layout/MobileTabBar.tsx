import React from 'react';
import { Home, CalendarPlus, Award, SlidersHorizontal } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export type TabType = 'home' | 'booking' | 'member' | 'manage';

interface MobileTabBarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export const MobileTabBar: React.FC<MobileTabBarProps> = ({
  activeTab,
  setActiveTab,
}) => {
  const { currentRole, bookings, stok } = useApp();

  // Low stock badge for admin
  const lowStockCount = stok.filter((s) => s.stokSaatIni <= s.minimumStok).length;
  // Pending bookings
  const pendingBookingCount = bookings.filter((b) => b.status === 'Menunggu').length;

  const tabs: { id: TabType; label: string; icon: React.ReactNode; badgeCount?: number }[] = [
    {
      id: 'home',
      label: 'Beranda',
      icon: <Home className="w-5 h-5" />,
    },
    {
      id: 'booking',
      label: 'Booking',
      icon: <CalendarPlus className="w-5 h-5" />,
      badgeCount: currentRole === 'admin' ? pendingBookingCount : undefined,
    },
    {
      id: 'member',
      label: 'Member & Gaya',
      icon: <Award className="w-5 h-5" />,
    },
    {
      id: 'manage',
      label: currentRole === 'admin' ? 'Kelola Salon' : currentRole === 'barber' ? 'Jadwal Barber' : 'Karir & GAS',
      icon: <SlidersHorizontal className="w-5 h-5" />,
      badgeCount: currentRole === 'admin' && lowStockCount > 0 ? lowStockCount : undefined,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#062320]/95 backdrop-blur-lg border-t border-white/10 pb-safe">
      <div className="max-w-md mx-auto grid grid-cols-4 items-center h-16 px-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex flex-col items-center justify-center h-full min-h-[44px] min-w-[44px] py-1 transition-all active:scale-95 ${
                isActive ? 'text-[#e5a93c]' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                {tab.icon}
                {tab.badgeCount !== undefined && tab.badgeCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-amber-500 text-slate-950 font-bold text-[9px] px-1.5 py-0.2 rounded-full leading-tight">
                    {tab.badgeCount}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] tracking-tight mt-1 whitespace-nowrap truncate max-w-[80px] ${
                  isActive ? 'font-bold text-[#e5a93c]' : 'font-medium'
                }`}
              >
                {tab.label}
              </span>
              {isActive && (
                <span className="w-1.5 h-1.5 bg-[#e5a93c] rounded-full mt-0.5"></span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
