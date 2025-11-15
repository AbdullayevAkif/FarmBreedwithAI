import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { 
  Brain, 
  Send, 
  Mic, 
  MicOff, 
  MessageCircle,
  Lightbulb,
  HelpCircle,
  BookOpen
} from 'lucide-react';
import { aiAdvisorAPI } from '../services/api';
import toast from 'react-hot-toast';
import AnimalRaisingGuide from '../components/AnimalRaisingGuide';

const AIAdvisor = () => {
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);

  const askQuestionMutation = useMutation({
    mutationFn: aiAdvisorAPI.askQuestion,
    onSuccess: (data) => {
      setResponse(data);
      setChatHistory(prev => [...prev, {
        type: 'question',
        content: question,
        timestamp: new Date()
      }, {
        type: 'answer',
        content: data,
        timestamp: new Date()
      }]);
      setQuestion('');
    },
    onError: () => {
      toast.error('Failed to get AI response');
    },
    onSettled: () => {
      setIsLoading(false);
    }
  });

  const voiceCommandMutation = useMutation({
    mutationFn: aiAdvisorAPI.processVoiceCommand,
    onSuccess: (data) => {
      setResponse(data);
      setChatHistory(prev => [...prev, {
        type: 'voice',
        content: 'Voice command processed',
        timestamp: new Date()
      }, {
        type: 'answer',
        content: data,
        timestamp: new Date()
      }]);
    },
    onError: () => {
      toast.error('Failed to process voice command');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    setIsLoading(true);
    askQuestionMutation.mutate(question);
  };

  const handleVoiceCommand = () => {
    if (isRecording) {
      setIsRecording(false);
      return;
    }

    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error('Voice recognition not supported in this browser');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsRecording(true);
      toast.success('Listening...');
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setQuestion(transcript);
      voiceCommandMutation.mutate(transcript);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      toast.error('Voice recognition failed');
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
  };

  const quickQuestions = [
    "What's the best breeding season for cattle?",
    "How do I improve my animals' genetics?",
    "What are the signs of a healthy breeding animal?",
    "How often should I breed my animals?",
    "What factors affect breeding success?",
    "How do I select the best breeding pairs?"
  ];

  const handleQuickQuestion = (quickQuestion) => {
    setQuestion(quickQuestion);
    setIsLoading(true);
    askQuestionMutation.mutate(quickQuestion);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Brain className="farm-icon" />
            AI Breeding Advisor
          </h1>
          <p className="page-subtitle">
            Get expert advice on animal breeding, genetics, and farm management.
          </p>
        </div>
      </div>

      <div className="ai-advisor-content">
        
        <div className="sidebar-section">
          <div className="section-card">
            <div className="raising-guide-section">
              <AnimalRaisingGuide />
            </div>

            <style jsx>{`
              .raising-guide-section {
                margin-top: 30px;
              }
              
              .animal-raising-guide {
                background-color: #f8f9fa;
                border-radius: 8px;
                padding: 20px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.05);
              }
              
              .guide-intro {
                color: #555;
                margin-bottom: 20px;
              }
              
              .animal-section {
                margin-bottom: 15px;
                border: 1px solid #e0e0e0;
                border-radius: 6px;
                overflow: hidden;
              }
              
              .section-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px 15px;
                background-color: #4caf50;
                color: white;
                cursor: pointer;
                transition: background-color 0.3s;
              }
              
              .section-header:hover {
                background-color: #3e8e41;
              }
              
              .section-header.active {
                background-color: #2e7d32;
              }
              
              .section-content {
                padding: 15px;
                background-color: white;
              }
              
              .stage-card {
                margin-bottom: 15px;
                padding: 15px;
                border-left: 3px solid #4caf50;
                background-color: #f9f9f9;
              }
              
              .stage-card h4 {
                color: #2e7d32;
                margin-top: 0;
                margin-bottom: 10px;
              }
              
              .stage-details {
                display: flex;
                flex-direction: column;
                gap: 10px;
              }
              
              .detail-item {
                padding: 8px;
              }
              
              .detail-item strong {
                display: block;
                margin-bottom: 5px;
                color: #333;
              }
              
              .detail-item.recipe {
                background-color: #f0f7f0;
                border-radius: 4px;
                padding: 10px;
              }
              
              .detail-item.recipe strong {
                color: #2e7d32;
              }
            `}</style>
          </div>

          <div className="section-card">
            <h2 className="section-title">
              <Brain className="farm-icon" />
              AI Capabilities
            </h2>
            <div className="ai-capabilities">
              <div className="capability-item">
                <div className="capability-icon">🧬</div>
                <div className="capability-text">Genetic Analysis</div>
              </div>
              <div className="capability-item">
                <div className="capability-icon">📊</div>
                <div className="capability-text">Breeding Recommendations</div>
              </div>
              <div className="capability-item">
                <div className="capability-icon">🏥</div>
                <div className="capability-text">Health Assessment</div>
              </div>
              <div className="capability-item">
                <div className="capability-icon">📅</div>
                <div className="capability-text">Breeding Scheduling</div>
              </div>
              <div className="capability-item">
                <div className="capability-icon">🎯</div>
                <div className="capability-text">Performance Prediction</div>
              </div>
              <div className="capability-item">
                <div className="capability-icon">💡</div>
                <div className="capability-text">Expert Advice</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAdvisor;

