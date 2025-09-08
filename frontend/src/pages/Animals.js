import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { animalsAPI } from '../services/api';
import toast from 'react-hot-toast';

const Animals = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGender, setFilterGender] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const queryClient = useQueryClient();

  const { data: animals = [], isLoading } = useQuery(['animals'], animalsAPI.getAll);

  const deleteAnimalMutation = useMutation({
    mutationFn: animalsAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['animals']);
      toast.success('Animal deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete animal');
    }
  });

  const filteredAnimals = animals.filter(animal => {
    const matchesSearch = animal.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         animal.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         animal.breed?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGender = filterGender === 'ALL' || animal.gender === filterGender;
    const matchesStatus = filterStatus === 'ALL' || animal.healthStatus === filterStatus;
    
    return matchesSearch && matchesGender && matchesStatus;
  });

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this animal?')) {
      deleteAnimalMutation.mutate(id);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'EXCELLENT': return 'status-excellent';
      case 'GOOD': return 'status-good';
      case 'FAIR': return 'status-fair';
      case 'POOR': return 'status-poor';
      default: return 'status-unknown';
    }
  };

  const getBreedingStatusColor = (status) => {
    switch (status) {
      case 'READY': return 'breeding-ready';
      case 'PREGNANT': return 'breeding-pregnant';
      case 'BREEDING': return 'breeding-breeding';
      case 'NOT_READY': return 'breeding-not-ready';
      case 'RETIRED': return 'breeding-retired';
      default: return 'status-unknown';
    }
  };

  const getScoreClass = (score) => {
    if (score >= 80) return 'score-excellent';
    if (score >= 60) return 'score-good';
    if (score >= 40) return 'score-fair';
    return 'score-poor';
  };

  return (
    <div className="main-content">
      <div className="page-header">
        <h1>
          <span className="emoji">🐑</span>
          Animals
        </h1>
        <p>Manage your farm animals and their breeding information.</p>
      </div>

      <div className="d-flex justify-between align-center mb-4">
        <button 
          className="btn btn-primary"
          onClick={() => setShowAddModal(true)}
        >
          <span className="emoji">➕</span>
          Add Animal
        </button>
      </div>

      <div className="card mb-4">
        <div className="card-header">
          <h3>
            <span className="emoji">🔍</span>
            Search & Filter
          </h3>
        </div>
        <div className="d-flex gap-3 align-center">
          <div className="form-group" style={{flex: 1}}>
            <input
              type="text"
              placeholder="Search animals by name, type, or breed..."
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
          <div className="form-group">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="form-control"
            >
              <option value="ALL">All Status</option>
              <option value="EXCELLENT">Excellent</option>
              <option value="GOOD">Good</option>
              <option value="FAIR">Fair</option>
              <option value="POOR">Poor</option>
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading animals...</p>
        </div>
      ) : (
        <div className="animal-grid">
          {filteredAnimals.map((animal) => (
            <div key={animal.id} className="animal-card">
              <div className="animal-card-header">
                <span className="emoji">🐄</span>
                <span>{animal.name}</span>
              </div>
              <div className="animal-card-body">
                <div className="animal-info">
                  <span>Type: {animal.type}</span>
                  <span>Breed: {animal.breed}</span>
                </div>
                <div className="animal-info">
                  <span>Gender: {animal.gender}</span>
                  <span>Health: {animal.healthStatus}</span>
                </div>
                <div className="animal-info">
                  <span>Breeding: {animal.breedingStatus}</span>
                  <span>Score: {animal.breedingScore || 0}</span>
                </div>
                {animal.weight && (
                  <div className="animal-info">
                    <span>Weight: {animal.weight} kg</span>
                  </div>
                )}
                <div className="d-flex gap-2 mt-3">
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => {
                      setSelectedAnimal(animal);
                      setShowDetailsModal(true);
                    }}
                  >
                    <span className="emoji">👁️</span>
                    View
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => toast('Edit functionality coming soon')}
                  >
                    <span className="emoji">✏️</span>
                    Edit
                  </button>
                  <button
                    className="btn btn-warning btn-sm"
                    onClick={() => toast('Photo analysis coming soon')}
                  >
                    <span className="emoji">📷</span>
                    Analyze
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(animal.id)}
                  >
                    <span className="emoji">🗑️</span>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredAnimals.length === 0 && !isLoading && (
        <div className="card text-center">
          <span className="emoji" style={{fontSize: '4rem'}}>🐑</span>
          <h3>No Animals Found</h3>
          <p>
            {searchTerm || filterGender !== 'ALL' || filterStatus !== 'ALL'
              ? 'Try adjusting your search or filters.'
              : 'Add your first animal to get started with smart breeding.'
            }
          </p>
          {!searchTerm && filterGender === 'ALL' && filterStatus === 'ALL' && (
            <button 
              className="btn btn-primary"
              onClick={() => setShowAddModal(true)}
            >
              <span className="emoji">➕</span>
              Add First Animal
            </button>
          )}
        </div>
      )}

      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Add New Animal</h2>
              <button 
                className="modal-close"
                onClick={() => setShowAddModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>Add animal form will be implemented here.</p>
              <button 
                className="btn-primary"
                onClick={() => {
                  setShowAddModal(false);
                  toast('Add animal form coming soon');
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showDetailsModal && selectedAnimal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">{selectedAnimal.name} Details</h2>
              <button 
                className="modal-close"
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedAnimal(null);
                }}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="animal-details-full">
                <div className="detail-row">
                  <span className="detail-label">Type:</span>
                  <span className="detail-value">{selectedAnimal.type}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Breed:</span>
                  <span className="detail-value">{selectedAnimal.breed}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Gender:</span>
                  <span className={`detail-value gender-${selectedAnimal.gender?.toLowerCase()}`}>
                    {selectedAnimal.gender}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Health Status:</span>
                  <span className={`detail-value ${getStatusColor(selectedAnimal.healthStatus)}`}>
                    {selectedAnimal.healthStatus}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Breeding Status:</span>
                  <span className={`detail-value ${getBreedingStatusColor(selectedAnimal.breedingStatus)}`}>
                    {selectedAnimal.breedingStatus}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Breeding Score:</span>
                  <span className={`detail-value ${getScoreClass(selectedAnimal.breedingScore)}`}>
                    {selectedAnimal.breedingScore || 0}
                  </span>
                </div>
                {selectedAnimal.birthDate && (
                  <div className="detail-row">
                    <span className="detail-label">Birth Date:</span>
                    <span className="detail-value">
                      {new Date(selectedAnimal.birthDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {selectedAnimal.weight && (
                  <div className="detail-row">
                    <span className="detail-label">Weight:</span>
                    <span className="detail-value">{selectedAnimal.weight} kg</span>
                  </div>
                )}
                {selectedAnimal.geneticsTraits && (
                  <div className="detail-row">
                    <span className="detail-label">Genetic Traits:</span>
                    <span className="detail-value">{selectedAnimal.geneticsTraits}</span>
                  </div>
                )}
                {selectedAnimal.temperament && (
                  <div className="detail-row">
                    <span className="detail-label">Temperament:</span>
                    <span className="detail-value">{selectedAnimal.temperament}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Animals;

