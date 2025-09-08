import React from 'react';
import { Heart, Users, Calendar } from 'lucide-react';

const TestComponent = () => {
  const handleTestClick = () => {
    alert('Button is working! Frontend is functional.');
  };

  return (
    <div style={{ 
      padding: '20px', 
      background: 'white', 
      borderRadius: '12px', 
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      margin: '20px',
      textAlign: 'center'
    }}>
      <h2 style={{ color: '#4a7c59', marginBottom: '20px' }}>
        <Heart style={{ marginRight: '10px' }} />
        Frontend Test Component
      </h2>
      
      <p style={{ marginBottom: '20px', color: '#666' }}>
        If you can see this and the button works, the frontend is functioning correctly!
      </p>
      
      <button 
        onClick={handleTestClick}
        style={{
          background: 'linear-gradient(135deg, #4a7c59, #6b8e6b)',
          color: 'white',
          border: 'none',
          padding: '12px 24px',
          borderRadius: '12px',
          cursor: 'pointer',
          fontSize: '16px',
          fontWeight: '500',
          boxShadow: '0 4px 15px rgba(74, 124, 89, 0.3)',
          transition: 'all 0.3s ease'
        }}
        onMouseOver={(e) => {
          e.target.style.transform = 'translateY(-2px)';
          e.target.style.boxShadow = '0 6px 20px rgba(74, 124, 89, 0.4)';
        }}
        onMouseOut={(e) => {
          e.target.style.transform = 'translateY(0)';
          e.target.style.boxShadow = '0 4px 15px rgba(74, 124, 89, 0.3)';
        }}
      >
        <Users style={{ marginRight: '8px' }} />
        Test Button
      </button>
      
      <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#4a7c59' }}>
          <Heart size={16} />
          <span>Icons Working</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#4a7c59' }}>
          <Calendar size={16} />
          <span>Styling Working</span>
        </div>
      </div>
    </div>
  );
};

export default TestComponent;

