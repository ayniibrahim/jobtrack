import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { api } from '../services/api.js';

export default function Header() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);

  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const [profileOpen, setProfileOpen] = useState(false);

  const searchInputRef = useRef(null);

  // Load notifications
  useEffect(() => {
    if (!user) return;
    async function loadNotifications() {
      try {
        const res = await api.notifications.getAll();
        if (res && res.success) {
          setNotifications(res.data || []);
          setUnreadCount(res.unreadCount || 0);
        }
      } catch (err) {
        console.warn('Could not load notifications:', err.message);
      }
    }
    loadNotifications();
  }, [user]);

  // Global keyboard shortcut for search (⌘K or Ctrl+K)
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setNotifOpen(false);
        setProfileOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current.focus(), 50);
    }
  }, [searchOpen]);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await api.search.query(searchQuery);
        if (res && res.success) {
          setSearchResults(res.data);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setSearchLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleMarkAllRead = async () => {
    try {
      await api.notifications.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkOneRead = async (id) => {
    try {
      await api.notifications.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <header className="fixed top-0 w-full z-40 bg-surface/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-outline-variant/20 pt-safe transition-colors">
        <div className="h-16 px-gutter-mobile flex items-center justify-between max-w-7xl mx-auto">
          {/* Brand mark & title */}
          <Link to="/dashboard" className="flex items-center gap-space-xs group">
            <img
              alt="JobTrack Brand Mark"
              className="h-8 w-auto object-contain transition-transform group-hover:scale-105"
              src="https://lh3.googleusercontent.com/aida/AEtjO1XIVKHIF26hejsVsOaI48BV-4fMKQm1ddFt9PZgLI9TvD6Ly0sCP047vX9qpeYrp_0QTiRrb4CA5gumqSIZRek5U8o2AQZ6AVryiKzYNPbvWQQlZRJ3YIjRjJAgI0dAI03NwEbxe9LQAGhsSZ8tPvoT0E_iBFTx8-6oFYoyMqskfEmAQOSPanvLOgl7cUPTWZEN7iaz_YCcYfU5NLnS4GoPz8HiGhfvOR4MYhV6LcWCzX-bNjip4XSrJ7k"
            />
            <div className="flex items-center gap-space-xs ml-space-xs">
              <span className="font-headline text-lg font-bold text-on-surface tracking-tight">
                JobTrack
              </span>
              <span className="hidden xs:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-[11px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse"></span>
                Active Search
              </span>
            </div>
          </Link>

          {/* Action buttons */}
          <div className="flex items-center gap-space-xs relative">
            {/* Search Trigger */}
            <button
              aria-label="Search roles and companies"
              onClick={() => setSearchOpen(true)}
              className="w-11 h-11 flex items-center justify-center rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
              type="button"
            >
              <span className="material-symbols-outlined text-[22px]">search</span>
            </button>

            {/* Notifications Button */}
            <button
              aria-label="Notifications"
              onClick={() => {
                setNotifOpen(!notifOpen);
                setProfileOpen(false);
              }}
              className="w-11 h-11 relative flex items-center justify-center rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
              type="button"
            >
              <span className="material-symbols-outlined text-[22px]">notifications</span>
              {unreadCount > 0 && (
                <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 rounded-full bg-primary ring-2 ring-surface animate-pulse"></span>
              )}
            </button>

            {/* User Profile Avatar Button */}
            <button
              aria-label="User profile"
              onClick={() => {
                setProfileOpen(!profileOpen);
                setNotifOpen(false);
              }}
              className="w-11 h-11 flex items-center justify-center rounded-full active:scale-95 transition-transform"
              type="button"
            >
              <img
                alt={user?.fullName || 'Profile'}
                className="w-8 h-8 rounded-full object-cover border border-primary/20 shadow-sm"
                src={
                  user?.avatar ||
                  'https://lh3.googleusercontent.com/aida-public/AB6AXuAWUhNlfbYNEjJxyfdg5DPXO0TbYzorXC-VqP-jdswZvrltTnJRyQFsmHfD-0UPrf9G2MwHoAIRTW0ISqLC6E9mOP8hH0Rj8ZX0i77Xa6X3fHkGTgWtIvz6-M498KJGngYjmKPbQ-qcWKfBM42G13P9azUxq6E1Qm0ySXEJfm5xA_R7s2ezI0Vaj-s1cpliuLUj42Qo4UPHxAI1PrTd8iCccGHoANMNbVR7pkij_WOasAN6HL8ghrpF'
                }
              />
            </button>

            {/* Notifications Dropdown Flyout */}
            {notifOpen && (
              <div className="absolute right-0 top-14 w-80 sm:w-96 rounded-2xl bg-surface-container-lowest shadow-2xl border border-outline-variant/30 p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center justify-between pb-3 border-b border-surface-container">
                  <div className="flex items-center gap-2">
                    <span className="font-headline text-sm font-bold text-on-surface">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-primary-fixed text-primary font-bold text-xs">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs text-primary font-medium hover:underline"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-surface-container-low no-scrollbar py-1">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-on-surface-variant text-sm">
                      <span className="material-symbols-outlined text-3xl text-outline mb-1 block">
                        notifications_none
                      </span>
                      You're all caught up!
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif._id}
                        onClick={() => handleMarkOneRead(notif._id)}
                        className={`p-2.5 rounded-xl transition-colors cursor-pointer flex items-start gap-3 my-1 ${
                          notif.read ? 'hover:bg-surface-container-low' : 'bg-surface-container-low/70'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full bg-primary-fixed text-primary flex items-center justify-center shrink-0 mt-0.5">
                          <span className="material-symbols-outlined text-[16px]">
                            {notif.type.includes('Interview')
                              ? 'videocam'
                              : notif.type.includes('Offer')
                              ? 'celebration'
                              : 'event'}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-on-surface leading-snug">
                            {notif.title}
                          </p>
                          <p className="text-[11px] text-on-surface-variant line-clamp-2 mt-0.5">
                            {notif.message}
                          </p>
                        </div>
                        {!notif.read && (
                          <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2"></span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* User Profile Dropdown Flyout */}
            {profileOpen && (
              <div className="absolute right-0 top-14 w-64 rounded-2xl bg-surface-container-lowest shadow-2xl border border-outline-variant/30 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-3 border-b border-surface-container flex items-center gap-3">
                  <img
                    alt={user?.fullName}
                    className="w-10 h-10 rounded-full object-cover border border-primary/20"
                    src={user?.avatar}
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="font-headline text-sm font-bold text-on-surface truncate">
                      {user?.fullName}
                    </span>
                    <span className="text-xs text-on-surface-variant truncate">
                      {user?.email}
                    </span>
                  </div>
                </div>

                <div className="py-1.5 flex flex-col gap-0.5 text-xs font-medium text-on-surface">
                  <Link
                    to="/settings"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-surface-container transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
                      person
                    </span>
                    Profile & Career Settings
                  </Link>
                  <Link
                    to="/companies"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-surface-container transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
                      domain
                    </span>
                    Target Companies
                  </Link>
                  <Link
                    to="/contacts"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-surface-container transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
                      contacts
                    </span>
                    Recruiter Contacts
                  </Link>
                  <Link
                    to="/documents"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-surface-container transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
                      folder
                    </span>
                    Career Documents Vault
                  </Link>
                </div>

                {/* Theme Selector Pill */}
                <div className="p-2 border-t border-surface-container flex items-center justify-between text-xs text-on-surface-variant">
                  <span>Theme:</span>
                  <div className="flex items-center gap-1 bg-surface-container p-0.5 rounded-lg">
                    <button
                      onClick={() => setTheme('light')}
                      className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-all ${
                        theme === 'light'
                          ? 'bg-surface-container-lowest text-primary shadow-sm'
                          : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      Light
                    </button>
                    <button
                      onClick={() => setTheme('dark')}
                      className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-all ${
                        theme === 'dark'
                          ? 'bg-surface-container-lowest text-primary shadow-sm'
                          : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      Dark
                    </button>
                    <button
                      onClick={() => setTheme('system')}
                      className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-all ${
                        theme === 'system'
                          ? 'bg-surface-container-lowest text-primary shadow-sm'
                          : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      Auto
                    </button>
                  </div>
                </div>

                <div className="p-1 border-t border-surface-container">
                  <button
                    onClick={() => {
                      logout();
                      navigate('/login');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-error hover:bg-error-container/30 transition-colors text-xs font-semibold text-left"
                  >
                    <span className="material-symbols-outlined text-[18px]">logout</span>
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Search Modal Overlay */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-50 bg-inverse-surface/50 backdrop-blur-sm flex items-start justify-center pt-16 px-4"
          onClick={() => setSearchOpen(false)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl bg-surface-container-lowest shadow-2xl border border-outline-variant/30 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input Bar */}
            <div className="flex items-center gap-3 p-4 border-b border-surface-container">
              <span className="material-symbols-outlined text-primary text-[24px]">search</span>
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search applications, companies, recruiter contacts, or tech stack..."
                className="flex-1 bg-transparent text-on-surface placeholder:text-on-surface-variant font-body-md text-base outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              )}
              <kbd className="hidden sm:inline-block px-2 py-0.5 text-[11px] font-mono bg-surface-container text-on-surface-variant rounded">
                ESC
              </kbd>
            </div>

            {/* Results Deck */}
            <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4 no-scrollbar">
              {searchLoading ? (
                <div className="py-8 text-center text-on-surface-variant text-sm flex items-center justify-center gap-2">
                  <span className="animate-spin material-symbols-outlined text-[20px] text-primary">
                    progress_activity
                  </span>
                  Searching career index...
                </div>
              ) : searchResults ? (
                searchResults.totalMatches === 0 ? (
                  <div className="py-8 text-center text-on-surface-variant text-sm">
                    No results found for "{searchQuery}".
                  </div>
                ) : (
                  <>
                    {/* Applications */}
                    {searchResults.applications.length > 0 && (
                      <div>
                        <span className="font-label-sm text-[11px] font-bold uppercase tracking-wider text-on-surface-variant block mb-2">
                          Applications ({searchResults.applications.length})
                        </span>
                        <div className="space-y-1.5">
                          {searchResults.applications.map((app) => (
                            <Link
                              key={app._id}
                              to={`/applications/${app._id}`}
                              onClick={() => setSearchOpen(false)}
                              className="p-2.5 rounded-xl hover:bg-surface-container flex items-center justify-between transition-colors group"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                                  {app.companyName.charAt(0)}
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-on-surface group-hover:text-primary">
                                    {app.jobTitle}
                                  </p>
                                  <p className="text-xs text-on-surface-variant">
                                    {app.companyName} · {app.location}
                                  </p>
                                </div>
                              </div>
                              <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-xs text-on-surface-variant font-medium">
                                {app.status}
                              </span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Companies */}
                    {searchResults.companies.length > 0 && (
                      <div>
                        <span className="font-label-sm text-[11px] font-bold uppercase tracking-wider text-on-surface-variant block mb-2">
                          Companies ({searchResults.companies.length})
                        </span>
                        <div className="space-y-1.5">
                          {searchResults.companies.map((comp) => (
                            <Link
                              key={comp._id}
                              to={`/companies`}
                              onClick={() => setSearchOpen(false)}
                              className="p-2.5 rounded-xl hover:bg-surface-container flex items-center justify-between transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-secondary text-[20px]">
                                  domain
                                </span>
                                <div>
                                  <p className="text-sm font-semibold text-on-surface">{comp.name}</p>
                                  <p className="text-xs text-on-surface-variant">{comp.industry} · {comp.location}</p>
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Contacts */}
                    {searchResults.contacts.length > 0 && (
                      <div>
                        <span className="font-label-sm text-[11px] font-bold uppercase tracking-wider text-on-surface-variant block mb-2">
                          Recruiter Contacts ({searchResults.contacts.length})
                        </span>
                        <div className="space-y-1.5">
                          {searchResults.contacts.map((contact) => (
                            <Link
                              key={contact._id}
                              to={`/contacts`}
                              onClick={() => setSearchOpen(false)}
                              className="p-2.5 rounded-xl hover:bg-surface-container flex items-center justify-between transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-tertiary text-[20px]">
                                  contact_mail
                                </span>
                                <div>
                                  <p className="text-sm font-semibold text-on-surface">{contact.name}</p>
                                  <p className="text-xs text-on-surface-variant">
                                    {contact.jobTitle} at {contact.company}
                                  </p>
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )
              ) : (
                <div className="py-6 text-center text-on-surface-variant text-xs space-y-1">
                  <p>Type to search across roles, salaries, companies, or recruiter names.</p>
                  <p className="text-outline">Press <kbd className="px-1.5 py-0.5 bg-surface-container rounded">ESC</kbd> to close anytime.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
