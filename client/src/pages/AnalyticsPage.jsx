import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        setLoading(true);
        const res = await api.analytics.getMetrics();
        if (res && res.success) {
          setData(res.data);
        }
      } catch (err) {
        console.error('Analytics load error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-on-background pb-28 pt-24 px-4 flex flex-col items-center justify-center gap-3">
        <span className="material-symbols-outlined text-4xl text-primary animate-spin">
          progress_activity
        </span>
        <span className="text-sm text-on-surface-variant font-medium">Computing pipeline analytics...</span>
      </div>
    );
  }

  const {
    totalApplications = 0,
    totalInterviews = 0,
    responseRate = 0,
    interviewRate = 0,
    offerRate = 0,
    rejectionRate = 0,
    applicationsByStatus = [],
    applicationsOverTime = [],
    applicationsBySource = [],
    salaryDistribution = []
  } = data || {};

  return (
    <div className="min-h-screen bg-background text-on-background pb-28 pt-20 px-4 sm:px-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="font-headline text-2xl sm:text-3xl font-bold tracking-tight text-on-surface">
          Career Analytics & Conversion Funnel
        </h1>
        <p className="font-body-md text-xs sm:text-sm text-on-surface-variant mt-1">
          Real-time metrics computed directly from your active job hunt database
        </p>
      </div>

      {/* 1. Core Conversion Rates Bento */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm">
          <span className="font-label-sm text-xs font-bold uppercase tracking-wider text-on-surface-variant block mb-1">
            Response Rate
          </span>
          <div className="font-headline text-3xl font-bold text-primary">
            {responseRate}%
          </div>
          <span className="text-xs text-on-surface-variant mt-1 block">
            Passed initial resume screen
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm">
          <span className="font-label-sm text-xs font-bold uppercase tracking-wider text-on-surface-variant block mb-1">
            Interview Rate
          </span>
          <div className="font-headline text-3xl font-bold text-amber-600 dark:text-amber-400">
            {interviewRate}%
          </div>
          <span className="text-xs text-on-surface-variant mt-1 block">
            {totalInterviews} loops scheduled
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm">
          <span className="font-label-sm text-xs font-bold uppercase tracking-wider text-on-surface-variant block mb-1">
            Offer Rate
          </span>
          <div className="font-headline text-3xl font-bold text-emerald-600 dark:text-emerald-400">
            {offerRate}%
          </div>
          <span className="text-xs text-on-surface-variant mt-1 block">
            High conversion efficiency
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm">
          <span className="font-label-sm text-xs font-bold uppercase tracking-wider text-on-surface-variant block mb-1">
            Total Tracked
          </span>
          <div className="font-headline text-3xl font-bold text-on-surface">
            {totalApplications}
          </div>
          <span className="text-xs text-on-surface-variant mt-1 block">
            {rejectionRate}% archive / pass rate
          </span>
        </div>
      </div>

      {/* 2. Charts Row: Status Distribution & Applications by Source */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Status Distribution */}
        <div className="p-6 rounded-3xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm">
          <h3 className="font-headline text-base font-bold text-on-surface mb-1">
            Pipeline Stage Distribution
          </h3>
          <p className="text-xs text-on-surface-variant mb-6">
            Count of active positions in each stage of the funnel
          </p>

          <div className="space-y-3.5">
            {applicationsByStatus.map((item) => {
              const max = Math.max(...applicationsByStatus.map((s) => s.count), 1);
              const pct = Math.round((item.count / max) * 100);

              return (
                <div key={item.status} className="space-y-1 text-xs">
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-on-surface">{item.status}</span>
                    <span className="text-on-surface-variant">{item.count} applications</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-surface-container overflow-hidden">
                    <div
                      style={{ width: `${Math.max(4, pct)}%`, backgroundColor: item.color }}
                      className="h-full rounded-full transition-all duration-500"
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Source Breakdown */}
        <div className="p-6 rounded-3xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm">
          <h3 className="font-headline text-base font-bold text-on-surface mb-1">
            Applications by Referral Source
          </h3>
          <p className="text-xs text-on-surface-variant mb-6">
            Inbound outreach vs employee referrals vs company careers
          </p>

          <div className="space-y-3.5">
            {applicationsBySource.map((src) => (
              <div key={src.source} className="space-y-1 text-xs">
                <div className="flex items-center justify-between font-semibold">
                  <span className="text-on-surface">{src.source}</span>
                  <span className="text-primary font-bold">
                    {src.count} ({src.percentage}%)
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-surface-container overflow-hidden">
                  <div
                    style={{ width: `${Math.max(6, src.percentage)}%` }}
                    className="h-full rounded-full bg-primary transition-all duration-500"
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Salary Target Distribution */}
      <div className="p-6 rounded-3xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm">
        <h3 className="font-headline text-base font-bold text-on-surface mb-1">
          Salary Target Distribution
        </h3>
        <p className="text-xs text-on-surface-variant mb-6">
          Base & target total compensation brackets for tracked opportunities
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {salaryDistribution.map((bucket) => (
            <div
              key={bucket.bracket}
              className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex flex-col items-center text-center justify-between"
            >
              <span className="font-label-sm text-xs font-bold text-on-surface-variant uppercase">
                {bucket.bracket}
              </span>
              <span className="font-headline text-2xl font-bold text-primary my-2">
                {bucket.count}
              </span>
              <span className="text-[11px] text-on-surface-variant font-medium">positions</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
