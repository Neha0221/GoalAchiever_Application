import React, { useState, useEffect } from 'react';
import { apiEndpoints } from '../../services/api';

const ConnectionTest = () => {
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const [backendData, setBackendData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      setConnectionStatus('checking');
      const response = await apiEndpoints.health();
      setBackendData(response.data);
      setConnectionStatus('connected');
      setError(null);
    } catch (err) {
      setConnectionStatus('error');
      setError(err.message);
      console.error('Connection test failed:', err);
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'green';
      case 'error':
        return 'red';
      case 'checking':
        return 'orange';
      default:
        return 'gray';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return '✅ Connected to Backend';
      case 'error':
        return '❌ Connection Failed';
      case 'checking':
        return '🔄 Checking Connection...';
      default:
        return '❓ Unknown Status';
    }
  };

  return (
    <div style={{
      padding: '20px',
      border: '1px solid #ccc',
      borderRadius: '8px',
      margin: '20px',
      backgroundColor: '#f9f9f9'
    }}>
      <h3>Frontend-Backend Connection Test</h3>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>Status: </strong>
        <span style={{ color: getStatusColor() }}>
          {getStatusText()}
        </span>
      </div>

      {connectionStatus === 'connected' && backendData && (
        <div style={{ marginBottom: '10px' }}>
          <strong>Backend Response:</strong>
          <pre style={{ 
            backgroundColor: '#e9e9e9', 
            padding: '10px', 
            borderRadius: '4px',
            fontSize: '12px',
            overflow: 'auto'
          }}>
            {JSON.stringify(backendData, null, 2)}
          </pre>
        </div>
      )}

      {connectionStatus === 'error' && error && (
        <div style={{ marginBottom: '10px' }}>
          <strong>Error:</strong>
          <div style={{ color: 'red', fontFamily: 'monospace' }}>
            {error}
          </div>
        </div>
      )}

      <button 
        onClick={testConnection}
        disabled={connectionStatus === 'checking'}
        style={{
          padding: '8px 16px',
          backgroundColor: connectionStatus === 'checking' ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: connectionStatus === 'checking' ? 'not-allowed' : 'pointer'
        }}
      >
        {connectionStatus === 'checking' ? 'Testing...' : 'Test Connection'}
      </button>

      <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
        <strong>Environment Variables:</strong>
        <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
          <li>Backend URL: {process.env.REACT_APP_BACKEND_URL || 'Not set'}</li>
          <li>Socket URL: {process.env.REACT_APP_SOCKET_URL || 'Not set'}</li>
          <li>Node Env: {process.env.REACT_APP_NODE_ENV || 'Not set'}</li>
        </ul>
      </div>
    </div>
  );
};

export default ConnectionTest;
