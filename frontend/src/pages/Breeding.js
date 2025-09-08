import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { animalsAPI, breedingAPI } from '../services/api';

const Breeding = () => {
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGender, setFilterGender] = useState('ALL');

  const { data: animals = [] } = useQuery(['animals'], animalsAPI.getAll);
  const { data: recommendations = [] } = useQuery({
    queryKey: ['recommendations', selectedAnimal?.id],
    queryFn: () => selectedAnimal ? breedingAPI.getRecommendations(selectedAnimal.id) : [],
    enabled: !!selectedAnimal
  });

  const filteredAnimals = animals.filter(animal => {
    const matchesSearch = animal.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         animal.type?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGender = filterGender === 'ALL' || animal.gender === filterGender;
    
    return matchesSearch && matchesGender;
  });

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
    <div className="main-content">
      <div className="page-header">
        <h1>
          <span className="emoji">💕</span>
          Breeding Management
        </h1>
        <p>Find the best breeding pairs and manage your breeding program.</p>
      </div>

      <div className="d-flex justify-between align-center mb-4">
        <button className="btn btn-primary">
          <span className="emoji">📅</span>
          Schedule Breeding
        </button>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="card-header">
            <h3>
              <span className="emoji">🐑</span>
              Select Animal
            </h3>
          </div>
          
          <div className="form-group">
            <input
              type="text"
              placeholder="Search animals..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-control"
            />
          </div>

          <div className="form-group">
            <select
              value={filterGender}
              onChange={(e) => setFilterGender(e.target.value)}
              className="form-control"
            >
              <option value="ALL">All Genders</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
            </select>
          </div>

          <div className="d-flex flex-column gap-2" style={{maxHeight: '400px', overflowY: 'auto'}}>
            {filteredAnimals.map((animal) => (
              <div
                key={animal.id}
                className={`p-3 ${selectedAnimal?.id === animal.id ? 'selected' : ''}`}
                onClick={() => setSelectedAnimal(animal)}
                style={{
                  border: selectedAnimal?.id === animal.id ? '2px solid var(--farm-green)' : '1px solid #e0e0e0',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                <div className="d-flex justify-between align-center">
                  <div>
                    <div className="font-weight-bold">{animal.name}</div>
                    <div className="text-muted">
                      {animal.type} • {animal.gender} • Score: {animal.breedingScore || 0}
                    </div>
                  </div>
                  <div className={`animal-status status-ready`}>
                    {animal.breedingScore || 0}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          {selectedAnimal ? (
            <>
              <div className="card-header">
                <h3>
                  <span className="emoji">🎯</span>
                  Breeding Recommendations for {selectedAnimal.name}
                </h3>
              </div>
              <div className="p-3 mb-4" style={{background: 'var(--farm-cream)', borderRadius: 'var(--radius-md)'}}>
                <div className="d-flex justify-between align-center">
                  <div>
                    <div className="font-weight-bold">{selectedAnimal.name}</div>
                    <div className="text-muted">
                      {selectedAnimal.type} • {selectedAnimal.gender} • {selectedAnimal.healthStatus}
                    </div>
                  </div>
                  <div className="animal-status status-ready">
                    Score: {selectedAnimal.breedingScore || 0}
                  </div>
                </div>
              </div>

              {recommendations.length > 0 ? (
                <div className="d-flex flex-column gap-3">
                  {recommendations.map((rec, index) => (
                    <div key={index} className="p-3" style={{border: '1px solid #e0e0e0', borderRadius: 'var(--radius-md)'}}>
                      <div className="d-flex justify-between align-center mb-3">
                        <div className="font-weight-bold">
                          <span className="emoji">💕</span>
                          {rec.animal1Name} × {rec.animal2Name}
                        </div>
                        <div className="animal-status status-ready">
                          {rec.compatibilityScore}% Match
                        </div>
                      </div>
                      
                      <div className="d-flex flex-column gap-2 mb-3">
                        <div>
                          <strong>Reasoning:</strong> {rec.reasoning}
                        </div>
                        <div>
                          <strong>Predicted Value:</strong> {rec.predictedOffspringValue ? `$${rec.predictedOffspringValue}` : 'N/A'}
                        </div>
                        <div>
                          <strong>Predicted Traits:</strong> {rec.predictedTraits || 'N/A'}
                        </div>
                        <div>
                          <strong>Risk Factors:</strong> {rec.riskFactors || 'None identified'}
                        </div>
                      </div>

                      <div className="d-flex gap-2">
                        <button className="btn btn-primary btn-sm">
                          <span className="emoji">📅</span>
                          Schedule Breeding
                        </button>
                        <button className="btn btn-secondary btn-sm">
                          <span className="emoji">📊</span>
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center">
                  <span className="emoji" style={{fontSize: '3rem'}}>🎯</span>
                  <h3>No Recommendations</h3>
                  <p>No suitable breeding partners found for this animal.</p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center">
              <span className="emoji" style={{fontSize: '3rem'}}>💕</span>
              <h3>Select an Animal</h3>
              <p>Choose an animal from the list to see breeding recommendations.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Breeding;

