import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';
import AddApplicationModal from '../components/AddApplicationModal.jsx';
import EditApplicationModal from '../components/EditApplicationModal.jsx';
import QuickMoveSheet from '../components/QuickMoveSheet.jsx';
import AdvancedFilterModal from '../components/AdvancedFilterModal.jsx';
import DeleteConfirmModal from '../components/DeleteConfirmModal.jsx';
import EmptyState from '../components/EmptyState.jsx';

export default function ApplicationsPage() {
  const { showToast } = useToast();

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid'

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [activeChip, setActiveChip] = useState('all'); // 'all', 'active', 'interview', 'offer', 'remote', 'high_priority'
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Advanced Filters
  const [advancedFilters, setAdvancedFilters] = useState({
    status: 'all',
    minSalary: 120,
    remoteOnly: false
  });
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // Selected applications for batch actions
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState(null);
  const [quickMoveApp, setQuickMoveApp] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Expanded notes toggle
  const [expandedNotes, setExpandedNotes] = useState({});

  const loadApplications = async () => {
    try {
      setLoading(true);
      const params = {
        sortBy,
        sortOrder,
        limit: 100
      };

      if (search.trim()) params.search = search.trim();

      if (activeChip === 'active') params.status = 'active';
      else if (activeChip === 'interview') params.status = 'Interview';
      else if (activeChip === 'offer') params.status = 'Offer';
      else if (activeChip === 'remote') params.workMode = 'Remote';
      else if (activeChip === 'high_priority') params.priority = 'High';

      // Advanced filter overrides
      if (advancedFilters.status && advancedFilters.status !== 'all') {
        params.status = advancedFilters.status;
      }
      if (advancedFilters.remoteOnly) {
        params.workMode = 'Remote';
      }

      const res = await api.applications.getAll(params);
      if (res && res.success) {
        let list = res.data || [];
        if (advancedFilters.minSalary > 120) {
          const threshold = advancedFilters.minSalary * 1000;
          list = list.filter((a) => (a.salaryMax || a.salaryMin || 0) >= threshold);
        }
        setApplications(list);
      }
    } catch (err) {
      console.error('Failed to load applications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, [search, activeChip, sortBy, sortOrder, advancedFilters]);

  // Batch actions
  const handleSelectAll = () => {
    if (selectedIds.size === applications.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(applications.map((a) => a._id)));
    }
  };

  const toggleSelectOne = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleBatchArchive = async () => {
    try {
      for (const id of selectedIds) {
        await api.applications.toggleArchive(id, true);
      }
      showToast(`Archived ${selectedIds.size} applications`);
      setSelectedIds(new Set());
      loadApplications();
    } catch (err) {
      showToast('Error archiving applications', 'error');
    }
  };

  const handleToggleTopChoice = async (app, e) => {
    e.stopPropagation();
    try {
      const nextVal = !app.isTopChoice;
      await api.applications.update(app._id, { isTopChoice: nextVal });
      setApplications((prev) =>
        prev.map((a) => (a._id === app._id ? { ...a, isTopChoice: nextVal } : a))
      );
      showToast(nextVal ? `Favorited ${app.companyName}` : 'Removed from favorites');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteApplication = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await api.applications.delete(deleteTarget._id);
      showToast('Application deleted successfully');
      setDeleteTarget(null);
      loadApplications();
    } catch (err) {
      showToast('Failed to delete application', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-background pb-28 pt-20 px-4 sm:px-6 max-w-7xl mx-auto">
      {/* 1. Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-headline text-2xl sm:text-3xl font-bold tracking-tight text-on-surface">
            Applications Tracker
          </h1>
          <p className="font-body-md text-xs sm:text-sm text-on-surface-variant mt-1">
            Tracking {applications.length} active opportunities across top tech companies
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-surface-container p-1 rounded-xl border border-outline-variant/30">
            <button
              onClick={() => setViewMode('list')}
              title="List View"
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'list' ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">view_list</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              title="Grid View"
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'grid' ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">grid_view</span>
            </button>
          </div>

          <button
            onClick={() => {
              setEditingApp(null);
              setIsAddModalOpen(true);
            }}
            className="h-10 px-4 rounded-xl bg-primary text-on-primary font-label-md text-xs font-bold shadow-md hover:bg-primary-container active:scale-98 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            New Application
          </button>
        </div>
      </div>

      {/* 2. Search Bar & Sort Row */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mb-4">
        <div className="sm:col-span-8 relative">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
            search
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by role, company, location, or tag..."
            className="w-full h-11 pl-10 pr-10 rounded-xl bg-surface-container-lowest text-on-surface text-sm border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all shadow-sm"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
        </div>

        <div className="sm:col-span-4 flex items-center gap-2">
          {/* Sort Selector */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="flex-1 h-11 px-3 rounded-xl bg-surface-container-lowest text-on-surface text-xs font-semibold border border-outline-variant/30 outline-none shadow-sm cursor-pointer"
          >
            <option value="updatedAt">Recently Updated</option>
            <option value="salary">Salary (High to Low)</option>
            <option value="dateApplied">Application Date</option>
            <option value="company">Company Name</option>
          </select>

          {/* Advanced Filter Modal Trigger */}
          <button
            onClick={() => setIsFilterModalOpen(true)}
            className="h-11 px-3 rounded-xl bg-surface-container-lowest text-on-surface-variant hover:text-primary border border-outline-variant/30 shadow-sm flex items-center gap-1.5 text-xs font-semibold"
          >
            <span className="material-symbols-outlined text-[18px]">tune</span>
            <span className="hidden xs:inline">Filters</span>
          </button>
        </div>
      </div>

      {/* 3. Filter Chips Bar */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 mb-4">
        {[
          { id: 'all', label: 'All' },
          { id: 'active', label: 'Active Pipeline' },
          { id: 'interview', label: 'Interviews' },
          { id: 'offer', label: 'Offers Extended' },
          { id: 'remote', label: 'Remote Only' },
          { id: 'high_priority', label: 'High Priority' }
        ].map((chip) => (
          <button
            key={chip.id}
            onClick={() => setActiveChip(chip.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 ${
              activeChip === chip.id
                ? 'bg-primary text-on-primary shadow-sm'
                : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* 4. Batch Actions Bar (when items selected) */}
      {selectedIds.size > 0 && (
        <div className="p-3 mb-4 rounded-2xl bg-primary-container text-on-primary flex items-center justify-between shadow-lg animate-in slide-in-from-top-2 duration-150">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold">
              {selectedIds.size} selected
            </span>
            <button
              onClick={handleSelectAll}
              className="text-xs font-semibold underline hover:opacity-80"
            >
              {selectedIds.size === applications.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBatchArchive}
              className="px-3 py-1 rounded-xl bg-surface-container-lowest text-primary text-xs font-bold hover:bg-surface-container"
            >
              Archive Selected
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-surface-container-lowest/20"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        </div>
      )}

      {/* 5. Applications Feed (List or Grid) */}
      {loading ? (
        <div className="py-20 text-center text-on-surface-variant text-sm flex flex-col items-center justify-center gap-3">
          <span className="material-symbols-outlined text-3xl text-primary animate-spin">
            progress_activity
          </span>
          <span>Loading applications...</span>
        </div>
      ) : applications.length === 0 ? (
        <EmptyState
          icon="work_outline"
          title="No applications match your criteria"
          description="Try broadening your search query or reset the filters to show all tracked positions."
          actionLabel="Add New Application"
          onAction={() => setIsAddModalOpen(true)}
          secondaryActionLabel="Reset All Filters"
          onSecondaryAction={() => {
            setSearch('');
            setActiveChip('all');
            setAdvancedFilters({ status: 'all', minSalary: 120, remoteOnly: false });
          }}
        />
      ) : (
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
              : 'space-y-3'
          }
        >
          {applications.map((app) => {
            const isSelected = selectedIds.has(app._id);
            const isNoteExpanded = expandedNotes[app._id];

            return (
              <div
                key={app._id}
                className={`p-5 rounded-2xl bg-surface-container-lowest border transition-all duration-150 shadow-sm relative group ${
                  isSelected
                    ? 'border-primary ring-1 ring-primary'
                    : 'border-outline-variant/30 hover:border-primary/40'
                }`}
              >
                {/* Top Row: Checkbox, Status Pill, Favorite & Actions */}
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectOne(app._id)}
                      className="w-4 h-4 rounded accent-primary cursor-pointer"
                    />
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
                    {app.priority === 'High' && (
                      <span className="px-2 py-0.5 rounded-full bg-error-container text-error text-[10px] font-bold">
                        High Priority
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleToggleTopChoice(app, e)}
                      title={app.isTopChoice ? 'Top choice role' : 'Star role'}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-amber-500 transition-colors"
                    >
                      <span
                        className={`material-symbols-outlined text-[20px] ${
                          app.isTopChoice ? 'text-amber-500 fill-current' : ''
                        }`}
                      >
                        {app.isTopChoice ? 'star' : 'star_border'}
                      </span>
                    </button>
                    <button
                      onClick={() => setQuickMoveApp(app)}
                      title="Quick Move stage"
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">drive_file_move</span>
                    </button>
                    <button
                      onClick={() => setEditingApp(app)}
                      title="Edit role"
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                    <button
                      onClick={() => setDeleteTarget(app)}
                      title="Delete role"
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-error hover:bg-surface-container transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </div>

                {/* Role Title & Company Header */}
                <Link to={`/applications/${app._id}`} className="block group">
                  <div className="flex items-start gap-3.5 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center font-bold text-primary text-lg shrink-0 overflow-hidden border border-outline-variant/20 shadow-sm">
                      {app.companyLogo ? (
                        <img alt={app.companyName} className="w-full h-full object-cover" src={app.companyLogo} />
                      ) : (
                        app.companyName.charAt(0)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-headline text-base sm:text-lg font-bold text-on-surface group-hover:text-primary transition-colors truncate">
                        {app.jobTitle}
                      </h3>
                      <p className="text-xs text-on-surface-variant font-medium mt-0.5">
                        <span className="font-bold text-on-surface">{app.companyName}</span> · {app.location} ({app.workMode})
                      </p>
                    </div>
                  </div>
                </Link>

                {/* Compensation & Urgency Chips */}
                <div className="flex flex-wrap items-center gap-2 text-xs mb-3">
                  {app.salaryMax ? (
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 font-bold">
                      ${(app.salaryMin / 1000).toFixed(0)}k - ${(app.salaryMax / 1000).toFixed(0)}k / yr
                    </span>
                  ) : null}
                  <span className="px-2.5 py-1 rounded-lg bg-surface-container text-on-surface-variant font-medium">
                    Applied: {app.dateApplied}
                  </span>
                  {app.source && (
                    <span className="px-2.5 py-1 rounded-lg bg-surface-container text-on-surface-variant text-[11px]">
                      Source: {app.source}
                    </span>
                  )}
                </div>

                {/* Next Action Banner */}
                {app.nextAction && (
                  <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/20 text-xs text-on-surface flex items-start gap-2 mb-3">
                    <span className="material-symbols-outlined text-[16px] text-primary shrink-0 mt-0.5">
                      flag
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className="font-bold">Next Action:</span> {app.nextAction}
                      {app.nextActionDate && (
                        <span className="text-primary font-semibold ml-1">
                          (Due {app.nextActionDate})
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Collapsible Notes Preview */}
                {app.notes && (
                  <div className="text-xs text-on-surface-variant mb-3">
                    <button
                      onClick={() =>
                        setExpandedNotes((prev) => ({ ...prev, [app._id]: !prev[app._id] }))
                      }
                      className="flex items-center gap-1 font-semibold text-primary hover:underline mb-1"
                    >
                      <span className="material-symbols-outlined text-[14px]">
                        {isNoteExpanded ? 'expand_less' : 'expand_more'}
                      </span>
                      {isNoteExpanded ? 'Hide Interview Prep Notes' : 'View Interview Notes'}
                    </button>
                    {isNoteExpanded && (
                      <div className="p-3 rounded-xl bg-surface-container/60 text-on-surface text-[11px] leading-relaxed whitespace-pre-line border border-outline-variant/20">
                        {app.notes}
                      </div>
                    )}
                  </div>
                )}

                {/* Footer Tags & Details Button */}
                <div className="flex items-center justify-between pt-2 border-t border-surface-container text-xs">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {app.tags &&
                      app.tags.slice(0, 3).map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-surface-container text-on-surface-variant text-[11px] font-mono"
                        >
                          #{tag}
                        </span>
                      ))}
                  </div>

                  <Link
                    to={`/applications/${app._id}`}
                    className="font-bold text-primary hover:underline flex items-center gap-1"
                  >
                    View Dossier
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <AddApplicationModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSaved={loadApplications}
      />

      <EditApplicationModal
        isOpen={!!editingApp}
        onClose={() => setEditingApp(null)}
        application={editingApp}
        onSaved={loadApplications}
      />

      <QuickMoveSheet
        isOpen={!!quickMoveApp}
        application={quickMoveApp}
        onClose={() => setQuickMoveApp(null)}
        onMoved={loadApplications}
      />

      <AdvancedFilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        filters={advancedFilters}
        onApplyFilters={(newFilters) => setAdvancedFilters(newFilters)}
        onResetFilters={() => setAdvancedFilters({ status: 'all', minSalary: 120, remoteOnly: false })}
      />

      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        title={`Delete application for ${deleteTarget?.companyName}?`}
        message="This will permanently delete this application, associated notes, and timeline history."
        loading={deleteLoading}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteApplication}
      />
    </div>
  );
}
