import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  User, 
  Mail, 
  Building, 
  Edit, 
  Save, 
  X,
  Shield,
  Calendar,
  Settings
} from 'lucide-react';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    farmName: user?.farmName || ''
  });

  const handleEdit = () => {
    setIsEditing(true);
    setEditData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      farmName: user?.farmName || ''
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      farmName: user?.farmName || ''
    });
  };

  const handleSave = () => {
    // In a real app, this would call an API to update the user
    toast.success('Profile updated successfully!');
    setIsEditing(false);
  };

  const handleInputChange = (field, value) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <User className="farm-icon" />
            Profile Settings
          </h1>
          <p className="page-subtitle">
            Manage your account information and preferences.
          </p>
        </div>
        <div className="header-actions">
          {!isEditing ? (
            <button className="btn-primary" onClick={handleEdit}>
              <Edit size={16} />
              Edit Profile
            </button>
          ) : (
            <div className="edit-actions">
              <button className="btn-secondary" onClick={handleCancel}>
                <X size={16} />
                Cancel
              </button>
              <button className="btn-primary" onClick={handleSave}>
                <Save size={16} />
                Save Changes
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="profile-content">
        <div className="profile-main">
          <div className="section-card">
            <h2 className="section-title">
              <User className="farm-icon" />
              Personal Information
            </h2>
            
            <div className="profile-form">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">First Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      className="form-input"
                      value={editData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                    />
                  ) : (
                    <div className="profile-value">{user?.firstName}</div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Last Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      className="form-input"
                      value={editData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                    />
                  ) : (
                    <div className="profile-value">{user?.lastName}</div>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Mail size={16} />
                  Email Address
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    className="form-input"
                    value={editData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                  />
                ) : (
                  <div className="profile-value">{user?.email}</div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Building size={16} />
                  Farm Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    className="form-input"
                    value={editData.farmName}
                    onChange={(e) => handleInputChange('farmName', e.target.value)}
                  />
                ) : (
                  <div className="profile-value">{user?.farmName}</div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Shield size={16} />
                  Role
                </label>
                <div className="profile-value profile-role">
                  {user?.role || 'USER'}
                </div>
              </div>
            </div>
          </div>

          <div className="section-card">
            <h2 className="section-title">
              <Settings className="farm-icon" />
              Account Settings
            </h2>
            
            <div className="settings-list">
              <div className="setting-item">
                <div className="setting-info">
                  <div className="setting-title">Change Password</div>
                  <div className="setting-description">
                    Update your account password for better security
                  </div>
                </div>
                <button className="btn-secondary btn-sm">
                  Change
                </button>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <div className="setting-title">Email Notifications</div>
                  <div className="setting-description">
                    Manage your email notification preferences
                  </div>
                </div>
                <button className="btn-secondary btn-sm">
                  Configure
                </button>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <div className="setting-title">Data Export</div>
                  <div className="setting-description">
                    Download your farm data and breeding records
                  </div>
                </div>
                <button className="btn-secondary btn-sm">
                  Export
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="profile-sidebar">
          <div className="section-card">
            <h2 className="section-title">
              <User className="farm-icon" />
              Account Summary
            </h2>
            
            <div className="account-summary">
              <div className="summary-item">
                <div className="summary-label">Member Since</div>
                <div className="summary-value">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                </div>
              </div>
              
              <div className="summary-item">
                <div className="summary-label">Last Login</div>
                <div className="summary-value">
                  {user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'N/A'}
                </div>
              </div>
              
              <div className="summary-item">
                <div className="summary-label">Account Status</div>
                <div className="summary-value status-active">
                  Active
                </div>
              </div>
            </div>
          </div>

          <div className="section-card">
            <h2 className="section-title">
              <Calendar className="farm-icon" />
              Farm Statistics
            </h2>
            
            <div className="farm-stats">
              <div className="stat-item">
                <div className="stat-value">0</div>
                <div className="stat-label">Total Animals</div>
              </div>
              
              <div className="stat-item">
                <div className="stat-value">0</div>
                <div className="stat-label">Breeding Sessions</div>
              </div>
              
              <div className="stat-item">
                <div className="stat-value">0</div>
                <div className="stat-label">Successful Breeds</div>
              </div>
              
              <div className="stat-item">
                <div className="stat-value">0%</div>
                <div className="stat-label">Success Rate</div>
              </div>
            </div>
          </div>

          <div className="section-card">
            <h2 className="section-title">
              <Shield className="farm-icon" />
              Security
            </h2>
            
            <div className="security-info">
              <div className="security-item">
                <div className="security-icon">🔒</div>
                <div className="security-text">
                  <div className="security-title">Password Protected</div>
                  <div className="security-description">Your account is secure</div>
                </div>
              </div>
              
              <div className="security-item">
                <div className="security-icon">🛡️</div>
                <div className="security-text">
                  <div className="security-title">Data Encrypted</div>
                  <div className="security-description">All data is encrypted</div>
                </div>
              </div>
            </div>
          </div>

          <div className="section-card danger-zone">
            <h2 className="section-title">
              <X className="farm-icon" />
              Danger Zone
            </h2>
            
            <div className="danger-actions">
              <button 
                className="btn-danger"
                onClick={handleLogout}
              >
                Logout
              </button>
              
              <button 
                className="btn-danger"
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                    toast.error('Account deletion not implemented');
                  }
                }}
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;



