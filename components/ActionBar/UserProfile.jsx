import React, { useState, useEffect } from 'react';
import { useWeb3Auth } from '../Web3AuthProvider';
import { IDKitWidget, VerificationLevel } from '@worldcoin/idkit';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import styles from './UserProfile.module.css';

export function UserProfile() {
  const { user, isLoading, login, getAccounts, getBalance } = useWeb3Auth();
  const [isWeb3Connected, setIsWeb3Connected] = useState(false);
 const [userBalance, setUserBalance] = useState(null);

    const [isHumanVerified, setIsHumanVerified] = useState(() => {
      // Initialize state with localStorage check
      if (typeof window !== 'undefined') {
        // First check general verification
        const storedWallet = localStorage.getItem('verified_wallet');
        if (storedWallet) return true;
        
        // Then check address-specific verification if we have user
        if (window.localStorage.getItem(`worldcoin_verified_${user?.address}`) === 'true') {
          return true;
        }
      }
      return false;
    });

    useEffect(() => {
      if (user) {
        setIsWeb3Connected(true);
        // Re-check verification status when user changes
        const storedVerificationStatus = localStorage.getItem(`worldcoin_verified_${user.address}`);
        if (storedVerificationStatus === 'true') {
          setIsHumanVerified(true);
        }
      }
    }, [user]);

    
  const [userStats, setUserStats] = useState({
    totalReports: 5,
    totalUpdates: 12,
    multiplier: 0.02,
    reportTypes: [
      { name: 'Completed', value: 5, color: '#10B981' },
      { name: 'In Progress', value: 2, color: '#3B82F6' },
      { name: 'Pending', value: 3, color: '#6B7280' },
    ],
    activityData: [
      { name: 'Reports', value: 5, color: '#10B981' },
      { name: 'Updates', value: 12, color: '#3B82F6' },
    ]
  });

  useEffect(() => {
    // Check if user is connected
    if (user) {
      setIsWeb3Connected(true);
      
      // Check if this wallet was verified with WorldID
      const storedVerificationStatus = localStorage.getItem(`worldcoin_verified_${user.address}`);
      if (storedVerificationStatus === 'true') {
        setIsHumanVerified(true);
      }
    }
  }, [user]); // Only depend on user changes


  const handleWeb3Login = async () => {
    if (!user) {
      await login();
      setIsWeb3Connected(true);
    }
  };


  useEffect(() => {
    const fetchUserStats = async () => {
      if (user?.address) {
        try {
          setUserStats({
            totalReports: 5,
            totalUpdates: 12,
            multiplier: 0.02
          });
        } catch (error) {
          console.error('Error fetching user stats:', error);
        }
      }
    };

    fetchUserStats();
  }, [user]);

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
    }
  }, []);


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
        }
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

      if (response.ok && result.success) {
        setIsEthSent(true);
        localStorage.setItem(`eth_sent_${userAddress}`, 'true');
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
      setIsHumanVerified(true);
      localStorage.setItem(`worldcoin_verified_${userAddress}`, 'true');
    } catch (error) {
      console.error("Error during verification:", error);
    }
  };

  const isFullyVerified = isWeb3Connected && isHumanVerified;

  const StatPieChart = ({ data, size = 120 }) => (
    <ResponsiveContainer width={size} height={size}>
      <PieChart>
        <Pie
          data={data}
          innerRadius={size/3}
          outerRadius={size/2}
          paddingAngle={5}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={index} fill={entry.color} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
  
  return (
    <div className={`${styles.userProfile} ${isFullyVerified ? styles.userProfileVerified : ''}`}>
      {!isFullyVerified ? (
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
      ) : (
        <div className={styles.reportsContainer}>
      <div className={styles.verifiedContent}>
        <div className={styles.verifiedHeader}>
          <div className={styles.headerLeft}>
            <h2>{user?.name || 'User'}</h2>
            <span className={styles.verifiedAddress}>
              {user?.address?.slice(0, 6)}...{user?.address?.slice(-4)}
              <span className={styles.verifiedBadge}>✓ Verified</span>
            </span>
          </div>
          <div className={styles.headerRight}>
            <div className={styles.returnInfo}>
              <span className={styles.returnLabel}>Accruing Return</span>
              <span className={styles.returnValue}>0.0214 TCO2 </span>
            </div>
          </div>
        </div>

        <div className={styles.metricsGrid}>
          <div className={styles.metricCard}>
            <div className={styles.metricChart}>
              <StatPieChart
                data={[
                  { value: userStats.multiplier * 100, color: '#10B981' },
                  { value: 100 - (userStats.multiplier * 100), color: '#E5E7EB' }
                ]}
                size={150}
              />
              <div className={styles.metricValue}>
                <span className={styles.bigNumber}>{userStats.multiplier}x</span>
                <span className={styles.metricLabel}>Multiplier</span>
              </div>
            </div>
          </div>

          <div className={styles.metricCard}>
            <div className={styles.metricChart}>
              <StatPieChart
                data={[
                  { value: userStats.totalReports, color: '#3B82F6' },
                  { value: 20 - userStats.totalReports, color: '#E5E7EB' }
                ]}
                size={150}
              />
              <div className={styles.metricValue}>
                <span className={styles.bigNumber}>{userStats.totalReports}</span>
                <span className={styles.metricLabel}>Reports</span>
              </div>
            </div>
          </div>

          <div className={styles.metricCard}>
            <div className={styles.metricChart}>
              <StatPieChart
                data={[
                  { value: userStats.totalUpdates, color: '#8B5CF6' },
                  { value: 50 - userStats.totalUpdates, color: '#E5E7EB' }
                ]}
                size={150}
              />
              <div className={styles.metricValue}>
                <span className={styles.bigNumber}>{userStats.totalUpdates}</span>
                <span className={styles.metricLabel}>Updates</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.walletInfo}>
          <div className={styles.balanceBox}>
            <h3>Balance</h3>
            <p className={styles.balance}>
              {userBalance !== null ? `${userBalance} TCO2 ` : 'Loading...'}
            </p>
          </div>
        </div>
      </div>
    </div>
      )}
    </div>
  );
}

export default UserProfile;