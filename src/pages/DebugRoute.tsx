import React from 'react';
import { useLocation } from 'react-router-dom';

const DebugRoute = () => {
  const location = useLocation();
  
  return (
    <div style={{ padding: '20px', backgroundColor: '#f0f0f0', minHeight: '100vh' }}>
      <h1>DEBUG ROUTE INFO</h1>
      <p><strong>Current URL:</strong> {window.location.href}</p>
      <p><strong>Pathname:</strong> {location.pathname}</p>
      <p><strong>Search:</strong> {location.search}</p>
      <p><strong>Hash:</strong> {location.hash}</p>
      <p><strong>Timestamp:</strong> {new Date().toISOString()}</p>
      
      <h2>All URL Params:</h2>
      <pre>{JSON.stringify(Object.fromEntries(new URLSearchParams(location.search)), null, 2)}</pre>
      
      <h2>Window Location:</h2>
      <pre>{JSON.stringify({
        href: window.location.href,
        origin: window.location.origin,
        pathname: window.location.pathname,
        search: window.location.search,
        hash: window.location.hash
      }, null, 2)}</pre>
    </div>
  );
};

export default DebugRoute;