'use client';

import { useState, useEffect } from 'react';
import { useWeb3Auth } from './Web3AuthProvider';
import Footer from './ActionBar/Footer';

export function Home() {
  const [selectedPin, setSelectedPin] = useState(null);
  const { user, isLoading, isInitialized, login, logout } = useWeb3Auth();

  const handleCreateEvent = () => {

    console.log('Creating new event...');
  };

  useEffect(() => {

  }, []);

  return (
    <div className="globe-container">
      <Footer 
        user={user}
        onLogout={logout}
        onLogin={login}
        onCreateEvent={handleCreateEvent}
      />
    </div>
  );
}

export default Home;