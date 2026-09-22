import React, { useState } from 'react';
import { api } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';

export default function QuickMoveSheet({ isOpen, onClose, application, onMoved }) {
  const { showToast } = useToast();
  const [selectedStage, setSelectedStage] = useState('Interview');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !application) return null;

  const stages = [
    { id: 'Wishlist', label: 'Wishlist', desc: 'Bookmarked / researching', color: 'bg-outline-variant' },
    { id: 'Applied', label: 'Applied', desc: 'Resume submitted', color: 'bg-outline' },
    { id: 'Screening', label: 'Screening', desc: 'Recruiter chat / review', color: 'bg-primary-container' },
    { id: 'Interview', label: 'Interview', desc: 'Active technical rounds', color: 'bg-secondary-container' },
    { id: 'Offer', label: 'Offer Extended', desc: 'Compensation pending', color: 'bg-tertiary-fixed-dim' },
    { id: 'Rejected', label: 'Rejected', desc: 'Declined / Passed', color: 'bg-error' },
    { id: 'Withdrawn', label: 'Withdrawn', desc: 'Candidate withdrew', color: 'bg-outline-variant' },
    { id: 'Archived', label: 'Archived', desc: 'Closed position', color: 'bg-surface-container-high' }
  ];

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const res = await api.applications.updateStatus(application._id, {
        status: selectedStage,
        note: note.trim()
      });
      showToast(`Shifted to ${selectedStage} successfully 🎉`);
      if (onMoved) onMoved(res.data);
      onClose();
      setNote('');
    } catch (err) {
      showToast(err.message || 'Error updating status', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-inverse-surface/40 backdrop-blur-sm flex items-end justify-center transition-opacity"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-surface-container-lowest rounded-t-3xl p-6 shadow-2xl border border-outline-variant/30 flex flex-col gap-4 animate-in slide-in-from-bottom duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sheet Handle */}
        <div className="w-12 h-1.5 rounded-full bg-surface-container mx-auto"></div>

        {/* Header Info */}
        <div className="flex items-start justify-between">
          <div className="flex flex-col">
            <span className="font-label-sm text-[11px] uppercase tracking-wider text-on-surface-variant font-bold">
              Quick Transition
            </span>
            <span className="font-headline text-lg font-bold text-on-surface">
              {application.jobTitle}
            </span>
            <span className="font-body-sm text-xs text-on-surface-variant">
              {application.companyName} · Currently in{' '}
              <span className="font-semibold text-primary">{application.status}</span>
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface-variant hover:bg-surface-container"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Stage Selector Target Grid */}
        <div className="flex flex-col gap-2 pt-1">
          <span className="font-label-sm text-xs text-on-surface-variant font-semibold">
            Select Destination Stage:
          </span>
          <div className="grid grid-cols-2 gap-2">
            {stages.map((stage) => {
              const isSelected = selectedStage === stage.id;
              return (
                <button
                  key={stage.id}
                  type="button"
                  onClick={() => setSelectedStage(stage.id)}
                  className={`p-3 rounded-xl text-left flex items-center gap-2.5 transition-all border ${
                    isSelected
                      ? 'bg-surface-container border-primary ring-1 ring-primary shadow-sm'
                      : 'bg-surface-container-low border-transparent hover:bg-surface-container'
                  }`}
                >
                  <span className={`w-3 h-3 rounded-full shrink-0 ${stage.color}`}></span>
                  <div className="flex flex-col min-w-0">
                    <span className="font-label-md text-xs font-bold text-on-surface truncate">
                      {stage.label}
                    </span>
                    <span className="text-[10px] text-on-surface-variant truncate">
                      {stage.desc}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Note Field */}
        <div className="flex flex-col gap-1.5 pt-1">
          <label className="font-label-sm text-xs text-on-surface-variant font-medium" htmlFor="moveNote">
            Update Note (Optional):
          </label>
          <input
            id="moveNote"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Cleared round 2, scheduled final interview loop"
            className="h-10 px-3.5 rounded-lg bg-surface-container-low text-on-surface text-xs outline-none border border-outline-variant/30 focus:border-primary focus:bg-surface-container-lowest transition-colors"
          />
        </div>

        {/* CTA Row */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-11 rounded-xl bg-surface-container text-on-surface font-label-md text-xs font-semibold hover:bg-surface-container-high transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleConfirm}
            className="flex-1 h-11 rounded-xl bg-primary-container text-on-primary font-label-md text-xs font-bold shadow-md active:scale-98 transition-all flex items-center justify-center gap-1.5"
          >
            {loading ? (
              <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
            ) : (
              <span className="material-symbols-outlined text-[16px]">check</span>
            )}
            Save Stage Move
          </button>
        </div>
      </div>
    </div>
  );
}
