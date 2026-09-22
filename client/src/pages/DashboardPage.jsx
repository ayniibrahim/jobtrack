import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../services/api.js';
import AddApplicationModal from '../components/AddApplicationModal.jsx';
import QuickMoveSheet from '../components/QuickMoveSheet.jsx';
import EmptyState from '../components/EmptyState.jsx';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [applications, setApplications] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active filter tab: 'all' | 'active' | 'high_priority'
  const [filterTab, setFilterTab] = useState('all');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [quickMoveApp, setQuickMoveApp] = useState(null);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, appsRes, interviewsRes, activitiesRes] = await Promise.all([
        api.applications.getStats(),
        api.applications.getAll({ limit: 10, sortBy: 'updatedAt', sortOrder: 'desc' }),
        api.interviews.getAll({ upcoming: 'true' }),
        api.activities.getAll()
      ]);

      if (statsRes.success) setStats(statsRes.data);
      if (appsRes.success) setApplications(appsRes.data || []);
      if (interviewsRes.success) setInterviews(interviewsRes.data || []);
      if (activitiesRes.success) setActivities(activitiesRes.data || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleClearActivities = async () => {
    try {
      await api.activities.clearAll();
      setActivities([]);
    } catch (err) {
      console.error('Failed to clear activities:', err);
    }
  };

  // Filtered applications
  const filteredApps = applications.filter((app) => {
    if (filterTab === 'active') return !app.isArchived && app.status !== 'Rejected';
    if (filterTab === 'high_priority') return app.priority === 'High';
    return true;
  });

  const nextInterview = interviews[0] || null;

  return (
    <div className="min-h-screen bg-background text-on-background pb-28 pt-20 px-4 sm:px-6 max-w-7xl mx-auto">
      {/* 1. Header Greeting Section */}
      <section className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-headline text-2xl sm:text-3xl font-bold tracking-tight text-on-surface">
              Good morning, {user?.fullName?.split(' ')[0] || 'Ayni'} 👋
            </h1>
            <p className="font-body-md text-sm text-on-surface-variant mt-1">
              {stats?.interviewCount || 0} active interviews this week · Keep the momentum high.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="h-10 px-4 rounded-xl bg-primary text-on-primary font-label-md text-xs font-bold shadow-md hover:bg-primary-container active:scale-98 transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Add Application
            </button>
            <Link
              to="/pipeline"
              className="h-10 px-4 rounded-xl bg-surface-container text-on-surface font-label-md text-xs font-semibold hover:bg-surface-container-high transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[18px]">view_kanban</span>
              View Pipeline
            </Link>
          </div>
        </div>

        {/* Quick Filter Tabs */}
        <div className="flex items-center gap-2 mt-5 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => setFilterTab('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 ${
              filterTab === 'all'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
            }`}
          >
            All ({stats?.totalPipeline || 0})
          </button>
          <button
            onClick={() => setFilterTab('active')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 ${
              filterTab === 'active'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
            }`}
          >
            Active ({stats?.activeCount || 0})
          </button>
          <button
            onClick={() => setFilterTab('high_priority')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 ${
              filterTab === 'high_priority'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
            }`}
          >
            High Priority ($160k+)
          </button>
          <Link
            to="/calendar"
            className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-surface-container text-on-surface-variant hover:text-on-surface shrink-0 flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[14px]">event</span>
            Schedule
          </Link>
        </div>
      </section>

      {/* 2. Key Statistics Grid (2x2 on mobile, 4x1 on desktop) */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {/* Total Pipeline */}
        <div className="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm flex flex-col justify-between hover:border-primary/40 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="font-label-sm text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              Total Pipeline
            </span>
            <div className="w-8 h-8 rounded-xl bg-primary-fixed/50 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">stacked_bar_chart</span>
            </div>
          </div>
          <div>
            <div className="font-headline text-2xl sm:text-3xl font-bold text-on-surface">
              {stats?.totalPipeline || applications.length}
            </div>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-tertiary mt-1">
              <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
              <span>+12% this month</span>
            </div>
          </div>
        </div>

        {/* In Review / Screening */}
        <div className="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm flex flex-col justify-between hover:border-primary/40 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="font-label-sm text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              In Review
            </span>
            <div className="w-8 h-8 rounded-xl bg-secondary-fixed/50 text-secondary flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">hourglass_top</span>
            </div>
          </div>
          <div>
            <div className="font-headline text-2xl sm:text-3xl font-bold text-on-surface">
              {stats?.inReviewCount || 0}
            </div>
            <div className="text-[11px] font-medium text-on-surface-variant mt-1">
              Screening & recruiter sync
            </div>
          </div>
        </div>

        {/* Active Interviews */}
        <div className="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm flex flex-col justify-between hover:border-primary/40 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="font-label-sm text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              Interviews
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">videocam</span>
            </div>
          </div>
          <div>
            <div className="font-headline text-2xl sm:text-3xl font-bold text-on-surface">
              {stats?.interviewCount || 0}
            </div>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-primary mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping"></span>
              <span>{interviews.length} rounds booked</span>
            </div>
          </div>
        </div>

        {/* Offers In */}
        <div className="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm flex flex-col justify-between hover:border-primary/40 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="font-label-sm text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              Offers In
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">celebration</span>
            </div>
          </div>
          <div>
            <div className="font-headline text-2xl sm:text-3xl font-bold text-on-surface">
              {stats?.offerCount || 0}
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              <span>Decision required</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Spotlight Hero Card: Upcoming Technical Interview */}
      {nextInterview && (
        <section className="mb-6">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-container via-surface-container-lowest to-surface-container-low p-5 sm:p-6 border border-primary/20 shadow-lg">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-lowest/80 text-primary font-label-sm text-xs font-bold backdrop-blur-sm border border-primary/20">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                  Upcoming Interview · {nextInterview.interviewType}
                </div>

                <h2 className="font-headline text-xl sm:text-2xl font-bold text-on-surface">
                  {nextInterview.company} · {nextInterview.jobTitle}
                </h2>

                <p className="font-body-md text-xs sm:text-sm text-on-surface-variant flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-primary">schedule</span>
                  <span>
                    {nextInterview.date} at {nextInterview.startTime}
                  </span>
                  {nextInterview.interviewer && (
                    <span className="hidden sm:inline">· With {nextInterview.interviewer} ({nextInterview.interviewerTitle})</span>
                  )}
                </p>

                {nextInterview.notes && (
                  <div className="p-3 rounded-xl bg-surface-container-lowest/70 backdrop-blur-sm border border-outline-variant/20 text-xs text-on-surface-variant font-mono">
                    <span className="font-bold text-on-surface">Focus notes:</span> {nextInterview.notes}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {nextInterview.meetingUrl && (
                  <a
                    href={nextInterview.meetingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-11 px-5 rounded-xl bg-primary text-on-primary font-label-md text-xs font-bold shadow-md hover:opacity-95 transition-transform active:scale-95 flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">videocam</span>
                    Join Call
                  </a>
                )}
                {nextInterview.applicationId && (
                  <Link
                    to={`/applications/${nextInterview.applicationId}`}
                    className="h-11 px-4 rounded-xl bg-surface-container-lowest text-on-surface font-label-md text-xs font-semibold hover:bg-surface-container transition-colors border border-outline-variant/30 flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[18px]">description</span>
                    Prep Dossier
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 4. Pipeline Funnel Multi-Segment Progress Strip */}
      <section className="p-5 rounded-3xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm mb-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-headline text-sm sm:text-base font-bold text-on-surface">
              Pipeline Velocity & Distribution
            </h3>
            <p className="text-xs text-on-surface-variant">
              Active stage progression across your career search
            </p>
          </div>
          <Link
            to="/pipeline"
            className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
          >
            Kanban View
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </Link>
        </div>

        {/* Funnel Segmented Bar */}
        <div className="w-full h-3.5 rounded-full bg-surface-container overflow-hidden flex gap-0.5 p-0.5 shadow-inner mb-4">
          <div
            title={`Wishlist: ${stats?.wishlistCount || 0}`}
            style={{ width: `${Math.max(8, (stats?.wishlistCount || 1) * 6)}%` }}
            className="h-full rounded-l-full bg-indigo-400 transition-all"
          ></div>
          <div
            title={`Applied: ${stats?.appliedCount || 0}`}
            style={{ width: `${Math.max(12, (stats?.appliedCount || 1) * 7)}%` }}
            className="h-full bg-sky-500 transition-all"
          ></div>
          <div
            title={`Screening: ${stats?.inReviewCount || 0}`}
            style={{ width: `${Math.max(15, (stats?.inReviewCount || 1) * 8)}%` }}
            className="h-full bg-purple-500 transition-all"
          ></div>
          <div
            title={`Interview: ${stats?.interviewCount || 0}`}
            style={{ width: `${Math.max(20, (stats?.interviewCount || 1) * 10)}%` }}
            className="h-full bg-amber-500 transition-all"
          ></div>
          <div
            title={`Offer: ${stats?.offerCount || 0}`}
            style={{ width: `${Math.max(15, (stats?.offerCount || 1) * 12)}%` }}
            className="h-full rounded-r-full bg-emerald-500 transition-all"
          ></div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-medium text-on-surface-variant">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-400"></span>
            Wishlist ({stats?.wishlistCount || 0})
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
            Applied ({stats?.appliedCount || 0})
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
            Screening ({stats?.inReviewCount || 0})
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            Interview ({stats?.interviewCount || 0})
          </span>
          <span className="flex items-center gap-1.5 text-emerald-600 font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            Offer ({stats?.offerCount || 0})
          </span>
        </div>
      </section>

      {/* 5. Main Content Columns: Recent Applications (Left 2/3) + Activity Feed (Right 1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Applications */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-headline text-base font-bold text-on-surface">
              Active Opportunities ({filteredApps.length})
            </h3>
            <Link
              to="/applications"
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
            >
              See all ({stats?.totalPipeline || applications.length})
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </Link>
          </div>

          {filteredApps.length === 0 ? (
            <EmptyState
              icon="work_outline"
              title="No applications in this view"
              description="Track an opportunity by clicking Add Application to manage your timeline."
              actionLabel="Add New Application"
              onAction={() => setIsAddModalOpen(true)}
            />
          ) : (
            <div className="space-y-2.5">
              {filteredApps.map((app) => (
                <div
                  key={app._id}
                  className="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 hover:border-primary/40 shadow-sm transition-all duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                >
                  <Link to={`/applications/${app._id}`} className="flex items-start gap-3.5 flex-1 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-surface-container flex items-center justify-center font-bold text-primary text-base shrink-0 overflow-hidden border border-outline-variant/20 shadow-sm">
                      {app.companyLogo ? (
                        <img alt={app.companyName} className="w-full h-full object-cover" src={app.companyLogo} />
                      ) : (
                        app.companyName.charAt(0)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-headline text-sm sm:text-base font-bold text-on-surface group-hover:text-primary transition-colors truncate">
                          {app.jobTitle}
                        </h4>
                        {app.isTopChoice && (
                          <span className="material-symbols-outlined text-amber-500 text-[16px]" title="Top Choice">
                            star
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-on-surface-variant mt-0.5">
                        <span className="font-medium text-on-surface">{app.companyName}</span>
                        <span>·</span>
                        <span>{app.location}</span>
                        {app.salaryMax && (
                          <>
                            <span>·</span>
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                              ${(app.salaryMax / 1000).toFixed(0)}k
                            </span>
                          </>
                        )}
                      </div>
                      {app.nextAction && (
                        <p className="text-[11px] text-on-surface-variant/80 mt-1 line-clamp-1 italic">
                          Next: {app.nextAction}
                        </p>
                      )}
                    </div>
                  </Link>

                  {/* Actions & Stage Pill */}
                  <div className="flex items-center gap-2 shrink-0 justify-end">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        app.status === 'Offer'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : app.status === 'Interview'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          : app.status === 'Screening'
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                          : 'bg-surface-container text-on-surface-variant'
                      }`}
                    >
                      {app.status}
                    </span>

                    <button
                      type="button"
                      title="Quick stage transition"
                      onClick={() => setQuickMoveApp(app)}
                      className="w-8 h-8 rounded-lg bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high flex items-center justify-center transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">drive_file_move</span>
                    </button>

                    <Link
                      to={`/applications/${app._id}`}
                      className="w-8 h-8 rounded-lg bg-surface-container text-on-surface-variant hover:text-primary hover:bg-surface-container-high flex items-center justify-center transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right 1 Col: Recent Activity Stream */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-headline text-base font-bold text-on-surface">Recent Activity</h3>
            {activities.length > 0 && (
              <button
                onClick={handleClearActivities}
                className="text-[11px] font-semibold text-on-surface-variant hover:text-error transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          <div className="p-4 rounded-3xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm space-y-3.5 max-h-[500px] overflow-y-auto no-scrollbar">
            {activities.length === 0 ? (
              <div className="py-8 text-center text-xs text-on-surface-variant">
                No recent activity logged yet.
              </div>
            ) : (
              activities.map((act) => (
                <div key={act._id} className="flex items-start gap-3 text-xs">
                  <div className="w-8 h-8 rounded-xl bg-surface-container text-primary flex items-center justify-center shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-[16px]">
                      {act.type === 'document'
                        ? 'description'
                        : act.type === 'interview'
                        ? 'videocam'
                        : act.type === 'status_change'
                        ? 'trending_flat'
                        : 'notifications'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-on-surface leading-snug">{act.title}</p>
                    <p className="text-[11px] text-on-surface-variant line-clamp-2 mt-0.5">
                      {act.description}
                    </p>
                    <span className="text-[10px] text-outline mt-1 block">
                      {new Date(act.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddApplicationModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSaved={loadDashboardData}
      />

      <QuickMoveSheet
        isOpen={!!quickMoveApp}
        application={quickMoveApp}
        onClose={() => setQuickMoveApp(null)}
        onMoved={loadDashboardData}
      />
    </div>
  );
}
