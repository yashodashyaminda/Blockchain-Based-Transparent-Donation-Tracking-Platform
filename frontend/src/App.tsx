import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
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
  const { currentRole } = useWeb3();

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

  // Web2.5 Auth Route Guard: Redirect unauthenticated guest users attempting to view private dashboards
  useEffect(() => {
    if (
      currentRole === 'guest' &&
      (activePage === 'ngo-dashboard' || activePage === 'donor-dashboard' || activePage === 'admin-dashboard')
    ) {
      setActivePage('login');
    }
  }, [currentRole, activePage]);

  // Page Routing Render Helper
  const renderPage = () => {
    switch (activePage) {
      case 'login':
        return <Login setActivePage={setActivePage} />;
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
