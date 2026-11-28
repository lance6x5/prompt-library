import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';

import { initInstallButton } from './install.js';

// Offer an "Install app" button when the browser allows it and the app isn't installed yet.
initInstallButton({ appName: 'Promptvault', selector: '.app-header' });

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
