import { useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import * as schemaImportService from '../services/schemaImportService.js';
import { useToast } from '../components/Toast.jsx';

export default function SchemaImportPage() {
  const { id: workspaceId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('sql'); // 'sql' | 'json' | 'csv'
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Preview Phase State
  const [previewData, setPreviewData] = useState(null); // { tables: [], relationships: [], warnings: [], errors: [] }
  const [validationErrors, setValidationErrors] = useState([]);
  const [validationWarnings, setValidationWarnings] = useState([]);
  const [conflictStrategy, setConflictStrategy] = useState('SKIP'); // 'SKIP' | 'REPLACE' | 'RENAME'

  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile) => {
    const maxSize = 5 * 1024 * 1024; // 5 MB
    if (selectedFile.size > maxSize) {
      showToast('File is too large. Maximum size is 5 MB.', 'error');
      return;
    }

    const name = selectedFile.name.toLowerCase();
    const ext = name.slice(name.lastIndexOf('.'));

    if (activeTab === 'sql' && ext !== '.sql') {
      showToast('Please upload a valid .sql file for SQL DDL tab.', 'error');
      return;
    }
    if (activeTab === 'json' && ext !== '.json') {
      showToast('Please upload a valid .json file for JSON tab.', 'error');
      return;
    }
    if (activeTab === 'csv' && ext !== '.csv') {
      showToast('Please upload a valid .csv file for CSV tab.', 'error');
      return;
    }

    setFile(selectedFile);
    setPreviewData(null);
    setValidationErrors([]);
    setValidationWarnings([]);
  };

  const handleUploadPreview = async () => {
    if (!file) {
      showToast('Please select or drag a file to upload.', 'error');
      return;
    }

    setIsUploading(true);
    setValidationErrors([]);
    setValidationWarnings([]);
    setPreviewData(null);

    try {
      let data;
      if (activeTab === 'sql') {
        data = await schemaImportService.previewSqlImport(workspaceId, file);
      } else if (activeTab === 'json') {
        data = await schemaImportService.previewJsonImport(workspaceId, file);
      } else if (activeTab === 'csv') {
        data = await schemaImportService.previewCsvImport(workspaceId, file);
      }

      setPreviewData(data);
      setValidationWarnings(data.warnings || []);
      showToast('Schema file parsed successfully. Please review the preview before saving.', 'success');
    } catch (err) {
      if (err.data && err.data.error && err.data.error.error === 'ValidationError') {
        setValidationErrors(err.data.error.details || []);
        setValidationWarnings(err.data.error.warnings || []);
        showToast('Validation failed. Review errors below.', 'error');
      } else {
        showToast(err.message || 'Failed to parse file.', 'error');
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!previewData) return;

    setIsSaving(true);
    try {
      const payload = {
        tables: previewData.tables,
        relationships: previewData.relationships,
        conflictStrategy,
      };

      const result = await schemaImportService.confirmImport(workspaceId, payload);
      const summary = result.summary;

      showToast(
        `Import completed! Created: ${summary.tablesCreated} tables, ${summary.columnsCreated} columns, ${summary.relationshipsCreated} relationships. (Skipped: ${summary.tablesSkipped}, Replaced: ${summary.tablesReplaced})`,
        'success'
      );
      navigate(`/workspaces/${workspaceId}`);
    } catch (err) {
      showToast(err.message || 'Failed to complete import.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const conflictsExist = previewData?.tables?.some((t) => t.conflict === 'EXISTS');

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-5">
        <div>
          <Link to={`/workspaces/${workspaceId}`} className="text-xs text-slate-400 hover:text-cyan-400 flex items-center gap-1 mb-2">
            ← Back to Workspace
          </Link>
          <h1 className="text-2xl font-bold text-white">Import Schema</h1>
          <p className="text-slate-400 text-sm mt-1">
            Build your workspace database schema instantly using a DDL file, structured JSON, or CSV matrix.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-950 p-1.5 rounded-xl border border-slate-800/80 w-fit">
        {['sql', 'json', 'csv'].map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setFile(null);
              setPreviewData(null);
              setValidationErrors([]);
              setValidationWarnings([]);
            }}
            className={`px-4 py-2 text-xs font-bold uppercase rounded-lg transition-all cursor-pointer ${
              activeTab === tab
                ? 'bg-slate-850 text-cyan-400 shadow-md border border-slate-800'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab === 'sql' ? 'SQL DDL' : tab.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Drag & Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all ${
          dragActive
            ? 'border-cyan-500 bg-cyan-950/10'
            : file
            ? 'border-emerald-500 bg-emerald-950/5'
            : 'border-slate-850 bg-slate-900/10 hover:border-slate-800'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept={activeTab === 'sql' ? '.sql' : activeTab === 'json' ? '.json' : '.csv'}
          className="hidden"
        />

        {file ? (
          <div className="text-center space-y-2">
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              File Loaded
            </div>
            <p className="text-sm font-bold text-white max-w-md truncate">{file.name}</p>
            <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
          </div>
        ) : (
          <div className="text-center space-y-3">
            <div className="mx-auto h-12 w-12 rounded-xl bg-slate-850 flex items-center justify-center border border-slate-800">
              <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-white">Drag & drop your file here</p>
              <p className="text-xs text-slate-500 mt-1">or click to browse from device (Max: 5 MB)</p>
            </div>
          </div>
        )}
      </div>

      {/* Parse Action Button */}
      {file && !previewData && (
        <button
          onClick={handleUploadPreview}
          disabled={isUploading}
          className="w-full py-3.5 rounded-xl font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all flex justify-center items-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/10 disabled:opacity-50"
        >
          {isUploading ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
              Parsing schema metadata...
            </>
          ) : (
            'Generate Schema Preview'
          )}
        </button>
      )}

      {/* Validation Errors & Warnings Section */}
      {(validationErrors.length > 0 || validationWarnings.length > 0) && (
        <div className="space-y-4">
          {validationErrors.length > 0 && (
            <div className="bg-red-950/20 border border-red-900/40 rounded-2xl p-5 space-y-2">
              <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Import Rejection Errors
              </div>
              <ul className="list-disc pl-5 text-xs text-slate-300 space-y-1">
                {validationErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {validationWarnings.length > 0 && (
            <div className="bg-amber-950/20 border border-amber-900/40 rounded-2xl p-5 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Import Schema Warnings
              </div>
              <ul className="list-disc pl-5 text-xs text-slate-300 space-y-1">
                {validationWarnings.map((warn, i) => (
                  <li key={i}>{warn}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Preview Section */}
      {previewData && (
        <div className="space-y-6">
          {/* Conflict resolution panel */}
          {conflictsExist && (
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                  Conflict Resolution Strategy
                </h3>
                <p className="text-xs text-slate-400">
                  Some imported tables already exist in your workspace. Choose how to resolve conflicts:
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { id: 'SKIP', name: 'Skip conflicting tables', desc: 'Keep existing, skip duplicates' },
                  { id: 'REPLACE', name: 'Replace existing tables', desc: 'Drop existing, create from file' },
                  { id: 'RENAME', name: 'Rename imported tables', desc: 'Append _import suffix to file tables' },
                ].map((strat) => (
                  <label
                    key={strat.id}
                    className={`border rounded-xl p-4 cursor-pointer transition-all flex flex-col justify-between ${
                      conflictStrategy === strat.id
                        ? 'border-cyan-500 bg-cyan-950/5'
                        : 'border-slate-850 bg-slate-950 hover:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <input
                        type="radio"
                        name="conflictStrategy"
                        value={strat.id}
                        checked={conflictStrategy === strat.id}
                        onChange={() => setConflictStrategy(strat.id)}
                        className="text-cyan-500 focus:ring-cyan-500 bg-slate-950 border-slate-800"
                      />
                      <span className="text-xs font-bold text-white">{strat.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-500">{strat.desc}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Tables and Columns structure view */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Parsed Schema Preview</h3>

            <div className="grid grid-cols-1 gap-4">
              {previewData.tables.map((table) => (
                <div key={table.name} className="bg-slate-900/30 border border-slate-850 rounded-2xl overflow-hidden shadow">
                  {/* Table Header */}
                  <div className="bg-slate-950/60 px-5 py-4 flex items-center justify-between border-b border-slate-850">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-bold text-white">{table.name}</span>
                      {table.conflict === 'EXISTS' && (
                        <span className="bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded text-[10px] font-semibold">
                          Name Collision
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">
                      {table.columns.length} columns
                    </span>
                  </div>

                  {/* Columns Detail */}
                  <div className="p-4 overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[500px]">
                      <thead>
                        <tr className="border-b border-slate-850 text-[10px] font-bold text-slate-500 uppercase">
                          <th className="pb-2">Column</th>
                          <th className="pb-2">Type</th>
                          <th className="pb-2 text-center">PK</th>
                          <th className="pb-2 text-center">Nullable</th>
                          <th className="pb-2 text-center">Unique</th>
                          <th className="pb-2">Default</th>
                        </tr>
                      </thead>
                      <tbody>
                        {table.columns.map((col) => (
                          <tr key={col.name} className="border-b border-slate-850/30 last:border-0 text-xs">
                            <td className="py-2.5 font-semibold text-slate-200">{col.name}</td>
                            <td className="py-2.5 font-mono text-[11px] text-purple-400">{col.dataType}</td>
                            <td className="py-2.5 text-center">
                              {col.primaryKey && (
                                <span className="inline-block px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-[9px]">
                                  PK
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 text-center text-slate-400">
                              {col.nullable ? 'Yes' : 'No'}
                            </td>
                            <td className="py-2.5 text-center">
                              {col.unique && (
                                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 inline-block" />
                              )}
                            </td>
                            <td className="py-2.5 font-mono text-slate-400 text-[11px]">
                              {col.defaultValue ?? <span className="italic text-slate-700">null</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Relationships Preview */}
          {previewData.relationships && previewData.relationships.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Relationships</h3>
              <div className="bg-slate-900/20 border border-slate-850 rounded-2xl p-5 shadow">
                <div className="grid grid-cols-1 gap-2.5">
                  {previewData.relationships.map((rel, i) => (
                    <div key={i} className="flex items-center gap-3 text-xs text-slate-300">
                      <span className="font-mono text-cyan-400 font-semibold">{rel.sourceTable}.{rel.sourceColumn}</span>
                      <svg className="h-3.5 w-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                      <span className="font-mono text-purple-400 font-semibold">{rel.targetTable}.{rel.targetColumn}</span>
                      <span className="text-[10px] text-slate-500 font-mono italic">({rel.type || 'MANY_TO_ONE'})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-4 pt-6 border-t border-slate-850">
            <button
              onClick={() => {
                setPreviewData(null);
                setFile(null);
              }}
              className="flex-1 py-3.5 rounded-xl font-bold bg-slate-850 hover:bg-slate-850/80 border border-slate-800 text-slate-300 transition-all cursor-pointer text-sm text-center"
            >
              Reset
            </button>
            <button
              onClick={handleConfirmImport}
              disabled={isSaving}
              className="flex-1 py-3.5 rounded-xl font-bold bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white transition-all flex justify-center items-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/10 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Importing schema metadata...
                </>
              ) : (
                'Confirm & Save Schema'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
