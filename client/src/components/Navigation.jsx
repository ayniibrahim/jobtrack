import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';

export default function Navigation() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
    { label: 'Applications', path: '/applications', icon: 'work' },
    { label: 'Pipeline', path: '/pipeline', icon: 'view_kanban' },
    { label: 'Companies', path: '/companies', icon: 'domain', desktopOnly: true },
    { label: 'Contacts', path: '/contacts', icon: 'contacts', desktopOnly: true },
    { label: 'Calendar', path: '/calendar', icon: 'calendar_today' },
    { label: 'Documents', path: '/documents', icon: 'folder', desktopOnly: true },
    { label: 'Analytics', path: '/analytics', icon: 'trending_up' },
    { label: 'Settings', path: '/settings', icon: 'settings', desktopOnly: true }
  ];

  return (
    <>
      {/* 1. Desktop Responsive Left Sidebar (>= 1024px) */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-64 bg-surface-container-lowest border-r border-outline-variant/30 z-30 pt-16 px-3 pb-4">
        <div className="flex flex-col gap-1 mt-4 flex-1 overflow-y-auto no-scrollbar">
          <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant/70">
            Career Workspace
          </div>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-label-md text-sm transition-all duration-150 ${
                  isActive
                    ? 'bg-primary-container text-on-primary font-bold shadow-sm shadow-primary/20'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
                }`
              }
            >
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>

        {/* Desktop Sidebar Footer with User Card & Theme Switch */}
        <div className="p-3 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex flex-col gap-2.5 mt-auto">
          <div className="flex items-center gap-2.5">
            <img
              alt={user?.fullName || 'User'}
              className="w-9 h-9 rounded-full object-cover border border-primary/30"
              src={user?.avatar}
            />
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-bold text-on-surface truncate">
                {user?.fullName}
              </span>
              <span className="text-[11px] text-on-surface-variant truncate">
                {user?.professionalTitle || user?.email}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-surface-container text-xs">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="flex items-center gap-1.5 text-on-surface-variant hover:text-on-surface text-[11px] font-medium"
              title="Toggle theme"
            >
              <span className="material-symbols-outlined text-[16px]">
                {theme === 'dark' ? 'light_mode' : 'dark_mode'}
              </span>
              <span>{theme === 'dark' ? 'Light' : 'Dark'} Mode</span>
            </button>

            <button
              onClick={logout}
              className="flex items-center gap-1 text-error hover:opacity-80 text-[11px] font-semibold"
            >
              <span className="material-symbols-outlined text-[15px]">logout</span>
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* 2. Mobile/Tablet Bottom Navigation Bar (< 1024px) */}
      <nav
        className="lg:hidden fixed bottom-0 w-full z-40 pb-safe bg-surface/90 backdrop-blur-xl border-t border-outline-variant/20 shadow-[0_-2px_12px_rgba(0,0,0,0.05)] transition-colors"
      >
        <div className="flex justify-between items-center h-20 px-space-xs max-w-lg mx-auto">
          {navItems
            .filter((item) => !item.desktopOnly)
            .map((item) => {
              const isActive = location.pathname.startsWith(item.path);
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex-1 flex flex-col items-center justify-center min-h-[44px] py-1 transition-colors ${
                    isActive
                      ? 'text-primary font-bold'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[24px]">{item.icon}</span>
                  <span className="font-label-sm text-[11px] mt-1">{item.label}</span>
                </NavLink>
              );
            })}
        </div>
      </nav>
    </>
  );
}
