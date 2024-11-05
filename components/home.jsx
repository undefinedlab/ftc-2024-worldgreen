'use client';

import { useState, useEffect } from 'react';
import { useWeb3Auth } from './Web3AuthProvider';
import World from './World/World';
import Footer from './ActionBar/Footer';

const ConnectModal = ({ onLogin, isLoading }) => (
  <div style={{
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  }}>
    <div style={{
      backgroundColor: '#FFFFFF',
      padding: '2rem',
      borderRadius: '1rem',
      maxWidth: '24rem',
      width: '90%',
      textAlign: 'center',
      color: 'black',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    }}>
      <h2 style={{ 
        marginBottom: '1rem',
        fontSize: '1.5rem',
        fontWeight: '600'
      }}>
        Connect to Web3
      </h2>
      <p style={{ 
        marginBottom: '2rem',
        color: '#a1a1a1',
        lineHeight: '1.5'
      }}>
        Please connect your Web3 Profile to explore projects around the globe.
      </p>
      <button
        onClick={onLogin}
        disabled={isLoading}
        style={{
          backgroundColor: '#FFFFFF ',
          color: 'black',
          padding: '0.75rem 1.5rem',
          borderRadius: '0.5rem',
          border: '1px solid black',
          cursor: isLoading ? 'default' : 'pointer',
          opacity: isLoading ? 0.7 : 1,
          transition: 'opacity 0.2s',
          fontSize: '1rem',
          fontWeight: '500'
        }}
      >
        {isLoading ? 'Connecting...' : 'Connect Wallet'}
      </button>
    </div>
  </div>
);

export function Home() {
  const [selectedPin, setSelectedPin] = useState(null);
  const { user, isLoading, isInitialized, login, logout } = useWeb3Auth();

  const handleCreateEvent = () => {
    console.log('Creating new event...');
  };

  // Show loading state while Web3Auth is initializing
  if (!isInitialized) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#000',
        color: 'white'
      }}>
        <div>Initializing...</div>
      </div>
    );
  }

  return (
    <div className="globe-container">
      {/* Show connect modal if not logged in */}
      {!user && (
        <ConnectModal 
          onLogin={login} 
          isLoading={isLoading} 
        />
      )}

      {/* Always render World and Footer, they'll be behind the modal if shown */}
      <World isConnected={!!user} />
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