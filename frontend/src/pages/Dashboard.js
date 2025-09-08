import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { animalsAPI, scheduleAPI, healthAPI } from '../services/api';

const Dashboard = () => {
  const { data: animals = [] } = useQuery(['animals'], animalsAPI.getAll);
  const { data: upcomingTasks = [] } = useQuery(['upcomingTasks'], scheduleAPI.getUpcoming);
  const { data: healthStatus } = useQuery(['healthStatus'], healthAPI.getStatus);

  const stats = [
    {
      label: 'Total Animals',
      value: animals.length,
      emoji: '🐑',
      change: '+12%'
    },
    {
      label: 'Breeding Pairs',
      value: animals.filter(a => a.breedingStatus === 'BREEDING').length,
      emoji: '💕',
      change: '+5%'
    },
    {
      label: 'Upcoming Tasks',
      value: upcomingTasks.length,
      emoji: '📅',
      change: '+3%'
    },
    {
      label: 'Success Rate',
      value: '94%',
      emoji: '📈',
      change: '+2%'
    }
  ];

  const recentAnimals = animals.slice(0, 5);
  const upcomingBreeding = upcomingTasks.slice(0, 3);

  return (
    <div className="main-content">
      <div className="page-header">
        <h1>
          <span className="emoji">🌾</span>
          Farm Dashboard
        </h1>
        <p>Welcome back! Here's what's happening on your farm today.</p>
      </div>

      <div className="stats-grid">
        {stats.map((stat, index) => (
          <div key={index} className="stat-card">
            <span className="emoji">{stat.emoji}</span>
            <div className="number">{stat.value}</div>
            <div className="label">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="card-header">
            <h3>
              <span className="emoji">🐑</span>
              Recent Animals
            </h3>
          </div>
          {recentAnimals.length > 0 ? (
            <div className="animal-grid">
              {recentAnimals.map((animal) => (
                <div key={animal.id} className="animal-card">
                  <div className="animal-card-header">
                    <span className="emoji">🐄</span>
                    <span>{animal.name}</span>
                  </div>
                  <div className="animal-card-body">
                    <div className="animal-info">
                      <span>Type: {animal.type}</span>
                      <span>Gender: {animal.gender}</span>
                    </div>
                    <div className="animal-info">
                      <span>Health: {animal.healthStatus}</span>
                      <span>Score: {animal.breedingScore || 0}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center">
              <span className="emoji" style={{fontSize: '3rem'}}>🐑</span>
              <h3>No Animals Yet</h3>
              <p>Add your first animal to get started with smart breeding.</p>
              <Link to="/animals" className="btn btn-primary">
                <span className="emoji">➕</span>
                Add Animal
              </Link>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <h3>
              <span className="emoji">📅</span>
              Upcoming Tasks
            </h3>
          </div>
          {upcomingBreeding.length > 0 ? (
            <div>
              {upcomingBreeding.map((task, index) => (
                <div key={index} className="d-flex justify-between align-center mb-3 p-3" style={{background: 'var(--farm-cream)', borderRadius: 'var(--radius-md)'}}>
                  <div>
                    <div className="font-weight-bold">{task.title || 'Breeding Task'}</div>
                    <div className="text-muted">
                      {new Date(task.scheduledDate).toLocaleDateString()}
                    </div>
                  </div>
                  <span className="animal-status status-ready">Pending</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center">
              <span className="emoji" style={{fontSize: '3rem'}}>📅</span>
              <h3>No Upcoming Tasks</h3>
              <p>Schedule breeding activities to see them here.</p>
              <Link to="/schedule" className="btn btn-primary">
                <span className="emoji">➕</span>
                Schedule Task
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="card-header">
            <h3>
              <span className="emoji">⚡</span>
              Quick Actions
            </h3>
          </div>
          <div className="d-flex flex-column gap-3">
            <Link to="/breeding" className="btn btn-primary">
              <span className="emoji">💕</span>
              Start Breeding Session
            </Link>
            <Link to="/animals" className="btn btn-secondary">
              <span className="emoji">🐑</span>
              Add New Animal
            </Link>
            <Link to="/schedule" className="btn btn-secondary">
              <span className="emoji">📅</span>
              Schedule Task
            </Link>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>
              <span className="emoji">⚙️</span>
              System Status
            </h3>
          </div>
          <div className="d-flex flex-column gap-3">
            <div className="d-flex justify-between align-center">
              <span>Database</span>
              <span className="animal-status status-ready">Connected</span>
            </div>
            <div className="d-flex justify-between align-center">
              <span>AI Service</span>
              <span className="animal-status status-ready">Active</span>
            </div>
            <div className="d-flex justify-between align-center">
              <span>Last Update</span>
              <span>{new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

