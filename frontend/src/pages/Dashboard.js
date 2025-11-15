import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { animalsAPI, scheduleAPI, healthAPI, statsAPI } from '../services/api';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [newTask, setNewTask] = React.useState({ title: '', species: '', description: '' });
  const speciesOptions = [
    'Chicken','Duck','Goose','Turkey','Quail','Pheasant','Cattle','Sheep','Goat','Pig','Horse','Donkey','Rabbit','Llama','Alpaca','Bee'
  ];

  const { data: animals = [] } = useQuery(['animals'], animalsAPI.getAll);
  const { data: upcomingTasks = [] } = useQuery(['upcomingTasks'], scheduleAPI.getUpcoming);
  const { data: weeklyTasks = [] } = useQuery(['weeklyTasks'], scheduleAPI.getWeekly);
  const { data: healthStatus } = useQuery(['healthStatus'], healthAPI.getStatus);
  const { data: breedingPairsCount = 0 } = useQuery(['breedingPairsCount'], () => statsAPI.get('breeding_pairs'));

  const deleteMutation = useMutation({
    mutationFn: (id) => scheduleAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['upcomingTasks']);
      queryClient.invalidateQueries(['weeklyTasks']);
      toast.success('Task removed');
    },
    onError: () => toast.error('Failed to remove task')
  });

  const speciesEmoji = (sp) => {
    const s = (sp || '').toLowerCase();
    if (['chicken', 'hen', 'rooster'].includes(s)) return '🐔';
    if (['duck'].includes(s)) return '🦆';
    if (['goose'].includes(s)) return '🪿';
    if (['turkey'].includes(s)) return '🦃';
    if (['quail'].includes(s)) return '🐤';
    if (['pheasant'].includes(s)) return '🐦';
    if (['cattle', 'cow', 'bull'].includes(s)) return '🐄';
    if (['sheep', 'ram', 'ewe'].includes(s)) return '🐑';
    if (['goat'].includes(s)) return '🐐';
    if (['pig'].includes(s)) return '🐖';
    if (['horse'].includes(s)) return '🐴';
    if (['donkey'].includes(s)) return '🫏';
    if (['rabbit'].includes(s)) return '🐇';
    if (['llama'].includes(s)) return '🦙';
    if (['alpaca'].includes(s)) return '🦙';
    if (['bee'].includes(s)) return '🐝';
    return '🐾';
  };

  const formatDate = (dateLike) => {
    try { return new Date(dateLike).toLocaleDateString('en-GB'); } catch { return ''; }
  };

  const getStartDate = (task) => {
    if (task.startDate) return new Date(task.startDate);
    if (task.scheduledDate && (task.durationDays || (task.species || task.metadata?.species))) {
      const days = task.durationDays || speciesDays(task.species || task.metadata?.species);
      const end = new Date(task.scheduledDate);
      const start = new Date(end);
      start.setDate(end.getDate() - days);
      return start;
    }
    return task.scheduledDate ? new Date(task.scheduledDate) : null;
  };

  const speciesDays = (sp) => {
    const s = (sp || '').toLowerCase();
    if (s === 'chicken') return 21;
    if (s === 'duck') return 28;
    if (s === 'turkey') return 30;
    if (s === 'goose') return 28;
    if (s === 'quail') return 17;
    if (s === 'pheasant') return 24;
    return 21;
  };

  const createHatchingMutation = useMutation({
    mutationFn: (payload) => scheduleAPI.createHatching(payload),
    onSuccess: () => {
      queryClient.invalidateQueries(['upcomingTasks']);
      queryClient.invalidateQueries(['weeklyTasks']);
      toast.success('Task created');
      setShowAddModal(false);
      setNewTask({ title: '', species: '', description: '' });
    },
    onError: () => toast.error('Failed to create task')
  });

  const getReadyStatus = (task) => {
    const d = new Date(task.scheduledDate);
    const today = new Date();
    const due = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return due <= t0 ? 'Ready' : 'Pending';
  };

  const breedingOpsCount = breedingPairsCount || 0;

  const stats = [
    {
      label: 'Total Animals',
      value: animals.length,
      emoji: '🐑',
      change: '+12%'
    },
    {
      label: 'Breeding Pairs',
      value: breedingOpsCount,
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
  const upcomingBreeding = upcomingTasks;

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
          <div className="card-header d-flex justify-between align-center">
            <h3>
              <span className="emoji">📅</span>
              Upcoming Tasks
            </h3>
            <button className="btn btn-primary btn-sm" onClick={()=>setShowAddModal(true)}>
              <span className="emoji">➕</span>
              Add Task
            </button>
          </div>
          {upcomingBreeding.length > 0 ? (
            <div>
              {upcomingBreeding.map((task, index) => (
                <div key={index} className="d-flex justify-between align-center mb-3 p-3" style={{background: 'var(--farm-cream)', borderRadius: 'var(--radius-md)'}}>
                  <div>
                    <div className="font-weight-bold">{task.title || 'Breeding Task'}</div>
                    <div className="text-muted">{`${formatDate(getStartDate(task))} / ${formatDate(task.scheduledDate)}`}</div>
                    <div className="mt-1" style={{fontSize: '0.9rem'}}>
                      <span className="emoji">{speciesEmoji(task.species || task.metadata?.species)}</span>
                      {(task.species || task.metadata?.species) ? ` Waiting: ${task.species || task.metadata?.species}` : ` Process: ${task.type || 'PENDING'}`}
                    </div>
                    {(task.species || task.durationDays) && (
                      <div className="text-muted" style={{fontSize:'0.85rem'}}>
                        Duration: {task.durationDays || speciesDays(task.species || task.metadata?.species)} days
                      </div>
                    )}
                  </div>
                  <div className="d-flex align-center gap-2">
                    <span className={`animal-status ${getReadyStatus(task)==='Ready' ? 'status-ready' : 'status-pending'}`}>{getReadyStatus(task)}</span>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => task.id && deleteMutation.mutate(task.id)}
                      title="Remove task"
                    >
                      🗑️
                    </button>
                  </div>
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
          {showAddModal && (
            <div className="p-3 mt-2" style={{background:"var(--farm-cream)", borderRadius:'var(--radius-md)'}}>
              <h3 className="mb-2">Add New Task</h3>
              <form onSubmit={(e)=>{
                e.preventDefault();
                if (!newTask.species) { toast.error('Select species'); return; }
                createHatchingMutation.mutate({ title: newTask.title, species: newTask.species, description: newTask.description });
              }}>
                <div className="form-group">
                  <label className="form-label">Title</label>
                  <input className="form-input" value={newTask.title} onChange={(e)=>setNewTask({...newTask, title: e.target.value})} placeholder="e.g., Hatching expected: Chicken" />
                </div>
                <div className="form-group">
                  <label className="form-label">Species</label>
                  <select className="form-input" value={newTask.species} onChange={(e)=>setNewTask({...newTask, species: e.target.value})}>
                    <option value="">Select species</option>
                    {speciesOptions.map(s=> <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-input" rows={3} value={newTask.description} onChange={(e)=>setNewTask({...newTask, description: e.target.value})} placeholder="Optional notes" />
                </div>
                <div className="d-flex justify-end gap-2 mt-2">
                  <button type="button" className="btn btn-outline" onClick={()=>setShowAddModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={createHatchingMutation.isLoading}>Create Task</button>
                </div>
              </form>
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

