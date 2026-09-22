import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';
import DeleteConfirmModal from '../components/DeleteConfirmModal.jsx';
import EmptyState from '../components/EmptyState.jsx';

export default function CompaniesPage() {
  const { showToast } = useToast();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Add/Edit modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    industry: 'Technology',
    location: '',
    website: '',
    description: '',
    notes: ''
  });

  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const res = await api.companies.getAll({ search });
      if (res && res.success) {
        setCompanies(res.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompanies();
  }, [search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCompany) {
        await api.companies.update(editingCompany._id, formData);
        showToast('Company details updated.');
      } else {
        await api.companies.create(formData);
        showToast('Company added to target directory.');
      }
      setIsModalOpen(false);
      setEditingCompany(null);
      loadCompanies();
    } catch (err) {
      showToast(err.message || 'Error saving company', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.companies.delete(deleteTarget._id);
      showToast('Company removed');
      setDeleteTarget(null);
      loadCompanies();
    } catch (err) {
      showToast('Error deleting company', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-background pb-28 pt-20 px-4 sm:px-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-headline text-2xl sm:text-3xl font-bold tracking-tight text-on-surface">
            Target Companies
          </h1>
          <p className="font-body-md text-xs sm:text-sm text-on-surface-variant mt-1">
            Directory of organizations you are interviewing with or tracking
          </p>
        </div>

        <button
          onClick={() => {
            setEditingCompany(null);
            setFormData({ name: '', industry: 'Technology', location: '', website: '', description: '', notes: '' });
            setIsModalOpen(true);
          }}
          className="h-10 px-4 rounded-xl bg-primary text-on-primary font-label-md text-xs font-bold shadow-md hover:bg-primary-container active:scale-98 transition-all flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Add Company
        </button>
      </div>

      {/* Search Input */}
      <div className="relative mb-6">
        <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
          search
        </span>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search companies by name, industry, or location..."
          className="w-full h-11 pl-10 pr-4 rounded-xl bg-surface-container-lowest text-on-surface text-sm border border-outline-variant/30 focus:border-primary outline-none transition-all shadow-sm"
        />
      </div>

      {/* Company Grid */}
      {loading ? (
        <div className="py-20 text-center text-on-surface-variant text-sm flex items-center justify-center gap-2">
          <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
          Loading company directory...
        </div>
      ) : companies.length === 0 ? (
        <EmptyState
          icon="domain"
          title="No companies found"
          description="Start building your company hitlist by adding your dream employers."
          actionLabel="Add Target Company"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {companies.map((comp) => (
            <div
              key={comp._id}
              className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm hover:border-primary/40 transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center font-bold text-primary text-xl shrink-0 overflow-hidden border border-outline-variant/20 shadow-sm">
                      {comp.logo ? (
                        <img alt={comp.name} className="w-full h-full object-cover" src={comp.logo} />
                      ) : (
                        comp.name.charAt(0)
                      )}
                    </div>
                    <div>
                      <h3 className="font-headline text-base font-bold text-on-surface">{comp.name}</h3>
                      <p className="text-xs text-on-surface-variant font-medium">
                        {comp.industry} · {comp.location || 'Remote'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingCompany(comp);
                        setFormData({
                          name: comp.name,
                          industry: comp.industry || 'Technology',
                          location: comp.location || '',
                          website: comp.website || '',
                          description: comp.description || '',
                          notes: comp.notes || ''
                        });
                        setIsModalOpen(true);
                      }}
                      className="w-7 h-7 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container flex items-center justify-center"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                    </button>
                    <button
                      onClick={() => setDeleteTarget(comp)}
                      className="w-7 h-7 rounded-lg text-on-surface-variant hover:text-error hover:bg-surface-container flex items-center justify-center"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                </div>

                <p className="text-xs text-on-surface-variant line-clamp-2 mb-3 leading-relaxed">
                  {comp.description || comp.notes || 'Target technology employer.'}
                </p>
              </div>

              <div className="pt-3 border-t border-surface-container flex items-center justify-between text-xs">
                <span className="font-semibold text-primary">
                  {comp.activeCount || 0} active roles
                </span>
                {comp.website && (
                  <a
                    href={comp.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-on-surface-variant hover:text-primary flex items-center gap-1"
                  >
                    <span>Careers Site</span>
                    <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-inverse-surface/40 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-surface-container-lowest rounded-2xl p-6 shadow-2xl border border-outline-variant/30 flex flex-col gap-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-headline text-base font-bold text-on-surface">
              {editingCompany ? 'Edit Company' : 'Add Target Company'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3 text-xs font-medium">
              <div>
                <label className="block text-on-surface-variant mb-1">Company Name *</label>
                <input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. OpenAI, Stripe, Linear"
                  className="w-full h-10 px-3 rounded-lg bg-surface-container-low text-on-surface border border-outline-variant/30 focus:border-primary outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-on-surface-variant mb-1">Industry</label>
                  <input
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    placeholder="Fintech, AI, DevTools"
                    className="w-full h-10 px-3 rounded-lg bg-surface-container-low text-on-surface border border-outline-variant/30 focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-on-surface-variant mb-1">Location</label>
                  <input
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="San Francisco, CA"
                    className="w-full h-10 px-3 rounded-lg bg-surface-container-low text-on-surface border border-outline-variant/30 focus:border-primary outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-on-surface-variant mb-1">Website URL</label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://company.com"
                  className="w-full h-10 px-3 rounded-lg bg-surface-container-low text-on-surface border border-outline-variant/30 focus:border-primary outline-none"
                />
              </div>
              <div>
                <label className="block text-on-surface-variant mb-1">Description / Notes</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Culture impressions, engineering bar, team notes..."
                  className="w-full p-3 rounded-lg bg-surface-container-low text-on-surface border border-outline-variant/30 focus:border-primary outline-none"
                />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 h-10 rounded-xl bg-surface-container text-on-surface"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 h-10 rounded-xl bg-primary text-on-primary font-bold shadow-sm"
                >
                  Save Company
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        title={`Delete ${deleteTarget?.name}?`}
        message="Are you sure? This will remove the company from your directory."
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
