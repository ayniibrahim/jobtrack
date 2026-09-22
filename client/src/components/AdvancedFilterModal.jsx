import React, { useState } from 'react';

export default function AdvancedFilterModal({ isOpen, onClose, filters, onApplyFilters, onResetFilters }) {
  if (!isOpen) return null;

  const [localStage, setLocalStage] = useState(filters.status || 'all');
  const [localMinComp, setLocalMinComp] = useState(filters.minSalary || 120);
  const [localRemoteOnly, setLocalRemoteOnly] = useState(filters.remoteOnly || false);

  const stages = [
    { id: 'all', label: 'All Stages' },
    { id: 'Applied', label: 'Applied' },
    { id: 'Screening', label: 'Screening' },
    { id: 'Interview', label: 'Technical' },
    { id: 'Offer', label: 'Offer' }
  ];

  const handleApply = () => {
    onApplyFilters({
      status: localStage,
      minSalary: localMinComp,
      remoteOnly: localRemoteOnly
    });
    onClose();
  };

  const handleReset = () => {
    setLocalStage('all');
    setLocalMinComp(120);
    setLocalRemoteOnly(false);
    onResetFilters();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-inverse-surface/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-t-3xl sm:rounded-2xl bg-surface-container-lowest p-6 shadow-2xl border border-outline-variant/30 flex flex-col gap-4 animate-in slide-in-from-bottom sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-1.5 rounded-full bg-outline-variant mx-auto mb-1 sm:hidden"></div>

        <div className="flex items-center justify-between pb-2 border-b border-surface-container">
          <h2 className="font-headline text-lg font-bold text-on-surface">Filter Applications</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="flex flex-col gap-4 py-1">
          {/* Stage Filter */}
          <div>
            <label className="font-label-sm text-xs text-on-surface-variant uppercase tracking-wider block mb-2 font-bold">
              Stage
            </label>
            <div className="flex flex-wrap gap-2">
              {stages.map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setLocalStage(st.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    localStage === st.id
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Min Compensation Slider */}
          <div>
            <label className="font-label-sm text-xs text-on-surface-variant uppercase tracking-wider block mb-1 font-bold">
              Minimum Compensation
            </label>
            <div className="flex items-center justify-between text-xs text-on-surface mb-1 font-semibold">
              <span>$120,000</span>
              <span className="text-primary font-bold text-sm">${localMinComp},000+</span>
              <span>$250,000+</span>
            </div>
            <input
              type="range"
              min="100"
              max="250"
              step="5"
              value={localMinComp}
              onChange={(e) => setLocalMinComp(Number(e.target.value))}
              className="w-full accent-primary cursor-pointer h-2 bg-surface-container rounded-lg"
            />
          </div>

          {/* Remote Only Toggle */}
          <div className="flex items-center justify-between pt-2 border-t border-surface-container">
            <span className="text-sm font-medium text-on-surface">Remote positions only</span>
            <input
              type="checkbox"
              checked={localRemoteOnly}
              onChange={(e) => setLocalRemoteOnly(e.target.checked)}
              className="w-5 h-5 rounded accent-primary cursor-pointer"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleReset}
            className="flex-1 h-11 rounded-xl bg-surface-container text-on-surface font-label-md text-xs font-semibold hover:bg-surface-container-high transition-colors"
          >
            Reset All
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="flex-1 h-11 rounded-xl bg-primary text-on-primary font-label-md text-xs font-bold shadow-md hover:bg-primary-container transition-colors"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}
