// World.jsx
import React, { useRef, useEffect, useState } from 'react';
import { useWeb3Auth } from '../Web3AuthProvider';
import { createSceneManager } from './sceneManager';
import { ContractDataManager } from './contractDataManager';
import styles from './world.css';

const CONTRACT_ADDRESS = "0x96B625E6ffC9b43c7D652F4c916a908d986649D5";

const World = () => {
  const { provider: web3AuthProvider } = useWeb3Auth();
  const containerRef = useRef(null);
  const canvas3DRef = useRef(null);
  const canvas2DRef = useRef(null);
  const popupRef = useRef(null);
  const sceneManagerRef = useRef(null);
  const contractManagerRef = useRef(null);

  const [isInitialized, setIsInitialized] = useState(false);
  const [popupContent, setPopupContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (web3AuthProvider) {
      const initializeManagers = async () => {
        try {
          contractManagerRef.current = new ContractDataManager(
            CONTRACT_ADDRESS,
            web3AuthProvider
          );

          sceneManagerRef.current = createSceneManager(
            containerRef,
            canvas3DRef,
            canvas2DRef,
            popupRef,
            setIsInitialized,
            (project) => {
              if (project) {
                setPopupContent(contractManagerRef.current.project);
              } else {
                setPopupContent('');
              }
            }
          );

          const projects = await contractManagerRef.current.initialize();
          sceneManagerRef.current.initScene(projects);
          
          contractManagerRef.current.addEventListener('projectsUpdated', (projects) => {
            if (sceneManagerRef.current) {
              sceneManagerRef.current.updateEvents(projects);
            }
          });

          setLoading(false);
        } catch (err) {
          console.error('Error initializing managers:', err);
          setError('Failed to load green projects');
          setLoading(false);
        }
      };

      initializeManagers();
    }

    return () => {
      if (sceneManagerRef.current) {
        sceneManagerRef.current.cleanup();
      }
    };
  }, [web3AuthProvider]);

  useEffect(() => {
    if (isInitialized && sceneManagerRef.current) {
      const animate = () => {
        sceneManagerRef.current.render();
        requestAnimationFrame(animate);
      };
      animate();
    }
  }, [isInitialized]);


  useEffect(() => {
    const handleClickOutside = (event) => {
      const popupElement = popupRef.current?.querySelector('.project-popup');
      if (popupElement && !popupElement.contains(event.target)) {
        setPopupContent('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);



  return (
    <div className="globe-container" ref={containerRef}>
      {error && (
        <div className="error-overlay">
          <p>{error}</p>
          <button onClick={() => contractManagerRef.current?.fetchProjects()}>
            Retry
          </button>
        </div>
      )}

      <canvas 
        id="globe-3d" 
        ref={canvas3DRef}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />      
      <canvas id="globe-2d-overlay" ref={canvas2DRef} />
      <div id="globe-popup-overlay" onClick={(e) => {
        if (e.target.id === 'globe-popup-overlay') {
          setPopupContent('');
        }
      }}>
        <div className="globe-popup" ref={popupRef}>
          {popupContent && (
            <div 
              className="project-popup"
              onClick={(e) => e.stopPropagation()}
              dangerouslySetInnerHTML={{ __html: popupContent }} 
            />
          )}
        </div>   
      </div>
    </div>
  );
};

export default World;