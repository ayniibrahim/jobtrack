import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';
import EditApplicationModal from '../components/EditApplicationModal.jsx';
import QuickMoveSheet from '../components/QuickMoveSheet.jsx';
import DeleteConfirmModal from '../components/DeleteConfirmModal.jsx';

export default function ApplicationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'timeline' | 'interview' | 'compensation' | 'role_fit' | 'notes' | 'documents'

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isQuickMoveOpen, setIsQuickMoveOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // New Note State
  const [newNote, setNewNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  const loadApplication = async () => {
    try {
      setLoading(true);
      const res = await api.applications.getById(id);
      if (res && res.success) {
        setApplication(res.data);
      }
    } catch (err) {
      showToast('Could not load application details', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplication();
  }, [id]);

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    setSavingNote(true);
    try {
      const updatedNotes = application.notes
        ? `${application.notes}\n\n[${new Date().toLocaleDateString()}]: ${newNote.trim()}`
        : newNote.trim();

      await api.applications.update(application._id, { notes: updatedNotes });

      // Also persist to Note model collection
      try {
        await api.notes.create({
          targetType: 'application',
          targetId: application._id,
          content: newNote.trim(),
          title: `Note for ${application.companyName}`
        });
      } catch (_) {}

      setApplication((prev) => ({ ...prev, notes: updatedNotes }));
      setNewNote('');
      showToast('Note saved to application dossier 📝');
    } catch (err) {
      showToast('Error adding note', 'error');
    } finally {
      setSavingNote(false);
    }
  };

  const handleToggleFavorite = async () => {
    try {
      const nextVal = !application.isTopChoice;
      await api.applications.update(application._id, { isTopChoice: nextVal });
      setApplication((prev) => ({ ...prev, isTopChoice: nextVal }));
      showToast(nextVal ? 'Saved as Top Choice' : 'Removed from top choice');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await api.applications.delete(application._id);
      showToast('Application deleted successfully');
      navigate('/applications');
    } catch (err) {
      showToast('Failed to delete application', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-on-background pb-28 pt-24 px-4 flex flex-col items-center justify-center gap-3">
        <span className="material-symbols-outlined text-4xl text-primary animate-spin">
          progress_activity
        </span>
        <span className="text-sm text-on-surface-variant font-medium">Loading application dossier...</span>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen bg-background text-on-background pb-28 pt-24 px-4 text-center">
        <h2 className="text-xl font-bold">Application Not Found</h2>
        <p className="text-xs text-on-surface-variant mt-2">
          This role may have been deleted or moved.
        </p>
        <Link
          to="/applications"
          className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          Back to Applications
        </Link>
      </div>
    );
  }

  // Salary calculations
  const minSal = application.minSalary || application.salaryMin || 0;
  const maxSal = application.maxSalary || application.salaryMax || 0;
  const curr = application.salaryCurrency || 'USD';
  const salType = application.salaryType || 'Annual';

  // Offer details fallback
  const comp = application.offerDetails || {
    baseSalary: maxSal || minSal || 185000,
    signOnBonus: 20000,
    rsuGrant: 120000,
    rsuPerYear: 30000,
    yearOneTotal: (maxSal || 185000) + 20000 + 30000
  };

  const stage = application.pipelineStage || application.status || 'Wishlist';
  const techTags = (application.techTags && application.techTags.length > 0)
    ? application.techTags
    : (application.tags || []);

  return (
    <div className="min-h-screen bg-background text-on-background pb-28 pt-20 px-4 sm:px-6 max-w-7xl mx-auto">
      {/* 1. Breadcrumbs & Top Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 text-xs text-on-surface-variant">
          <Link to="/applications" className="hover:text-primary transition-colors flex items-center gap-1 font-medium">
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Applications
          </Link>
          <span>/</span>
          <span className="font-semibold text-on-surface">{application.companyName}</span>
          <span>/</span>
          <span className="truncate max-w-[200px]">{application.jobTitle}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsQuickMoveOpen(true)}
            className="h-9 px-3.5 rounded-xl bg-surface-container text-on-surface text-xs font-bold hover:bg-surface-container-high transition-colors flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">drive_file_move</span>
            Change Stage
          </button>
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="h-9 px-3.5 rounded-xl bg-primary text-on-primary text-xs font-bold hover:opacity-95 transition-opacity flex items-center gap-1.5 shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px]">edit</span>
            Edit Application
          </button>
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            aria-label="Delete application"
            className="w-9 h-9 rounded-xl bg-surface-container text-on-surface-variant hover:text-error hover:bg-error-container/30 transition-colors flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-[18px]">delete</span>
          </button>
        </div>
      </div>

      {/* 2. Hero Header Card */}
      <div className="p-6 rounded-3xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center font-bold text-primary text-2xl shrink-0 overflow-hidden border border-outline-variant/30 shadow-md">
              {application.companyLogo ? (
                <img alt={application.companyName} className="w-full h-full object-cover" src={application.companyLogo} />
              ) : (
                application.companyName.charAt(0)
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-headline text-xl sm:text-2xl font-bold text-on-surface">
                  {application.jobTitle}
                </h1>
                <button
                  onClick={handleToggleFavorite}
                  className="text-on-surface-variant hover:text-amber-500 transition-colors"
                  title="Toggle favorite"
                >
                  <span
                    className={`material-symbols-outlined text-[22px] ${
                      application.isTopChoice ? 'text-amber-500 fill-current' : ''
                    }`}
                  >
                    {application.isTopChoice ? 'star' : 'star_border'}
                  </span>
                </button>
              </div>

              <p className="text-sm font-semibold text-on-surface-variant mt-0.5">
                <span className="text-primary font-bold">{application.companyName}</span> · {application.location || 'Location Not Specified'} ({application.workMode || 'Remote'})
              </p>

              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    stage === 'Offer'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : stage === 'Interview'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                      : stage === 'Screening'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                      : stage === 'Wishlist'
                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                      : 'bg-surface-container text-on-surface'
                  }`}
                >
                  {stage}
                </span>

                <span className="px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-xs font-medium">
                  {application.priority || 'Medium Priority (Standard)'}
                </span>

                <span className="px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-xs font-medium">
                  {application.employmentType || 'Full-time'}
                </span>

                {application.source && (
                  <span className="px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-xs font-medium flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px]">share</span>
                    {application.source}
                  </span>
                )}

                {application.jobUrl && (
                  <a
                    href={application.jobUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary font-semibold hover:underline ml-1"
                  >
                    Job Posting
                    <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Target Salary Block */}
          {(maxSal > 0 || minSal > 0 || application.salaryRange) && (
            <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/20 sm:text-right shrink-0">
              <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant block">
                Target Compensation
              </span>
              <span className="font-headline text-lg sm:text-xl font-bold text-emerald-600 dark:text-emerald-400">
                {application.salaryRange ? application.salaryRange : (
                  `${curr} ${minSal > 0 ? `$${(minSal / 1000).toFixed(0)}k` : ''}${minSal > 0 && maxSal > 0 ? ' - ' : ''}${maxSal > 0 ? `$${(maxSal / 1000).toFixed(0)}k` : ''}`
                )}
              </span>
              <span className="text-[11px] text-on-surface-variant block capitalize">{salType} Salary</span>
            </div>
          )}
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-surface-container pb-2 mb-6 overflow-x-auto no-scrollbar">
        {[
          { id: 'overview', label: 'Overview & Details', icon: 'info' },
          { id: 'timeline', label: 'Timeline & Dates', icon: 'calendar_month' },
          { id: 'interview', label: 'Interview & Prep', icon: 'videocam' },
          { id: 'role_fit', label: 'Role Fit & Skills', icon: 'psychology' },
          { id: 'compensation', label: 'Compensation Bento', icon: 'payments' },
          { id: 'notes', label: 'Dossier Notes', icon: 'edit_note' },
          { id: 'documents', label: 'Vault Documents', icon: 'folder' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === tab.id
                ? 'bg-primary text-on-primary shadow-sm'
                : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 4. Tab Contents */}

      {/* TAB: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            {/* Immediate Next Action Card */}
            <div className="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-headline text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  Immediate Next Action
                </h4>
                {application.nextActionDate && (
                  <span className="text-xs text-primary font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">event</span>
                    Due: {application.nextActionDate}
                  </span>
                )}
              </div>
              <p className="text-sm text-on-surface font-semibold">
                {application.nextAction || 'No pending action defined. Keep in touch with recruiter.'}
              </p>
            </div>

            {/* Job Description Card */}
            {application.jobDescription && (
              <div className="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm">
                <h4 className="font-headline text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
                  Job Description & Mission
                </h4>
                <p className="text-xs text-on-surface leading-relaxed whitespace-pre-line">
                  {application.jobDescription}
                </p>
              </div>
            )}

            {/* Why This Role? Card */}
            {application.whyThisRole && (
              <div className="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm">
                <h4 className="font-headline text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
                  Why This Role?
                </h4>
                <p className="text-xs text-on-surface leading-relaxed whitespace-pre-line">
                  {application.whyThisRole}
                </p>
              </div>
            )}

            {/* General Notes Card */}
            <div className="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm">
              <h4 className="font-headline text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
                General Notes & Context
              </h4>
              <p className="text-xs text-on-surface leading-relaxed whitespace-pre-line">
                {application.notes || 'No general notes recorded yet.'}
              </p>
            </div>
          </div>

          {/* Right Column: Recruiter & Quick Info */}
          <div className="space-y-4">
            {/* Recruiter / Contact POC Card */}
            <div className="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm">
              <h4 className="font-headline text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-3">
                Lead Point of Contact
              </h4>
              {application.recruiterName ? (
                <>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-primary-fixed text-primary font-bold flex items-center justify-center text-sm">
                      {application.recruiterName.charAt(0)}
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-on-surface">
                        {application.recruiterName}
                      </h5>
                      <p className="text-[11px] text-on-surface-variant">
                        Recruiter / Talent Partner
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 pt-2 border-t border-surface-container text-xs">
                    {application.recruiterEmail && (
                      <a
                        href={`mailto:${application.recruiterEmail}`}
                        className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors"
                      >
                        <span className="material-symbols-outlined text-[16px]">mail</span>
                        <span className="truncate">{application.recruiterEmail}</span>
                      </a>
                    )}
                    {application.recruiterPhone && (
                      <a
                        href={`tel:${application.recruiterPhone}`}
                        className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors"
                      >
                        <span className="material-symbols-outlined text-[16px]">call</span>
                        <span>{application.recruiterPhone}</span>
                      </a>
                    )}
                    {application.recruiterLinkedIn && (
                      <a
                        href={application.recruiterLinkedIn}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-primary hover:underline transition-colors"
                      >
                        <span className="material-symbols-outlined text-[16px]">link</span>
                        <span>LinkedIn Profile</span>
                      </a>
                    )}
                    {application.contactNotes && (
                      <div className="mt-2 p-2.5 rounded-lg bg-surface-container-low text-[11px] text-on-surface-variant">
                        {application.contactNotes}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="py-4 text-center text-xs text-on-surface-variant">
                  <span className="material-symbols-outlined text-2xl text-on-surface-variant block mb-1">person_off</span>
                  No recruiter contact linked yet.
                </div>
              )}
            </div>

            {/* Resume / CV Version */}
            <div className="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm">
              <h4 className="font-headline text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
                Resume / CV Version
              </h4>
              {application.resumeVersion ? (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/20">
                  <span className="material-symbols-outlined text-primary text-[20px]">description</span>
                  <span className="text-xs font-bold text-on-surface truncate">{application.resumeVersion}</span>
                </div>
              ) : (
                <p className="text-xs text-on-surface-variant">No resume version tagged.</p>
              )}
            </div>

            {/* Tech Tags */}
            {techTags.length > 0 && (
              <div className="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm">
                <h4 className="font-headline text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
                  Tech Tags
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {techTags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 rounded-lg bg-surface-container text-on-surface text-[11px] font-semibold"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: TIMELINE & DATES */}
      {activeTab === 'timeline' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/30">
              <span className="text-[11px] font-bold uppercase text-on-surface-variant block mb-1">Date Saved</span>
              <span className="font-headline text-base font-bold text-on-surface">
                {application.dateSaved || 'Not recorded'}
              </span>
              <span className="text-[10px] text-on-surface-variant block mt-1">Opportunity logged</span>
            </div>

            <div className="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/30">
              <span className="text-[11px] font-bold uppercase text-on-surface-variant block mb-1">Date Applied</span>
              <span className="font-headline text-base font-bold text-on-surface">
                {application.dateApplied || 'Not yet applied'}
              </span>
              <span className="text-[10px] text-on-surface-variant block mt-1">Submission timestamp</span>
            </div>

            <div className="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/30">
              <span className="text-[11px] font-bold uppercase text-on-surface-variant block mb-1">Application Deadline</span>
              <span className="font-headline text-base font-bold text-on-surface">
                {application.applicationDeadline || application.deadline || 'No hard deadline'}
              </span>
              <span className="text-[10px] text-on-surface-variant block mt-1">Job posting expiry</span>
            </div>

            <div className="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/30">
              <span className="text-[11px] font-bold uppercase text-on-surface-variant block mb-1">Last Follow-up</span>
              <span className="font-headline text-base font-bold text-on-surface">
                {application.lastFollowUpDate || 'None recorded'}
              </span>
              <span className="text-[10px] text-on-surface-variant block mt-1">Last touchpoint with recruiter</span>
            </div>
          </div>

          {/* Next Action Box */}
          <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-primary block mb-1">
                Upcoming Next Action
              </span>
              <h4 className="font-headline text-base font-bold text-on-surface">
                {application.nextAction || 'Submit application'}
              </h4>
              {application.nextActionDate && (
                <p className="text-xs text-on-surface-variant mt-1">
                  Target completion date: {application.nextActionDate}
                </p>
              )}
            </div>

            <button
              onClick={() => setIsEditModalOpen(true)}
              className="h-9 px-4 rounded-xl bg-surface-container text-on-surface text-xs font-bold hover:bg-surface-container-high transition-colors shrink-0"
            >
              Update Next Action
            </button>
          </div>
        </div>
      )}

      {/* TAB: INTERVIEW & PREPARATION */}
      {activeTab === 'interview' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-container mb-4">
              <div>
                <h4 className="font-headline text-base font-bold text-on-surface">
                  Interview Round & Preparation Notes
                </h4>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Scheduled loops, video conference links, and architectural talking points.
                </p>
              </div>

              {application.meetingLink && (
                <a
                  href={application.meetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-10 px-4 rounded-xl bg-primary text-on-primary font-bold text-xs shadow-md hover:opacity-95 transition-all flex items-center gap-2 shrink-0"
                >
                  <span className="material-symbols-outlined text-[18px]">videocam</span>
                  Launch Video Meeting
                </a>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/20">
                <span className="text-[11px] font-bold uppercase text-on-surface-variant block mb-1">
                  Interview Date
                </span>
                <span className="font-headline text-base font-bold text-on-surface">
                  {application.interviewDate || 'Not scheduled yet'}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/20">
                <span className="text-[11px] font-bold uppercase text-on-surface-variant block mb-1">
                  Interview Type
                </span>
                <span className="font-headline text-base font-bold text-on-surface">
                  {application.interviewType || 'Technical'}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/20">
                <span className="text-[11px] font-bold uppercase text-on-surface-variant block mb-1">
                  Meeting Link
                </span>
                <span className="text-xs font-semibold text-primary truncate block">
                  {application.meetingLink || 'No link provided'}
                </span>
              </div>
            </div>

            {/* Preparation Notes */}
            <div className="space-y-4">
              <div>
                <h5 className="font-headline text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
                  Interview & Preparation Notes
                </h5>
                <div className="p-4 rounded-xl bg-surface-container-low text-xs text-on-surface leading-relaxed whitespace-pre-line">
                  {application.interviewNotes || 'No specific interview preparation notes logged yet. Click Edit to add topics.'}
                </div>
              </div>

              <div>
                <h5 className="font-headline text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
                  Interview Questions / Topics
                </h5>
                <div className="p-4 rounded-xl bg-surface-container-low text-xs text-on-surface leading-relaxed whitespace-pre-line">
                  {application.interviewQuestions || 'No anticipated questions logged yet.'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: ROLE FIT & SKILLS */}
      {activeTab === 'role_fit' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm space-y-4">
            <h4 className="font-headline text-base font-bold text-on-surface">
              Role Fit & Key Requirements
            </h4>

            <div>
              <h5 className="font-headline text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
                Why This Role?
              </h5>
              <div className="p-4 rounded-xl bg-surface-container-low text-xs text-on-surface leading-relaxed whitespace-pre-line">
                {application.whyThisRole || 'No role interest statement provided.'}
              </div>
            </div>

            <div>
              <h5 className="font-headline text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
                Key Skills & Employer Requirements
              </h5>
              <div className="p-4 rounded-xl bg-surface-container-low text-xs text-on-surface leading-relaxed whitespace-pre-line">
                {application.keySkills || 'No key requirements logged.'}
              </div>
            </div>

            <div>
              <h5 className="font-headline text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
                Tech Stack Tags
              </h5>
              <div className="flex flex-wrap gap-2">
                {techTags.length > 0 ? (
                  techTags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 rounded-xl bg-surface-container text-on-surface text-xs font-semibold"
                    >
                      {tag}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-on-surface-variant">No tech tags provided.</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: COMPENSATION BENTO */}
      {activeTab === 'compensation' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 text-emerald-900 dark:text-emerald-200">
              <span className="text-[11px] font-bold uppercase tracking-wider block mb-1">
                Target Salary Range
              </span>
              <span className="font-headline text-2xl sm:text-3xl font-bold">
                {curr} {minSal > 0 ? `$${(minSal / 1000).toFixed(0)}k` : ''}{minSal > 0 && maxSal > 0 ? ' - ' : ''}{maxSal > 0 ? `$${(maxSal / 1000).toFixed(0)}k` : '$0'}
              </span>
              <span className="text-xs text-emerald-700 dark:text-emerald-400 block mt-1 capitalize">
                {salType} Compensation Target
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30">
              <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant block mb-1">
                Annual Base Salary (Calculated)
              </span>
              <span className="font-headline text-2xl font-bold text-on-surface">
                ${(comp.baseSalary / 1000).toFixed(0)},000
              </span>
              <span className="text-xs text-on-surface-variant block mt-1">
                Paid semi-monthly (~${((comp.baseSalary || 180000) / 24).toFixed(0)}/paycheck)
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30">
              <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant block mb-1">
                RSU Grant (4-Yr Vest)
              </span>
              <span className="font-headline text-2xl font-bold text-on-surface">
                ${(comp.rsuGrant / 1000).toFixed(0)},000
              </span>
              <span className="text-xs text-on-surface-variant block mt-1">
                ${(comp.rsuPerYear / 1000).toFixed(0)}k/year with 1-year cliff
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB: DOSSIER NOTES */}
      {activeTab === 'notes' && (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm">
            <h4 className="font-headline text-sm font-bold text-on-surface mb-3">
              Add Prep Note / Interview Debrief
            </h4>
            <form onSubmit={handleAddNote} className="space-y-3">
              <textarea
                rows={3}
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Log interviewer questions, system design architecture diagrams discussed, compensation counter numbers, or culture impressions..."
                className="w-full p-3 rounded-xl bg-surface-container-low text-on-surface text-xs outline-none border border-outline-variant/30 focus:border-primary transition-colors"
              />
              <button
                type="submit"
                disabled={savingNote || !newNote.trim()}
                className="h-9 px-4 rounded-xl bg-primary text-on-primary font-label-md text-xs font-bold shadow-sm hover:opacity-95 transition-all flex items-center gap-1.5 ml-auto disabled:opacity-50"
              >
                {savingNote ? (
                  <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined text-[16px]">post_add</span>
                )}
                Append Note
              </button>
            </form>
          </div>

          <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm">
            <h4 className="font-headline text-sm font-bold text-on-surface mb-3">
              Dossier History & Log
            </h4>
            <div className="p-4 rounded-xl bg-surface-container-low text-xs text-on-surface leading-relaxed whitespace-pre-line font-mono">
              {application.notes || 'No notes currently stored for this application.'}
            </div>
          </div>
        </div>
      )}

      {/* TAB: DOCUMENTS */}
      {activeTab === 'documents' && (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-headline text-sm font-bold text-on-surface">
                  Attached Files & Dossier PDFs
                </h4>
                <p className="text-xs text-on-surface-variant">
                  Resumes, cover letters, and formal offer agreements.
                </p>
              </div>
              <Link
                to="/documents"
                className="h-9 px-3.5 rounded-xl bg-primary text-on-primary font-label-md text-xs font-bold shadow-sm hover:opacity-95 transition-all flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">upload_file</span>
                Upload Document
              </Link>
            </div>

            {application.resumeVersion && (
              <div className="p-3 mb-4 rounded-xl bg-surface-container border border-outline-variant/30 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">badge</span>
                  <span>
                    Tagged Resume Version: <strong>{application.resumeVersion}</strong>
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {(application.documents || []).length === 0 ? (
                <div className="py-8 text-center text-xs text-on-surface-variant">
                  No files linked directly to this role yet.
                </div>
              ) : (
                application.documents.map((doc) => (
                  <div
                    key={doc._id}
                    className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/20 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-primary text-[22px]">
                        picture_as_pdf
                      </span>
                      <div>
                        <p className="font-bold text-on-surface">{doc.name}</p>
                        <p className="text-[11px] text-on-surface-variant">
                          {doc.type} · {(doc.size / (1024 * 1024)).toFixed(1)} MB
                        </p>
                      </div>
                    </div>

                    <a
                      href={doc.url}
                      download
                      className="h-8 px-3 rounded-lg bg-surface-container text-on-surface text-xs font-semibold hover:bg-surface-container-high transition-colors flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[15px]">download</span>
                      Download
                    </a>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <EditApplicationModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        application={application}
        onSaved={loadApplication}
      />

      <QuickMoveSheet
        isOpen={isQuickMoveOpen}
        application={application}
        onClose={() => setIsQuickMoveOpen(false)}
        onMoved={loadApplication}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        title={`Delete ${application.companyName} Application?`}
        message="This will permanently delete this opportunity and its notes."
        loading={deleteLoading}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
