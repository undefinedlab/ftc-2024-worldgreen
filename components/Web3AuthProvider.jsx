'use client';

import React, {
  useEffect,
  useState,
  createContext,
  useContext,
  useCallback,
} from 'react';
import { CHAIN_NAMESPACES, IProvider, WALLET_ADAPTERS, WEB3AUTH_NETWORK } from '@web3auth/base';
import { EthereumPrivateKeyProvider } from '@web3auth/ethereum-provider';
import { Web3Auth } from '@web3auth/modal';
import { ethers } from 'ethers';
import { MetamaskAdapter } from '@web3auth/metamask-adapter';

const clientId =
  'BBP-UuLBs-tTUxp4PwAtS2nQPW25oSLXUfAEg7H-FqTD9LOyMVgTlFDFEJLoMj2nij51yvRRCvYYeQnptrOYR_E';

  const chainConfig = {
    chainNamespace: CHAIN_NAMESPACES.EIP155,
    chainId: '0xaa36a7', // Sepolia
    rpcTarget: 'https://sepolia.drpc.org',
    displayName: 'Sepolia',
    blockExplorerUrl: 'https://testnet.chiliscan.com',
    ticker: 'ETH',
    tickerName: 'Ethereum',
    decimals: 18,
    isTestnet: true,
  };

const ChillizConfig = chainConfig;
const privateKeyProvider = new EthereumPrivateKeyProvider({
  config: { chainConfig },
});


const modalConfig = {
  [WALLET_ADAPTERS.METAMASK]: {
    label: "MetaMask",
    showOnModal: true
  }
};

const web3auth = new Web3Auth({
  clientId,
  web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
  privateKeyProvider,
  chainConfig,
  uiConfig: {
    modalConfig
  }
});
const metamaskAdapter = new MetamaskAdapter({
  clientId,
  sessionTime: 3600,
  web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
  chainConfig,
});

web3auth.configureAdapter(metamaskAdapter);


const Web3AuthContext = createContext(null);

export const useWeb3Auth = () => useContext(Web3AuthContext);

export const Web3AuthProvider = ({ children }) => {
  const [provider, setProvider] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [ethersProvider, setEthersProvider] = useState(null);
  const [signer, setSigner] = useState(null);

  const initializeWeb3Auth = useCallback(async () => {
    try {
      await web3auth.initModal({
        modalConfig
      });
      setIsInitialized(true);
      if (web3auth.connected) {
        console.log('Connected to Web3Auth');

        const web3authProvider = web3auth.provider;
        setProvider(web3authProvider);
        const userInfo = await web3auth.getUserInfo();
        setUser(userInfo);

        const ethProvider = new ethers.BrowserProvider(web3authProvider);
        setEthersProvider(ethProvider);
        try {
          const ethSigner = await ethProvider.getSigner();
          setSigner(ethSigner);
        } catch (error) {
          console.warn('Unable to get signer:', error);
        }
      }
    } catch (error) {
      console.error('Error initializing Web3Auth:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // useEffect(() => {
  //   console.log(web3auth);
  // }, []);

  useEffect(() => {
    initializeWeb3Auth();
  }, [initializeWeb3Auth]);

  const login = async () => {
    if (!isInitialized) {
      console.log('Web3Auth is not initialized yet');
      return;
    }
    setIsLoading(true);
    try {
      const web3authProvider = await web3auth.connect();

      setProvider(web3authProvider);
      if (web3auth.connected) {
        const userInfo = await web3auth.getUserInfo();
        setUser(userInfo);

        const ethProvider = new ethers.BrowserProvider(web3authProvider);
        setEthersProvider(ethProvider);
        const ethSigner = await ethProvider.getSigner();
        setSigner(ethSigner);
      }
    } catch (error) {
      console.error('Error during login:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    if (!isInitialized) {
      console.log('Web3Auth is not initialized yet');
      return;
    }
    setIsLoading(true);
    try {
      await web3auth.logout();
      setProvider(null);
      setUser(null);
      setEthersProvider(null);
      setSigner(null);
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getChainId = async () => {
    if (!ethersProvider) return null;
    try {
      const network = await ethersProvider.getNetwork();
      return network.chainId.toString();
    } catch (error) {
      console.error('Error getting chain ID:', error);
      return null;
    }
  };

  const getAccounts = async () => {
    if (!signer) return null;
    try {
      const address = await signer.getAddress();
      return address;
    } catch (error) {
      console.error('Error getting account:', error);
      return null;
    }
  };

  const getBalance = async () => {
    if (!ethersProvider || !signer) return null;
    try {
      const address = await signer.getAddress();
      const balance = await ethersProvider.getBalance(address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('Error getting balance:', error);
      return null;
    }
  };

  const switchChain = async () => {
    if (!ethersProvider || !signer) return null;
    // try {
    //   await web3auth.addChain(ChillizConfig);
    //   await web3auth.switchChain({ chainId: '0x15b32' });
    // } catch (error) {
    //   console.error('Error Switching Chain:', error);
    //   return null;
    // }
  };

  const value = {
    provider,
    user,
    isLoading,
    isInitialized,
    login,
    logout,
    ethersProvider,
    signer,
    getChainId,
    getAccounts,
    getBalance,
    switchChain,
  };

  return (
    <Web3AuthContext.Provider value={value}>
      {children}
    </Web3AuthContext.Provider>
  );
};

export default Web3AuthProvider;
