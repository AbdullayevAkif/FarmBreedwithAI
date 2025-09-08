import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { scheduleAPI } from '../services/api';
import toast from 'react-hot-toast';

const Schedule = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const queryClient = useQueryClient();

  const { data: upcomingTasks = [], isLoading: upcomingLoading } = useQuery(
    ['upcomingTasks'], 
    scheduleAPI.getUpcoming
  );
  
  const { data: weeklyTasks = [], isLoading: weeklyLoading } = useQuery(
    ['weeklyTasks'], 
    scheduleAPI.getWeekly
  );

  const markCompleteMutation = useMutation({
    mutationFn: scheduleAPI.markComplete,
    onSuccess: () => {
      queryClient.invalidateQueries(['upcomingTasks']);
      queryClient.invalidateQueries(['weeklyTasks']);
      toast.success('Task marked as completed');
    },
    onError: () => {
      toast.error('Failed to update task');
    }
  });

  const allTasks = [...upcomingTasks, ...weeklyTasks];
  const uniqueTasks = allTasks.filter((task, index, self) => 
    index === self.findIndex(t => t.id === task.id)
  );

  const filteredTasks = uniqueTasks.filter(task => {
    const matchesSearch = task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'ALL' || 
                         (filterStatus === 'PENDING' && !task.completed) ||
                         (filterStatus === 'COMPLETED' && task.completed);
    
    return matchesSearch && matchesStatus;
  });

  const handleMarkComplete = (taskId) => {
    markCompleteMutation.mutate(taskId);
  };

  const getStatusClass = (task) => {
    if (task.completed) return 'status-completed';
    
    const taskDate = new Date(task.scheduledDate);
    const today = new Date();
    const diffTime = taskDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'status-overdue';
    if (diffDays <= 1) return 'status-pending';
    return 'status-pending';
  };

  const getStatusText = (task) => {
    if (task.completed) return 'Completed';
    
    const taskDate = new Date(task.scheduledDate);
    const today = new Date();
    const diffTime = taskDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    return `In ${diffDays} days`;
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'HIGH': return 'priority-high';
      case 'MEDIUM': return 'priority-medium';
      case 'LOW': return 'priority-low';
      default: return 'priority-medium';
    }
  };

  return (
    <div className="main-content">
      <div className="page-header">
        <h1>
          <span className="emoji">📅</span>
          Breeding Schedule
        </h1>
        <p>Manage your breeding activities and farm tasks.</p>
      </div>

      <div className="d-flex justify-between align-center mb-4">
        <button 
          className="btn btn-primary"
          onClick={() => setShowAddModal(true)}
        >
          <span className="emoji">➕</span>
          Add Task
        </button>
      </div>

      <div className="card mb-4">
        <div className="card-header">
          <h3>
            <span className="emoji">🔍</span>
            Search & Filter Tasks
          </h3>
        </div>
        <div className="d-flex gap-3 align-center">
          <div className="form-group" style={{flex: 1}}>
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-control"
            />
          </div>
          <div className="form-group">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="form-control"
            >
              <option value="ALL">All Tasks</option>
              <option value="PENDING">Pending</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="card-header">
            <h3>
              <span className="emoji">⏰</span>
              All Tasks
            </h3>
          </div>
          
          {upcomingLoading || weeklyLoading ? (
            <div className="loading">
              <div className="spinner"></div>
              <p>Loading tasks...</p>
            </div>
          ) : filteredTasks.length > 0 ? (
            <div className="d-flex flex-column gap-3">
              {filteredTasks.map((task) => (
                <div key={task.id} className="p-3" style={{border: '1px solid #e0e0e0', borderRadius: 'var(--radius-md)'}}>
                  <div className="d-flex justify-between align-start mb-2">
                    <div>
                      <div className="font-weight-bold">{task.title || 'Breeding Task'}</div>
                      <div className="text-muted">
                        <span className="emoji">📅</span>
                        {new Date(task.scheduledDate).toLocaleDateString()}
                      </div>
                      {task.description && (
                        <div className="mt-1">{task.description}</div>
                      )}
                      {task.priority && (
                        <span className="animal-status status-ready mt-1">
                          {task.priority}
                        </span>
                      )}
                    </div>
                    <div className="d-flex flex-column align-end gap-2">
                      <span className="animal-status status-ready">
                        {getStatusText(task)}
                      </span>
                      {!task.completed && (
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handleMarkComplete(task.id)}
                          disabled={markCompleteMutation.isLoading}
                        >
                          <span className="emoji">✅</span>
                          Complete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center">
              <span className="emoji" style={{fontSize: '3rem'}}>📅</span>
              <h3>No Tasks Found</h3>
              <p>
                {searchTerm || filterStatus !== 'ALL'
                  ? 'Try adjusting your search or filters.'
                  : 'Create your first breeding task to get started.'
                }
              </p>
              {!searchTerm && filterStatus === 'ALL' && (
                <button 
                  className="btn btn-primary"
                  onClick={() => setShowAddModal(true)}
                >
                  <span className="emoji">➕</span>
                  Add First Task
                </button>
              )}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <h3>
              <span className="emoji">📊</span>
              Task Overview
            </h3>
          </div>
          
          <div className="stats-grid">
            <div className="stat-card">
              <span className="emoji">⏳</span>
              <div className="number">
                {filteredTasks.filter(t => !t.completed).length}
              </div>
              <div className="label">Pending Tasks</div>
            </div>
            
            <div className="stat-card">
              <span className="emoji">✅</span>
              <div className="number">
                {filteredTasks.filter(t => t.completed).length}
              </div>
              <div className="label">Completed</div>
            </div>
            
            <div className="stat-card">
              <span className="emoji">⚠️</span>
              <div className="number">
                {filteredTasks.filter(t => {
                  const taskDate = new Date(t.scheduledDate);
                  const today = new Date();
                  return taskDate < today && !t.completed;
                }).length}
              </div>
              <div className="label">Overdue</div>
            </div>
            
            <div className="stat-card">
              <span className="emoji">📅</span>
              <div className="number">
                {filteredTasks.filter(t => {
                  const taskDate = new Date(t.scheduledDate);
                  const today = new Date();
                  const diffTime = taskDate - today;
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  return diffDays >= 0 && diffDays <= 7 && !t.completed;
                }).length}
              </div>
              <div className="label">This Week</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card mt-4">
        <div className="card-header">
          <h3>
            <span className="emoji">⚡</span>
            Quick Actions
          </h3>
        </div>
        <div className="d-flex gap-3">
          <button className="btn btn-secondary">
            <span className="emoji">📅</span>
            Schedule Breeding
          </button>
          <button className="btn btn-secondary">
            <span className="emoji">✅</span>
            Mark All Complete
          </button>
          <button className="btn btn-secondary">
            <span className="emoji">⚠️</span>
            View Overdue
          </button>
        </div>
      </div>

      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Add New Task</h2>
              <button 
                className="modal-close"
                onClick={() => setShowAddModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>Add task form will be implemented here.</p>
              <button 
                className="btn-primary"
                onClick={() => {
                  setShowAddModal(false);
                  toast('Add task form coming soon');
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Schedule;

