import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';
import EditApplicationModal from './EditApplicationModal.jsx';

const PIPELINE_STAGES = [
  'Wishlist',
  'Applied',
  'Screening',
  'Interview',
  'Offer',
  'Rejected',
  'Withdrawn',
  'Archived'
];

const SOURCES = [
  'LinkedIn',
  'Company Website',
  'Indeed',
  'Glassdoor',
  'Referral',
  'Recruiter',
  'Job Board',
  'Other'
];

const WORK_MODES = ['Remote', 'Hybrid', 'On-site'];

const NEXT_ACTIONS = [
  'Follow up',
  'Prepare for interview',
  'Complete assessment',
  'Send CV',
  'Send portfolio',
  'Wait for response',
  'Other'
];

const getTodayString = () => new Date().toISOString().split('T')[0];

export default function AddApplicationModal({ isOpen, onClose, onSaved, initialData = null }) {
  const { showToast } = useToast();

  // If initialData has an existing _id, delegate to EditApplicationModal
  if (isOpen && initialData && initialData._id) {
    return (
      <EditApplicationModal
        isOpen={isOpen}
        onClose={onClose}
        onSaved={onSaved}
        application={initialData}
      />
    );
  }

  const [submitting, setSubmitting] = useState(false);

  const initialFormState = {
    // JOB
    jobTitle: '',
    companyName: '',
    location: '',
    workMode: 'Remote',
    jobUrl: '',
    source: 'Other',

    // TRACKING
    pipelineStage: initialData?.status || 'Applied',
    dateApplied: getTodayString(),
    nextAction: '',
    nextActionDate: '',

    // OPTIONAL
    salaryRange: '',
    recruiterName: '',
    resumeVersion: '',
    techTags: '',
    notes: ''
  };

  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setFormData({
        jobTitle: '',
        companyName: '',
        location: '',
        workMode: 'Remote',
        jobUrl: '',
        source: 'Other',
        pipelineStage: initialData?.status || 'Applied',
        dateApplied: getTodayString(),
        nextAction: '',
        nextActionDate: '',
        salaryRange: '',
        recruiterName: '',
        resumeVersion: '',
        techTags: '',
        notes: ''
      });
      setErrors({});
      setSubmitting(false);
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.jobTitle.trim()) {
      errs.jobTitle = 'Job title is required';
    }
    if (!formData.companyName.trim()) {
      errs.companyName = 'Company name is required';
    }
    if (!formData.pipelineStage) {
      errs.pipelineStage = 'Pipeline stage is required';
    }
    if (!formData.dateApplied) {
      errs.dateApplied = 'Date applied is required';
    }
    if (formData.jobUrl && !/^https?:\/\//i.test(formData.jobUrl)) {
      errs.jobUrl = 'URL must start with http:// or https://';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      showToast('Please fill in the required fields', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const tagsArray = formData.techTags
        ? formData.techTags.split(',').map((t) => t.trim()).filter(Boolean)
        : [];

      const payload = {
        jobTitle: formData.jobTitle.trim(),
        companyName: formData.companyName.trim(),
        location: formData.location.trim() || 'Remote',
        workMode: formData.workMode,
        jobUrl: formData.jobUrl.trim(),
        source: formData.source,
        pipelineStage: formData.pipelineStage,
        status: formData.pipelineStage,
        dateApplied: formData.dateApplied,
        nextAction: formData.nextAction || 'Wait for response',
        nextActionDate: formData.nextActionDate || '',
        salaryRange: formData.salaryRange.trim(),
        recruiterName: formData.recruiterName.trim(),
        resumeVersion: formData.resumeVersion.trim(),
        techTags: tagsArray,
        tags: tagsArray,
        notes: formData.notes.trim()
      };

      const res = await api.applications.create(payload);

      if (res && res.success) {
        showToast('Application added successfully.');
        if (onSaved) onSaved(res.data);
        onClose();
      } else {
        showToast(res?.message || 'Failed to add application', 'error');
      }
    } catch (err) {
      console.error('Error adding application:', err);
      showToast(err.message || 'Error adding application', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-inverse-surface/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-surface-container-lowest rounded-3xl shadow-2xl border border-outline-variant/30 flex flex-col my-auto max-h-[94vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-surface-container flex items-start justify-between shrink-0 bg-surface-container-lowest">
          <div>
            <h2 className="font-headline text-lg sm:text-xl font-bold text-on-surface">
              Add New Job Application
            </h2>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Quickly save a job you applied for and track it later.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high flex items-center justify-center transition-colors shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* SECTION 1: JOB */}
          <div>
            <div className="flex items-center gap-1.5 mb-2.5">
              <span className="w-1.5 h-3.5 rounded-full bg-primary"></span>
              <h3 className="font-label-sm text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                JOB
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Job Title <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.jobTitle}
                  onChange={(e) => handleChange('jobTitle', e.target.value)}
                  placeholder="e.g. Senior Frontend Engineer"
                  className={`w-full h-9 px-3 rounded-xl bg-surface-container text-xs text-on-surface outline-none border transition-all ${
                    errors.jobTitle ? 'border-error ring-1 ring-error' : 'border-outline-variant/30 focus:border-primary'
                  }`}
                />
                {errors.jobTitle && <p className="text-[10px] text-error mt-1">{errors.jobTitle}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Company Name <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.companyName}
                  onChange={(e) => handleChange('companyName', e.target.value)}
                  placeholder="e.g. Stripe, Linear"
                  className={`w-full h-9 px-3 rounded-xl bg-surface-container text-xs text-on-surface outline-none border transition-all ${
                    errors.companyName ? 'border-error ring-1 ring-error' : 'border-outline-variant/30 focus:border-primary'
                  }`}
                />
                {errors.companyName && <p className="text-[10px] text-error mt-1">{errors.companyName}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                  placeholder="e.g. San Francisco, CA / Worldwide"
                  className="w-full h-9 px-3 rounded-xl bg-surface-container text-xs text-on-surface outline-none border border-outline-variant/30 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Work Mode
                </label>
                <select
                  value={formData.workMode}
                  onChange={(e) => handleChange('workMode', e.target.value)}
                  className="w-full h-9 px-3 rounded-xl bg-surface-container text-xs text-on-surface outline-none border border-outline-variant/30 focus:border-primary cursor-pointer"
                >
                  {WORK_MODES.map((mode) => (
                    <option key={mode} value={mode}>{mode}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Job Posting URL
                </label>
                <input
                  type="url"
                  value={formData.jobUrl}
                  onChange={(e) => handleChange('jobUrl', e.target.value)}
                  placeholder="https://company.com/jobs/123"
                  className={`w-full h-9 px-3 rounded-xl bg-surface-container text-xs text-on-surface outline-none border transition-all ${
                    errors.jobUrl ? 'border-error ring-1 ring-error' : 'border-outline-variant/30 focus:border-primary'
                  }`}
                />
                {errors.jobUrl && <p className="text-[10px] text-error mt-1">{errors.jobUrl}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Source
                </label>
                <select
                  value={formData.source}
                  onChange={(e) => handleChange('source', e.target.value)}
                  className="w-full h-9 px-3 rounded-xl bg-surface-container text-xs text-on-surface outline-none border border-outline-variant/30 focus:border-primary cursor-pointer"
                >
                  {SOURCES.map((src) => (
                    <option key={src} value={src}>{src}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 2: TRACKING */}
          <div className="pt-2 border-t border-surface-container/60">
            <div className="flex items-center gap-1.5 mb-2.5">
              <span className="w-1.5 h-3.5 rounded-full bg-secondary"></span>
              <h3 className="font-label-sm text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                TRACKING
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Pipeline Stage <span className="text-error">*</span>
                </label>
                <select
                  value={formData.pipelineStage}
                  onChange={(e) => handleChange('pipelineStage', e.target.value)}
                  className="w-full h-9 px-3 rounded-xl bg-surface-container text-xs text-on-surface font-semibold outline-none border border-outline-variant/30 focus:border-primary cursor-pointer"
                >
                  {PIPELINE_STAGES.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
                {errors.pipelineStage && <p className="text-[10px] text-error mt-1">{errors.pipelineStage}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Date Applied <span className="text-error">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.dateApplied}
                  onChange={(e) => handleChange('dateApplied', e.target.value)}
                  className="w-full h-9 px-3 rounded-xl bg-surface-container text-xs text-on-surface outline-none border border-outline-variant/30 focus:border-primary"
                />
                {errors.dateApplied && <p className="text-[10px] text-error mt-1">{errors.dateApplied}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Next Action
                </label>
                <select
                  value={formData.nextAction}
                  onChange={(e) => handleChange('nextAction', e.target.value)}
                  className="w-full h-9 px-3 rounded-xl bg-surface-container text-xs text-on-surface outline-none border border-outline-variant/30 focus:border-primary cursor-pointer"
                >
                  <option value="">Select next action...</option>
                  {NEXT_ACTIONS.map((act) => (
                    <option key={act} value={act}>{act}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Next Action Date
                </label>
                <input
                  type="date"
                  value={formData.nextActionDate}
                  onChange={(e) => handleChange('nextActionDate', e.target.value)}
                  className="w-full h-9 px-3 rounded-xl bg-surface-container text-xs text-on-surface outline-none border border-outline-variant/30 focus:border-primary"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: OPTIONAL */}
          <div className="pt-2 border-t border-surface-container/60">
            <div className="flex items-center gap-1.5 mb-2.5">
              <span className="w-1.5 h-3.5 rounded-full bg-outline"></span>
              <h3 className="font-label-sm text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                OPTIONAL
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5 mb-3">
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Salary Range
                </label>
                <input
                  type="text"
                  value={formData.salaryRange}
                  onChange={(e) => handleChange('salaryRange', e.target.value)}
                  placeholder="$600 – $900 / month"
                  className="w-full h-9 px-3 rounded-xl bg-surface-container text-xs text-on-surface outline-none border border-outline-variant/30 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Recruiter Name
                </label>
                <input
                  type="text"
                  value={formData.recruiterName}
                  onChange={(e) => handleChange('recruiterName', e.target.value)}
                  placeholder="e.g. Elena Rostova"
                  className="w-full h-9 px-3 rounded-xl bg-surface-container text-xs text-on-surface outline-none border border-outline-variant/30 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Resume / CV Version
                </label>
                <input
                  type="text"
                  value={formData.resumeVersion}
                  onChange={(e) => handleChange('resumeVersion', e.target.value)}
                  placeholder="Ayni_FullStack_CV_v2"
                  className="w-full h-9 px-3 rounded-xl bg-surface-container text-xs text-on-surface outline-none border border-outline-variant/30 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Tech Tags
                </label>
                <input
                  type="text"
                  value={formData.techTags}
                  onChange={(e) => handleChange('techTags', e.target.value)}
                  placeholder="React, Node.js, MongoDB"
                  className="w-full h-9 px-3 rounded-xl bg-surface-container text-xs text-on-surface outline-none border border-outline-variant/30 focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">
                Notes
              </label>
              <textarea
                rows={2}
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Anything important about this application..."
                className="w-full p-2.5 rounded-xl bg-surface-container text-xs text-on-surface outline-none border border-outline-variant/30 focus:border-primary resize-none"
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-3 border-t border-surface-container flex items-center justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 rounded-xl bg-surface-container text-on-surface text-xs font-semibold hover:bg-surface-container-high transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="h-9 px-5 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary-container disabled:opacity-50 transition-all flex items-center gap-2 shadow-sm cursor-pointer"
            >
              {submitting && (
                <span className="material-symbols-outlined text-[15px] animate-spin">
                  progress_activity
                </span>
              )}
              <span>{submitting ? 'Adding...' : 'Add Application'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
