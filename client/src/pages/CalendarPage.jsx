import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';
import DeleteConfirmModal from '../components/DeleteConfirmModal.jsx';
import EmptyState from '../components/EmptyState.jsx';

export default function CalendarPage() {
  const { showToast } = useToast();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInterview, setEditingInterview] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [formData, setFormData] = useState({
    company: '',
    jobTitle: '',
    interviewType: 'Technical',
    date: new Date().toISOString().split('T')[0],
    startTime: '14:00',
    endTime: '15:00',
    interviewer: '',
    meetingUrl: '',
    notes: ''
  });

  const loadCalendar = async () => {
    try {
      setLoading(true);
      const res = await api.interviews.getCalendar();
      if (res && res.success) {
        setEvents(res.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCalendar();
  }, []);

  const openAddModal = () => {
    setEditingInterview(null);
    setFormData({
      company: '',
      jobTitle: '',
      interviewType: 'Technical',
      date: new Date().toISOString().split('T')[0],
      startTime: '14:00',
      endTime: '15:00',
      interviewer: '',
      meetingUrl: '',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (evt) => {
    setEditingInterview(evt);
    setFormData({
      company: evt.company || '',
      jobTitle: evt.jobTitle || '',
      interviewType: evt.interviewType || 'Technical',
      date: evt.date || new Date().toISOString().split('T')[0],
      startTime: evt.startTime || '14:00',
      endTime: evt.endTime || '15:00',
      interviewer: evt.interviewer || '',
      meetingUrl: evt.meetingUrl || '',
      notes: evt.details || ''
    });
    setIsModalOpen(true);
  };

  const handleSchedule = async (e) => {
    e.preventDefault();
    try {
      if (editingInterview) {
        await api.interviews.update(editingInterview.id, formData);
        showToast('Interview round updated! 📅');
      } else {
        await api.interviews.create(formData);
        showToast('Interview scheduled on calendar! 📅');
      }
      setIsModalOpen(false);
      setEditingInterview(null);
      loadCalendar();
    } catch (err) {
      showToast(err.message || 'Error saving interview', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.interviews.delete(deleteTarget.id);
      showToast('Interview removed from schedule');
      setDeleteTarget(null);
      loadCalendar();
    } catch (err) {
      showToast(err.message || 'Error deleting interview', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-background pb-28 pt-20 px-4 sm:px-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-headline text-2xl sm:text-3xl font-bold tracking-tight text-on-surface">
            Interview Schedule & Deadlines
          </h1>
          <p className="font-body-md text-xs sm:text-sm text-on-surface-variant mt-1">
            Keep track of live technical rounds, offer decision timelines, and recruiter check-ins
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="h-10 px-4 rounded-xl bg-primary text-on-primary font-label-md text-xs font-bold shadow-md hover:bg-primary-container active:scale-98 transition-all flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">calendar_add_on</span>
          Schedule Round
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-on-surface-variant text-sm flex items-center justify-center gap-2">
          <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
          Loading timeline calendar...
        </div>
      ) : events.length === 0 ? (
        <EmptyState
          icon="event"
          title="No upcoming events scheduled"
          description="Plan ahead by scheduling your next interview round or logging an offer decision deadline."
          actionLabel="Schedule Interview"
          onAction={openAddModal}
        />
      ) : (
        <div className="space-y-4">
          {events.map((evt) => (
            <div
              key={evt.id}
              className={`p-5 rounded-2xl bg-surface-container-lowest border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
                evt.type === 'offer_deadline'
                  ? 'border-emerald-500/40 bg-emerald-50/10'
                  : 'border-outline-variant/30 hover:border-primary/40'
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center shrink-0 border ${
                    evt.type === 'offer_deadline'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300'
                      : 'bg-surface-container text-primary border-outline-variant/20'
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase">
                    {new Date(evt.date).toLocaleDateString(undefined, { month: 'short' })}
                  </span>
                  <span className="font-headline text-lg font-bold leading-tight">
                    {new Date(evt.date).getDate()}
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-headline text-base font-bold text-on-surface">
                      {evt.title}
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        evt.type === 'offer_deadline'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-primary-container text-on-primary'
                      }`}
                    >
                      {evt.type === 'offer_deadline' ? 'Decision Due' : 'Live Round'}
                    </span>
                  </div>

                  <p className="text-xs text-on-surface-variant font-medium mt-0.5 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[15px] text-primary">schedule</span>
                    <span>
                      {evt.startTime} - {evt.endTime}
                    </span>
                    {evt.interviewer && <span>· with {evt.interviewer}</span>}
                  </p>

                  {evt.details && (
                    <p className="text-xs text-on-surface-variant mt-1.5 line-clamp-2">
                      {evt.details}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                {evt.meetingUrl && (
                  <a
                    href={evt.meetingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-9 px-4 rounded-xl bg-primary text-on-primary font-label-md text-xs font-bold shadow-sm hover:opacity-95 transition-all flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">videocam</span>
                    Join Video
                  </a>
                )}
                {evt.applicationId && (
                  <a
                    href={`/applications/${evt.applicationId}`}
                    className="h-9 px-3.5 rounded-xl bg-surface-container text-on-surface text-xs font-semibold hover:bg-surface-container-high transition-colors flex items-center gap-1"
                  >
                    <span>Dossier</span>
                    <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                  </a>
                )}

                {/* Edit and Delete for interview events */}
                {evt.type === 'interview' && (
                  <>
                    <button
                      type="button"
                      onClick={() => openEditModal(evt)}
                      aria-label="Edit interview round"
                      className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-container text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors"
                      title="Edit round"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(evt)}
                      aria-label="Delete interview round"
                      className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-container text-on-surface-variant hover:text-error hover:bg-error-container/30 transition-colors"
                      title="Cancel/Delete round"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Schedule / Edit Interview Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-inverse-surface/40 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-surface-container-lowest rounded-2xl p-6 shadow-2xl border border-outline-variant/30 flex flex-col gap-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-headline text-base font-bold text-on-surface">
              {editingInterview ? 'Edit Interview Loop' : 'Schedule Interview Loop'}
            </h3>
            <form onSubmit={handleSchedule} className="space-y-3 text-xs font-medium">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-on-surface-variant mb-1">Company *</label>
                  <input
                    required
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="e.g. Stripe, Linear"
                    className="w-full h-10 px-3 rounded-lg bg-surface-container-low text-on-surface border border-outline-variant/30 focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-on-surface-variant mb-1">Job Title</label>
                  <input
                    value={formData.jobTitle}
                    onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                    placeholder="Senior Frontend Engineer"
                    className="w-full h-10 px-3 rounded-lg bg-surface-container-low text-on-surface border border-outline-variant/30 focus:border-primary outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-on-surface-variant mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg bg-surface-container-low text-on-surface border border-outline-variant/30 focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-on-surface-variant mb-1">Start Time</label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg bg-surface-container-low text-on-surface border border-outline-variant/30 focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-on-surface-variant mb-1">End Time</label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg bg-surface-container-low text-on-surface border border-outline-variant/30 focus:border-primary outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-on-surface-variant mb-1">Interviewer Name</label>
                  <input
                    value={formData.interviewer}
                    onChange={(e) => setFormData({ ...formData, interviewer: e.target.value })}
                    placeholder="Sarah Chen"
                    className="w-full h-10 px-3 rounded-lg bg-surface-container-low text-on-surface border border-outline-variant/30 focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-on-surface-variant mb-1">Interview Type</label>
                  <select
                    value={formData.interviewType}
                    onChange={(e) => setFormData({ ...formData, interviewType: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg bg-surface-container-low text-on-surface border border-outline-variant/30 focus:border-primary outline-none"
                  >
                    <option value="Technical">Technical / System Design</option>
                    <option value="Behavioral">Behavioral / Leadership</option>
                    <option value="Recruiter">Recruiter Screen</option>
                    <option value="Take-home">Take-Home Walkthrough</option>
                    <option value="Final">Offer / Final Round</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-on-surface-variant mb-1">Meeting Video URL</label>
                <input
                  type="url"
                  value={formData.meetingUrl}
                  onChange={(e) => setFormData({ ...formData, meetingUrl: e.target.value })}
                  placeholder="https://meet.google.com/..."
                  className="w-full h-10 px-3 rounded-lg bg-surface-container-low text-on-surface border border-outline-variant/30 focus:border-primary outline-none"
                />
              </div>

              <div>
                <label className="block text-on-surface-variant mb-1">Preparation Notes</label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Focus points, distributed cache questions, past projects..."
                  className="w-full p-3 rounded-lg bg-surface-container-low text-on-surface border border-outline-variant/30 focus:border-primary outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 h-10 rounded-xl bg-surface-container text-on-surface font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 h-10 rounded-xl bg-primary text-on-primary font-bold shadow-sm hover:opacity-95 transition-opacity"
                >
                  {editingInterview ? 'Update Round' : 'Save to Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <DeleteConfirmModal
          isOpen={Boolean(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          title="Cancel Interview Round"
          description={`Are you sure you want to remove the interview with "${deleteTarget.company}" from your schedule? This action cannot be undone.`}
        />
      )}
    </div>
  );
}
