import React from 'react';

export default function EmptyState({
  icon = 'inbox',
  title = 'No items found',
  description = 'Get started by adding your first record to track.',
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction
}) {
  return (
    <div className="w-full py-12 px-4 flex flex-col items-center justify-center text-center rounded-2xl bg-surface-container-lowest border border-dashed border-outline-variant/40 my-4">
      <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant mb-3 shadow-inner">
        <span className="material-symbols-outlined text-[28px] text-primary">{icon}</span>
      </div>
      <h3 className="font-headline text-base font-bold text-on-surface mb-1">{title}</h3>
      <p className="font-body-sm text-xs text-on-surface-variant max-w-sm mb-5 leading-relaxed">
        {description}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2.5">
        {actionLabel && onAction && (
          <button
            type="button"
            onClick={onAction}
            className="px-4 h-9 rounded-xl bg-primary text-on-primary font-label-md text-xs font-bold shadow-sm hover:opacity-95 active:scale-98 transition-all flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            {actionLabel}
          </button>
        )}
        {secondaryActionLabel && onSecondaryAction && (
          <button
            type="button"
            onClick={onSecondaryAction}
            className="px-4 h-9 rounded-xl bg-surface-container text-on-surface font-label-md text-xs font-semibold hover:bg-surface-container-high transition-colors"
          >
            {secondaryActionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
