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
        <div className="chat-section">
          <div className="section-card">
            <h2 className="section-title">
              <MessageCircle className="farm-icon" />
              Ask Your Question
            </h2>

            <form onSubmit={handleSubmit} className="question-form">
              <div className="input-group">
                <input
                  type="text"
                  className="form-input question-input"
                  placeholder="Ask anything about animal breeding, genetics, or farm management..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className={`voice-btn ${isRecording ? 'recording' : ''}`}
                  onClick={handleVoiceCommand}
                  disabled={isLoading}
                >
                  {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
                </button>
                <button
                  type="submit"
                  className="btn-primary send-btn"
                  disabled={isLoading || !question.trim()}
                >
                  {isLoading ? (
                    <div className="loading-spinner"></div>
                  ) : (
                    <Send size={16} />
                  )}
                </button>
              </div>
            </form>

            {response && (
              <div className="ai-response">
                <div className="response-header">
                  <Brain className="response-icon" />
                  <span>AI Advisor Response</span>
                </div>
                <div className="response-content">
                  {response}
                </div>
              </div>
            )}

            {chatHistory.length > 0 && (
              <div className="chat-history">
                <h3>Conversation History</h3>
                <div className="chat-messages">
                  {chatHistory.map((message, index) => (
                    <div key={index} className={`chat-message ${message.type}`}>
                      <div className="message-content">
                        {message.content}
                      </div>
                      <div className="message-time">
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="sidebar-section">
          <div className="section-card">
            <h2 className="section-title">
              <Lightbulb className="farm-icon" />
              Quick Questions
            </h2>
            <div className="quick-questions">
              {quickQuestions.map((quickQuestion, index) => (
                <button
                  key={index}
                  className="quick-question-btn"
                  onClick={() => handleQuickQuestion(quickQuestion)}
                  disabled={isLoading}
                >
                  <HelpCircle size={16} />
                  {quickQuestion}
                </button>
              ))}
            </div>
          </div>

          <div className="section-card">
            <h2 className="section-title">
              <BookOpen className="farm-icon" />
              Breeding Tips
            </h2>
            <div className="breeding-tips">
              <div className="tip-item">
                <h4>Optimal Breeding Age</h4>
                <p>Most farm animals reach breeding maturity at 12-18 months, depending on species and breed.</p>
              </div>
              <div className="tip-item">
                <h4>Genetic Diversity</h4>
                <p>Maintain genetic diversity by avoiding close relatives and introducing new bloodlines periodically.</p>
              </div>
              <div className="tip-item">
                <h4>Health Assessment</h4>
                <p>Always ensure animals are in excellent health before breeding to maximize success rates.</p>
              </div>
              <div className="tip-item">
                <h4>Record Keeping</h4>
                <p>Maintain detailed records of breeding history, genetics, and offspring performance.</p>
              </div>
            </div>
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

