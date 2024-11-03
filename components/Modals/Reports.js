import React, { useState, useEffect } from 'react';
import { useWeb3Auth } from '../Web3AuthProvider';
import { Contract, BrowserProvider } from 'ethers';
import styles from './Reports.module.css';
import { ProjectDetailModal } from './ProjectDetailModal';


// Contract ABI - updated to use the public functions
const CONTRACT_ABI = [
  "function projects(uint256) view returns (uint256 startDate, string plantType, string size, uint256 co2Extracted, string authorName, string bio, uint256 upvotes, uint256 reports, string thumbnailUri, uint256 lastUpdateDate, tuple(int256 lat, int256 lng) coordinates, bool exists)",
  "function ownerOf(uint256) view returns (address)",
  "function getProjectAge(uint256) view returns (uint256)",
  "function getProjectUpdateCount(uint256) view returns (uint256)"
];

const CONTRACT_ADDRESS = "0x96B625E6ffC9b43c7D652F4c916a908d986649D5";


const ProjectCard = ({ project, onClick }) => (
  <div 
    className={styles.projectCard}
    onClick={onClick}
  >
    <div className={styles.imageContainer}>
      <img
        src={project.thumbnailUri || '/placeholder-image.jpg'}
        alt={project.plantType}
        className={styles.projectImage}
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = '/placeholder-image.jpg';
        }}
      />
    </div>
    <h3 className={styles.plantName}>{project.plantType}</h3>
    <p className={styles.authorName}>@{project.authorName}</p>
    <div className={styles.projectStats}>
      <div className={styles.statRow}>
        <span>CO₂: {project.co2Extracted} kg</span>
        <span>👍 {project.upvotes}</span>
      </div>
      <div className={styles.statRow}>
        <span>Updates: {project.updateCount || '0'}</span>
        <span>Age: {project.age || 'N/A'}</span>
      </div>
    </div>
    {project.owner && (
      <div className={styles.projectFooter}>
        Owner: {project.owner.slice(0, 6)}...{project.owner.slice(-4)}
      </div>
    )}
  </div>
);


const ProjectSection = ({ title, projects, onSelectProject }) => (
  <div className={styles.projectSection}>
    <h2 className={styles.sectionTitle}>{title}</h2>
    <div className={styles.projectGrid}>
      {projects.map(project => (
        <ProjectCard
          key={project.id}
          project={project}
          onClick={() => onSelectProject(project)}
        />
      ))}
    </div>
  </div>
);

