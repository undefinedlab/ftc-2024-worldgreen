import React, { useState, useEffect, useRef } from 'react';
import { useWeb3Auth } from '../Web3AuthProvider';
import contractConfig from './ReportMinter.json';
import { questions, initialReportData } from './questionConfig';
import { ContractService } from './contractService';
import styles from '../Modals/Modals.module.css';

export function Bot({ pendingMessage, onClose }) {
  const { provider, user } = useWeb3Auth();
  const [messages, setMessages] = useState([]);
  const [isCreatingReport, setIsCreatingReport] = useState(false);
  const [isUpdatingProject, setIsUpdatingProject] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [reportData, setReportData] = useState(initialReportData);
  const [updateData, setUpdateData] = useState({ tokenId: null, videoUri: '', description: '' });
  const [updateStep, setUpdateStep] = useState('select'); 
  const [userProjects, setUserProjects] = useState([]);
  const messagesEndRef = useRef(null);
  const [contractService, setContractService] = useState(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  const lastProcessedMessageRef = useRef(null);

  useEffect(() => {
    const initialize = async () => {
      if (provider && !hasInitialized) {
        const service = new ContractService(provider, contractConfig);
        setContractService(service);
        setHasInitialized(true);

        const status = await service.checkConnection();
        if (status.isConnected) {
          addMessage("Welcome to Green Projects! 🌱", true);
          addMessage(`• New - Start a new project
• Update - Update existing project
• Help - Show all commands
• Retry - Retry last failed action`, true);
        } else {
          addMessage("Please connect your wallet to continue", true);
        }
      }
    };

    initialize();
  }, [provider]);

  const fetchUserProjects = async () => {
    try {
      if (!contractService || !user?.account) {
        console.error("Contract service or user account not available");
        return [];
      }
  
      console.log("Fetching projects for user:", user.account);
      
      // Get all projects for the user
      const projects = await contractService.getAllProjectsForUser(user.account);
      
      console.log("Found projects:", projects);
      
      if (projects.length === 0) {
        console.log("No projects found for user");
      }
      
      return projects;
      
    } catch (error) {
      console.error("Error fetching user projects:", error);
      return [];
    }
  };
  
  const handleUpdateCommand = async () => {
    if (!contractService) {
      addMessage("Please wait for wallet connection...", true);
      return;
    }
  
    addMessage("Fetching your projects...", true);
    
    try {
      const projects = await fetchUserProjects();
      setUserProjects(projects);
  
      if (projects.length === 0) {
        addMessage("You don't have any projects to update. Try creating a new one!", true);
        return;
      }
  
      setIsUpdatingProject(true);
      setUpdateStep('select');
      
      addMessage("Your projects:", true);
      projects.forEach(project => {
        const lastUpdate = new Date(project.lastUpdateDate * 1000);
        addMessage(`${project.tokenId}: ${project.plantType} (Last update: ${lastUpdate.toLocaleDateString()})`, true);
      });
      addMessage("Please enter the project number you want to update:", true);
    } catch (error) {
      console.error("Error in update command:", error);
      addMessage("Failed to fetch your projects. Please try again.", true);
    }
  };

  
  const handleUpdateFlow = async (answer) => {
    try {
      switch (updateStep) {
        case 'select':
          const tokenId = parseInt(answer);
          const project = userProjects.find(p => p.tokenId === tokenId);
          
          if (!project) {
            addMessage("Invalid project number. Please try again.", true);
            return;
          }
          
          setUpdateData({ ...updateData, tokenId });
          setUpdateStep('video');
          addMessage("Please provide the video URI for the update:", true);
          break;

        case 'video':
          if (!answer.trim()) {
            addMessage("Video URI cannot be empty. Please try again.", true);
            return;
          }
          
          setUpdateData({ ...updateData, videoUri: answer.trim() });
          setUpdateStep('description');
          addMessage("Please provide a short description (max 80 characters):", true);
          break;

        case 'description':
          if (answer.length > 80) {
            addMessage("Description is too long (max 80 characters). Please try again.", true);
            return;
          }
          
          setUpdateData({ ...updateData, description: answer.trim() });
          addMessage("Submitting update...", true);
          
          const result = await contractService.addUpdate(
            updateData.tokenId,
            updateData.videoUri,
            answer.trim()
          );
          
          if (result.success) {
            addMessage(`✅ Update submitted successfully! Transaction: ${result.txHash}`, true);
            setIsUpdatingProject(false);
            setUpdateStep('select');
            setUpdateData({ tokenId: null, videoUri: '', description: '' });
          } else {
            addMessage(`❌ Update failed: ${result.error?.message || 'Unknown error'}`, true);
          }
          break;
      }
    } catch (error) {
      console.error("Error in update flow:", error);
      addMessage("An error occurred. Please try again.", true);
    }
  };

  const handleCommand = (command) => {
    const lowerCommand = command.toLowerCase();
    
    if (lowerCommand === 'new') {
      if (!contractService) {
        addMessage("Please wait for wallet connection...", true);
        return;
      }
      setIsCreatingReport(true);
      setCurrentQuestion(0);
      addMessage("Let's create a new green project! 🌱", true);
      addMessage(questions[0].text, true);
    } else if (lowerCommand === 'update') {
      handleUpdateCommand();
    } else if (lowerCommand === 'retry') {
      handleRetry();
    } else if (lowerCommand === 'help') {
      addMessage(`Available commands:
• new - Start a new project
• update - Update existing project
• retry - Retry last failed action
• help - Show this help message`, true);
    } else {
      addMessage("I didn't understand that command. Type 'help' to see available commands.", true);
    }
  };

  const handleNewMessage = async (text) => {
    addMessage(text, false);

    if (isUpdatingProject) {
      await handleUpdateFlow(text);
    } else if (isCreatingReport) {
      await handleReportAnswer(text);
    } else {
      handleCommand(text);
    }
  };

  const handleReportAnswer = async (answer) => {
    try {
      if (!contractService) {
        addMessage("Please wait for wallet connection...", true);
        return;
      }

      const currentQ = questions[currentQuestion];
      const validation = currentQ.validate(answer);

      if (!validation.isValid) {
        addMessage(validation.error, true);
        return;
      }

      // Update report data
      const updatedData = { ...reportData };
      if (currentQ.id === 'coordinates') {
        updatedData.lat = validation.value.lat;
        updatedData.lng = validation.value.lng;
      } else {
        updatedData[currentQ.id] = validation.value;
      }
      setReportData(updatedData);

      // Move to next question or finish
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(prev => prev + 1);
        addMessage(questions[currentQuestion + 1].text, true);
      } else {
        addMessage("Creating your green project NFT...", true);
        const result = await contractService.mintNFT(updatedData);
        handleMintResult(result);
      }
    } catch (error) {
      console.error("Error handling report answer:", error);
      addMessage("Sorry, there was an error processing your answer. Please try again.", true);
    }
  };

  const handleMintResult = (result) => {
    if (result.success) {
      addMessage(`🌱 Success! Your green project has been created as an NFT! Transaction: ${result.txHash}`, true);
      setIsCreatingReport(false);
      setCurrentQuestion(0);
      setReportData(initialReportData);
    } else {
      addMessage(`❌ Minting failed: ${result.error?.message || 'Unknown error'}. Type 'retry' to try again, or 'new' to start over.`, true);
    }
  };

  const handleRetry = async () => {
    if (!contractService) {
      addMessage("Please wait for wallet connection...", true);
      return;
    }
    
    addMessage("Retrying to mint the project...", true);
    const result = await contractService.mintNFT(reportData);
    handleMintResult(result);
  };


  const addMessage = (text, isBot = false) => {
    setMessages(prev => [...prev, {
      text,
      isBot,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };


  useEffect(() => {
    if (pendingMessage && 
        pendingMessage.timestamp !== lastProcessedMessageRef.current?.timestamp) {
      lastProcessedMessageRef.current = pendingMessage;
      handleNewMessage(pendingMessage.text);
    }
  }, [pendingMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className={styles.overlay}>
      <div className={styles.chatContainer}>
        <div className={styles.chatHeader}>
          <h2>🌱 Green Project Assistant</h2>
          {user && <div className={styles.userInfo}></div>}
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>
        
        <div className={styles.messagesContainer}>
          {messages.map((message, index) => (
            <div 
              key={index} 
              className={`${styles.message} ${message.isBot ? styles.botMessage : styles.userMessage}`}
            >
              <div className={styles.messageContent}>
                <span className={styles.messageText}>{message.text}</span>
                <span className={styles.messageTime}>{message.timestamp}</span>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  );
}