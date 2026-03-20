import React from 'react';
import { Routes, Route, Outlet } from 'react-router-dom';
import ProtectedRoute from '../components/common/ProtectedRoute';

// Layouts
import Navbar from '../components/common/Navbar';
import Sidebar from '../components/common/Sidebar';

// Components
import Dashboard from '../components/dashboard/Dashboard';
import UserList from '../components/users/UserList';
import Attendance from '../components/users/AttendanceList';
import PenddingUserList from '../components/users/PenddingUserList';
import UserForm from '../components/users/UserForm';
import UserDetails from '../components/users/UserDetails';
import PortalUserList from '../components/admin/PortalUserList';
import Notification from '../components/users/NotificationForm';
import Profile from '../components/profile/Profile';
import StudentDegrees from '../components/users/StudentDegrees';
import BulkDegreeUpload from '../components/users/BulkDegreeUpload';
import Settings from '../components/settings/Settings';

// Auth Components
import Login from '../components/auth/Login';
import Register from '../components/auth/Register';
import ForgotPassword from '../components/auth/ForgotPassword';

// Firestore Components
import AgbyaList from '../components/firestore/AgbyaList';
import TaksList from '../components/firestore/TaksList';
import CopticList from '../components/firestore/CopticList';
import HymnsList from '../components/firestore/HymnsList';
import CreateAgbyaDocument from '../components/firestore/CreateAgbyaDocument';
import CreateTaks from '../components/firestore/CreateTaks';
import CreateHymns from '../components/firestore/CreateHymns';
import CreateCopticContent from '../components/firestore/CreateCopticContent';

const MainLayout = () => {
    const [showSidebar, setShowSidebar] = React.useState(false);

    return (
        <div className="min-h-screen">
            <Navbar onToggleSidebar={() => setShowSidebar(!showSidebar)} />
            <div className="flex">
                {/* Mobile Sidebar Overlay */}
                {showSidebar && (
                    <div 
                        className="fixed inset-0 bg-black/50 z-[1040] lg:hidden backdrop-blur-sm transition-opacity"
                        onClick={() => setShowSidebar(false)}
                    />
                )}

                {/* Sidebar Container */}
                <aside 
                    className={`
                        fixed inset-y-0 left-0 z-[1050] w-64 transform transition-transform duration-300 ease-in-out bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800
                        lg:translate-x-0 lg:static lg:inset-auto lg:z-10
                        ${showSidebar ? 'translate-x-0' : '-translate-x-full'}
                    `}
                >
                    <div className="h-full flex flex-col">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center lg:hidden">
                            <span className="font-bold text-slate-900 dark:text-white">Menu</span>
                            <button 
                                onClick={() => setShowSidebar(false)}
                                className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                            >
                                <i className="bi bi-x-lg"></i>
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                           <Sidebar onClose={() => setShowSidebar(false)} />
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 min-w-0 overflow-hidden">
                    <div className="px-4 py-6 md:px-8">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

const AppRoutes = () => {
    return (
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
                <Route path="/settings" element={
                    <ProtectedRoute requiredPermission={{ module: 'settings', action: 'view' }}>
                        <Settings />
                    </ProtectedRoute>
                } />
                <Route path="/users/notification" element={<Notification />} />
                <Route path="/users/:code/degrees" element={<StudentDegrees />} />
                <Route path="/degrees" element={
                    <ProtectedRoute requiredPermission={{ module: 'degrees', action: 'edit' }}>
                        <BulkDegreeUpload />
                    </ProtectedRoute>
                } />

                {/* Firestore Routes */}
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
    );
};

export default AppRoutes;
