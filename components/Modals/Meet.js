import React, { useState, useEffect } from 'react';
import { useWeb3Auth } from '../Web3AuthProvider';
import { Contract, BrowserProvider } from 'ethers';
import { User, Heart, MessageCircle, Share2, Calendar, Trophy, Video, Clock } from 'lucide-react';
import styles from './Meet.module.css';

const CONTRACT_ABI = [
  "function projects(uint256) view returns (uint256 startDate, string plantType, string size, uint256 co2Extracted, string authorName, string bio, uint256 upvotes, uint256 reports, string thumbnailUri, uint256 lastUpdateDate, tuple(int256 lat, int256 lng) coordinates, bool exists)",
  "function getProjectUpdates(uint256) view returns (tuple(uint256 timestamp, string description, string videoUri)[])",
  "function getProjectUpdateCount(uint256) view returns (uint256)"
];

const CONTRACT_ADDRESS = "0x96B625E6ffC9b43c7D652F4c916a908d986649D5";

const VideoPlayer = ({ videoUri }) => {
  const getYoutubeId = (url) => {
    if (!url) return null;
    
    if (url.includes('youtu.be')) {
      const id = url.split('youtu.be/')[1]?.split('?')[0];
      return id || null;
    }
    
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const cleanVideoUri = videoUri?.split('?')[0];
  
  const youtubeId = getYoutubeId(videoUri);

  if (youtubeId) {
    return (
      <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gray-100">
        <iframe
          src={`https://www.youtube.com/embed/${youtubeId}`}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute top-0 left-0 w-full h-full"
        ></iframe>
      </div>
    );
  } else if (cleanVideoUri) {
    return (
      <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gray-100">
        <video
          controls
          className="absolute top-0 left-0 w-full h-full object-cover"
        >
          <source src={cleanVideoUri} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>
    );
  }

  return (
    <div className="w-full aspect-video rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
      Invalid video URL
    </div>
  );
};


const TimelineUpdate = ({ update, project }) => {
  const formattedDate = new Date(Number(update.timestamp) * 1000).toLocaleDateString();
  
  const isVideoUrl = (text) => {
    return text?.includes('youtu.be/') || text?.includes('youtube.com/');
  };

  const videoUrl = isVideoUrl(update.description) ? update.description : update.videoUri;
  const descriptionText = isVideoUrl(update.description) ? update.videoUri : update.description;

  return (
    <div className={styles.timelineItem}>
      <div className={styles.timelineMarker}>
        <div className={styles.timelineDot} />
        <div className={styles.timelineLine} />
      </div>

      <div className={styles.timelineContent}>
        <div className={styles.timelineHeader}>
          <div className={styles.authorInfo}>
            <img 
              src={project.thumbnailUri || '/placeholder-image.jpg'} 
              alt={project.authorName}
              className={styles.authorAvatar}
            />
            <div>
              <h3 className={styles.authorName}>@{project.authorName}</h3>
              <p className={styles.projectName}>{project.plantType}</p>
            </div>
          </div>
          <span className={styles.timelineDate}>
            <Clock className={styles.icon} size={16} />
            {formattedDate}
          </span>
        </div>

        <div className={styles.updateContent}>
          {videoUrl && isVideoUrl(videoUrl) && (
            <div className="mb-4">
              <VideoPlayer videoUri={videoUrl} />
            </div>
          )}
          {descriptionText && !isVideoUrl(descriptionText) && (
            <p className={styles.updateDescription}>{descriptionText}</p>
          )}
        </div>

        <div className={styles.interactions}>
          <button className={styles.interactionButton}>
            <Heart className={styles.icon} />
            <span>Like</span>
          </button>
          <button className={styles.interactionButton}>
            <MessageCircle className={styles.icon} />
            <span>Comment</span>
          </button>
          <button className={styles.interactionButton}>
            <Share2 className={styles.icon} />
            <span>Share</span>
          </button>
        </div>
      </div>
    </div>
  );
};


export function Meet({ onClose }) {
  const { provider: web3AuthProvider } = useWeb3Auth();
  const [updates, setUpdates] = useState([]);
  const [projectStats, setProjectStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProjectsData = async () => {
    try {
      setLoading(true);
      if (!web3AuthProvider) {
        throw new Error('Provider not initialized');
      }

      const ethersProvider = new BrowserProvider(web3AuthProvider);
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, ethersProvider);

      let allUpdates = [];
      let allProjects = [];
      let tokenId = 1;
      let consecutiveFailures = 0;
      const MAX_CONSECUTIVE_FAILURES = 3;

      while (consecutiveFailures < MAX_CONSECUTIVE_FAILURES) {
        try {
          const project = await contract.projects(tokenId);
          
          if (project.exists) {
            consecutiveFailures = 0;
            
            const projectUpdates = await contract.getProjectUpdates(tokenId);
            const updateCount = await contract.getProjectUpdateCount(tokenId);
            
            allProjects.push({
              id: tokenId,
              plantType: project.plantType,
              authorName: project.authorName,
              updateCount: Number(updateCount),
              thumbnailUri: project.thumbnailUri
            });
            
            if (projectUpdates && projectUpdates.length > 0) {
              const formattedUpdates = projectUpdates.map(update => ({
                timestamp: update.timestamp.toString(),
                description: update.description,
                videoUri: update.videoUri,
                project: {
                  id: tokenId,
                  authorName: project.authorName,
                  plantType: project.plantType,
                  thumbnailUri: project.thumbnailUri,
                }
              }));
              allUpdates = [...allUpdates, ...formattedUpdates];
            }
          } else {
            consecutiveFailures++;
          }
        } catch (err) {
          console.warn(`Error fetching data for project ${tokenId}:`, err);
          consecutiveFailures++;
        }
        tokenId++;
      }

      allUpdates.sort((a, b) => Number(b.timestamp) - Number(a.timestamp));
      
      allProjects.sort((a, b) => b.updateCount - a.updateCount);
      
      console.log('Fetched updates:', allUpdates);
      setUpdates(allUpdates);
      setProjectStats(allProjects);
      
    } catch (err) {
      console.error('Error in fetchProjectsData:', err);
      setError('Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (web3AuthProvider) {
      fetchProjectsData();
    }
  }, [web3AuthProvider]);

  return (
    <div className={styles.meetContainer}>
      <div className={styles.header}>
        <h2 className={styles.title}>WorldGreen People</h2>
        <button onClick={onClose} className={styles.closeButton}>×</button>
      </div>

      <div className={styles.content}>
        <div className={styles.timelineContainer}>
          {loading ? (
            <div className={styles.loadingContainer}>
              Loading timeline...
            </div>
          ) : error ? (
            <div className={styles.errorContainer}>{error}</div>
          ) : updates.length === 0 ? (
            <div className={styles.emptyContainer}>
              No updates available
            </div>
          ) : (
            <div className={styles.timeline}>
              {updates.map((update, index) => (
                <TimelineUpdate
                  key={`${update.project.id}-${index}`}
                  update={update}
                  project={update.project}
                />
              ))}
            </div>
          )}
        </div>
        
        <div className={styles.sidebarContainer}>
          <div className={styles.leaderboard}>
            <div className={styles.leaderboardHeader}>
              <Trophy className={styles.trophyIcon} />
              <h3>Top Contributors</h3>
            </div>
            <div className={styles.leaderboardList}>
              {projectStats.slice(0, 7).map((project, index) => (
                <div key={project.id} className={styles.leaderboardItem}>
                  <span className={`${styles.rank} ${index < 3 ? styles[`rank${index + 1}`] : ''}`}>
                    #{index + 1}
                  </span>
                  <div className={styles.leaderboardInfo}>
                    <span className={styles.projectTitle}>{project.plantType}</span>
                    <span className={styles.authorName}>@{project.authorName}</span>
                  </div>
                  <div className={styles.updateCount}>
                    <Video className={styles.smallIcon} />
                    {project.updateCount}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}