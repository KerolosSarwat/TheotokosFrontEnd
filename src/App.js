import React from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import AppRoutes from './routes/AppRoutes';
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <div className="App">
          <AppRoutes />
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
