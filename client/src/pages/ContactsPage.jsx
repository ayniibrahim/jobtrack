import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';
import DeleteConfirmModal from '../components/DeleteConfirmModal.jsx';
import EmptyState from '../components/EmptyState.jsx';

export default function ContactsPage() {
  const { showToast } = useToast();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    jobTitle: 'Recruiter',
    email: '',
    phone: '',
    linkedin: '',
    notes: '',
    isPrimaryPOC: false
  });

  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadContacts = async () => {
    try {
      setLoading(true);
      const res = await api.contacts.getAll({ search });
      if (res && res.success) {
        setContacts(res.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContacts();
  }, [search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingContact) {
        await api.contacts.update(editingContact._id, formData);
        showToast('Contact updated.');
      } else {
        await api.contacts.create(formData);
        showToast('Contact added to recruiter directory.');
      }
      setIsModalOpen(false);
      setEditingContact(null);
      loadContacts();
    } catch (err) {
      showToast(err.message || 'Error saving contact', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.contacts.delete(deleteTarget._id);
      showToast('Contact deleted');
      setDeleteTarget(null);
      loadContacts();
    } catch (err) {
      showToast('Error deleting contact', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-background pb-28 pt-20 px-4 sm:px-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-headline text-2xl sm:text-3xl font-bold tracking-tight text-on-surface">
            Recruiter & Network Directory
          </h1>
          <p className="font-body-md text-xs sm:text-sm text-on-surface-variant mt-1">
            Manage your hiring partners, coordinators, and referral advocates
          </p>
        </div>

        <button
          onClick={() => {
            setEditingContact(null);
            setFormData({
              name: '',
              company: '',
              jobTitle: 'Lead Talent Partner',
              email: '',
              phone: '',
              linkedin: '',
              notes: '',
              isPrimaryPOC: true
            });
            setIsModalOpen(true);
          }}
          className="h-10 px-4 rounded-xl bg-primary text-on-primary font-label-md text-xs font-bold shadow-md hover:bg-primary-container active:scale-98 transition-all flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">person_add</span>
          Add Recruiter
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
          search
        </span>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search contacts by name, company, email, or role..."
          className="w-full h-11 pl-10 pr-4 rounded-xl bg-surface-container-lowest text-on-surface text-sm border border-outline-variant/30 focus:border-primary outline-none transition-all shadow-sm"
        />
      </div>

      {/* Contacts Grid */}
      {loading ? (
        <div className="py-20 text-center text-on-surface-variant text-sm flex items-center justify-center gap-2">
          <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
          Loading network contacts...
        </div>
      ) : contacts.length === 0 ? (
        <EmptyState
          icon="contacts"
          title="No recruiter contacts saved"
          description="Keep track of everyone in your hiring loop: recruiters, sourcers, and interviewers."
          actionLabel="Add First Recruiter"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contacts.map((contact) => (
            <div
              key={contact._id}
              className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm hover:border-primary/40 transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary-fixed text-primary font-bold text-lg flex items-center justify-center border border-primary/20 shrink-0">
                      {contact.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-headline text-base font-bold text-on-surface">
                          {contact.name}
                        </h3>
                        {contact.isPrimaryPOC && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold">
                            Primary
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-on-surface-variant font-medium">
                        {contact.jobTitle} · <strong className="text-on-surface">{contact.company}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingContact(contact);
                        setFormData({
                          name: contact.name,
                          company: contact.company || '',
                          jobTitle: contact.jobTitle || '',
                          email: contact.email || '',
                          phone: contact.phone || '',
                          linkedin: contact.linkedin || '',
                          notes: contact.notes || '',
                          isPrimaryPOC: Boolean(contact.isPrimaryPOC)
                        });
                        setIsModalOpen(true);
                      }}
                      className="w-7 h-7 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container flex items-center justify-center"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                    </button>
                    <button
                      onClick={() => setDeleteTarget(contact)}
                      className="w-7 h-7 rounded-lg text-on-surface-variant hover:text-error hover:bg-surface-container flex items-center justify-center"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                </div>

                {contact.notes && (
                  <p className="text-xs text-on-surface-variant line-clamp-2 mb-3 bg-surface-container-low p-2 rounded-lg">
                    {contact.notes}
                  </p>
                )}
              </div>

              {/* Contact Links */}
              <div className="pt-3 border-t border-surface-container flex items-center gap-2 text-xs">
                {contact.email && (
                  <a
                    href={`mailto:${contact.email}`}
                    className="h-8 px-2.5 rounded-lg bg-surface-container text-on-surface hover:text-primary flex items-center gap-1 font-semibold"
                  >
                    <span className="material-symbols-outlined text-[15px]">mail</span>
                    Email
                  </a>
                )}
                {contact.phone && (
                  <a
                    href={`tel:${contact.phone}`}
                    className="h-8 px-2.5 rounded-lg bg-surface-container text-on-surface hover:text-primary flex items-center gap-1 font-semibold"
                  >
                    <span className="material-symbols-outlined text-[15px]">call</span>
                    Call
                  </a>
                )}
                {contact.linkedin && (
                  <a
                    href={contact.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-8 px-2.5 rounded-lg bg-surface-container text-on-surface hover:text-primary flex items-center gap-1 font-semibold ml-auto"
                  >
                    <span className="material-symbols-outlined text-[15px]">open_in_new</span>
                    LinkedIn
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
              {editingContact ? 'Edit Recruiter Contact' : 'Add Recruiter Contact'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3 text-xs font-medium">
              <div>
                <label className="block text-on-surface-variant mb-1">Full Name *</label>
                <input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. David Kim, Sarah Chen"
                  className="w-full h-10 px-3 rounded-lg bg-surface-container-low text-on-surface border border-outline-variant/30 focus:border-primary outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-on-surface-variant mb-1">Company</label>
                  <input
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="Stripe, Figma, Linear"
                    className="w-full h-10 px-3 rounded-lg bg-surface-container-low text-on-surface border border-outline-variant/30 focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-on-surface-variant mb-1">Title</label>
                  <input
                    value={formData.jobTitle}
                    onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                    placeholder="Lead Talent Partner"
                    className="w-full h-10 px-3 rounded-lg bg-surface-container-low text-on-surface border border-outline-variant/30 focus:border-primary outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-on-surface-variant mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="name@company.com"
                    className="w-full h-10 px-3 rounded-lg bg-surface-container-low text-on-surface border border-outline-variant/30 focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-on-surface-variant mb-1">Phone</label>
                  <input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (415) 555-0100"
                    className="w-full h-10 px-3 rounded-lg bg-surface-container-low text-on-surface border border-outline-variant/30 focus:border-primary outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-on-surface-variant mb-1">LinkedIn Profile</label>
                <input
                  type="url"
                  value={formData.linkedin}
                  onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                  placeholder="https://linkedin.com/in/..."
                  className="w-full h-10 px-3 rounded-lg bg-surface-container-low text-on-surface border border-outline-variant/30 focus:border-primary outline-none"
                />
              </div>
              <div>
                <label className="block text-on-surface-variant mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Coordinating technical interview loops..."
                  className="w-full p-3 rounded-lg bg-surface-container-low text-on-surface border border-outline-variant/30 focus:border-primary outline-none"
                />
              </div>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="primaryPOC"
                  checked={formData.isPrimaryPOC}
                  onChange={(e) => setFormData({ ...formData, isPrimaryPOC: e.target.checked })}
                  className="w-4 h-4 rounded accent-primary"
                />
                <label htmlFor="primaryPOC" className="text-on-surface cursor-pointer">
                  Mark as Primary Recruiter POC
                </label>
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
                  Save Recruiter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        title={`Delete ${deleteTarget?.name}?`}
        message="Are you sure you want to remove this contact from your address book?"
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
