import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { MobileHeader } from './components/layout/MobileHeader';
import { MobileTabBar, TabType } from './components/layout/MobileTabBar';
import { PwaInstallBar } from './components/common/PwaInstallBar';
import { LoginView } from './components/views/LoginView';
import { HomeView } from './components/views/HomeView';
import { BookingView } from './components/views/BookingView';
import { HistoryMemberView } from './components/views/HistoryMemberView';
import { ManagementView } from './components/views/ManagementView';
import { ServiceType } from './types';

const MainApp: React.FC = () => {
  const { isLoggedIn } = useApp();
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [preselectedServiceId, setPreselectedServiceId] = useState<string | undefined>(undefined);
  const [preselectedServiceType, setPreselectedServiceType] = useState<ServiceType>('Studio');

  const handleNavigateToBooking = (serviceId?: string, serviceType: ServiceType = 'Studio') => {
    setPreselectedServiceId(serviceId);
    setPreselectedServiceType(serviceType);
    setActiveTab('booking');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToMember = () => {
    setActiveTab('member');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!isLoggedIn) {
    return (
      <>
        <LoginView
          onLoginSuccess={(initialTab = 'home') => {
            setActiveTab(initialTab);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
        <PwaInstallBar hasBottomNav={false} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#041a18] text-slate-100 flex justify-center selection:bg-[#e5a93c] selection:text-[#062320]">
      {/* Mobile-First Frame Container */}
      <div className="w-full max-w-md min-h-screen bg-[#062320] border-x border-white/10 flex flex-col relative shadow-2xl">
        <MobileHeader />

        <main className="flex-1 px-4 pt-4 pb-28">
          {activeTab === 'home' && (
            <HomeView
              onNavigateToBooking={handleNavigateToBooking}
              onNavigateToMember={handleNavigateToMember}
            />
          )}

          {activeTab === 'booking' && (
            <BookingView
              initialServiceId={preselectedServiceId}
              initialServiceType={preselectedServiceType}
              onBookingSuccess={() => setActiveTab('home')}
            />
          )}

          {activeTab === 'member' && <HistoryMemberView />}

          {activeTab === 'manage' && <ManagementView />}
        </main>

        <PwaInstallBar hasBottomNav={true} />
        <MobileTabBar activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
