import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useWeb3Auth } from '../Web3AuthProvider';
import { IDKitWidget, VerificationLevel } from '@worldcoin/idkit';
import styles from './UserProfile.module.css';

export function UserProfile() {
  const { user, isLoading, isInitialized, login, logout } = useWeb3Auth();
  const [isWeb3Connected, setIsWeb3Connected] = useState(false);
  const [isHumanVerified, setIsHumanVerified] = useState(false);
  const [isEthSent, setIsEthSent] = useState(false);
  const { getAccounts } = useWeb3Auth(); 
  const { getBalance } = useWeb3Auth(); 

  const [userBalance, setUserBalance] = useState(null); 


  useEffect(() => {
    const fetchUserBalance = async () => {
      if (user) {
        try {
          const balance = await getBalance();
          setUserBalance(balance);
        } catch (error) {
          console.error('Error fetching balance:', error);
        }
      }
    };
    
    fetchUserBalance();
  }, [user, getBalance]);

  useEffect(() => {
    console.log('User:', user);
    if (user) {
      setIsWeb3Connected(true);
      const storedVerificationStatus = localStorage.getItem(`worldcoin_verified_${user.address}`);
      if (storedVerificationStatus === 'true') {
        setIsHumanVerified(true);
      }
      const storedEthSentStatus = localStorage.getItem(`eth_sent_${user.address}`);
      if (storedEthSentStatus === 'true') {
        setIsEthSent(true);
      }
    }
  }, [user]);

  useEffect(() => {
    const storedWallet = localStorage.getItem('verified_wallet');
    
    if (storedWallet) {
      setIsHumanVerified(true);
      setIsEthSent(true);
      console.log('Wallet already verified:', storedWallet);
    }
  }, []);
  

  const handleWeb3Login = async () => {
    if (!user) {
      await login();
      setIsWeb3Connected(true);
    }
  };

  const handleVerify = async (proof) => {
    try {
      const response = await fetch('https://backer-mynq.onrender.com/verifyWorldCoin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          proof: proof.proof,
          merkle_root: proof.merkle_root,
          nullifier_hash: proof.nullifier_hash,
          action_id: "checkin",
          signal: proof.signal,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setIsHumanVerified(true);
          localStorage.setItem(`worldcoin_verified_${user.address}`, 'true');
          console.log('World ID verification successful');
          await sendEth();
        } else {
          throw new Error('Verification failed');
        }
      } else {
        throw new Error('Verification failed');
      }
    } catch (error) {
      console.error('Error during verification:', error);
    }
  };

  const sendEth = async () => {
    if (isEthSent) return; 

    try {
      const userAddress = await getAccounts(); 
      if (!userAddress) {
        throw new Error("Could not retrieve Ethereum address");
      }

      console.log('Sending ETH to:', userAddress); 

      const response = await fetch('https://backer-mynq.onrender.com/sendEth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userAddress, 
        }),
      });

      const result = await response.json();
      console.log('ETH transfer response:', result); 

      if (response.ok && result.success) {
        setIsEthSent(true);
        localStorage.setItem(`eth_sent_${userAddress}`, 'true');
        console.log('ETH sent successfully');
      } else {
        throw new Error(result.message || 'ETH transfer failed');
      }
    } catch (error) {
      console.error('Error during ETH transfer:', error);
    }
  };

  const onSuccess = async () => {
    try {
      const userAddress = await getAccounts(); 
  
      await sendEth();
  
      localStorage.setItem('verified_wallet', userAddress);
      setIsVerified(true);
      setIsEthSent(true);
      localStorage.setItem(`worldcoin_verified_${userAddress}`, 'true');
    } catch (error) {
      console.error("Error during verification:", error);
    }
  };
  

  const isFullyVerified = isWeb3Connected && isHumanVerified;

  return (
    <div className={styles.userProfile}>
      {!isFullyVerified && (
        <>
          <div className={styles.loginStep}>
            <h3>Step 1</h3>
            <button 
              onClick={handleWeb3Login}
              className={isWeb3Connected ? styles.buttonGreen : styles.buttonBlue}
              disabled={isWeb3Connected}
            >
              {isWeb3Connected ? '✓ Connected' : 'SignUp'}
            </button>
          </div>

          <div className={styles.loginStep}>
            <h3>Step 2</h3>
            <IDKitWidget
              app_id="app_staging_d9e298960943b548e75c0f9d2855c7ed"
              action="checkin"
              onSuccess={onSuccess} 
              handleVerify={handleVerify}
              verification_level={VerificationLevel.Orb}
            >
              {({ open }) => (
                <button 
                  onClick={open}
                  className={isHumanVerified ? styles.buttonGreen : styles.buttonBlue}
                  disabled={isHumanVerified}
                >
                  {isHumanVerified ? '✓ Verified' : 'Real Human?'}
                </button>
              )}
            </IDKitWidget>
          </div>
        </>
      )}

      {isFullyVerified && user && (
        <div className={styles.userInfo}>
          <div className={styles.avatarContainer}>
            <Image
              src="/images/empty-avatar.png"
              alt="User Avatar"
              width={80}
              height={80}
              className={styles.avatar}
            />
          </div>
          <h3>{user.name}</h3>
          <p>Balance: {userBalance !== null ? `${userBalance} ETH` : 'Loading...'}</p>
        </div>
      )}
    </div>
  );
}

export default UserProfile;