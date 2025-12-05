'use client';

import { useState, useEffect } from 'react';
import LoginScreen from '@/components/LoginScreen';
import MainApp from '@/components/MainApp';
import { AllianceData } from '@/types';

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [allianceKey, setAllianceKey] = useState('');
  const [allianceData, setAllianceData] = useState<AllianceData | null>(null);

  // Check for URL parameter on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const keyParam = urlParams.get('key');
    
    if (keyParam && keyParam.trim()) {
      // Key will be auto-filled in LoginScreen
      console.log('🔗 Alliance key found in URL');
    }
  }, []);

  const handleLogin = (key: string, data: AllianceData) => {
    setAllianceKey(key);
    setAllianceData(data);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setAllianceKey('');
    setAllianceData(null);
    // Clear URL parameters
    window.history.replaceState({}, '', window.location.pathname);
  };

  return (
    <div className="min-h-screen">
      {!isLoggedIn ? (
        <LoginScreen onLogin={handleLogin} />
      ) : (
        <MainApp 
          allianceKey={allianceKey}
          initialData={allianceData!}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}
