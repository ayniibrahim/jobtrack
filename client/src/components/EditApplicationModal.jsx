import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';

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

const PRIORITY_OPTIONS = [
  { value: 'High Priority (Urgent)', label: 'High Priority (Urgent)', badge: 'bg-error-container text-error' },
  { value: 'Medium Priority (Standard)', label: 'Medium Priority (Standard)', badge: 'bg-surface-container text-on-surface' },
  { value: 'Low Priority (Casual)', label: 'Low Priority (Casual)', badge: 'bg-surface-container text-on-surface-variant' }
];

const WORK_MODES = ['Remote', 'Hybrid', 'On-site'];
const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance'];
const SOURCES = ['LinkedIn', 'Company Website', 'Indeed', 'Glassdoor', 'Referral', 'Recruiter', 'Job Board', 'Other'];
const CURRENCIES = ['USD', 'EUR', 'GBP', 'Other'];
const SALARY_TYPES = ['Annual', 'Monthly', 'Hourly'];
const INTERVIEW_TYPES = ['Phone', 'Video', 'Technical', 'HR', 'Panel', 'On-site', 'Other'];

const NEXT_ACTION_PRESETS = [
  'Follow up',
  'Prepare for interview',
  'Complete assessment',
  'Send CV',
  'Send portfolio',
  'Wait for response',
  'Other'
];

