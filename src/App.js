import React from 'react';
import { Routes, Route, Outlet } from 'react-router-dom';
import Dashboard from './components/dashboard/Dashboard';
import Sidebar from './components/common/Sidebar';
import Navbar from './components/common/Navbar';
import UserList from './components/users/UserList';
import Attendance from './components/users/AttendanceList';
import PenddingUserList from './components/users/PenddingUserList';
import UserForm from './components/users/UserForm';
import UserDetails from './components/users/UserDetails';
import PortalUserList from './components/admin/PortalUserList';
import Notification from './components/users/NotificationForm';
import AgbyaList from './components/firestore/AgbyaList';
import TaksList from './components/firestore/TaksList';
import CopticList from './components/firestore/CopticList';
import HymnsList from './components/firestore/HymnsList';
import CreateAgbyaDocument from './components/firestore/CreateAgbyaDocument'
import CreateTaks from './components/firestore/CreateTaks'
import CreateHymns from './components/firestore/CreateHymns'
import CreateCopticContent from './components/firestore/CreateCopticContent'
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ForgotPassword from './components/auth/ForgotPassword';
import Profile from './components/profile/Profile';

import './App.css';

const MainLayout = () => {
  return (
    <>
      <Navbar />
      <div className="container-fluid">
        <div className="row">
          <div className="col-md-2 d-none d-md-block sidebar">
            <Sidebar />
          </div>
          <main className="col-md-10 ms-sm-auto px-md-4">
            <Outlet />
          </main>
        </div>
      </div>
    </>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <div className="App">
          <Routes>
            {/* Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/users" element={<UserList />} />
              <Route path="/attendance" element={<Attendance />} />
              <Route path="/penddingusers" element={<PenddingUserList />} />
              <Route path="/users/new" element={<UserForm />} />
              <Route path="/users/edit/:code" element={<UserForm />} />
              <Route path="/users/:code" element={<UserDetails />} />
              <Route path="/admin/portal-users" element={<PortalUserList />} />
              <Route path="/users/notification" element={<Notification />} />
              <Route path="/firestore/agbya" element={<AgbyaList />} />
              <Route path="/firestore/taks" element={<TaksList />} />
              <Route path="/firestore/coptic" element={<CopticList />} />
              <Route path="/firestore/hymns" element={<HymnsList />} />
              <Route path="/firestore/createAgbya" element={<CreateAgbyaDocument />} />
              <Route path="/firestore/createTaks" element={<CreateTaks />} />
              <Route path="/firestore/createHymns" element={<CreateHymns />} />
              <Route path="/firestore/CreateCopticContent" element={<CreateCopticContent />} />
            </Route>
          </Routes>
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
