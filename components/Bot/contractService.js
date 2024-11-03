import { ethers } from 'ethers';

export class ContractService {
  constructor(provider, contractConfig) {
    this.provider = provider;
    this.contractConfig = contractConfig;
  }

  async checkConnection() {
    try {
      const accounts = await this.provider.request({ method: 'eth_accounts' });
      const chainId = await this.provider.request({ method: 'eth_chainId' });
      const balance = await this.provider.request({ 
        method: 'eth_getBalance',
        params: [accounts[0], 'latest']
      });

      console.log({
        account: accounts[0],
        chainId,
        balance: ethers.utils.formatEther(balance),
        provider: this.provider
      });

      return {
        isConnected: true,
        account: accounts[0],
        chainId,
        balance: ethers.utils.formatEther(balance)
      };
    } catch (error) {
      console.error("Connection check failed:", error);
      return { isConnected: false };
    }
  }

  async mintNFT(data) {
    try {
      const connectionStatus = await this.checkConnection();
      if (!connectionStatus.isConnected) {
        throw new Error("Not connected to wallet");
      }

      const createProjectTx = {
        from: connectionStatus.account,
        to: this.contractConfig.contractAddress,
        data: new ethers.utils.Interface(this.contractConfig.contractABI).encodeFunctionData(
          'createProject',
          [
            data.plantType,
            data.size,
            data.authorName,
            data.bio,
            data.thumbnailUri,
            Math.round(data.lat * 1000000),
            Math.round(data.lng * 1000000)
          ]
        )
      };

      const txHash = await this.provider.request({
        method: 'eth_sendTransaction',
        params: [createProjectTx],
      });

      console.log("Transaction sent:", txHash);
      return { success: true, txHash };
    } catch (error) {
      console.error("Minting error:", error);
      return { success: false, error };
    }
  }
}