import React, { useState, useEffect } from 'react';
import { useWeb3Auth } from '../../Web3AuthProvider';
import styles from './Profile.module.css';

export function Profile({ onClose }) {
  const { user, provider: web3AuthProvider } = useWeb3Auth();
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    profileImage: '',
    walletAddress: '',
    balance: '0',
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || 'Anonymous',
        email: user.email || 'No email provided',
        profileImage: user.profileImage || '/placeholder-avatar.png',
        walletAddress: user.address || '',
        balance: user.balance || '0',
      });
    }
  }, [user]);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>×</button>
        
        <div className={styles.content}>
          <div className={styles.header}>
            <div className={styles.avatarContainer}>
              <img 
                src={profileData.profileImage} 
                alt="Profile"
                className={styles.avatar}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/placeholder-avatar.png';
                }}
              />
            </div>
            <h2 className={styles.name}>{profileData.name}</h2>
            <p className={styles.email}>{profileData.email}</p>
          </div>

          <div className={styles.details}>
            <div className={styles.detailItem}>
              <span className={styles.label}>Wallet Address</span>
              <span className={styles.value}>
                {profileData.walletAddress ? 
                  `${profileData.walletAddress.slice(0, 6)}...${profileData.walletAddress.slice(-4)}` :
                  'Not connected'
                }
              </span>
            </div>

            <div className={styles.detailItem}>
              <span className={styles.label}>Balance</span>
              <span className={styles.value}>{profileData.balance} ETH</span>
            </div>
          </div>

          <div className={styles.actions}>
            <button className={styles.actionButton}>
              Edit Profile
            </button>
            <button className={styles.actionButton}>
              View Activity
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;