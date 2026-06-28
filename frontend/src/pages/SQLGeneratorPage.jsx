import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../services/api.js';
import * as tableService from '../services/tableService.js';
import * as relationshipService from '../services/relationshipService.js';
import * as savedQueryService from '../services/savedQueryService.js';
import NaturalLanguageInput from '../components/NaturalLanguageInput.jsx';
import GenerateButton from '../components/GenerateButton.jsx';
import RecommendedQueryCard from '../components/RecommendedQueryCard.jsx';
import QueryAlternativeCard from '../components/QueryAlternativeCard.jsx';
import LoadingState from '../components/LoadingState.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ErrorCard from '../components/ErrorCard.jsx';
import { useToast } from '../components/Toast.jsx';
import { useWorkspace } from '../contexts/WorkspaceContext.jsx';

export default function SQLGeneratorPage() {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();
  const { workspaces, currentWorkspace, selectWorkspace } = useWorkspace();

  // Schema preview state
  const [schemaTables, setSchemaTables] = useState([]);
  const [schemaRelationships, setSchemaRelationships] = useState([]);
  const [isSchemaLoading, setIsSchemaLoading] = useState(false);
  const [schemaOpen, setSchemaOpen] = useState(false);

  // Error & results state
  const [errorMsg, setErrorMsg] = useState('');
  const [errorDetails, setErrorDetails] = useState('');
  const [requestId, setRequestId] = useState('');
  const [recommended, setRecommended] = useState(null);
  const [alternatives, setAlternatives] = useState([]);

  // Load schema preview whenever the active workspace changes
  const loadSchemaPreview = useCallback(async () => {
    if (!currentWorkspace?.id) {
      setSchemaTables([]);
      setSchemaRelationships([]);
      return;
    }

    setIsSchemaLoading(true);
    try {
      const [tables, rels] = await Promise.all([
        tableService.listTables(currentWorkspace.id),
        relationshipService.listRelationships(currentWorkspace.id),
      ]);
      setSchemaTables(tables);
      setSchemaRelationships(rels);
    } catch {
      // Schema preview is non-critical; silently swallow
    } finally {
      setIsSchemaLoading(false);
    }
  }, [currentWorkspace?.id]);

  useEffect(() => {
    loadSchemaPreview();
  }, [loadSchemaPreview]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;
    if (!currentWorkspace?.id) {
      showToast('Please select a Workspace before generating SQL.', 'error');
      return;
    }

    setErrorMsg('');
    setErrorDetails('');
    setRequestId('');
    setIsLoading(true);
    setRecommended(null);
    setAlternatives([]);

    try {
      const response = await apiClient.post('/sql/generate', {
        query: inputText,
        workspaceId: currentWorkspace.id,
      });

      const queries = response.data?.data || response.data?.queries;
      if (response.data?.success && queries) {
        const { recommendedQuery, alternatives: altList } = queries;
        setRecommended(recommendedQuery);
        setAlternatives(altList || []);
        showToast('SQL alternatives generated successfully!', 'success');
      } else {
        throw new Error('Invalid query format received from server.');
      }
    } catch (err) {
      console.error('SQL generation failed:', err);
      const msg = err.message || 'An error occurred during query generation.';
      const details = err.data?.error
        ? typeof err.data.error === 'object'
          ? JSON.stringify(err.data.error, null, 2)
          : String(err.data.error)
        : '';
      const reqId = err.data?.requestId || '';
      setErrorMsg(msg);
      setErrorDetails(details);
      setRequestId(reqId);
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopySuccess = () => {
    showToast('SQL query copied to clipboard.', 'success');
  };

  const canGenerate = !!currentWorkspace?.id && !!inputText.trim();

  // ── Save Query Modal state ──────────────────────────────────────────────
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');
  const [saveDescription, setSaveDescription] = useState('');
  const [saveTagsRaw, setSaveTagsRaw] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const openSaveModal = () => {
    setSaveTitle('');
    setSaveDescription('');
    setSaveTagsRaw('');
    setSaveModalOpen(true);
  };

  const handleSaveQuery = async () => {
    if (!saveTitle.trim() || !currentWorkspace?.id || !recommended?.sql) return;
    setIsSaving(true);
    try {
      const tags = saveTagsRaw.split(',').map((t) => t.trim()).filter(Boolean);
      await savedQueryService.saveQuery({
        workspaceId: currentWorkspace.id,
        title: saveTitle.trim(),
        description: saveDescription.trim() || undefined,
        naturalLanguagePrompt: inputText,
        generatedSQL: recommended.sql,
        tags,
      });
      showToast('Query saved successfully!', 'success');
      setSaveModalOpen(false);
    } catch (err) {
      showToast(err.message || 'Failed to save query.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      {/* Workspace Inner Navigation Bar */}
      {currentWorkspace && (
        <div className="flex border-b border-slate-800 pb-px gap-6">
          <Link
            to={`/workspaces/${currentWorkspace.id}`}
            className="text-sm font-medium text-slate-400 hover:text-white pb-2 px-1 transition-colors"
          >
            Overview
          </Link>
          <Link
            to={`/workspaces/${currentWorkspace.id}/schema`}
            className="text-sm font-medium text-slate-400 hover:text-white pb-2 px-1 transition-colors"
          >
            Schema Builder
          </Link>
          <span className="text-sm font-bold text-cyan-400 border-b-2 border-cyan-400 pb-2 px-1 cursor-default">
            SQL Generator
          </span>
        </div>
      )}

      {/* Page Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
          AI SQL Query Generator
        </h1>
        <p className="text-slate-400 max-w-xl mx-auto text-xs sm:text-sm">
          Select a Workspace and describe your query in plain English — Gemini will generate SQL using your exact schema.
        </p>
      </div>

      {/* Active Workspace Selector + Schema Status */}
      <div className="bg-slate-900/35 border border-slate-900 rounded-2xl p-5 shadow-lg backdrop-blur-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider shrink-0">
              Active Workspace:
            </span>
            {currentWorkspace ? (
              <span className="text-sm font-bold text-cyan-400">
                {currentWorkspace.name}{' '}
                <span className="text-xs font-mono font-medium text-slate-500">
                  ({currentWorkspace.databaseType})
                </span>
              </span>
            ) : (
              <span className="text-sm italic text-slate-500">None selected</span>
            )}
          </div>

          {workspaces.length > 0 && (
            <select
              value={currentWorkspace?.id || ''}
              onChange={(e) => {
                const selected = workspaces.find((w) => w.id === e.target.value);
                selectWorkspace(selected);
              }}
              className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all duration-150 cursor-pointer w-full sm:w-auto"
            >
              <option value="" disabled>Select workspace…</option>
              {workspaces.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Schema stats row */}
        {currentWorkspace && (
          <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-slate-800">
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Schema Loaded
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <svg className="h-3.5 w-3.5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 5.25h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5" />
              </svg>
              <span>
                {isSchemaLoading ? '…' : <><strong className="text-white">{schemaTables.length}</strong> Tables</>}
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <svg className="h-3.5 w-3.5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <span>
                {isSchemaLoading ? '…' : <><strong className="text-white">{schemaRelationships.length}</strong> Relationships</>}
              </span>
            </div>
            <Link
              to={`/workspaces/${currentWorkspace.id}/schema`}
              className="ml-auto text-[10px] font-semibold text-slate-500 hover:text-cyan-400 transition-colors"
            >
              Edit Schema →
            </Link>
          </div>
        )}
      </div>

      {/* No-workspace warning banner */}
      {!currentWorkspace && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/8 p-4 text-sm text-amber-400 flex items-start gap-3">
          <svg className="h-5 w-5 shrink-0 mt-0.5 text-amber-500" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <div>
            <span className="font-bold block mb-0.5">Select a Workspace to generate SQL.</span>
            <span className="text-xs text-amber-500/80">
              Gemini uses your workspace schema to generate accurate queries using real table and column names.{' '}
              <Link to="/workspaces" className="underline font-semibold hover:text-amber-300">
                Open Workspaces →
              </Link>
            </span>
          </div>
        </div>
      )}

      {/* Collapsible Schema Preview Panel */}
      {currentWorkspace && schemaTables.length > 0 && (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
          <button
            onClick={() => setSchemaOpen((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-slate-900/40 transition-colors"
          >
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h10a2 2 0 012 2v14a2 2 0 01-2 2z" />
              </svg>
              <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Current Schema</span>
              <span className="text-[10px] font-mono text-slate-500">({schemaTables.length} tables · {schemaRelationships.length} relationships)</span>
            </div>
            <svg
              className={`h-4 w-4 text-slate-500 transition-transform duration-200 ${schemaOpen ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {schemaOpen && (
            <div className="px-5 pb-5 pt-1 space-y-5 border-t border-slate-800">
              {/* Tables + Columns */}
              <div className="space-y-3">
                {schemaTables.map((table) => (
                  <div key={table.id} className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
                    <div className="px-4 py-2.5 bg-slate-800/50 flex items-center gap-2">
                      <svg className="h-3.5 w-3.5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 5.25h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5" />
                      </svg>
                      <span className="text-xs font-bold font-mono text-white">{table.name}</span>
                      {table.description && (
                        <span className="text-[10px] text-slate-500 italic">— {table.description}</span>
                      )}
                    </div>
                    <table className="w-full text-[11px] font-mono">
                      <thead>
                        <tr className="text-slate-500 border-b border-slate-800">
                          <th className="text-left px-4 py-2 font-semibold uppercase tracking-wide">Column</th>
                          <th className="text-left px-4 py-2 font-semibold uppercase tracking-wide">Type</th>
                          <th className="text-center px-4 py-2 font-semibold uppercase tracking-wide">Attrs</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(table.columns || []).map((col) => (
                          <tr key={col.id} className="border-b border-slate-800/40 hover:bg-slate-800/20">
                            <td className="px-4 py-2 text-slate-200">{col.name}</td>
                            <td className="px-4 py-2 text-cyan-400">{col.dataType}</td>
                            <td className="px-4 py-2 text-center">
                              <div className="flex justify-center gap-1 flex-wrap">
                                {col.primaryKey && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">PK</span>
                                )}
                                {col.unique && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-purple-500/10 text-purple-400 border border-purple-500/20">UQ</span>
                                )}
                                {!col.nullable && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-red-500/10 text-red-400 border border-red-500/20">NN</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>

              {/* Relationships section */}
              {schemaRelationships.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Relationships</p>
                  <div className="space-y-1.5 font-mono text-xs">
                    {schemaRelationships.map((r) => {
                      const srcTable = schemaTables.find((t) => t.id === r.sourceTableId);
                      const tgtTable = schemaTables.find((t) => t.id === r.targetTableId);
                      const srcCol = srcTable?.columns?.find((c) => c.id === r.sourceColumnId);
                      const tgtCol = tgtTable?.columns?.find((c) => c.id === r.targetColumnId);
                      return (
                        <div key={r.id} className="flex items-center flex-wrap gap-1.5 px-3 py-2 bg-slate-900 rounded-lg border border-slate-800/60">
                          <span className="text-white font-bold">{srcTable?.name || r.sourceTableId}</span>
                          <span className="text-slate-500">({srcCol?.name || '?'})</span>
                          <span className="text-cyan-400">─[{r.relationshipType}]─→</span>
                          <span className="text-white font-bold">{tgtTable?.name || r.targetTableId}</span>
                          <span className="text-slate-500">({tgtCol?.name || '?'})</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Input Form Section */}
      <div className="bg-slate-900/35 border border-slate-900 rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <NaturalLanguageInput
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isLoading}
            placeholder={
              currentWorkspace
                ? `Describe a query using your ${currentWorkspace.name} schema…`
                : 'Select a Workspace to generate SQL.'
            }
          />

          {!currentWorkspace && (
            <p className="text-xs text-amber-400/80 font-medium flex items-center gap-1">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3.75h.008v.008H12v-.008zm0-10.5C6.477 3 2 7.477 2 13s4.477 10 10 10 10-4.477 10-10S17.523 3 12 3z" />
              </svg>
              Select a Workspace to generate SQL.
            </p>
          )}

          <div className="flex justify-end">
            <GenerateButton isLoading={isLoading} disabled={!canGenerate} />
          </div>
        </form>
      </div>

      {/* Error state */}
      {errorMsg && (
        <ErrorCard
          message={errorMsg}
          errorDetails={errorDetails}
          requestId={requestId}
          onRetry={canGenerate ? handleSubmit : null}
        />
      )}

      {/* Loading Skeletal State */}
      {isLoading && <LoadingState />}

      {/* Empty State before generation */}
      {!isLoading && !recommended && alternatives.length === 0 && !errorMsg && (
        <EmptyState onSelectPrompt={(prompt) => setInputText(prompt)} />
      )}

      {/* Query Outcomes Rendering Section */}
      {!isLoading && (recommended || alternatives.length > 0) && (
        <div className="space-y-8">
          {/* 1. Recommended Query Card + Save Button */}
          {recommended && (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Best Suggestion
                </h2>
                <button
                  onClick={openSaveModal}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-gradient-to-r from-cyan-500/20 to-purple-600/20 border border-cyan-500/30 text-cyan-400 hover:from-cyan-500/30 hover:to-purple-600/30 hover:border-cyan-400/50 transition-all duration-200 cursor-pointer"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" /></svg>
                  Save Query
                </button>
              </div>
              <RecommendedQueryCard query={recommended} onCopySuccess={handleCopySuccess} />
            </div>
          )}

          {/* 2. Alternatives Choices List */}
          {alternatives.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">
                SQL Query Alternatives
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {alternatives.map((alt, index) => (
                  <QueryAlternativeCard
                    key={index}
                    query={alt}
                    onCopySuccess={handleCopySuccess}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Save Query Modal */}
      {saveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setSaveModalOpen(false)}>
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-base font-bold text-white">Save Query</h2>
                <p className="text-xs text-slate-500 mt-0.5">Saving to: <span className="text-cyan-400 font-semibold">{currentWorkspace?.name}</span></p>
              </div>
              <button onClick={() => setSaveModalOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {/* SQL preview */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">SQL to Save</p>
                <div className="rounded-xl bg-slate-950 border border-slate-800 p-3 max-h-28 overflow-auto">
                  <pre className="font-mono text-[11px] text-cyan-400 whitespace-pre-wrap break-all">{recommended?.sql}</pre>
                </div>
              </div>
              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Title *</label>
                <input
                  autoFocus
                  value={saveTitle}
                  onChange={(e) => setSaveTitle(e.target.value)}
                  placeholder="e.g. All active employees"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>
              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Description</label>
                <textarea
                  value={saveDescription}
                  onChange={(e) => setSaveDescription(e.target.value)}
                  rows={2}
                  placeholder="Optional description…"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 resize-none"
                />
              </div>
              {/* Tags */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tags <span className="font-normal text-slate-600">(comma-separated)</span></label>
                <input
                  value={saveTagsRaw}
                  onChange={(e) => setSaveTagsRaw(e.target.value)}
                  placeholder="analytics, users, reporting"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 pb-5">
              <button onClick={() => setSaveModalOpen(false)} className="px-4 py-2 text-sm font-semibold text-slate-400 hover:text-white transition-colors">Cancel</button>
              <button
                onClick={handleSaveQuery}
                disabled={isSaving || !saveTitle.trim()}
                className="px-5 py-2 text-sm font-bold rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {isSaving ? 'Saving…' : 'Save Query'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
