import React, { useState, useEffect } from 'react';
import { Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { userService } from '../../services/services';

const Dashboard = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingUsers: 0,
    totalAttendance: 0,
    levels: {}
  });
  const [recentUsers, setRecentUsers] = useState([]);

  useEffect(() => {
    document.title = `${t('dashboard.title')} | Firebase Portal`;
  }, [t]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Fetch data in parallel
        const [usersData, pendingData, attendanceData] = await Promise.all([
          userService.getAllUsers(),
          userService.getPenddingUsers(),
          userService.getUsersAttendance('all')
        ]);

        const usersList = Object.values(usersData || {});
        const pendingList = Object.values(pendingData || {});

        // Calculate Level distribution
        const levels = {};
        usersList.forEach(user => {
          const level = user.level || 'Unknown';
          levels[level] = (levels[level] || 0) + 1;
        });

        setStats({
          totalUsers: usersList.length,
          pendingUsers: pendingList.length,
          totalAttendance: attendanceData ? attendanceData.reduce((acc, curr) => acc + (curr.attendance?.length || 0), 0) : 0,
          levels
        });

        // "Recent" users - since we don't have accurate timestamps on all, we'll just take the last 5 from the list
        setRecentUsers(usersList.slice(-5).reverse());

        setLoading(false);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
        <Spinner animation="border" role="status" variant="primary">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  return (
    <div className="dashboard space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center pt-3 pb-2 mb-4 border-b border-slate-200 dark:border-slate-800 gap-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white m-0">{t('dashboard.title')}</h1>
        <div className="flex gap-2 w-full md:w-auto">
          <div className="flex-1 md:flex-none btn-group shadow-sm rounded-lg overflow-hidden">
            <button type="button" className="btn btn-sm btn-outline-secondary border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">Share</button>
            <button type="button" className="btn btn-sm btn-outline-secondary border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">Export</button>
          </div>
        </div>
      </div>

      {/* Statistics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Total Users */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border-l-4 border-primary flex justify-between items-center transition-transform hover:scale-[1.02]">
          <div>
            <h6 className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1 uppercase tracking-wider">{t('dashboard.totalUsers')}</h6>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-0">{stats.totalUsers}</h3>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl">
            <i className="bi bi-people-fill text-blue-600 dark:text-blue-400 text-xl"></i>
          </div>
        </div>

        {/* Pending Requests */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border-l-4 border-warning flex justify-between items-center transition-transform hover:scale-[1.02]">
          <div>
            <h6 className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1 uppercase tracking-wider">{t('dashboard.pendingRequests')}</h6>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-0">{stats.pendingUsers}</h3>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-xl">
            <i className="bi bi-clock-history text-amber-600 dark:text-amber-400 text-xl"></i>
          </div>
        </div>

        {/* Total Attendance */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border-l-4 border-success flex justify-between items-center transition-transform hover:scale-[1.02]">
          <div>
            <h6 className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1 uppercase tracking-wider">{t('dashboard.totalAttendance')}</h6>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-0">{stats.totalAttendance}</h3>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-xl">
            <i className="bi bi-check-circle-fill text-emerald-600 dark:text-emerald-400 text-xl"></i>
          </div>
        </div>

        {/* Top Level */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border-l-4 border-info flex justify-between items-center transition-transform hover:scale-[1.02]">
          <div>
            <h6 className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1 uppercase tracking-wider">{t('dashboard.topLevel')}</h6>
            <h5 className="text-lg font-bold text-slate-900 dark:text-white mb-0 truncate w-32" title={Object.keys(stats.levels).sort((a, b) => stats.levels[b] - stats.levels[a])[0] || 'N/A'}>
              {Object.keys(stats.levels).sort((a, b) => stats.levels[b] - stats.levels[a])[0] || 'N/A'}
            </h5>
          </div>
          <div className="bg-cyan-50 dark:bg-cyan-900/20 p-3 rounded-xl">
            <i className="bi bi-graph-up text-cyan-600 dark:text-cyan-400 text-xl"></i>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main Actions Column */}
        <div className="lg:w-2/3 space-y-8">
          <section>
            <h5 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center">
              <span className="w-1 h-6 bg-primary rounded-full me-2"></span>
              {t('dashboard.quickActions')}
            </h5>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <Link to="/users" className="no-underline group">
                <div className="h-full bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 text-center transition-all group-hover:shadow-md group-hover:-translate-y-1">
                  <div className="mb-3 inline-block p-3 rounded-2xl bg-blue-50 dark:bg-blue-900/20 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
                    <i className="bi bi-people text-blue-600 dark:text-blue-400 text-3xl"></i>
                  </div>
                  <h6 className="text-slate-900 dark:text-slate-100 font-semibold mb-0 tracking-tight">{t('dashboard.allUsers')}</h6>
                </div>
              </Link>

              <Link to="/penddingusers" className="no-underline group">
                <div className="h-full bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 text-center transition-all group-hover:shadow-md group-hover:-translate-y-1">
                  <div className="mb-3 inline-block p-3 rounded-2xl bg-amber-50 dark:bg-amber-900/20 group-hover:bg-amber-100 dark:group-hover:bg-amber-900/30 transition-colors relative">
                    <i className="bi bi-person-plus text-amber-600 dark:text-amber-400 text-3xl"></i>
                    {stats.pendingUsers > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-6 w-6">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-6 w-6 bg-red-500 text-white text-[10px] items-center justify-center font-bold">
                          {stats.pendingUsers}
                        </span>
                      </span>
                    )}
                  </div>
                  <h6 className="text-slate-900 dark:text-slate-100 font-semibold mb-0 tracking-tight">{t('dashboard.pendingUsers')}</h6>
                </div>
              </Link>

              <Link to="/users/notification" className="no-underline group">
                <div className="h-full bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 text-center transition-all group-hover:shadow-md group-hover:-translate-y-1">
                  <div className="mb-3 inline-block p-3 rounded-2xl bg-red-50 dark:bg-red-900/20 group-hover:bg-red-100 dark:group-hover:bg-red-900/30 transition-colors">
                    <i className="bi bi-bell text-red-600 dark:text-red-400 text-3xl"></i>
                  </div>
                  <h6 className="text-slate-900 dark:text-slate-100 font-semibold mb-0 tracking-tight">{t('dashboard.sendNotification')}</h6>
                </div>
              </Link>
            </div>
          </section>

          <section>
            <h5 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center">
              <span className="w-1 h-6 bg-success rounded-full me-2"></span>
              {t('dashboard.contentManagement')}
            </h5>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { to: '/firestore/agbya', icon: 'bi-book', color: 'text-emerald-600', bg: 'bg-emerald-50', label: t('nav.agbya') },
                { to: '/firestore/taks', icon: 'bi-journal-text', color: 'text-cyan-600', bg: 'bg-cyan-50', label: t('nav.taks') },
                { to: '/firestore/coptic', icon: 'bi-translate', color: 'text-amber-600', bg: 'bg-amber-50', label: t('nav.coptic') },
                { to: '/firestore/hymns', icon: 'bi-music-note-list', color: 'text-rose-600', bg: 'bg-rose-50', label: t('nav.hymns') },
              ].map((item, idx) => (
                <Link key={idx} to={item.to} className="no-underline group">
                  <div className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 text-center transition-all group-hover:bg-slate-50 dark:group-hover:bg-slate-700">
                    <i className={`bi ${item.icon} mb-1 ${item.color} text-xl block`}></i>
                    <small className="font-bold text-slate-700 dark:text-slate-300">{item.label}</small>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>

        {/* Recent Activity Column */}
        <div className="lg:w-1/3">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden h-full flex flex-col">
            <div className="p-4 border-b border-slate-50 dark:border-slate-700 flex justify-between items-center">
              <h6 className="mb-0 font-bold text-slate-900 dark:text-white flex items-center">
                <i className="bi bi-activity me-2 text-primary"></i>
                {t('dashboard.recentActivity')}
              </h6>
            </div>
            <div className="flex-1 overflow-y-auto">
              {recentUsers.length === 0 ? (
                <div className="p-8 text-center text-slate-400 italic text-sm">{t('dashboard.noRecentActivity')}</div>
              ) : (
                <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
                  {recentUsers.map((user, idx) => (
                    <div key={idx} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center me-3 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-colors">
                          <i className="bi bi-person text-slate-500 dark:text-slate-400 group-hover:text-blue-500 transition-colors"></i>
                        </div>
                        <div className="flex-grow min-w-0">
                          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{user.fullName}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">{user.level || 'No Level'}</div>
                        </div>
                        <Link to={`/users/${user.code}`} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary/10 transition-all">
                          <i className="bi bi-chevron-right"></i>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-4 border-t border-slate-50 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
              <Link to="/users" className="text-sm font-medium text-primary hover:text-primary/80 no-underline flex items-center justify-center">
                {t('dashboard.viewAllUsers')}
                <i className="bi bi-arrow-right ms-2 mt-0.5"></i>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