export default function EditApplicationModal({ isOpen, onClose, onSaved, application }) {
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [availableDocs, setAvailableDocs] = useState([]);
  const [activeTab, setActiveTab] = useState('job'); // 'job' | 'comp' | 'dates' | 'recruiter' | 'interview' | 'prep'

  // Form State
  const [formData, setFormData] = useState({
    jobTitle: '',
    companyName: '',
    location: '',
    workMode: 'Remote',
    employmentType: 'Full-time',
    jobUrl: '',
    source: 'Other',
    jobDescription: '',
    pipelineStage: 'Applied',
    priority: 'Medium Priority (Standard)',
    minSalary: '',
    maxSalary: '',
    salaryRange: '',
    salaryCurrency: 'USD',
    salaryType: 'Annual',
    dateSaved: '',
    dateApplied: '',
    applicationDeadline: '',
    lastFollowUpDate: '',
    nextAction: '',
    nextActionDate: '',
    recruiterName: '',
    recruiterEmail: '',
    recruiterPhone: '',
    recruiterLinkedIn: '',
    contactNotes: '',
    resumeVersion: '',
    interviewDate: '',
    interviewType: 'Technical',
    meetingLink: '',
    interviewNotes: '',
    interviewQuestions: '',
    techTags: '',
    whyThisRole: '',
    keySkills: '',
    notes: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      api.documents.getAll()
        .then((res) => {
          if (res && res.success) setAvailableDocs(res.data || []);
        })
        .catch(() => {});
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && application) {
      const tagsString = Array.isArray(application.techTags)
        ? application.techTags.join(', ')
        : (Array.isArray(application.tags) ? application.tags.join(', ') : '');

      setFormData({
        jobTitle: application.jobTitle || '',
        companyName: application.companyName || '',
        location: application.location || '',
        workMode: application.workMode || 'Remote',
        employmentType: application.employmentType || 'Full-time',
        jobUrl: application.jobUrl || '',
        source: application.source || 'Other',
        jobDescription: application.jobDescription || '',
        pipelineStage: application.pipelineStage || application.status || 'Applied',
        priority: application.priority || 'Medium Priority (Standard)',
        minSalary: application.minSalary || application.salaryMin || '',
        maxSalary: application.maxSalary || application.salaryMax || '',
        salaryRange: application.salaryRange || '',
        salaryCurrency: application.salaryCurrency || 'USD',
        salaryType: application.salaryType || 'Annual',
        dateSaved: application.dateSaved || '',
        dateApplied: application.dateApplied || '',
        applicationDeadline: application.applicationDeadline || application.deadline || '',
        lastFollowUpDate: application.lastFollowUpDate || '',
        nextAction: application.nextAction || '',
        nextActionDate: application.nextActionDate || '',
        recruiterName: application.recruiterName || '',
        recruiterEmail: application.recruiterEmail || '',
        recruiterPhone: application.recruiterPhone || '',
        recruiterLinkedIn: application.recruiterLinkedIn || '',
        contactNotes: application.contactNotes || '',
        resumeVersion: application.resumeVersion || '',
        interviewDate: application.interviewDate || '',
        interviewType: application.interviewType || 'Technical',
        meetingLink: application.meetingLink || '',
        interviewNotes: application.interviewNotes || '',
        interviewQuestions: application.interviewQuestions || '',
        techTags: tagsString,
        whyThisRole: application.whyThisRole || '',
        keySkills: application.keySkills || '',
        notes: application.notes || ''
      });
      setIsDirty(false);
      setErrors({});
      setShowDiscardConfirm(false);
      setActiveTab('job');
    }
  }, [isOpen, application]);

  if (!isOpen || !application) return null;

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
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
    if (!formData.jobTitle.trim()) errs.jobTitle = 'Job title is required';
    if (!formData.companyName.trim()) errs.companyName = 'Company name is required';

    const minSal = formData.minSalary !== '' ? Number(formData.minSalary) : null;
    const maxSal = formData.maxSalary !== '' ? Number(formData.maxSalary) : null;
    if (minSal !== null && maxSal !== null && minSal > maxSal) {
      errs.salary = 'Minimum salary cannot exceed maximum salary.';
    }

    if (formData.jobUrl && !/^https?:\/\//i.test(formData.jobUrl)) {
      errs.jobUrl = 'URL must start with http:// or https://';
    }
    if (formData.meetingLink && !/^https?:\/\//i.test(formData.meetingLink)) {
      errs.meetingLink = 'URL must start with http:// or https://';
    }
    if (formData.recruiterEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.recruiterEmail)) {
      errs.recruiterEmail = 'Invalid email address format';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCloseAttempt = () => {
    if (isDirty) {
      setShowDiscardConfirm(true);
    } else {
      onClose();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      showToast('Please fix the highlighted errors', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        jobTitle: formData.jobTitle.trim(),
        companyName: formData.companyName.trim(),
        location: formData.location.trim(),
        workMode: formData.workMode,
        employmentType: formData.employmentType,
        jobUrl: formData.jobUrl.trim(),
        source: formData.source,
        jobDescription: formData.jobDescription.trim(),
        pipelineStage: formData.pipelineStage,
        status: formData.pipelineStage,
        priority: formData.priority,
        minSalary: formData.minSalary !== '' ? Number(formData.minSalary) : 0,
        maxSalary: formData.maxSalary !== '' ? Number(formData.maxSalary) : 0,
        salaryMin: formData.minSalary !== '' ? Number(formData.minSalary) : 0,
        salaryMax: formData.maxSalary !== '' ? Number(formData.maxSalary) : 0,
        salaryRange: formData.salaryRange.trim(),
        salaryCurrency: formData.salaryCurrency,
        salaryType: formData.salaryType,
        dateSaved: formData.dateSaved,
        dateApplied: formData.dateApplied,
        applicationDeadline: formData.applicationDeadline,
        deadline: formData.applicationDeadline,
        lastFollowUpDate: formData.lastFollowUpDate,
        nextAction: formData.nextAction.trim(),
        nextActionDate: formData.nextActionDate,
        recruiterName: formData.recruiterName.trim(),
        recruiterEmail: formData.recruiterEmail.trim(),
        recruiterPhone: formData.recruiterPhone.trim(),
        recruiterLinkedIn: formData.recruiterLinkedIn.trim(),
        contactNotes: formData.contactNotes.trim(),
        resumeVersion: formData.resumeVersion.trim(),
        interviewDate: formData.interviewDate,
        interviewType: formData.interviewType,
        meetingLink: formData.meetingLink.trim(),
        interviewNotes: formData.interviewNotes.trim(),
        interviewQuestions: formData.interviewQuestions.trim(),
        techTags: formData.techTags.split(',').map((t) => t.trim()).filter(Boolean),
        whyThisRole: formData.whyThisRole.trim(),
        keySkills: formData.keySkills.trim(),
        notes: formData.notes.trim()
      };

      const res = await api.applications.update(application._id, payload);
      if (res && res.success) {
        showToast('Application updated successfully.');
        setIsDirty(false);
        if (onSaved) onSaved(res.data);
        onClose();
      } else {
        showToast(res?.message || 'Failed to update application', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Error updating application', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const tabs = [
    { id: 'job', label: 'Basic & Role', icon: 'work' },
    { id: 'tracking', label: 'Status & Dates', icon: 'schedule' },
    { id: 'comp', label: 'Compensation', icon: 'payments' },
    { id: 'recruiter', label: 'Recruiter Contact', icon: 'badge' },
    { id: 'interview', label: 'Interview & Prep', icon: 'video_call' },
    { id: 'skills', label: 'Skills & Fit', icon: 'psychology' },
    { id: 'notes', label: 'Notes', icon: 'notes' }
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-inverse-surface/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      onClick={handleCloseAttempt}
    >
      <div
        className="w-full max-w-4xl bg-surface-container-lowest rounded-3xl shadow-2xl border border-outline-variant/30 flex flex-col my-auto max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Discard confirmation overlay */}
        {showDiscardConfirm && (
          <div className="absolute inset-0 z-50 bg-inverse-surface/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-surface-container-lowest p-6 rounded-2xl max-w-md w-full shadow-2xl border border-outline-variant/40 animate-in zoom-in-95 duration-150">
              <div className="w-12 h-12 rounded-xl bg-error-container text-error flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-2xl">warning</span>
              </div>
              <h3 className="font-headline text-lg font-bold text-on-surface">Discard changes?</h3>
              <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">
                You have unsaved edits. Are you sure you want to discard your changes?
              </p>
              <div className="flex items-center justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setShowDiscardConfirm(false)}
                  className="px-4 py-2 rounded-xl bg-surface-container text-on-surface font-semibold text-xs hover:bg-surface-container-high transition-colors"
                >
                  Keep Editing
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDiscardConfirm(false);
                    setIsDirty(false);
                    onClose();
                  }}
                  className="px-4 py-2 rounded-xl bg-error text-on-error font-semibold text-xs hover:opacity-90 transition-opacity"
                >
                  Discard
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-surface-container flex items-center justify-between shrink-0 bg-surface-container-lowest">
          <div>
            <span className="font-label-sm text-[11px] uppercase tracking-wider text-primary font-bold">
              Edit Opportunity
            </span>
            <h2 className="font-headline text-xl font-bold text-on-surface flex items-center gap-2">
              Edit Application
            </h2>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Manage complete role details, compensation breakdown, recruiter contacts, and interview preparation.
            </p>
          </div>
          <button
            onClick={handleCloseAttempt}
            className="w-9 h-9 rounded-full bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 border-b border-surface-container bg-surface-container-low/40 flex items-center gap-1 overflow-x-auto no-scrollbar shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`h-11 px-3.5 flex items-center gap-2 font-label-md text-xs font-semibold border-b-2 transition-all shrink-0 ${
                activeTab === tab.id
                  ? 'border-primary text-primary font-bold'
                  : 'border-transparent text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[17px]">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* TAB: Basic & Role */}
          {activeTab === 'job' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    Job Title <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.jobTitle}
                    onChange={(e) => handleChange('jobTitle', e.target.value)}
                    className={`w-full h-10 px-3 rounded-xl bg-surface-container text-xs text-on-surface outline-none border transition-all ${
                      errors.jobTitle ? 'border-error ring-1 ring-error' : 'border-outline-variant/30 focus:border-primary'
                    }`}
                  />
                  {errors.jobTitle && <p className="text-[11px] text-error mt-1">{errors.jobTitle}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    Company Name <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => handleChange('companyName', e.target.value)}
                    className={`w-full h-10 px-3 rounded-xl bg-surface-container text-xs text-on-surface outline-none border transition-all ${
                      errors.companyName ? 'border-error ring-1 ring-error' : 'border-outline-variant/30 focus:border-primary'
                    }`}
                  />
                  {errors.companyName && <p className="text-[11px] text-error mt-1">{errors.companyName}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleChange('location', e.target.value)}
                    placeholder="e.g. San Francisco, CA / Remote"
                    className="w-full h-10 px-3 rounded-xl bg-surface-container text-xs text-on-surface outline-none border border-outline-variant/30 focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">Work Mode</label>
                  <select
                    value={formData.workMode}
                    onChange={(e) => handleChange('workMode', e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-surface-container text-xs text-on-surface outline-none border border-outline-variant/30 focus:border-primary cursor-pointer"
                  >
                    {WORK_MODES.map((mode) => (
                      <option key={mode} value={mode}>{mode}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">Employment Type</label>
                  <select
                    value={formData.employmentType}
                    onChange={(e) => handleChange('employmentType', e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-surface-container text-xs text-on-surface outline-none border border-outline-variant/30 focus:border-primary cursor-pointer"
                  >
                    {EMPLOYMENT_TYPES.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">Source</label>
                  <select
                    value={formData.source}
                    onChange={(e) => handleChange('source', e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-surface-container text-xs text-on-surface outline-none border border-outline-variant/30 focus:border-primary cursor-pointer"
                  >
                    {SOURCES.map((src) => (
                      <option key={src} value={src}>{src}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">Job Posting URL</label>
                <input
                  type="url"
                  value={formData.jobUrl}
                  onChange={(e) => handleChange('jobUrl', e.target.value)}
                  placeholder="https://jobs.example.com/role"
                  className={`w-full h-10 px-3 rounded-xl bg-surface-container text-xs text-on-surface outline-none border transition-all ${
                    errors.jobUrl ? 'border-error ring-1 ring-error' : 'border-outline-variant/30 focus:border-primary'
                  }`}
                />
                {errors.jobUrl && <p className="text-[11px] text-error mt-1">{errors.jobUrl}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">Job Description</label>
                <textarea
                  rows={4}
                  value={formData.jobDescription}
                  onChange={(e) => handleChange('jobDescription', e.target.value)}
                  placeholder="Key responsibilities, team overview, and requirements..."
                  className="w-full p-3 rounded-xl bg-surface-container text-xs text-on-surface outline-none border border-outline-variant/30 focus:border-primary"
                />
              </div>
            </div>
          )}

          {/* TAB: Status & Dates */}
          {activeTab === 'tracking' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">Pipeline Stage</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {PIPELINE_STAGES.map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleChange('pipelineStage', st)}
                      className={`h-9 px-3 rounded-xl text-xs font-bold transition-all border ${
                        formData.pipelineStage === st
                          ? 'bg-primary text-on-primary border-primary shadow-sm'
                          : 'bg-surface-container text-on-surface-variant border-transparent hover:bg-surface-container-high'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => handleChange('priority', e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-surface-container text-xs text-on-surface outline-none border border-outline-variant/30 focus:border-primary cursor-pointer"
                >
                  {PRIORITY_OPTIONS.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">Date Applied</label>
                  <input
                    type="date"
                    value={formData.dateApplied}
                    onChange={(e) => handleChange('dateApplied', e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-surface-container text-xs text-on-surface outline-none border border-outline-variant/30 focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">Application Deadline</label>
                  <input
                    type="date"
                    value={formData.applicationDeadline}
                    onChange={(e) => handleChange('applicationDeadline', e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-surface-container text-xs text-on-surface outline-none border border-outline-variant/30 focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">Last Follow-up Date</label>
                  <input
                    type="date"
                    value={formData.lastFollowUpDate}
                    onChange={(e) => handleChange('lastFollowUpDate', e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-surface-container text-xs text-on-surface outline-none border border-outline-variant/30 focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">Next Action Date</label>
                  <input
                    type="date"
                    value={formData.nextActionDate}
                    onChange={(e) => handleChange('nextActionDate', e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-surface-container text-xs text-on-surface outline-none border border-outline-variant/30 focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">Next Action</label>
                <select
                  value={formData.nextAction}
                  onChange={(e) => handleChange('nextAction', e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-surface-container text-xs text-on-surface outline-none border border-outline-variant/30 focus:border-primary cursor-pointer mb-2"
                >
                  <option value="">Select next action...</option>
                  {NEXT_ACTION_PRESETS.map((act) => (
                    <option key={act} value={act}>{act}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={formData.nextAction}
                  onChange={(e) => handleChange('nextAction', e.target.value)}
                  placeholder="Or custom action..."
                  className="w-full h-9 px-3 rounded-xl bg-surface-container text-xs text-on-surface outline-none border border-outline-variant/30 focus:border-primary"
                />
              </div>
            </div>
          )}

          {/* TAB: Compensation */}
          {activeTab === 'comp' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">Salary Range Summary</label>
                <input
                  type="text"
                  value={formData.salaryRange}
                  onChange={(e) => handleChange('salaryRange', e.target.value)}
                  placeholder="e.g. $600 – $900 / month or $160,000 – $190,000"
                  className="w-full h-10 px-3 rounded-xl bg-surface-container text-xs text-on-surface outline-none border border-outline-variant/30 focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">Minimum Salary</label>
                  <input
                    type="number"
                    value={formData.minSalary}
                    onChange={(e) => handleChange('minSalary', e.target.value)}
                    placeholder="e.g. 150000"
                    className="w-full h-10 px-3 rounded-xl bg-surface-container text-xs text-on-surface outline-none border border-outline-variant/30 focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">Maximum Salary</label>
                  <input
                    type="number"
                    value={formData.maxSalary}
                    onChange={(e) => handleChange('maxSalary', e.target.value)}
                    placeholder="e.g. 185000"
                    className="w-full h-10 px-3 rounded-xl bg-surface-container text-xs text-on-surface outline-none border border-outline-variant/30 focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">Currency</label>
                  <select
                    value={formData.salaryCurrency}
                    onChange={(e) => handleChange('salaryCurrency', e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-surface-container text-xs text-on-surface outline-none border border-outline-variant/30 focus:border-primary cursor-pointer"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">Salary Frequency</label>
                  <select
                    value={formData.salaryType}
                    onChange={(e) => handleChange('salaryType', e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-surface-container text-xs text-on-surface outline-none border border-outline-variant/30 focus:border-primary cursor-pointer"
                  >
                    {SALARY_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>
              {errors.salary && <p className="text-[11px] text-error font-medium">{errors.salary}</p>}
            </div>
          )}

          {/* TAB: Recruiter Contact */}
          {activeTab === 'recruiter' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">Recruiter Name</label>
                  <input
                    type="text"
                    value={formData.recruiterName}
                    onChange={(e) => handleChange('recruiterName', e.target.value)}
                    placeholder="e.g. Elena Rostova"
                    className="w-full h-10 px-3 rounded-xl bg-surface-container text-xs text-on-surface outline-none border border-outline-variant/30 focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">Recruiter Email</label>
                  <input
                    type="email"
                    value={formData.recruiterEmail}
                    onChange={(e) => handleChange('recruiterEmail', e.target.value)}
                    placeholder="recruiter@company.com"
                    className={`w-full h-10 px-3 rounded-xl bg-surface-container text-xs text-on-surface outline-none border transition-all ${
                      errors.recruiterEmail ? 'border-error ring-1 ring-error' : 'border-outline-variant/30 focus:border-primary'
                    }`}
                  />
                  {errors.recruiterEmail && <p className="text-[11px] text-error mt-1">{errors.recruiterEmail}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">Recruiter Phone</label>
                  <input
                    type="tel"
                    value={formData.recruiterPhone}
                    onChange={(e) => handleChange('recruiterPhone', e.target.value)}
                    placeholder="+1 555-0199"
                    className="w-full h-10 px-3 rounded-xl bg-surface-container text-xs text-on-surface outline-none border border-outline-variant/30 focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">LinkedIn Profile</label>
                  <input
                    type="url"
                    value={formData.recruiterLinkedIn}
                    onChange={(e) => handleChange('recruiterLinkedIn', e.target.value)}
                    placeholder="https://linkedin.com/in/recruiter"
                    className="w-full h-10 px-3 rounded-xl bg-surface-container text-xs text-on-surface outline-none border border-outline-variant/30 focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">Contact Notes</label>
                <textarea
                  rows={3}
                  value={formData.contactNotes}
                  onChange={(e) => handleChange('contactNotes', e.target.value)}
                  placeholder="Recruiter communication history, connection source, response times..."
                  className="w-full p-3 rounded-xl bg-surface-container text-xs text-on-surface outline-none border border-outline-variant/30 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">Resume / CV Version</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.resumeVersion}
                    onChange={(e) => handleChange('resumeVersion', e.target.value)}
                    placeholder="e.g. Ayni_FullStack_CV_v2"
                    className="flex-1 h-10 px-3 rounded-xl bg-surface-container text-xs text-on-surface outline-none border border-outline-variant/30 focus:border-primary"
                  />
                  {availableDocs.length > 0 && (
                    <select
                      onChange={(e) => handleChange('resumeVersion', e.target.value)}
                      className="h-10 px-3 rounded-xl bg-surface-container text-xs text-on-surface outline-none border border-outline-variant/30 focus:border-primary cursor-pointer"
                    >
                      <option value="">Link from Vault...</option>
                      {availableDocs.map((doc) => (
                        <option key={doc._id} value={doc.name}>{doc.name}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB: Interview & Prep */}
          {activeTab === 'interview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">Interview Date & Time</label>
                  <input
                    type="datetime-local"
                    value={formData.interviewDate}
                    onChange={(e) => handleChange('interviewDate', e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-surface-container text-xs text-on-surface outline-none border border-outline-variant/30 focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">Interview Type</label>
                  <select
                    value={formData.interviewType}
                    onChange={(e) => handleChange('interviewType', e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-surface-container text-xs text-on-surface outline-none border border-outline-variant/30 focus:border-primary cursor-pointer"
                  >
                    {INTERVIEW_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">Meeting Link</label>
                <input
                  type="url"
                  value={formData.meetingLink}
                  onChange={(e) => handleChange('meetingLink', e.target.value)}
                  placeholder="https://meet.google.com/xyz or https://zoom.us/j/..."
                  className={`w-full h-10 px-3 rounded-xl bg-surface-container text-xs text-on-surface outline-none border transition-all ${
                    errors.meetingLink ? 'border-error ring-1 ring-error' : 'border-outline-variant/30 focus:border-primary'
                  }`}
                />
                {errors.meetingLink && <p className="text-[11px] text-error mt-1">{errors.meetingLink}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">Interview & Preparation Notes</label>
                <textarea
                  rows={3}
                  value={formData.interviewNotes}
                  onChange={(e) => handleChange('interviewNotes', e.target.value)}
                  placeholder="Round agenda, interviewer profiles, system design prep, talking points..."
                  className="w-full p-3 rounded-xl bg-surface-container text-xs text-on-surface outline-none border border-outline-variant/30 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">Anticipated Questions / Topics</label>
                <textarea
                  rows={3}
                  value={formData.interviewQuestions}
                  onChange={(e) => handleChange('interviewQuestions', e.target.value)}
                  placeholder="Likely questions, architecture scenarios, behavioral prompts..."
                  className="w-full p-3 rounded-xl bg-surface-container text-xs text-on-surface outline-none border border-outline-variant/30 focus:border-primary"
                />
              </div>
            </div>
          )}

          {/* TAB: Skills & Fit */}
          {activeTab === 'skills' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">Tech Tags (comma-separated)</label>
                <input
                  type="text"
                  value={formData.techTags}
                  onChange={(e) => handleChange('techTags', e.target.value)}
                  placeholder="React, TypeScript, Node.js, GraphQL, AWS"
                  className="w-full h-10 px-3 rounded-xl bg-surface-container text-xs text-on-surface outline-none border border-outline-variant/30 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">Why This Role?</label>
                <textarea
                  rows={3}
                  value={formData.whyThisRole}
                  onChange={(e) => handleChange('whyThisRole', e.target.value)}
                  placeholder="Personal motivation, team mission alignment, product excitement..."
                  className="w-full p-3 rounded-xl bg-surface-container text-xs text-on-surface outline-none border border-outline-variant/30 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">Key Skills & Requirements</label>
                <textarea
                  rows={3}
                  value={formData.keySkills}
                  onChange={(e) => handleChange('keySkills', e.target.value)}
                  placeholder="Must-have competencies, distributed systems experience, leadership expectations..."
                  className="w-full p-3 rounded-xl bg-surface-container text-xs text-on-surface outline-none border border-outline-variant/30 focus:border-primary"
                />
              </div>
            </div>
          )}

          {/* TAB: Notes */}
          {activeTab === 'notes' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">Dossier Notes</label>
                <textarea
                  rows={6}
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  placeholder="Anything important about this application, referrals, culture impressions, follow-ups..."
                  className="w-full p-3 rounded-xl bg-surface-container text-xs text-on-surface outline-none border border-outline-variant/30 focus:border-primary"
                />
              </div>
            </div>
          )}

          {/* Modal Footer */}
          <div className="pt-4 border-t border-surface-container flex items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={handleCloseAttempt}
              className="px-4 py-2.5 rounded-xl bg-surface-container text-on-surface text-xs font-bold hover:bg-surface-container-high transition-colors"
            >
              Cancel
            </button>
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary-container disabled:opacity-50 transition-all flex items-center gap-2 shadow-md cursor-pointer"
              >
                {submitting && (
                  <span className="material-symbols-outlined text-[16px] animate-spin">
                    progress_activity
                  </span>
                )}
                <span>{submitting ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
