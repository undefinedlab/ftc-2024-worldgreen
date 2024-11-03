import React, { useState, useEffect, useRef } from 'react';
import { useWeb3Auth } from '../Web3AuthProvider';
import contractConfig from './ReportMinter.json';
import { questions, initialReportData } from './questionConfig';
import { ContractService } from './contractService';
import styles from '../Modals/Modals.module.css';

export function Bot({ inputMessage, onClose }) {
  const { provider, user } = useWeb3Auth();
  const [messages, setMessages] = useState([]);
  const [isCreatingReport, setIsCreatingReport] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [reportData, setReportData] = useState(initialReportData);
  const messagesEndRef = useRef(null);
  const [contractService, setContractService] = useState(null);

  // Initialize contract service
  useEffect(() => {
    if (provider) {
      const service = new ContractService(provider, contractConfig);
      setContractService(service);
      
      // Check connection on init
      service.checkConnection().then(status => {
        if (status.isConnected) {
          addMessage(`Connected to wallet: ${status.account.slice(0, 6)}...${status.account.slice(-4)}`, true);
          addMessage(`Balance: ${Number(status.balance).toFixed(4)} ETH`, true);
        } else {
          addMessage("Please connect your wallet to continue", true);
        }
      });
    }
  }, [provider]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const addMessage = (text, isBot = false) => {
    setMessages(prev => [...prev, {
      text,
      isBot,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const handleRetry = async () => {
    if (!contractService) return;
    
    addMessage("Retrying to mint the project...", true);
    const result = await contractService.mintNFT(reportData);
    handleMintResult(result);
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

  const handleReportAnswer = async (answer) => {
    const currentQ = questions[currentQuestion];
    const validation = currentQ.validate(answer);

    if (!validation.isValid) {
      addMessage(validation.error, true);
      return;
    }

    const updatedData = { ...reportData };
    if (currentQ.id === 'coordinates') {
      updatedData.lat = validation.value.lat;
      updatedData.lng = validation.value.lng;
    } else {
      updatedData[currentQ.id] = validation.value;
    }

    setReportData(updatedData);
    addMessage(answer, false);

    if (currentQuestion < questions.length - 1) {
      addMessage(questions[currentQuestion + 1].text, true);
      setCurrentQuestion(prev => prev + 1);
    } else {
      addMessage("Creating your green project NFT...", true);
      const result = await contractService.mintNFT(updatedData);
      handleMintResult(result);
    }
  };


  const handleCommand = (command) => {
    const lowerCommand = command.toLowerCase();
    
    if (lowerCommand === 'new') {
      setIsCreatingReport(true);
      setCurrentQuestion(0);
      addMessage(questions[0], true);
    } else if (lowerCommand === 'retry') {
      handleRetry();
    } else if (lowerCommand === 'help') {
      addMessage(`Available commands:
• new - Start a new project
• retry - Retry last failed mint
• help - Show this help message`, true);
    } else {
      addMessage("Welcome to Green Projects! 🌱 Type 'new' to start a project or 'help' for commands.", true);
    }
  };

  useEffect(() => {
    if (inputMessage?.trim()) {
      if (isCreatingReport) {
        handleReportAnswer(inputMessage);
      } else {
        handleCommand(inputMessage);
      }
    }
  }, [inputMessage]);

  return (
    <div className={styles.overlay}>
      <div className={styles.chatContainer}>
        <div className={styles.chatHeader}>
          <h2>🌱 Green Project Assistant</h2>
          {user && (
            <div className={styles.userInfo}>
              Connected: {user.address?.slice(0, 6)}...{user.address?.slice(-4)}
            </div>
          )}
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

export default Bot;