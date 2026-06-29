import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useWorkspace } from '../contexts/WorkspaceContext.jsx';
import * as workspaceService from '../services/workspaceService.js';
import { useToast } from '../components/Toast.jsx';

export default function WorkspaceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { selectWorkspace, removeWorkspace, editWorkspace } = useWorkspace();

  const [workspace, setWorkspace] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [databaseType, setDatabaseType] = useState('POSTGRESQL');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchDetails = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await workspaceService.getWorkspace(id);
      setWorkspace(data);
      selectWorkspace(data); // Mark as active workspace
      setName(data.name);
      setDescription(data.description || '');
      setDatabaseType(data.databaseType);
    } catch (err) {
      showToast(err.message || 'Failed to load workspace details.', 'error');
      navigate('/workspaces');
    } finally {
      setIsLoading(false);
    }
  }, [id, selectWorkspace, showToast, navigate]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete workspace "${workspace.name}"? This will delete all tables and columns.`)) {
      try {
        await removeWorkspace(workspace.id);
        showToast('Workspace deleted successfully.', 'success');
        navigate('/workspaces');
      } catch (err) {
        showToast(err.message || 'Failed to delete workspace.', 'error');
      }
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Workspace name is required');
      return;
    }

    setFormError('');
    setIsSubmitting(true);
    try {
      const updated = await editWorkspace(workspace.id, { name, description, databaseType });
      setWorkspace(updated);
      setIsEditModalOpen(false);
      showToast('Workspace updated successfully!', 'success');
    } catch (err) {
      setFormError(err.message || 'Failed to update workspace.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
        <span className="text-sm text-slate-400">Loading workspace details...</span>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Workspace Inner Navigation Bar */}
      <div className="flex border-b border-slate-800 pb-px gap-6">
        <Link
          to={`/workspaces/${id}`}
          className="text-sm font-bold text-cyan-400 border-b-2 border-cyan-400 pb-2 px-1"
        >
          Overview
        </Link>
        <Link
          to={`/workspaces/${id}/schema`}
          className="text-sm font-medium text-slate-400 hover:text-white pb-2 px-1 transition-colors"
        >
          Schema Builder
        </Link>
        <Link
          to="/dashboard"
          className="text-sm font-medium text-slate-400 hover:text-white pb-2 px-1 transition-colors"
        >
          SQL Generator
        </Link>
      </div>

      {/* Header Info */}
      <div className="bg-slate-900/35 border border-slate-900 rounded-2xl p-6 shadow-xl backdrop-blur-md flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-800 border border-slate-700 text-slate-300">
              {workspace.databaseType}
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Schema Loaded
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">{workspace.name}</h1>
          <p className="text-slate-400 text-sm max-w-xl">
            {workspace.description || <span className="italic text-slate-600">No description provided</span>}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white transition-colors"
          >
            Edit Project
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-900/30 transition-colors"
          >
            Delete Workspace
          </button>
          <Link
            to="/dashboard"
            className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white transition-all shadow shadow-cyan-500/10"
          >
            Generate SQL →
          </Link>
        </div>
      </div>

      {/* Schema Statistics Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Tables */}
        <div className="bg-slate-900/20 border border-slate-900 rounded-2xl p-6 space-y-4 shadow-lg backdrop-blur-md">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Tables</h3>
            <svg className="h-5 w-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 5.25h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5" />
            </svg>
          </div>
          <div className="space-y-1">
            <span className="text-4xl font-extrabold text-white">{workspace._count?.tables || 0}</span>
            <p className="text-xs text-slate-500">Logical entities registered in schema</p>
          </div>
        </div>

        {/* Columns */}
        <div className="bg-slate-900/20 border border-slate-900 rounded-2xl p-6 space-y-4 shadow-lg backdrop-blur-md">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Columns</h3>
            <svg className="h-5 w-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h10a2 2 0 012 2v14a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="space-y-1">
            <span className="text-4xl font-extrabold text-white">{workspace._count?.columns || 0}</span>
            <p className="text-xs text-slate-500">Total data attributes defined</p>
          </div>
        </div>

        {/* Relationships */}
        <div className="bg-slate-900/20 border border-slate-900 rounded-2xl p-6 space-y-4 shadow-lg backdrop-blur-md">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Relationships</h3>
            <svg className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <div className="space-y-1">
            <span className="text-4xl font-extrabold text-white">{workspace._count?.relationships || 0}</span>
            <p className="text-xs text-slate-500">Foreign key associations configured</p>
          </div>
        </div>
      </div>

      {/* Action CTA Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Schema Builder CTA */}
        <div className="bg-gradient-to-tr from-cyan-950/20 via-slate-900/40 to-purple-950/20 border border-slate-800 rounded-2xl p-8 flex flex-col justify-between gap-6 shadow-2xl">
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-8 w-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                <svg className="h-4 w-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3.75 5.25h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5" />
                </svg>
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Visual Builder</span>
            </div>
            <h2 className="text-lg font-bold text-white">Design Schema Manually</h2>
            <p className="text-sm text-slate-400">
              Add tables, columns, and foreign-key relationships through the interactive visual editor.
            </p>
          </div>
          <Link
            to={`/workspaces/${id}/schema`}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-colors shadow-lg shadow-cyan-500/10"
          >
            Open Schema Builder →
          </Link>
        </div>

        {/* Import Schema CTA */}
        <div className="bg-gradient-to-tr from-purple-950/20 via-slate-900/40 to-cyan-950/20 border border-slate-800 rounded-2xl p-8 flex flex-col justify-between gap-6 shadow-2xl">
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-8 w-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                <svg className="h-4 w-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fast Import</span>
            </div>
            <h2 className="text-lg font-bold text-white">Import from File</h2>
            <p className="text-sm text-slate-400">
              Upload a SQL DDL file, JSON schema, or CSV matrix to instantly scaffold your entire schema.
            </p>
          </div>
          <Link
            to={`/workspaces/${id}/import`}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold bg-purple-600 hover:bg-purple-500 text-white transition-colors shadow-lg shadow-purple-500/10"
          >
            Import Schema →
          </Link>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Edit Workspace Settings</h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              {formError && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
                  {formError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Workspace Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Database Type
                </label>
                <select
                  value={databaseType}
                  onChange={(e) => setDatabaseType(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-white focus:border-cyan-500 focus:outline-none cursor-pointer"
                >
                  <option value="POSTGRESQL">PostgreSQL</option>
                  <option value="MYSQL">MySQL</option>
                  <option value="SQLITE">SQLite</option>
                  <option value="SQLSERVER">SQL Server</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white disabled:opacity-50 transition-colors flex justify-center items-center gap-2"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
