import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Box, 
  Upload, 
  Camera, 
  Plus, 
  Eye, 
  Trash2,
  CheckCircle,
  AlertCircle,
  TrendingUp
} from 'lucide-react';
import { breedingBoxAPI } from '../services/api';
import toast from 'react-hot-toast';

const BreedingBox = () => {
  const [sessionName, setSessionName] = useState('');
  const [uploadedPhotos, setUploadedPhotos] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);

  const queryClient = useQueryClient();

  const { data: sessions = [] } = useQuery(['breedingBoxSessions'], breedingBoxAPI.getAllSessions);

  const analyzeMutation = useMutation({
    mutationFn: breedingBoxAPI.analyze,
    onSuccess: (data) => {
      setAnalysisResult(data);
      queryClient.invalidateQueries(['breedingBoxSessions']);
      toast.success('Analysis completed successfully!');
    },
    onError: () => {
      toast.error('Analysis failed. Please try again.');
    },
    onSettled: () => {
      setIsAnalyzing(false);
    }
  });

  const handleFileUpload = (files) => {
    const newPhotos = Array.from(files).map(file => ({
      id: Date.now() + Math.random(),
      file,
      preview: URL.createObjectURL(file),
      name: file.name
    }));
    setUploadedPhotos(prev => [...prev, ...newPhotos]);
  };

  const removePhoto = (id) => {
    setUploadedPhotos(prev => {
      const photo = prev.find(p => p.id === id);
      if (photo) {
        URL.revokeObjectURL(photo.preview);
      }
      return prev.filter(p => p.id !== id);
    });
  };

  const handleAnalyze = async () => {
    if (uploadedPhotos.length === 0) {
      toast.error('Please upload at least one photo');
      return;
    }

    if (!sessionName.trim()) {
      toast.error('Please enter a session name');
      return;
    }

    setIsAnalyzing(true);

    try {
      const photoAnalysisRequests = await Promise.all(
        uploadedPhotos.map(async (photo) => {
          const base64 = await convertToBase64(photo.file);
          return {
            photoBase64: base64,
            animalName: photo.name.split('.')[0]
          };
        })
      );

      const request = {
        sessionName: sessionName.trim(),
        animalPhotos: photoAnalysisRequests
      };

      analyzeMutation.mutate(request);
    } catch (error) {
      toast.error('Failed to process photos');
      setIsAnalyzing(false);
    }
  };

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  const getScoreClass = (score) => {
    if (score >= 80) return 'score-excellent';
    if (score >= 60) return 'score-good';
    if (score >= 40) return 'score-fair';
    return 'score-poor';
  };

  const getCompatibilityClass = (score) => {
    if (score >= 80) return 'score-excellent';
    if (score >= 60) return 'score-good';
    if (score >= 40) return 'score-fair';
    return 'score-poor';
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Box className="farm-icon" />
            Breeding Box
          </h1>
          <p className="page-subtitle">
            Upload animal photos for AI-powered breeding analysis and recommendations.
          </p>
        </div>
      </div>

      <div className="breeding-box-content">
        <div className="upload-section">
          <div className="section-card">
            <h2 className="section-title">
              <Upload className="farm-icon" />
              Upload Animal Photos
            </h2>

            <div className="form-group">
              <label className="form-label">Session Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="Enter session name (e.g., Spring Breeding 2024)"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
              />
            </div>

            <div className="upload-area">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleFileUpload(e.target.files)}
                className="file-input"
                id="photo-upload"
              />
              <label htmlFor="photo-upload" className="upload-label">
                <Camera className="upload-icon" />
                <div className="upload-text">Click to upload photos</div>
                <div className="upload-hint">or drag and drop images here</div>
                <div className="upload-hint">Supports JPG, PNG, WEBP formats</div>
              </label>
            </div>

            {uploadedPhotos.length > 0 && (
              <div className="uploaded-photos">
                <h3>Uploaded Photos ({uploadedPhotos.length})</h3>
                <div className="photos-grid">
                  {uploadedPhotos.map((photo) => (
                    <div key={photo.id} className="photo-item">
                      <img src={photo.preview} alt={photo.name} className="photo-preview" />
                      <div className="photo-info">
                        <div className="photo-name">{photo.name}</div>
                        <button
                          className="remove-photo"
                          onClick={() => removePhoto(photo.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              className="btn-primary analyze-btn"
              onClick={handleAnalyze}
              disabled={isAnalyzing || uploadedPhotos.length === 0}
            >
              {isAnalyzing ? (
                <>
                  <div className="loading-spinner"></div>
                  Analyzing...
                </>
              ) : (
                <>
                  <TrendingUp size={16} />
                  Analyze Photos
                </>
              )}
            </button>
          </div>
        </div>

        {analysisResult && (
          <div className="analysis-section">
            <div className="section-card">
              <h2 className="section-title">
                <CheckCircle className="farm-icon" />
                Analysis Results
              </h2>

              <div className="analysis-summary">
                <div className="summary-item">
                  <span className="summary-label">Session:</span>
                  <span className="summary-value">{analysisResult.sessionName}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Animals Analyzed:</span>
                  <span className="summary-value">{analysisResult.animalAnalysis?.length || 0}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Breeding Pairs Found:</span>
                  <span className="summary-value">{analysisResult.breedingPairs?.length || 0}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Diversity Score:</span>
                  <span className="summary-value">{analysisResult.overallDiversityScore || 0}%</span>
                </div>
              </div>

              {analysisResult.animalAnalysis && analysisResult.animalAnalysis.length > 0 && (
                <div className="animal-analysis">
                  <h3>Animal Analysis</h3>
                  <div className="analysis-grid">
                    {analysisResult.animalAnalysis.map((analysis, index) => (
                      <div key={index} className="analysis-result">
                        <div className="analysis-title">
                          Animal {index + 1} - {analysis.animalType}
                        </div>
                        <div className="analysis-details">
                          <div className="analysis-item">
                            <div className="analysis-label">Breed</div>
                            <div className="analysis-value">{analysis.breed}</div>
                          </div>
                          <div className="analysis-item">
                            <div className="analysis-label">Health Status</div>
                            <div className="analysis-value">{analysis.healthStatus}</div>
                          </div>
                          <div className="analysis-item">
                            <div className="analysis-label">Breeding Readiness</div>
                            <div className="analysis-value">{analysis.breedingReadiness}</div>
                          </div>
                          <div className="analysis-item">
                            <div className="analysis-label">Breeding Score</div>
                            <div className={`analysis-value ${getScoreClass(analysis.breedingScore)}`}>
                              {analysis.breedingScore}
                            </div>
                          </div>
                          <div className="analysis-item">
                            <div className="analysis-label">Confidence</div>
                            <div className="analysis-value">
                              {Math.round((analysis.confidence || 0) * 100)}%
                            </div>
                          </div>
                        </div>
                        {analysis.recommendations && (
                          <div className="analysis-recommendations">
                            <strong>Recommendations:</strong> {analysis.recommendations}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {analysisResult.breedingPairs && analysisResult.breedingPairs.length > 0 && (
                <div className="breeding-pairs">
                  <h3>Recommended Breeding Pairs</h3>
                  <div className="pairs-list">
                    {analysisResult.breedingPairs.map((pair, index) => (
                      <div key={index} className="recommendation-card">
                        <div className="recommendation-header">
                          <div className="recommendation-pair">
                            {pair.animal1Name} × {pair.animal2Name}
                          </div>
                          <div className={`compatibility-score ${getCompatibilityClass(pair.compatibilityScore)}`}>
                            {pair.compatibilityScore}% Match
                          </div>
                        </div>
                        <div className="recommendation-details">
                          <div className="recommendation-item">
                            <div className="recommendation-label">Reasoning</div>
                            <div className="recommendation-value">{pair.reasoning}</div>
                          </div>
                          <div className="recommendation-item">
                            <div className="recommendation-label">Predicted Value</div>
                            <div className="recommendation-value">
                              {pair.predictedOffspringValue ? `$${pair.predictedOffspringValue}` : 'N/A'}
                            </div>
                          </div>
                          <div className="recommendation-item">
                            <div className="recommendation-label">Predicted Traits</div>
                            <div className="recommendation-value">{pair.predictedTraits || 'N/A'}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {analysisResult.unsuitableAnimals && analysisResult.unsuitableAnimals.length > 0 && (
                <div className="unsuitable-animals">
                  <h3>
                    <AlertCircle className="farm-icon" />
                    Unsuitable for Breeding
                  </h3>
                  <div className="unsuitable-list">
                    {analysisResult.unsuitableAnimals.map((animal, index) => (
                      <div key={index} className="unsuitable-item">
                        {animal}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {analysisResult.generalRecommendations && (
                <div className="general-recommendations">
                  <h3>General Recommendations</h3>
                  <p>{analysisResult.generalRecommendations}</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="sessions-section">
          <div className="section-card">
            <h2 className="section-title">
              <Eye className="farm-icon" />
              Previous Sessions
            </h2>
            
            {sessions.length > 0 ? (
              <div className="sessions-list">
                {sessions.map((session) => (
                  <div key={session.id} className="session-item">
                    <div className="session-info">
                      <div className="session-name">{session.sessionName}</div>
                      <div className="session-date">
                        {new Date(session.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <button
                      className="btn-secondary btn-sm"
                      onClick={() => setSelectedSession(session)}
                    >
                      <Eye size={14} />
                      View
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <Box className="empty-state-icon" />
                <h3 className="empty-state-title">No Sessions Yet</h3>
                <p className="empty-state-description">
                  Upload photos to create your first breeding analysis session.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BreedingBox;

