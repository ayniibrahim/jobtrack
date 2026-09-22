import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';
import DeleteConfirmModal from '../components/DeleteConfirmModal.jsx';
import EmptyState from '../components/EmptyState.jsx';

export default function DocumentsPage() {
  const { showToast } = useToast();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');

  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [docCategory, setDocCategory] = useState('Resume');

  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const res = await api.documents.getAll({ type: activeCategory });
      if (res && res.success) {
        setDocuments(res.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [activeCategory]);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', file.name);
      formData.append('type', docCategory);

      await api.documents.upload(formData);
      showToast(`${file.name} saved to career vault 📄`);
      loadDocuments();
    } catch (err) {
      showToast(err.message || 'Error uploading file', 'error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.documents.delete(deleteTarget._id);
      showToast('Document removed from vault');
      setDeleteTarget(null);
      loadDocuments();
    } catch (err) {
      showToast('Error removing document', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-background pb-28 pt-20 px-4 sm:px-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-headline text-2xl sm:text-3xl font-bold tracking-tight text-on-surface">
            Career Documents Vault
          </h1>
          <p className="font-body-md text-xs sm:text-sm text-on-surface-variant mt-1">
            Centralized repository for resumes, tailored cover letters, and formal offer agreements
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={docCategory}
            onChange={(e) => setDocCategory(e.target.value)}
            className="h-10 px-3 rounded-xl bg-surface-container text-on-surface text-xs font-semibold outline-none cursor-pointer"
          >
            <option value="Resume">Resume</option>
            <option value="Cover Letter">Cover Letter</option>
            <option value="Certificate">Certificate</option>
            <option value="Portfolio">Portfolio / Presentation</option>
            <option value="Other">Offer Agreement / Other</option>
          </select>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept=".pdf,.doc,.docx,.png,.jpg"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="h-10 px-4 rounded-xl bg-primary text-on-primary font-label-md text-xs font-bold shadow-md hover:bg-primary-container active:scale-98 transition-all flex items-center gap-2"
          >
            {uploading ? (
              <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
            ) : (
              <span className="material-symbols-outlined text-[18px]">upload_file</span>
            )}
            Upload File
          </button>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 mb-6">
        {['all', 'Resume', 'Cover Letter', 'Certificate', 'Portfolio', 'Other'].map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 ${
              activeCategory === cat
                ? 'bg-primary text-on-primary shadow-sm'
                : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            {cat === 'all' ? 'All Documents' : cat}
          </button>
        ))}
      </div>

      {/* Documents Grid */}
      {loading ? (
        <div className="py-20 text-center text-on-surface-variant text-sm flex items-center justify-center gap-2">
          <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
          Accessing encrypted document vault...
        </div>
      ) : documents.length === 0 ? (
        <EmptyState
          icon="folder_open"
          title="No documents in this category"
          description="Upload tailored resumes, letters, or offer contracts to keep your assets organized."
          actionLabel="Upload First Document"
          onAction={() => fileInputRef.current?.click()}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <div
              key={doc._id}
              className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm hover:border-primary/40 transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-primary-fixed/40 text-primary flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[24px]">
                        {doc.type === 'Resume'
                          ? 'description'
                          : doc.type === 'Cover Letter'
                          ? 'draft'
                          : 'folder'}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-headline text-sm font-bold text-on-surface truncate">
                        {doc.name}
                      </h3>
                      <p className="text-[11px] text-on-surface-variant font-medium mt-0.5">
                        {doc.type} · {(doc.size / (1024 * 1024)).toFixed(1)} MB
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setDeleteTarget(doc)}
                    className="w-7 h-7 rounded-lg text-on-surface-variant hover:text-error hover:bg-surface-container flex items-center justify-center"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-surface-container flex items-center justify-between text-xs">
                <span className="text-[11px] text-on-surface-variant">
                  Added: {new Date(doc.createdAt).toLocaleDateString()}
                </span>
                <a
                  href={doc.url}
                  download
                  className="h-8 px-3 rounded-lg bg-surface-container text-on-surface hover:text-primary flex items-center gap-1 font-semibold"
                >
                  <span className="material-symbols-outlined text-[14px]">download</span>
                  Download
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        title={`Delete ${deleteTarget?.name}?`}
        message="This document will be permanently removed from your vault."
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
