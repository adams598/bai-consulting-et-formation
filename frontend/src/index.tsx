import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
// import reportWebVitals from './reportWebVitals';
import "@fontsource/lato"; // Importation de la police Lato
import { Toaster } from "./components/ui/toaster";

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
    <Toaster />
  </React.StrictMode>
);
// ... existing code ... 