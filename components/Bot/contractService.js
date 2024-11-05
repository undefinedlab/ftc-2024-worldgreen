import { ethers } from 'ethers';

export class ContractService {
  constructor(provider, contractConfig) {
    this.provider = provider;
    this.contractConfig = contractConfig;
    this.contract = null;
  }



    async initContract() {
      try {
        const ethersProvider = new ethers.BrowserProvider(this.provider);
        const signer = await ethersProvider.getSigner();
        
        this.contract = new ethers.Contract(
          this.contractConfig.contractAddress,
          this.contractConfig.contractABI,
          signer
        );
        
        return true;
      } catch (error) {
        console.error("Contract initialization failed:", error);
        return false;
      }
    }
  
    async checkConnection() {
      try {
        const accounts = await this.provider.request({ method: 'eth_accounts' });
        const chainId = await this.provider.request({ method: 'eth_chainId' });
        const balance = await this.provider.request({ 
          method: 'eth_getBalance',
          params: [accounts[0], 'latest']
        });
  
        if (!this.contract) {
          await this.initContract();
        }
  
        return {
          isConnected: true,
          account: accounts[0],
          chainId,
          balance: ethers.formatEther(balance)
        };
      } catch (error) {
        console.error("Connection check failed:", error);
        return { isConnected: false };
      }
    }
  
    async getProject(tokenId) {
      try {
        if (!this.contract) await this.initContract();
        
        const project = await this.contract.projects(tokenId);
        
        // Check if project exists
        if (!project.exists) {
          throw new Error("Project does not exist");
        }
  
        return {
          startDate: Number(project.startDate),
          plantType: project.plantType,
          size: project.size,
          co2Extracted: project.co2Extracted.toString(),
          authorName: project.authorName,
          bio: project.bio,
          upvotes: project.upvotes.toString(),
          reports: project.reports.toString(),
          thumbnailUri: project.thumbnailUri,
          lastUpdateDate: Number(project.lastUpdateDate),
          coordinates: {
            lat: Number(project.coordinates.lat) / 1000000,
            lng: Number(project.coordinates.lng) / 1000000
          }
        };
      } catch (error) {
        throw error;
      }
    }
  
    async getOwner(tokenId) {
      try {
        if (!this.contract) await this.initContract();
        return await this.contract.ownerOf(tokenId);
      } catch (error) {
        throw error;
      }
    }
  
    async getAllProjectsForUser(userAddress) {
      try {
        if (!this.contract) await this.initContract();
        
        const projects = [];
        let tokenId = 1;
        let consecutiveFailures = 0;
        
        while (consecutiveFailures < 3) {
          try {
            const owner = await this.contract.ownerOf(tokenId);
            
            if (owner.toLowerCase() === userAddress.toLowerCase()) {
              const project = await this.getProject(tokenId);
              projects.push({
                tokenId,
                ...project
              });
              consecutiveFailures = 0;
            }
          } catch (error) {
            consecutiveFailures++;
          }
          tokenId++;
        }
        
        return projects;
      } catch (error) {
        console.error("Error fetching all projects:", error);
        throw error;
      }
    }
  
    async addUpdate(tokenId, videoUri, description) {
      try {
        if (!this.contract) await this.initContract();
  
        // Get signer again to ensure fresh connection
        const ethersProvider = new ethers.BrowserProvider(this.provider);
        const signer = await ethersProvider.getSigner();
        
        // Create contract instance with signer
        const contractWithSigner = this.contract.connect(signer);
        
        // Send transaction
        const tx = await contractWithSigner.addUpdate(tokenId, videoUri, description);
        const receipt = await tx.wait();
  
        return {
          success: true,
          txHash: receipt.hash
        };
      } catch (error) {
        console.error("Add update failed:", error);
        return {
          success: false,
          error
        };
      }
    }

    async mintNFT(data) {
      try {
        const connectionStatus = await this.checkConnection();
        if (!connectionStatus.isConnected) {
          throw new Error("Not connected to wallet");
        }
  
        const iface = new ethers.Interface(this.contractConfig.contractABI);
        
        const createProjectTx = {
          from: connectionStatus.account,
          to: this.contractConfig.contractAddress,
          data: iface.encodeFunctionData('createProject', [
            data.plantType,
            data.size,
            data.authorName,
            data.bio,
            data.thumbnailUri,
            Math.round(data.lat * 1000000),
            Math.round(data.lng * 1000000)
          ])
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

