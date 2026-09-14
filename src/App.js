import React from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { ConfigProvider } from './context/ConfigContext';
import AppRoutes from './routes/AppRoutes';
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ConfigProvider>
          <div className="App">
            <AppRoutes />
          </div>
        </ConfigProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
