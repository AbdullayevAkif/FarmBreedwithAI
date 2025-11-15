import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { scheduleAPI } from '../services/api';
import toast from 'react-hot-toast';

const Schedule = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [viewImage, setViewImage] = useState(null);
  const [newTask, setNewTask] = useState({
    title: '',
    type: 'BREEDING',
    scheduledDate: '',
    description: ''
  });

  const updateMutation = useMutation({
    mutationFn: ({id, data}) => scheduleAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['upcomingTasks']);
      queryClient.invalidateQueries(['weeklyTasks']);
      toast.success('Task updated');
      setShowEditModal(false);
      setEditingTask(null);
    },
    onError: () => toast.error('Failed to update task')
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => scheduleAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['upcomingTasks']);
      queryClient.invalidateQueries(['weeklyTasks']);
      toast.success('Task deleted');
    },
    onError: () => toast.error('Failed to delete task')
  });

  const scheduleLocalNotification = async (title, when) => {
    try {
      if (!('Notification' in window)) return;
      if (Notification.permission !== 'granted') {
        await Notification.requestPermission();
      }
      const delay = Math.max(0, new Date(when).getTime() - Date.now());
      if (delay > 0 && delay <= 7 * 24 * 60 * 60 * 1000) {
        setTimeout(() => {
          try { new Notification(title); } catch {}
        }, delay);
      }
    } catch {}
  };

  
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

  const speciesOptions = [
    'Chicken','Duck','Goose','Turkey','Quail','Pheasant','Cattle','Sheep','Goat','Pig','Horse','Donkey','Rabbit','Llama','Alpaca','Bee'
  ];

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

  React.useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now();
      uniqueTasks.forEach((t) => {
        if (!t.completed && new Date(t.scheduledDate).getTime() <= now) {
          markCompleteMutation.mutate(t.id);
        }
      });
    }, 60000);
    return () => clearInterval(id);
  }, [uniqueTasks]);

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
                      <div className="d-flex gap-2">
                        {task.metadata?.imageUrl && (
                          <button className="btn btn-secondary btn-sm" onClick={() => setViewImage(task.metadata.imageUrl)}>👁️ View</button>
                        )}
                        <button className="btn btn-secondary btn-sm" onClick={() => { setEditingTask(task); setShowEditModal(true); }}>✏️ Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => deleteMutation.mutate(task.id)}>🗑️ Delete</button>
                        {!task.completed && (
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleMarkComplete(task.id)}
                            disabled={markCompleteMutation.isLoading}
                          >
                            ✅ Complete
                          </button>
                        )}
                      </div>
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
              <form onSubmit={async (e) => {
                e.preventDefault();
                if (!newTask.title.trim()) { toast.error('Title required'); return; }
                const sp = (newTask.species || '').trim();
                if (!sp) { toast.error('Select species'); return; }
                const now = new Date();
                try {
                  const map = {
                    chicken: 21,
                    duck: 28,
                    turkey: 28,
                    goose: 28,
                    quail: 17,
                    pheasant: 24
                  };
                  const key = sp.toLowerCase();
                  const incubation = map[key] ?? 21;
                  const hatch = new Date(now);
                  hatch.setDate(hatch.getDate() + incubation);
                  const hatchTitle = newTask.title.trim() || `Hatching expected: ${sp}`;
                  await scheduleAPI.create({
                    title: hatchTitle,
                    type: 'HATCHING',
                    scheduledDate: hatch.toISOString(),
                    description: newTask.description || '',
                    metadata: { species: sp }
                  });
                  scheduleLocalNotification(hatchTitle, hatch.toISOString());

                  setShowAddModal(false);
                  setNewTask({ title: '', type: 'BREEDING', scheduledDate: '', description: '' });
                  queryClient.invalidateQueries(['upcomingTasks']);
                  queryClient.invalidateQueries(['weeklyTasks']);
                  toast.success('Hatching task created');
                } catch {
                  toast.error('Failed to create task');
                }
              }}>
                <div className="form-group">
                  <label className="form-label">Title</label>
                  <input className="form-input" value={newTask.title} onChange={(e)=>setNewTask({...newTask, title: e.target.value})} placeholder="e.g., Hatching expected: Chicken" />
                </div>
                <div className="d-flex gap-2">
                  <div className="form-group" style={{flex:1}}>
                    <label className="form-label">Species</label>
                    <select className="form-input" value={newTask.species || ''} onChange={(e)=>setNewTask({...newTask, species: e.target.value})}>
                      <option value="">Select species</option>
                      {speciesOptions.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-input" rows={3} value={newTask.description} onChange={(e)=>setNewTask({...newTask, description: e.target.value})} placeholder="Optional notes" />
                </div>
                <div className="d-flex justify-end gap-2 mt-2">
                  <button type="button" className="btn btn-outline" onClick={()=>setShowAddModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Create Task</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showEditModal && editingTask && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Edit Task</h2>
              <button className="modal-close" onClick={() => { setShowEditModal(false); setEditingTask(null); }}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={(e) => {
                e.preventDefault();
                const payload = {
                  title: editingTask.title,
                  description: editingTask.description,
                  scheduledDate: editingTask.scheduledDate,
                  metadata: editingTask.metadata,
                };
                updateMutation.mutate({ id: editingTask.id, data: payload });
              }}>
                <div className="form-group">
                  <label className="form-label">Title</label>
                  <input className="form-input" value={editingTask.title || ''} onChange={(e)=>setEditingTask({...editingTask, title: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Date & Time</label>
                  <input className="form-input" type="datetime-local" value={editingTask.scheduledDate ? new Date(editingTask.scheduledDate).toISOString().slice(0,16) : ''} onChange={(e)=>setEditingTask({...editingTask, scheduledDate: new Date(e.target.value).toISOString()})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-input" rows={3} value={editingTask.description || ''} onChange={(e)=>setEditingTask({...editingTask, description: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Image URL</label>
                  <input className="form-input" value={editingTask.metadata?.imageUrl || ''} onChange={(e)=>setEditingTask({...editingTask, metadata: { ...(editingTask.metadata||{}), imageUrl: e.target.value }})} />
                </div>
                <div className="d-flex justify-end gap-2 mt-2">
                  <button type="button" className="btn btn-outline" onClick={() => { setShowEditModal(false); setEditingTask(null); }}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Save</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {viewImage && (
        <div className="modal-overlay" onClick={() => setViewImage(null)}>
          <div className="modal-content" onClick={(e)=>e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Task Image</h2>
              <button className="modal-close" onClick={() => setViewImage(null)}>×</button>
            </div>
            <div className="modal-body">
              <img src={viewImage} alt="task" style={{maxWidth:'100%', borderRadius:12}} />
              <div className="d-flex justify-end mt-2">
                <button className="btn btn-outline" onClick={() => setViewImage(null)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Schedule;

