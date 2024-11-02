import React, { useState, useEffect } from 'react';
import styles from '../Modals/Modals.module.css';

export function Bot({ inputMessage, onClose }) {
  const [messages, setMessages] = useState([]);
  const [isCreatingReport, setIsCreatingReport] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [newReport, setNewReport] = useState({
    name: '',
    plantType: '',
    plantName: '',
    city: '',
    coordinates: null,
    image: 'https://example.com/placeholder-image.jpg' // Hardcoded for now
  });

  // Questions for the report creation process
  const questions = [
    "What is your name?",
    "What type of plant are you planting: Tree or Flower?",
    "What is the name of the plant?",
    "From which city you are from?",
    "Please upload the images (click the upload button below)"
  ];

  // Mock function to get coordinates (in real implementation, this would be an API call)
  const getCityCoordinates = async (city) => {
    const mockCoordinates = {
      'new york': { lat: 40.7128, lng: -74.0060 },
      'london': { lat: 51.5074, lng: -0.1278 },
      'paris': { lat: 48.8566, lng: 2.3522 },
    };
    
    const normalizedCity = city.toLowerCase();
    return mockCoordinates[normalizedCity] || { lat: 0, lng: 0 };
  };

  const handleReportAnswer = async (answer) => {
    const updatedReport = { ...newReport };
    
    switch (currentQuestion) {
      case 0:
        updatedReport.name = answer;
        break;
      case 1:
        updatedReport.plantType = answer.toLowerCase();
        break;
      case 2:
        updatedReport.plantName = answer;
        break;
      case 3:
        updatedReport.city = answer;
        const coordinates = await getCityCoordinates(answer);
        updatedReport.coordinates = coordinates;
        break;
      case 4:
        break;
    }

    setNewReport(updatedReport);

    const newMessages = [
      {
        text: answer,
        isBot: false,
        timestamp: new Date().toLocaleTimeString()
      }
    ];

    if (currentQuestion < questions.length - 1) {
      newMessages.push({
        text: questions[currentQuestion + 1],
        isBot: true,
        timestamp: new Date().toLocaleTimeString()
      });
      setCurrentQuestion(currentQuestion + 1);
    } else {
      newMessages.push({
        text: "Thank you! Your report has been created successfully!",
        isBot: true,
        timestamp: new Date().toLocaleTimeString()
      });
      console.log("Final Report Data:", updatedReport);
      setIsCreatingReport(false);
      setCurrentQuestion(0);
    }

    setMessages(prev => [...prev, ...newMessages]);
  };

  const getBotResponse = (message) => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('new report')) {
      setIsCreatingReport(true);
      return questions[0];
    } else if (lowerMessage.includes('create')) {
      return "CREATE: Let's start creating your new report! Just type 'new report' to begin.";
    } else if (lowerMessage.includes('continue')) {
      return "CONTINUE: Here are your ongoing reports.";
    } else if (lowerMessage.includes('income')) {
      return "INCOME: Here's your current income status.";
    } else if (lowerMessage.includes('updates')) {
      return "UPDATES: Here are the latest updates on your reports.";
    } else {
      return "Hello there, what are you up to for today? Let's Create or continue the reports, check on your income or check updates on your favourite reports";
    }
  };

  useEffect(() => {
    if (inputMessage && inputMessage !== '') {
      if (isCreatingReport) {
        handleReportAnswer(inputMessage);
      } else {
        const newMessages = [
          {
            text: inputMessage,
            isBot: false,
            timestamp: new Date().toLocaleTimeString()
          },
          {
            text: getBotResponse(inputMessage),
            isBot: true,
            timestamp: new Date().toLocaleTimeString()
          }
        ];
        
        setMessages(prevMessages => [...prevMessages, ...newMessages]);
      }
    }
  }, [inputMessage]);

  const handleImageUpload = () => {
    // Simulate image upload completion
    const simulatedImageUrl = 'https://example.com/uploaded-image.jpg';
    handleReportAnswer(simulatedImageUrl);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.chatContainer}>
        <div className={styles.chatHeader}>
          <h2>Assistant</h2>
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
          
          {/* Show upload button when at the image question */}
          {isCreatingReport && currentQuestion === 4 && (
            <div className={styles.uploadButtonContainer}>
              <button 
                className={styles.uploadButton}
                onClick={handleImageUpload}
              >
                Upload Image
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}