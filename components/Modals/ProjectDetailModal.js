import React, { useState, useEffect } from 'react';
import { Contract, BrowserProvider } from 'ethers';
import { Calendar, Clock, MapPin, Leaf, Scale, User } from 'lucide-react';

const PROJECT_UPDATES_ABI = [
  "function getProjectUpdates(uint256) view returns (tuple(uint256 timestamp, string videoUri, string description)[])",
  "function getProjectAge(uint256) view returns (uint256)",
  "function getDaysSinceLastUpdate(uint256) view returns (uint256)"
];

const VideoPlayer = ({ videoUri }) => {
    // Function to get YouTube video ID from URL
    const getYoutubeId = (url) => {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = url.match(regExp);
      return (match && match[2].length === 11) ? match[2] : null;
    };
  
    // Check if it's a YouTube video
    const youtubeId = getYoutubeId(videoUri);
  
    if (youtubeId) {
      return (
        <div className="aspect-video w-full rounded-lg overflow-hidden">
          <iframe
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${youtubeId}`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          ></iframe>
        </div>
      );
    } else {
      // For other video sources
      return (
        <div className="aspect-video w-full rounded-lg overflow-hidden">
          <video
            controls
            className="w-full h-full object-cover"
          >
            <source src={videoUri} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }
  };

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backdropFilter: 'blur(5px)',
    overflowY: 'auto',
    

  },
  modal: {
    overflowY: 'scroll',
    
    backgroundColor: 'white',
    borderRadius: '1.5rem',
    maxWidth: '100%',
    width: '100%',
    maxHeight: '70vh',
    overflow: 'hidden',
    position: 'relative'
  },
  closeButton: {
    position: 'absolute',
    top: '1rem',
    right: '1rem',
    background: 'none',
    border: 'none',
    fontSize: '1.5rem',
    cursor: 'pointer',
    color: '#666',
    zIndex: 10
  },
  content: {
    padding: '2rem',
    maxHeight: '90vh',
    overflowY: 'auto'
  }
};

export function ProjectDetailModal({ 
  isOpen, 
  onClose, 
  project, 
  contractAddress, 
  web3AuthProvider 
}) {
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [additionalInfo, setAdditionalInfo] = useState(null);

  useEffect(() => {
    const fetchProjectUpdates = async () => {
      if (!isOpen || !project || !web3AuthProvider) return;

      try {
        setLoading(true);
        const ethersProvider = new BrowserProvider(web3AuthProvider);
        const contract = new Contract(contractAddress, PROJECT_UPDATES_ABI, ethersProvider);

        const [updates, age, daysSinceUpdate] = await Promise.all([
          contract.getProjectUpdates(project.id),
          contract.getProjectAge(project.id),
          contract.getDaysSinceLastUpdate(project.id)
        ]);

        setUpdates(updates);
        setAdditionalInfo({
          age: age.toString(),
          daysSinceUpdate: daysSinceUpdate.toString()
        });
        
        console.log('Fetched updates:', updates);
      } catch (error) {
        console.error('Error fetching project updates:', error);
        setError('Failed to load project updates');
      } finally {
        setLoading(false);
      }
    };

    fetchProjectUpdates();
  }, [isOpen, project, web3AuthProvider, contractAddress]);

  const formatDate = (timestamp) => {
    return new Date(Number(timestamp) * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen || !project) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()} className="modal-content">
        <button style={styles.closeButton} onClick={onClose}>×</button>
        
        <div style={styles.content}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">


            
            {/* Project Image and Basic Info */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-4">{project.plantType}</h2>
              
              <div className="relative h-64 rounded-lg overflow-hidden">
                <img
                  src={project.thumbnailUri}
                  alt={project.plantType}
                  className="object-cover w-full h-full"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/placeholder-image.jpg';
                  }}
                />
              </div>
              <div className="bg-white p-4 rounded-lg border">
                <h3 className="font-semibold mb-2">About this Project</h3>
                <p className="text-gray-600">{project.bio}</p>
              </div>


              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <div className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-gray-500" />
                  <span>Created by {project.authorName}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-gray-500" />
                  <span>Started {formatDate(project.startDate/1000)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5 text-gray-500" />
                  <span>Location: {project.coordinates.lat.toFixed(4)}, {project.coordinates.lng.toFixed(4)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Leaf className="h-5 w-5 text-green-500" />
                  <span>Size: {project.size}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Scale className="h-5 w-5 text-blue-500" />
                  <span>CO₂ Extracted: {project.co2Extracted} tonnes</span>
                </div>
              </div>

           


              
            </div>




            {/* Updates Timeline */}
            <div className="space-y-6">

                    {/* Project Stats */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-3">Project Stats</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-white rounded-lg border">
                    <div className="text-2xl font-bold text-green-500">
                      {project.upvotes}
                    </div>
                    <div className="text-sm text-gray-500">Upvotes</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg border">
                    <div className="text-2xl font-bold text-blue-500">
                      {additionalInfo?.age || '0'}
                    </div>
                    <div className="text-sm text-gray-500">Days Active</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg border">
                    <div className="text-2xl font-bold text-purple-500">
                      {updates.length}
                    </div>
                    <div className="text-sm text-gray-500">Updates</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg border">
                    <div className="text-2xl font-bold text-orange-500">
                      {additionalInfo?.daysSinceUpdate || '0'}
                    </div>
                    <div className="text-sm text-gray-500">Days Since Update</div>
                  </div>
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg border">
                <h3 className="font-semibold mb-4">Project Updates</h3>
                {loading ? (
                  <div className="text-center py-4">Loading updates...</div>
                ) : error ? (
                  <div className="text-center text-red-500 py-4">{error}</div>
                ) : updates.length === 0 ? (
                  <div className="text-center text-gray-500 py-4">No updates yet</div>
                ) : (
                  <div className="space-y-6">
                  {updates.map((update, index) => (
  <div
    key={index}
    className="relative pl-6 pb-6 border-l-2 border-green-200 last:border-l-0"
  >
    <div className="absolute left-[-9px] top-0 w-4 h-4 bg-green-500 rounded-full" />
    <div className="bg-gray-50 p-4 rounded-lg">
      <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
        <Clock className="h-4 w-4" />
        <span>{formatDate(update.timestamp)}</span>
      </div>
      <p className="text-gray-700 mb-3">{update.description}</p>
      {update.videoUri && (
        <div className="mt-3">
          <VideoPlayer videoUri={update.videoUri} />
        </div>
      )}
    </div>
  </div>
))}
                  </div>
                )}
              </div>

        
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProjectDetailModal;