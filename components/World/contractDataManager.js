// contractDataManager.js
import { Contract, BrowserProvider } from 'ethers';

const CONTRACT_ABI = [
  "function _tokenIds() view returns (uint256)",
  "function projects(uint256) view returns (uint256 startDate, string plantType, string size, uint256 co2Extracted, string authorName, string bio, uint256 upvotes, uint256 reports, string thumbnailUri, uint256 lastUpdateDate, tuple(int256 lat, int256 lng) coordinates, bool exists)"
];

export class ContractDataManager {
  constructor(contractAddress, web3AuthProvider) {
    this.contractAddress = contractAddress;
    this.web3AuthProvider = web3AuthProvider;
    this.projects = [];
    this.eventListeners = new Map();
  }

  addEventListener(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event).add(callback);
  }

  removeEventListener(event, callback) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).delete(callback);
    }
  }

  emit(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => callback(data));
    }
  }

  async initialize() {
    try {
      if (!this.web3AuthProvider) {
        throw new Error('Web3Auth provider not initialized');
      }

      console.log('Initializing contract manager with address:', this.contractAddress);
      const ethersProvider = new BrowserProvider(this.web3AuthProvider);
      console.log('Ethers provider created:', ethersProvider);
      
      this.contract = new Contract(this.contractAddress, CONTRACT_ABI, ethersProvider);
      console.log('Contract instance created:', this.contract.address);
      
      await this.fetchProjects();
      return this.projects;
    } catch (error) {
      console.error('Error initializing contract data manager:', error);
      throw error;
    }
  }

  async fetchProjects() {
    let tokenId = 1;
    let consecutiveFailures = 0;
    const MAX_CONSECUTIVE_FAILURES = 3;
    this.projects = [];

    console.log('Starting to fetch projects from contract:', this.contractAddress);

    while (consecutiveFailures < MAX_CONSECUTIVE_FAILURES) {
      try {
        console.log(`\n------ Fetching project ${tokenId} ------`);
        const project = await this.contract.projects(tokenId);
        console.log('Raw project data:', {
          startDate: project.startDate.toString(),
          plantType: project.plantType,
          size: project.size,
          co2Extracted: project.co2Extracted.toString(),
          authorName: project.authorName,
          bio: project.bio,
          upvotes: project.upvotes.toString(),
          reports: project.reports.toString(),
          thumbnailUri: project.thumbnailUri,
          lastUpdateDate: project.lastUpdateDate.toString(),
          coordinates: {
            lat: project.coordinates.lat.toString(),
            lng: project.coordinates.lng.toString(),
          },
          exists: project.exists
        });
        
        if (project.exists) {
          console.log(`Project ${tokenId} exists, formatting data...`);
          const formattedProject = this.formatProjectData(tokenId, project);
          console.log('Formatted project:', formattedProject);
          this.projects.push(formattedProject);
          consecutiveFailures = 0;
        } else {
          console.log(`Project ${tokenId} does not exist`);
          consecutiveFailures++;
        }
      } catch (err) {
        console.error(`Error fetching project ${tokenId}:`, err);
        console.log('Error details:', {
          message: err.message,
          code: err.code,
          ...(err.error && { errorData: err.error.data }),
        });
        consecutiveFailures++;
      }
      tokenId++;
    }

    console.log('\n------ Fetch Summary ------');
    console.log('Total projects found:', this.projects.length);
    console.log('Project IDs:', this.projects.map(p => p.id));
    console.log('------------------------\n');

    this.emit('projectsUpdated', this.projects);
    return this.projects;
  }

  formatProjectData(tokenId, project) {
    const formattedData = {
      id: tokenId,
      type: 'green-project',
      category: project.plantType,
      coordinates: {
        lat: Number(project.coordinates.lat) / 1000000,
        lng: Number(project.coordinates.lng) / 1000000
      },
      properties: {
        startDate: new Date(Number(project.startDate) * 1000),
        size: project.size,
        co2Extracted: project.co2Extracted.toString(),
        authorName: project.authorName,
        bio: project.bio,
        upvotes: project.upvotes.toString(),
        thumbnailUri: project.thumbnailUri,
        lastUpdateDate: new Date(Number(project.lastUpdateDate) * 1000)
      }
    };

    console.log(`Formatted data for project ${tokenId}:`, {
      rawCoordinates: {
        lat: project.coordinates.lat.toString(),
        lng: project.coordinates.lng.toString()
      },
      formattedCoordinates: formattedData.coordinates,
      dates: {
        rawStartDate: project.startDate.toString(),
        formattedStartDate: formattedData.properties.startDate,
        rawLastUpdate: project.lastUpdateDate.toString(),
        formattedLastUpdate: formattedData.properties.lastUpdateDate
      }
    });

    return formattedData;
  }

  async validateContract() {
    try {
      console.log('Validating contract connection...');
      
      // Try to call a simple view function
      const projectData = await this.contract.projects(1);
      console.log('Contract response test:', projectData);
      
      // Check if the contract has the expected functions
      const hasProjects = typeof this.contract.projects === 'function';
      console.log('Contract interface validation:', {
        hasProjectsFunction: hasProjects,
        contractAddress: this.contract.address,
        providerNetwork: await this.contract.provider.getNetwork(),
      });
      
      return true;
    } catch (error) {
      console.error('Contract validation failed:', error);
      return false;
    }
  }


}