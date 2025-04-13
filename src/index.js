import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './styles/global.css';
import './styles/theme.css'; // Import theme CSS
import App from './App';
import reportWebVitals from './reportWebVitals';
import '@ant-design/v5-patch-for-react-19';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <App />
);

reportWebVitals();