export function Reports({ onClose }) {
  const { provider: web3AuthProvider, getAccounts, getBalance, getChainId } = useWeb3Auth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [walletInfo, setWalletInfo] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);

  const [selectedFilter, setSelectedFilter] = useState('all');

  const fetchReports = async () => {
    try {
      setLoading(true);
      if (!web3AuthProvider) {
        throw new Error('Provider not initialized');
      }

      // Create ethers provider from Web3Auth provider
      const ethersProvider = new BrowserProvider(web3AuthProvider);
      console.log('Ethers provider created:', ethersProvider);

      // Create contract instance
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, ethersProvider);
      console.log('Contract instance created');

      const fetchedReports = [];
      let tokenId = 1;
      let consecutiveFailures = 0;
      const MAX_CONSECUTIVE_FAILURES = 3; // Stop after 3 consecutive non-existent tokens

      // Keep fetching until we hit consecutive non-existent tokens
      while (consecutiveFailures < MAX_CONSECUTIVE_FAILURES) {
        try {
          console.log(`Attempting to fetch project ${tokenId}...`);
          const project = await contract.projects(tokenId);
          
          if (project.exists) {
            console.log(`Project ${tokenId} exists, fetching details...`);
            consecutiveFailures = 0; // Reset counter on successful fetch

            const formattedProject = {
              id: tokenId,
              startDate: new Date(Number(project.startDate) * 1000),
              plantType: project.plantType,
              size: project.size,
              co2Extracted: project.co2Extracted.toString(),
              authorName: project.authorName,
              bio: project.bio,
              upvotes: project.upvotes.toString(),
              reports: project.reports.toString(),
              thumbnailUri: project.thumbnailUri,
              lastUpdateDate: new Date(Number(project.lastUpdateDate) * 1000),
              coordinates: {
                lat: Number(project.coordinates.lat) / 1000000,
                lng: Number(project.coordinates.lng) / 1000000
              }
            };

            try {
              // Fetch additional data
              const [owner, age, updateCount] = await Promise.all([
                contract.ownerOf(tokenId),
                contract.getProjectAge(tokenId),
                contract.getProjectUpdateCount(tokenId)
              ]);

              formattedProject.owner = owner;
              formattedProject.age = age.toString();
              formattedProject.updateCount = updateCount.toString();
            } catch (error) {
              console.warn(`Error fetching additional data for project ${tokenId}:`, error);
            }
            
            fetchedReports.push(formattedProject);
            console.log(`Added project ${tokenId}:`, formattedProject);
          } else {
            console.log(`Project ${tokenId} does not exist`);
            consecutiveFailures++;
          }
        } catch (err) {
          console.log(`Error or no project at tokenId ${tokenId}`);
          consecutiveFailures++;
        }
        
        tokenId++;
      }

      console.log('Total projects fetched:', fetchedReports.length);
      setReports(fetchedReports);
    } catch (err) {
      console.error('Error in fetchReports:', err);
      setError('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initializeWalletInfo = async () => {
      if (web3AuthProvider) {
        try {
          const accounts = await getAccounts();
          const balance = await getBalance();
          const chainId = await getChainId();
          
          setWalletInfo({
            address: accounts,
            balance: balance,
            chainId: chainId
          });
          
          console.log('Wallet Information:', {
            address: accounts,
            balance: `${balance} ETH`,
            networkId: chainId
          });
        } catch (error) {
          console.error('Error fetching wallet information:', error);
        }
      }
    };

    initializeWalletInfo();
  }, [web3AuthProvider]);

  useEffect(() => {
    if (web3AuthProvider && walletInfo) {
      fetchReports();
    }
  }, [web3AuthProvider, walletInfo]);

  const filterButtons = [
    { id: 'all', label: 'All Projects' },
    { id: 'trees', label: '🌳 Trees' },
    { id: 'plants', label: '🌱 Plants' },
    { id: 'gardens', label: '🏡 Gardens' },
    { id: 'forests', label: '🌲 Forests' },

    { id: 'SEA Region', label: '🌊 SEA' },
    { id: 'USA Region', label: '🇺🇸 USA' },
    { id: 'EU Region', label: '🇪🇺 EU' },

  ];

  const filteredReports = reports.filter(report => 
    (searchTerm === '' || 
    report.plantType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.authorName.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (selectedFilter === 'all' || report.type === selectedFilter)
  );

  const sortedByNew = [...filteredReports].sort((a, b) => b.id - a.id);
  const sortedByHot = [...filteredReports].sort((a, b) => 
    Number(b.lastUpdateDate) - Number(a.lastUpdateDate)
  );
  const sortedByLoved = [...filteredReports].sort((a, b) => 
    Number(b.upvotes) - Number(a.upvotes)
  );
  

  return (
    <div className={styles.reportsContainer}>
      <div className={styles.searchContainer}>
        <input
          type="search"
          placeholder="Search projects..."
          className={styles.searchInput}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
  
      <div className={styles.filterContainer}>
        {filterButtons.map(button => (
          <button
            key={button.id}
            className={`${styles.filterButton} ${
              selectedFilter === button.id ? styles.filterButtonActive : ''
            }`}
            onClick={() => setSelectedFilter(button.id)}
          >
            {button.label}
          </button>
        ))}
      </div>
  
      <div className={styles.scrollableContent}>
        {loading ? (
          <div className={styles.loadingContainer}>Loading projects...</div>
        ) : error ? (
          <div className={styles.errorContainer}>{error}</div>
        ) : (
          <>
            <ProjectSection 
              title="🆕 New Projects" 
              projects={sortedByNew.slice(0, 8)}
              onSelectProject={setSelectedProject}
            />
            <ProjectSection 
              title="🔥 Hot Projects" 
              projects={sortedByHot.slice(0, 8)}
              onSelectProject={setSelectedProject}
            />
            <ProjectSection 
              title="❤️ Most Loved" 
              projects={sortedByLoved.slice(0, 8)}
              onSelectProject={setSelectedProject}
            />
          </>
        )}
      </div>
  
      <ProjectDetailModal
        isOpen={!!selectedProject}
        onClose={() => setSelectedProject(null)}
        project={selectedProject}
        contractAddress={CONTRACT_ADDRESS}
        web3AuthProvider={web3AuthProvider}
      />
    </div>
  );
}

export default Reports;