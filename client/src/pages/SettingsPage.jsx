import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { api } from '../services/api.js';

export default function SettingsPage() {
  const { user, updateProfile, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { showToast } = useToast();

  const [profileData, setProfileData] = useState({
    fullName: user?.fullName || '',
    professionalTitle: user?.professionalTitle || '',
    location: user?.location || '',
    desiredRole: user?.desiredRole || '',
    desiredSalary: user?.desiredSalary || '',
    preferredLocation: user?.preferredLocation || '',
    remotePreference: user?.remotePreference || 'Remote & Hybrid',
    employmentType: user?.employmentType || 'Full-time'
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });

  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      await updateProfile(profileData);
      showToast('Profile settings saved! ✨');
    } catch (err) {
      showToast(err.message || 'Error updating profile', 'error');
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      showToast('New passwords do not match', 'error');
      return;
    }
    setPasswordSaving(true);
    try {
      await api.auth.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      showToast('Password updated successfully');
      setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    } catch (err) {
      showToast(err.message || 'Error changing password', 'error');
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-background pb-28 pt-20 px-4 sm:px-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="font-headline text-2xl sm:text-3xl font-bold tracking-tight text-on-surface">
          Account & Preferences
        </h1>
        <p className="font-body-md text-xs sm:text-sm text-on-surface-variant mt-1">
          Customize your career profile, theme aesthetics, and credentials
        </p>
      </div>

      <div className="space-y-6">
        {/* Profile Card */}
        <div className="p-6 rounded-3xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <img
              alt={user?.fullName}
              className="w-16 h-16 rounded-full object-cover border border-primary/30 shadow-sm"
              src={user?.avatar}
            />
            <div>
              <h2 className="font-headline text-lg font-bold text-on-surface">{user?.fullName}</h2>
              <p className="text-xs text-on-surface-variant">{user?.email}</p>
              <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-primary-fixed text-primary text-[11px] font-bold">
                Executive Horizon Plan
              </span>
            </div>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-4 text-xs font-medium">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-on-surface-variant mb-1 font-semibold">Full Name</label>
                <input
                  required
                  value={profileData.fullName}
                  onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl bg-surface-container-low text-on-surface border border-outline-variant/30 focus:border-primary outline-none"
                />
              </div>
              <div>
                <label className="block text-on-surface-variant mb-1 font-semibold">Professional Title</label>
                <input
                  value={profileData.professionalTitle}
                  onChange={(e) => setProfileData({ ...profileData, professionalTitle: e.target.value })}
                  placeholder="Staff Frontend Engineer"
                  className="w-full h-10 px-3 rounded-xl bg-surface-container-low text-on-surface border border-outline-variant/30 focus:border-primary outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-on-surface-variant mb-1 font-semibold">Desired Target Role</label>
                <input
                  value={profileData.desiredRole}
                  onChange={(e) => setProfileData({ ...profileData, desiredRole: e.target.value })}
                  placeholder="Senior / Staff Frontend Engineer"
                  className="w-full h-10 px-3 rounded-xl bg-surface-container-low text-on-surface border border-outline-variant/30 focus:border-primary outline-none"
                />
              </div>
              <div>
                <label className="block text-on-surface-variant mb-1 font-semibold">Desired Salary Range</label>
                <input
                  value={profileData.desiredSalary}
                  onChange={(e) => setProfileData({ ...profileData, desiredSalary: e.target.value })}
                  placeholder="$180,000 - $220,000"
                  className="w-full h-10 px-3 rounded-xl bg-surface-container-low text-on-surface border border-outline-variant/30 focus:border-primary outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-on-surface-variant mb-1 font-semibold">Current Location</label>
                <input
                  value={profileData.location}
                  onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                  placeholder="San Francisco, CA"
                  className="w-full h-10 px-3 rounded-xl bg-surface-container-low text-on-surface border border-outline-variant/30 focus:border-primary outline-none"
                />
              </div>
              <div>
                <label className="block text-on-surface-variant mb-1 font-semibold">Remote Preference</label>
                <input
                  value={profileData.remotePreference}
                  onChange={(e) => setProfileData({ ...profileData, remotePreference: e.target.value })}
                  placeholder="Remote & Hybrid SF"
                  className="w-full h-10 px-3 rounded-xl bg-surface-container-low text-on-surface border border-outline-variant/30 focus:border-primary outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={profileSaving}
              className="h-10 px-5 rounded-xl bg-primary text-on-primary font-label-md text-xs font-bold shadow-md hover:bg-primary-container active:scale-98 transition-all flex items-center gap-1.5 ml-auto"
            >
              {profileSaving && (
                <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
              )}
              Save Profile Changes
            </button>
          </form>
        </div>

        {/* Theme Settings */}
        <div className="p-6 rounded-3xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm">
          <h3 className="font-headline text-base font-bold text-on-surface mb-1">
            Display & Appearance
          </h3>
          <p className="text-xs text-on-surface-variant mb-4">
            Select your preferred visual mode for JobTrack
          </p>

          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'light', label: 'Light Mode', icon: 'light_mode' },
              { id: 'dark', label: 'Dark Mode', icon: 'dark_mode' },
              { id: 'system', label: 'System Default', icon: 'settings_brightness' }
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={`p-4 rounded-2xl border text-center flex flex-col items-center gap-2 transition-all ${
                  theme === t.id
                    ? 'border-primary ring-2 ring-primary/20 bg-surface-container'
                    : 'border-outline-variant/30 hover:bg-surface-container-low'
                }`}
              >
                <span className="material-symbols-outlined text-[24px] text-primary">{t.icon}</span>
                <span className="text-xs font-bold text-on-surface">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Password Reset */}
        <div className="p-6 rounded-3xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm">
          <h3 className="font-headline text-base font-bold text-on-surface mb-1">
            Security & Password
          </h3>
          <p className="text-xs text-on-surface-variant mb-4">
            Update your account password
          </p>

          <form onSubmit={handlePasswordSubmit} className="space-y-3 text-xs font-medium max-w-md">
            <div>
              <label className="block text-on-surface-variant mb-1">Current Password</label>
              <input
                type="password"
                required
                value={passwordData.currentPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, currentPassword: e.target.value })
                }
                className="w-full h-10 px-3 rounded-xl bg-surface-container-low text-on-surface border border-outline-variant/30 focus:border-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-on-surface-variant mb-1">New Password</label>
              <input
                type="password"
                required
                value={passwordData.newPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, newPassword: e.target.value })
                }
                className="w-full h-10 px-3 rounded-xl bg-surface-container-low text-on-surface border border-outline-variant/30 focus:border-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-on-surface-variant mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                value={passwordData.confirmNewPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, confirmNewPassword: e.target.value })
                }
                className="w-full h-10 px-3 rounded-xl bg-surface-container-low text-on-surface border border-outline-variant/30 focus:border-primary outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={passwordSaving}
              className="h-10 px-4 rounded-xl bg-surface-container text-on-surface hover:bg-surface-container-high font-bold text-xs transition-colors"
            >
              Update Password
            </button>
          </form>
        </div>

        {/* Danger Zone */}
        <div className="p-6 rounded-3xl bg-error-container/20 border border-error/30 shadow-sm flex items-center justify-between">
          <div>
            <h3 className="font-headline text-base font-bold text-error">Sign Out of JobTrack</h3>
            <p className="text-xs text-on-surface-variant">
              End your current authenticated session on this browser.
            </p>
          </div>
          <button
            onClick={logout}
            className="h-10 px-4 rounded-xl bg-error text-on-error font-bold text-xs hover:opacity-90 transition-opacity"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
