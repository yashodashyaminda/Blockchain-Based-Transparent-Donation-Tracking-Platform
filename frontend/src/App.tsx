import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { Register } from './pages/Register';
import { NgoDashboard } from './pages/ngo/NgoDashboard';
import { DonorDashboard } from './pages/donor/DonorDashboard';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { Footer } from './components/Footer';
import { RoleSwitcher } from './components/RoleSwitcher';
import { useWeb3 } from './context/Web3Context';
import Lenis from 'lenis';

function App() {
  const [activePage, setActivePage] = useState<string>('home');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const { isWalletConnected } = useWeb3();

  // Initialize Lenis Smooth Scrolling
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  // Sync route redirects if connection or role drops
  useEffect(() => {
    // If not connected and looking at dashboards, redirect to home
    if (!isWalletConnected && activePage !== 'home' && activePage !== 'register') {
      setActivePage('home');
    }
  }, [isWalletConnected, activePage]);

  // Page Routing Render Helper
  const renderPage = () => {
    switch (activePage) {
      case 'register':
        return (
          <Register 
            setActivePage={setActivePage} 
            selectedCampaignId={selectedCampaignId} 
          />
        );
      case 'ngo-dashboard':
        return <NgoDashboard />;
      case 'donor-dashboard':
        return (
          <DonorDashboard 
            preSelectedCampaignId={selectedCampaignId} 
            setPreSelectedCampaignId={setSelectedCampaignId} 
          />
        );
      case 'admin-dashboard':
        return <AdminDashboard />;
      default:
        return (
          <Home 
            setActivePage={setActivePage} 
            setSelectedCampaignId={setSelectedCampaignId} 
          />
        );
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Floating Translucent Header Navbar */}
      <Navbar activePage={activePage} setActivePage={setActivePage} />

      {/* Render selected workspace / landing page */}
      <main className="flex-grow">
        {renderPage()}
      </main>

      {/* Footer */}
      <Footer />

      {/* Persistent floating dashboard simulation role switcher */}
      <RoleSwitcher />
    </div>
  );
}

export default App;
