import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';
import QuickMoveSheet from '../components/QuickMoveSheet.jsx';
import AddApplicationModal from '../components/AddApplicationModal.jsx';

const COLUMNS = [
  { id: 'Wishlist', title: 'Wishlist', color: 'border-indigo-500', badgeColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300' },
  { id: 'Applied', title: 'Applied', color: 'border-sky-500', badgeColor: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300' },
  { id: 'Screening', title: 'Screening', color: 'border-purple-500', badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' },
  { id: 'Interview', title: 'Technical Interview', color: 'border-amber-500', badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' },
  { id: 'Offer', title: 'Offer Extended', color: 'border-emerald-500', badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' },
  { id: 'Rejected', title: 'Archived', color: 'border-rose-400', badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' }
];

export default function PipelinePage() {
  const { showToast } = useToast();

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [remoteOnly, setRemoteOnly] = useState(false);

  // Drag and drop state
  const [draggingAppId, setDraggingAppId] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);

  // Modals
  const [quickMoveApp, setQuickMoveApp] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addDefaultStatus, setAddDefaultStatus] = useState('Applied');

  const loadPipeline = async () => {
    try {
      setLoading(true);
      const res = await api.applications.getAll({ limit: 200, sortBy: 'updatedAt', sortOrder: 'desc' });
      if (res && res.success) {
        setApplications(res.data || []);
      }
    } catch (err) {
      console.error('Pipeline error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPipeline();
  }, []);

  // Filter applications
  const filteredApps = applications.filter((app) => {
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const match =
        app.jobTitle.toLowerCase().includes(q) ||
        app.companyName.toLowerCase().includes(q) ||
        (app.location && app.location.toLowerCase().includes(q));
      if (!match) return false;
    }
    if (remoteOnly && app.workMode !== 'Remote') return false;
    return true;
  });

  // Calculate Pipeline Hero metrics
  const activeRoles = applications.filter((a) => !a.isArchived && a.status !== 'Rejected');
  const salaries = applications.map((a) => a.salaryMax || a.salaryMin).filter(Boolean);
  const avgSalary = salaries.length > 0 ? Math.round(salaries.reduce((a, b) => a + b, 0) / salaries.length) : 172000;

  // Native HTML5 Drag and Drop handlers
  const handleDragStart = (e, appId) => {
    setDraggingAppId(appId);
    e.dataTransfer.setData('text/plain', appId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, colId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverCol !== colId) {
      setDragOverCol(colId);
    }
  };

  const handleDragLeave = () => {
    setDragOverCol(null);
  };

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    setDragOverCol(null);
    const appId = e.dataTransfer.getData('text/plain') || draggingAppId;
    if (!appId) return;

    const currentApp = applications.find((a) => a._id === appId);
    if (!currentApp || currentApp.status === targetStatus) return;

    // Optimistically update UI
    setApplications((prev) =>
      prev.map((a) => (a._id === appId ? { ...a, status: targetStatus } : a))
    );

    try {
      await api.applications.updateStatus(appId, { status: targetStatus });
      showToast(`Moved ${currentApp.companyName} to ${targetStatus} 🎉`);
    } catch (err) {
      showToast('Failed to update stage', 'error');
      loadPipeline(); // Rollback
    } finally {
      setDraggingAppId(null);
    }
  };

  const openAddInStage = (stageId) => {
    setAddDefaultStatus(stageId);
    setIsAddModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background text-on-background pb-28 pt-20 px-4 sm:px-6 max-w-[1600px] mx-auto">
      {/* 1. Pipeline Live Status Banner Strip (Executive Horizon style) */}
      <div className="p-4 sm:p-5 rounded-3xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-label-sm text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
              Live Pipeline Management
            </span>
          </div>
          <div className="flex flex-wrap items-baseline gap-4 mt-1">
            <h1 className="font-headline text-2xl font-bold text-on-surface">
              {activeRoles.length} Active Positions
            </h1>
            <span className="text-xs text-on-surface-variant font-medium">
              Avg Target: <strong className="text-on-surface font-bold">${(avgSalary / 1000).toFixed(0)}k</strong>
            </span>
            <span className="text-xs text-emerald-600 font-bold">
              85% Pipeline Health
            </span>
          </div>
        </div>

        {/* Filter Controls & CTA */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px]">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
              search
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search stage cards..."
              className="w-full h-9 pl-9 pr-3 rounded-xl bg-surface-container-low text-xs text-on-surface outline-none border border-outline-variant/30 focus:border-primary transition-colors"
            />
          </div>

          <label className="flex items-center gap-1.5 text-xs text-on-surface-variant cursor-pointer select-none">
            <input
              type="checkbox"
              checked={remoteOnly}
              onChange={(e) => setRemoteOnly(e.target.checked)}
              className="w-4 h-4 rounded accent-primary cursor-pointer"
            />
            <span>Remote Only</span>
          </label>

          <button
            onClick={() => openAddInStage('Applied')}
            className="h-9 px-4 rounded-xl bg-primary text-on-primary font-label-md text-xs font-bold shadow-sm hover:opacity-95 active:scale-98 transition-all flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            Add Opportunity
          </button>
        </div>
      </div>

      {/* 2. Kanban Board Grid */}
      {loading ? (
        <div className="py-20 text-center text-on-surface-variant text-sm flex flex-col items-center justify-center gap-3">
          <span className="material-symbols-outlined text-3xl text-primary animate-spin">
            progress_activity
          </span>
          <span>Organizing pipeline board...</span>
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-6 no-scrollbar snap-x">
          {COLUMNS.map((col) => {
            const colApps = filteredApps.filter((a) => {
              const st = a.pipelineStage || a.status;
              if (col.id === 'Rejected') {
                return st === 'Rejected' || st === 'Archived' || st === 'Withdrawn' || a.isArchived;
              }
              return st === col.id && !a.isArchived;
            });
            const isTargeted = dragOverCol === col.id;

            return (
              <div
                key={col.id}
                onDragOver={(e) => handleDragOver(e, col.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, col.id)}
                className={`w-72 sm:w-80 shrink-0 flex flex-col rounded-2xl bg-surface-container-lowest border transition-all duration-200 snap-start max-h-[calc(100vh-250px)] ${
                  isTargeted
                    ? 'border-primary ring-2 ring-primary/30 bg-surface-container-low'
                    : 'border-outline-variant/30'
                }`}
              >
                {/* Column Header */}
                <div className={`p-3.5 border-b border-surface-container flex items-center justify-between border-t-4 ${col.color}`}>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-headline text-xs font-bold text-on-surface truncate">
                      {col.title}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${col.badgeColor}`}>
                      {colApps.length}
                    </span>
                  </div>

                  <button
                    onClick={() => openAddInStage(col.id)}
                    title={`Add role directly to ${col.title}`}
                    className="w-7 h-7 rounded-lg bg-surface-container text-on-surface-variant hover:text-primary hover:bg-surface-container-high flex items-center justify-center transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                  </button>
                </div>

                {/* Cards Container */}
                <div className="p-3 flex-1 overflow-y-auto space-y-3 no-scrollbar min-h-[150px]">
                  {colApps.length === 0 ? (
                    <div className="py-8 text-center text-xs text-on-surface-variant border border-dashed border-outline-variant/30 rounded-xl p-3">
                      Drop cards here or click + to add.
                    </div>
                  ) : (
                    colApps.map((app) => (
                      <div
                        key={app._id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, app._id)}
                        className={`p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/30 shadow-sm hover:border-primary/50 hover:shadow-md cursor-grab active:cursor-grabbing transition-all select-none group ${
                          draggingAppId === app._id ? 'opacity-40 scale-95' : ''
                        }`}
                      >
                        {/* Card Header: Logo, Company, Star */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <Link to={`/applications/${app._id}`} className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center font-bold text-primary text-xs shrink-0 overflow-hidden border border-outline-variant/20">
                              {app.companyLogo ? (
                                <img alt={app.companyName} className="w-full h-full object-cover" src={app.companyLogo} />
                              ) : (
                                app.companyName.charAt(0)
                              )}
                            </div>
                            <span className="font-bold text-xs text-on-surface truncate">
                              {app.companyName}
                            </span>
                          </Link>

                          <div className="flex items-center gap-1">
                            {app.isTopChoice && (
                              <span className="material-symbols-outlined text-amber-500 text-[16px]">
                                star
                              </span>
                            )}
                            <button
                              onClick={() => setQuickMoveApp(app)}
                              title="Move stage"
                              className="w-6 h-6 rounded flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors"
                            >
                              <span className="material-symbols-outlined text-[15px]">drive_file_move</span>
                            </button>
                          </div>
                        </div>

                        {/* Role Title */}
                        <Link to={`/applications/${app._id}`}>
                          <h4 className="font-headline text-xs font-bold text-on-surface hover:text-primary transition-colors line-clamp-2 leading-snug mb-2">
                            {app.jobTitle}
                          </h4>
                        </Link>

                        {/* Work mode & Salary Tag */}
                        <div className="flex flex-wrap items-center gap-1.5 mb-2.5 text-[11px]">
                          <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-medium">
                            {app.workMode}
                          </span>
                          {app.salaryMax ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 font-bold">
                              ${(app.salaryMax / 1000).toFixed(0)}k
                            </span>
                          ) : null}
                        </div>

                        {/* Next Action Pill if present */}
                        {app.nextAction && (
                          <div className="p-2 rounded-lg bg-surface-container/60 text-[10px] text-on-surface-variant line-clamp-2 border border-outline-variant/10 mb-2">
                            <strong className="text-on-surface">Next:</strong> {app.nextAction}
                          </div>
                        )}

                        {/* Bottom Footer: Stage badge & Details Link */}
                        <div className="flex items-center justify-between pt-2 border-t border-surface-container text-[10px] text-on-surface-variant font-medium">
                          <span>{app.dateApplied || 'Active'}</span>
                          <Link
                            to={`/applications/${app._id}`}
                            className="font-bold text-primary hover:underline flex items-center gap-0.5"
                          >
                            Details
                            <span className="material-symbols-outlined text-[12px]">chevron_right</span>
                          </Link>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <QuickMoveSheet
        isOpen={!!quickMoveApp}
        application={quickMoveApp}
        onClose={() => setQuickMoveApp(null)}
        onMoved={loadPipeline}
      />

      <AddApplicationModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        initialData={{ status: addDefaultStatus }}
        onSaved={loadPipeline}
      />
    </div>
  );
}
