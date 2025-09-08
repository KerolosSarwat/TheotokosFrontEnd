import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Dashboard from './components/dashboard/Dashboard';
import Sidebar from './components/common/Sidebar';
import Navbar from './components/common/Navbar';
import UserList from './components/users/UserList';
import PenddingUserList from './components/users/PenddingUserList';
import UserForm from './components/users/UserForm';
import UserDetails from './components/users/UserDetails';
import Notification from './components/users/NotificationForm';
import AgbyaList from './components/firestore/AgbyaList';
import TaksList from './components/firestore/TaksList';
import CopticList from './components/firestore/CopticList';
import HymnsList from './components/firestore/HymnsList';
import CreateAgbyaDocument from './components/firestore/CreateAgbyaDocument'
import CreateTaks from './components/firestore/CreateTaks'
import CreateHymns from './components/firestore/CreateHymns'
import CreateCopticContent from './components/firestore/CreateCopticContent'
import './App.css';

function App() {
  return (
    <div className="App">
      <Navbar />
      <div className="container-fluid">
        <div className="row">
          <div className="col-md-2 d-none d-md-block bg-light sidebar">
            <Sidebar />
          </div>
          <main className="col-md-10 ms-sm-auto px-md-4">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/users" element={<UserList />} />
              <Route path="/penddingusers" element={<PenddingUserList />} />
              <Route path="/users/new" element={<UserForm />} />
              <Route path="/users/edit/:code" element={<UserForm />} />
              <Route path="/users/:code" element={<UserDetails />} />
              <Route path="/users/notification" element={<Notification />} />
              <Route path="/firestore/agbya" element={<AgbyaList />} />
              <Route path="/firestore/taks" element={<TaksList />} />
              <Route path="/firestore/coptic" element={<CopticList />} />
              <Route path="/firestore/hymns" element={<HymnsList />} />
              <Route path="/firestore/createAgbya" element={<CreateAgbyaDocument />} />
              <Route path="/firestore/createTaks" element={<CreateTaks />} />
              <Route path="/firestore/createHymns" element={<CreateHymns />} />
              <Route path="/firestore/CreateCopticContent" element={<CreateCopticContent />} />
            </Routes>
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;
