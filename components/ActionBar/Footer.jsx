import React, { useState } from 'react';
import Image from 'next/image';
import styles from './Footer.module.css';
import UserProfile from './UserProfile';
import { useWeb3Auth } from '../Web3AuthProvider';
import { Reports } from '../Modals/Reports';
import { FundModal } from '../Modals/Fund';
import { Meet } from '../Modals/Meet';
import { Bot } from '../Bot/Bot.js';

export function Footer({ onCreateEvent }) {
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [activeOverlay, setActiveOverlay] = useState(null);
  const [inputText, setInputText] = useState('');
  const [pendingMessage, setPendingMessage] = useState(null);
  const { user, logout } = useWeb3Auth();

  const toggleOverlay = (type) => {
    if (type === 'profile') {
      setShowUserProfile(!showUserProfile);
    } else {
      setActiveOverlay(activeOverlay === type ? null : type);
      setShowUserProfile(false);
    }
  };

  const handleInputChange = (e) => {
    setInputText(e.target.value);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && inputText.trim()) {
      // Open bot if not already open
      if (activeOverlay !== 'bot') {
        toggleOverlay('bot');
      }
      
      // Set the complete message only when Enter is pressed
      setPendingMessage({
        text: inputText.trim(),
        timestamp: Date.now()
      });
      
      // Clear input
      setInputText('');
    }
  };

  return (
    <>
      <div className={styles.footer}>
        {/* Left side - Logout and Socials */}
        <div className={styles.footer__left}>
          {user && (
            <div className={styles.footer__icon_wrapper} onClick={logout}>
              <Image src="/images/exit.png" alt="Logout" width={24} height={24} />
            </div>
          )}
          <SocialIcon type="twitter" />
          <SocialIcon type="instagram" />
          <SocialIcon type="discord" />
        </div>

        {/* Center - Search */}
        <div className={styles.footer__center}>
          <div className={styles.footer__search_container}>
            <input
              type="text" // Changed from search to text to prevent search behavior
              placeholder="Say Hi!"
              className={styles.footer__search_input}
              value={inputText}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
            />
          </div>
        </div>

        {/* Right side - Icons */}
        <div className={styles.footer__right}>
          <div 
            className={styles.footer__icon_wrapper} 
            onClick={() => toggleOverlay('meet')}
          >
            <Image src="/images/meet.png" alt="FanMeet" width={24} height={24} />
          </div>
          <div 
            className={styles.footer__icon_wrapper}
            onClick={() => toggleOverlay('fund')}
          >
            <Image src="/images/fund.png" alt="Fund" width={24} height={24} />
          </div>
          <div 
            className={styles.footer__icon_wrapper}
            onClick={() => toggleOverlay('reports')}
          >
            <Image src="/images/events.png" alt="Reports" width={24} height={24} />
          </div>
          <div 
            className={styles.footer__icon_wrapper} 
            onClick={() => {
              toggleOverlay('profile');
              setShowUserProfile(!showUserProfile);
            }}
          >
            <Image src="/images/profile.png" alt="Profile" width={24} height={24} />
          </div>
        </div>

        {/* Overlays */}
        {showUserProfile && <UserProfile />}
        {activeOverlay === 'fund' && <FundModal />}
        {activeOverlay === 'meet' && <Meet />}
        {activeOverlay === 'reports' && <Reports />}
        {activeOverlay === 'bot' && (
          <Bot 
            pendingMessage={pendingMessage}
            onClose={() => {
              toggleOverlay(null);
              setPendingMessage(null);
            }}
          />
        )}
      </div>
    </>
  );
}

function SocialIcon({ type }) {
  return (
    <div className={styles.footer__icon_wrapper}>
      <Image src={`/images/${type}.png`} alt={type} width={24} height={24} />
    </div>
  );
}

export default Footer;