import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import * as tableService from '../services/tableService.js';
import * as columnService from '../services/columnService.js';
import * as relationshipService from '../services/relationshipService.js';
import * as workspaceService from '../services/workspaceService.js';
import { useToast } from '../components/Toast.jsx';

const DATA_TYPES = [
  'TEXT', 'VARCHAR', 'INTEGER', 'BIGINT', 'DECIMAL', 'BOOLEAN',
  'DATE', 'TIMESTAMP', 'UUID', 'JSON', 'FLOAT', 'DOUBLE',
  'SERIAL', 'BIGSERIAL'
];

const RELATIONSHIP_TYPES = ['ONE_TO_ONE', 'ONE_TO_MANY', 'MANY_TO_ONE', 'MANY_TO_MANY'];

export default function SchemaBuilderPage() {
  const { id: workspaceId } = useParams();
  const { showToast } = useToast();

  const [workspace, setWorkspace] = useState(null);
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [columns, setColumns] = useState([]);
  const [relationships, setRelationships] = useState([]);

  // Load states
  const [isWorkspaceLoading, setIsWorkspaceLoading] = useState(true);
  const [isTablesLoading, setIsTablesLoading] = useState(false);
  const [isColumnsLoading, setIsColumnsLoading] = useState(false);
  const [isRelsLoading, setIsRelsLoading] = useState(false);

  // Modals state
  const [tableModal, setTableModal] = useState({ open: false, mode: 'CREATE', id: null, name: '', description: '' });
  const [columnModal, setColumnModal] = useState({
    open: false,
    mode: 'CREATE',
    id: null,
    name: '',
    dataType: 'TEXT',
    nullable: true,
    primaryKey: false,
    unique: false,
    defaultValue: ''
  });
  const [relModal, setRelModal] = useState({
    open: false,
    sourceTableId: '',
    sourceColumnId: '',
    targetTableId: '',
    targetColumnId: '',
    relationshipType: 'ONE_TO_MANY'
  });

  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [sourceCols, setSourceCols] = useState([]);
  const [targetCols, setTargetCols] = useState([]);

  // ── Loaders ────────────────────────────────────────────────────────────────

  const fetchWorkspace = useCallback(async () => {
    try {
      const data = await workspaceService.getWorkspace(workspaceId);
      setWorkspace(data);
    } catch (err) {
      showToast(err.message || 'Failed to load workspace details.', 'error');
    } finally {
      setIsWorkspaceLoading(false);
    }
  }, [workspaceId, showToast]);

  const fetchTables = useCallback(async () => {
    setIsTablesLoading(true);
    try {
      const list = await tableService.listTables(workspaceId);
      setTables(list);
      // Auto-select first table if none selected
      if (list.length > 0 && !selectedTable) {
        setSelectedTable(list[0]);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load tables.', 'error');
    } finally {
      setIsTablesLoading(false);
    }
  }, [workspaceId, selectedTable, showToast]);

  const fetchColumns = useCallback(async (tableId) => {
    setIsColumnsLoading(true);
    try {
      const list = await columnService.listColumns(tableId);
      setColumns(list);
    } catch (err) {
      showToast(err.message || 'Failed to load columns.', 'error');
    } finally {
      setIsColumnsLoading(false);
    }
  }, [showToast]);

  const fetchRelationships = useCallback(async () => {
    setIsRelsLoading(true);
    try {
      const list = await relationshipService.listRelationships(workspaceId);
      setRelationships(list);
    } catch (err) {
      showToast(err.message || 'Failed to load relationships.', 'error');
    } finally {
      setIsRelsLoading(false);
    }
  }, [workspaceId, showToast]);

  // Initial load
  useEffect(() => {
    fetchWorkspace();
    fetchRelationships();
  }, [fetchWorkspace, fetchRelationships]);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  // Load columns whenever selected table changes
  useEffect(() => {
    if (selectedTable) {
      fetchColumns(selectedTable.id);
    } else {
      setColumns([]);
    }
  }, [selectedTable, fetchColumns]);

  // ── Table Actions ──────────────────────────────────────────────────────────

  const handleTableSubmit = async (e) => {
    e.preventDefault();
    if (!tableModal.name.trim()) {
      setErrorMsg('Table name is required');
      return;
    }

    // Name validation
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableModal.name)) {
      setErrorMsg('Table name must start with a letter/underscore and contain only alphanumeric characters and underscores.');
      return;
    }

    setErrorMsg('');
    setIsSubmitting(true);
    try {
      if (tableModal.mode === 'CREATE') {
        const newTable = await tableService.createTable(workspaceId, {
          name: tableModal.name.trim(),
          description: tableModal.description.trim()
        });
        setTables((prev) => [...prev, newTable]);
        setSelectedTable(newTable);
        showToast('Table created successfully', 'success');
      } else {
        const updated = await tableService.updateTable(tableModal.id, {
          name: tableModal.name.trim(),
          description: tableModal.description.trim()
        });
        setTables((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
        if (selectedTable?.id === updated.id) {
          setSelectedTable(updated);
        }
        showToast('Table updated successfully', 'success');
      }
      setTableModal((m) => ({ ...m, open: false }));
    } catch (err) {
      setErrorMsg(err.message || 'An error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTableDelete = async (table) => {
    if (window.confirm(`Are you sure you want to delete table "${table.name}"? This cascades to all columns and relationships.`)) {
      try {
        await tableService.deleteTable(table.id);
        setTables((prev) => prev.filter((t) => t.id !== table.id));
        if (selectedTable?.id === table.id) {
          setSelectedTable(null);
        }
        fetchRelationships(); // Cascade deletes relationships
        showToast('Table deleted successfully', 'success');
      } catch (err) {
        showToast(err.message || 'Failed to delete table.', 'error');
      }
    }
  };

  // ── Column Actions ─────────────────────────────────────────────────────────

  const handleColumnSubmit = async (e) => {
    e.preventDefault();
    if (!columnModal.name.trim()) {
      setErrorMsg('Column name is required');
      return;
    }

    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(columnModal.name)) {
      setErrorMsg('Column name must start with a letter/underscore and contain only alphanumeric characters and underscores.');
      return;
    }

    setErrorMsg('');
    setIsSubmitting(true);
    try {
      const payload = {
        name: columnModal.name.trim(),
        dataType: columnModal.dataType,
        nullable: columnModal.nullable,
        primaryKey: columnModal.primaryKey,
        unique: columnModal.unique,
        defaultValue: columnModal.defaultValue ? columnModal.defaultValue.trim() : null
      };

      if (columnModal.mode === 'CREATE') {
        const newCol = await columnService.createColumn(selectedTable.id, payload);
        setColumns((prev) => [...prev, newCol]);
        showToast('Column added successfully', 'success');
      } else {
        const updated = await columnService.updateColumn(columnModal.id, payload);
        setColumns((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        showToast('Column updated successfully', 'success');
      }
      setColumnModal((m) => ({ ...m, open: false }));
    } catch (err) {
      setErrorMsg(err.message || 'An error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleColumnDelete = async (col) => {
    if (window.confirm(`Delete column "${col.name}"?`)) {
      try {
        await columnService.deleteColumn(col.id);
        setColumns((prev) => prev.filter((c) => c.id !== col.id));
        fetchRelationships(); // Cascade deletes relationship
        showToast('Column deleted successfully', 'success');
      } catch (err) {
        showToast(err.message || 'Failed to delete column.', 'error');
      }
    }
  };

  // ── Relationship Actions ───────────────────────────────────────────────────

  const openRelModal = async () => {
    if (tables.length < 2) return;
    const sTable = tables[0];
    const tTable = tables[1];
    setErrorMsg('');
    setIsSubmitting(false);

    try {
      const [sCols, tCols] = await Promise.all([
        columnService.listColumns(sTable.id),
        columnService.listColumns(tTable.id)
      ]);
      setSourceCols(sCols);
      setTargetCols(tCols);
      setRelModal({
        open: true,
        sourceTableId: sTable.id,
        sourceColumnId: sCols[0]?.id || '',
        targetTableId: tTable.id,
        targetColumnId: tCols[0]?.id || '',
        relationshipType: 'ONE_TO_MANY'
      });
    } catch (err) {
      showToast('Failed to load column schemas for relationship mapping.', 'error');
    }
  };

  const handleSourceTableChange = async (tId) => {
    try {
      const cols = await columnService.listColumns(tId);
      setSourceCols(cols);
      setRelModal((m) => ({ ...m, sourceTableId: tId, sourceColumnId: cols[0]?.id || '' }));
    } catch (err) {
      showToast('Failed to load columns for table', 'error');
    }
  };

  const handleTargetTableChange = async (tId) => {
    try {
      const cols = await columnService.listColumns(tId);
      setTargetCols(cols);
      setRelModal((m) => ({ ...m, targetTableId: tId, targetColumnId: cols[0]?.id || '' }));
    } catch (err) {
      showToast('Failed to load columns for table', 'error');
    }
  };

  const handleRelSubmit = async (e) => {
    e.preventDefault();
    const { sourceTableId, sourceColumnId, targetTableId, targetColumnId, relationshipType } = relModal;

    if (!sourceTableId || !sourceColumnId || !targetTableId || !targetColumnId) {
      setErrorMsg('All source and target mappings are required');
      return;
    }

    setErrorMsg('');
    setIsSubmitting(true);
    try {
      const newRel = await relationshipService.createRelationship({
        sourceTableId,
        sourceColumnId,
        targetTableId,
        targetColumnId,
        relationshipType
      });
      setRelationships((prev) => [newRel, ...prev]);
      setRelModal((m) => ({ ...m, open: false }));
      showToast('Relationship created successfully', 'success');
    } catch (err) {
      setErrorMsg(err.message || 'An error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRelDelete = async (rel) => {
    if (window.confirm('Delete this relationship association?')) {
      try {
        await relationshipService.deleteRelationship(rel.id);
        setRelationships((prev) => prev.filter((r) => r.id !== rel.id));
        showToast('Relationship deleted successfully', 'success');
      } catch (err) {
        showToast(err.message || 'Failed to delete relationship.', 'error');
      }
    }
  };

  // Helpers to get names
  const getTableName = (id) => tables.find((t) => t.id === id)?.name || id;
  
  // Find column name (nested check, search table column list or fetch target)
  const getColumnName = (tableId, colId) => {
    if (tableId === selectedTable?.id) {
      return columns.find((c) => c.id === colId)?.name || colId;
    }
    return colId; // Display key placeholder if target columns not loaded
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Workspace Inner Navigation Bar */}
      <div className="flex border-b border-slate-800 pb-px gap-6">
        <Link
          to={`/workspaces/${workspaceId}`}
          className="text-sm font-medium text-slate-400 hover:text-white pb-2 px-1 transition-colors"
        >
          Overview
        </Link>
        <Link
          to={`/workspaces/${workspaceId}/schema`}
          className="text-sm font-bold text-cyan-400 border-b-2 border-cyan-400 pb-2 px-1"
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

      {isWorkspaceLoading ? (
        <div className="text-center py-6 text-sm text-slate-500">Loading workspace information...</div>
      ) : (
        <div className="flex items-center justify-between bg-slate-900/10 border border-slate-900 rounded-2xl px-6 py-4 shadow backdrop-blur-sm">
          <div className="space-y-1">
            <h1 className="text-xl font-extrabold text-white">{workspace?.name}</h1>
            <p className="text-xs text-slate-400">Design your database tables, columns, and foreign key relationships below.</p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
            Schema Loaded
          </span>
        </div>
      )}

      {/* Main Designer Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left column: Tables list sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Tables</h3>
            <button
              onClick={() => {
                setErrorMsg('');
                setTableModal({ open: true, mode: 'CREATE', id: null, name: '', description: '' });
              }}
              className="p-1 rounded-lg text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300 transition-colors"
              title="Add Table"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </button>
          </div>

          {isTablesLoading && tables.length === 0 ? (
            <div className="text-slate-500 text-xs py-4 px-2 italic">Loading tables...</div>
          ) : tables.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-800 p-6 text-center text-xs text-slate-500">
              No tables created yet. Click "+" to add one.
            </div>
          ) : (
            <div className="space-y-2">
              {tables.map((t) => (
                <div
                  key={t.id}
                  onClick={() => setSelectedTable(t)}
                  className={`group flex items-center justify-between p-3.5 rounded-xl cursor-pointer border transition-all ${
                    selectedTable?.id === t.id
                      ? 'bg-slate-900 border-slate-700/80 shadow-md shadow-cyan-500/5 text-cyan-400'
                      : 'bg-slate-900/30 border-slate-800 hover:border-slate-800/80 text-slate-300 hover:text-white'
                  }`}
                >
                  <span className="font-mono text-sm truncate max-w-[120px]">{t.name}</span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setErrorMsg('');
                        setTableModal({ open: true, mode: 'EDIT', id: t.id, name: t.name, description: t.description || '' });
                      }}
                      className="p-1 text-slate-400 hover:text-white"
                      title="Rename"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTableDelete(t);
                      }}
                      className="p-1 text-slate-500 hover:text-red-400"
                      title="Delete"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right column: Columns detail list */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-slate-900/35 border border-slate-900 rounded-2xl p-6 shadow-xl backdrop-blur-md space-y-6">
            {selectedTable ? (
              <>
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div className="space-y-1">
                    <h2 className="text-xl font-bold text-white font-mono flex items-center gap-2">
                      <span className="text-cyan-400">table:</span>
                      {selectedTable.name}
                    </h2>
                    <p className="text-xs text-slate-400">
                      {selectedTable.description || <span className="italic text-slate-600">No table description</span>}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setErrorMsg('');
                      setColumnModal({
                        open: true,
                        mode: 'CREATE',
                        id: null,
                        name: '',
                        dataType: 'TEXT',
                        nullable: true,
                        primaryKey: false,
                        unique: false,
                        defaultValue: ''
                      });
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-colors"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Add Column
                  </button>
                </div>

                {/* Columns Table List */}
                {isColumnsLoading && columns.length === 0 ? (
                  <div className="text-center py-6 text-sm text-slate-500">Loading attributes...</div>
                ) : columns.length === 0 ? (
                  <div className="text-center py-8 text-sm text-slate-500 border border-dashed border-slate-800 rounded-xl">
                    No columns defined on this table. Add attributes to generate schemas.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr className="border-b border-slate-800 text-xs text-slate-400 uppercase tracking-wider font-semibold">
                          <th className="py-3 px-4">Name</th>
                          <th className="py-3 px-4">Data Type</th>
                          <th className="py-3 px-4 text-center">Attributes</th>
                          <th className="py-3 px-4">Default</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {columns.map((c) => (
                          <tr key={c.id} className="border-b border-slate-800/40 hover:bg-slate-900/10 text-sm font-mono text-slate-200">
                            <td className="py-3.5 px-4 font-bold text-white">{c.name}</td>
                            <td className="py-3.5 px-4 text-cyan-400 text-xs">{c.dataType}</td>
                            <td className="py-3.5 px-4">
                              <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                {c.primaryKey && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                                    PK
                                  </span>
                                )}
                                {c.unique && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                    UQ
                                  </span>
                                )}
                                {!c.nullable && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-red-500/10 text-red-400 border border-red-500/20">
                                    NN
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-xs text-slate-400">
                              {c.defaultValue !== null && c.defaultValue !== undefined ? (
                                <code className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800">{c.defaultValue}</code>
                              ) : (
                                <span className="italic text-slate-600">null</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex justify-end gap-1">
                                <button
                                  onClick={() => {
                                    setErrorMsg('');
                                    setColumnModal({
                                      open: true,
                                      mode: 'EDIT',
                                      id: c.id,
                                      name: c.name,
                                      dataType: c.dataType,
                                      nullable: c.nullable,
                                      primaryKey: c.primaryKey,
                                      unique: c.unique,
                                      defaultValue: c.defaultValue || ''
                                    });
                                  }}
                                  className="p-1 text-slate-400 hover:text-white"
                                  title="Edit"
                                >
                                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleColumnDelete(c)}
                                  className="p-1 text-slate-500 hover:text-red-400"
                                  title="Delete"
                                >
                                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 text-sm text-slate-500">
                No active table selected. Select or create a table to configure attributes.
              </div>
            )}
          </div>

          {/* Relationships list */}
          <div className="bg-slate-900/35 border border-slate-900 rounded-2xl p-6 shadow-xl backdrop-blur-md space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Relationships</h3>
              {tables.length > 1 && (
                <button
                  onClick={openRelModal}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-cyan-400 transition-colors"
                >
                  Create Relationship
                </button>
              )}
            </div>

            {isRelsLoading && relationships.length === 0 ? (
              <div className="text-slate-500 text-xs py-2 italic">Loading relationships...</div>
            ) : relationships.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                No foreign keys mapped yet. Click "Create Relationship" (requires 2+ tables).
              </div>
            ) : (
              <div className="space-y-3 font-mono text-xs">
                {relationships.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800/80"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-white font-bold">{getTableName(r.sourceTableId)}</span>
                      <span className="text-slate-500">({getColumnName(r.sourceTableId, r.sourceColumnId)})</span>
                      <span className="text-cyan-400 font-bold">─[{r.relationshipType}]─→</span>
                      <span className="text-white font-bold">{getTableName(r.targetTableId)}</span>
                      <span className="text-slate-500">({getColumnName(r.targetTableId, r.targetColumnId)})</span>
                    </div>

                    <button
                      onClick={() => handleRelDelete(r)}
                      className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0 ml-2"
                      title="Delete relation"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL 1: Create/Rename Table */}
      {tableModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">
                {tableModal.mode === 'CREATE' ? 'Create Schema Table' : 'Edit Table Name'}
              </h2>
              <button
                onClick={() => setTableModal((m) => ({ ...m, open: false }))}
                className="p-1 text-slate-400 hover:text-white"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleTableSubmit} className="space-y-4">
              {errorMsg && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400 font-mono">
                  {errorMsg}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase block">Table Name</label>
                <input
                  type="text"
                  value={tableModal.name}
                  onChange={(e) => setTableModal((m) => ({ ...m, name: e.target.value }))}
                  placeholder="e.g. customer_transactions"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase block">Description</label>
                <textarea
                  value={tableModal.description}
                  onChange={(e) => setTableModal((m) => ({ ...m, description: e.target.value }))}
                  placeholder="Tracks transaction details..."
                  rows={2}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setTableModal((m) => ({ ...m, open: false }))}
                  className="flex-1 px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Create/Edit Column */}
      {columnModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">
                {columnModal.mode === 'CREATE' ? 'Add Field Attribute' : 'Edit Column Properties'}
              </h2>
              <button
                onClick={() => setColumnModal((m) => ({ ...m, open: false }))}
                className="p-1 text-slate-400 hover:text-white"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleColumnSubmit} className="space-y-4">
              {errorMsg && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400 font-mono">
                  {errorMsg}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase block">Column Name</label>
                <input
                  type="text"
                  value={columnModal.name}
                  onChange={(e) => setColumnModal((m) => ({ ...m, name: e.target.value }))}
                  placeholder="e.g. created_at"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase block">Data Type</label>
                <select
                  value={columnModal.dataType}
                  onChange={(e) => setColumnModal((m) => ({ ...m, dataType: e.target.value }))}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                >
                  {DATA_TYPES.map((dt) => (
                    <option key={dt} value={dt}>
                      {dt}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase block">Default Value</label>
                <input
                  type="text"
                  value={columnModal.defaultValue}
                  onChange={(e) => setColumnModal((m) => ({ ...m, defaultValue: e.target.value }))}
                  placeholder="e.g. NOW(), false, 100"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-white focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-4 pt-2">
                <label className="flex flex-col items-center gap-2 p-3.5 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer text-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Nullable</span>
                  <input
                    type="checkbox"
                    checked={columnModal.nullable}
                    onChange={(e) => setColumnModal((m) => ({ ...m, nullable: e.target.checked }))}
                    className="h-4 w-4 rounded border-slate-800 bg-slate-950 text-cyan-500 focus:ring-cyan-500"
                  />
                </label>

                <label className="flex flex-col items-center gap-2 p-3.5 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer text-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Primary Key</span>
                  <input
                    type="checkbox"
                    checked={columnModal.primaryKey}
                    onChange={(e) => setColumnModal((m) => ({ ...m, primaryKey: e.target.checked }))}
                    className="h-4 w-4 rounded border-slate-800 bg-slate-950 text-cyan-500 focus:ring-cyan-500"
                  />
                </label>

                <label className="flex flex-col items-center gap-2 p-3.5 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer text-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Unique</span>
                  <input
                    type="checkbox"
                    checked={columnModal.unique}
                    onChange={(e) => setColumnModal((m) => ({ ...m, unique: e.target.checked }))}
                    className="h-4 w-4 rounded border-slate-800 bg-slate-950 text-cyan-500 focus:ring-cyan-500"
                  />
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setColumnModal((m) => ({ ...m, open: false }))}
                  className="flex-1 px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Create Relationship */}
      {relModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Create Table Relationship</h2>
              <button
                onClick={() => setRelModal((m) => ({ ...m, open: false }))}
                className="p-1 text-slate-400 hover:text-white"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleRelSubmit} className="space-y-4">
              {errorMsg && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400 font-mono">
                  {errorMsg}
                </div>
              )}

              {/* Source configuration */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Source Table
                  </label>
                  <select
                    value={relModal.sourceTableId}
                    onChange={(e) => handleSourceTableChange(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:outline-none"
                  >
                    {tables.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Source Column
                  </label>
                  <select
                    value={relModal.sourceColumnId}
                    onChange={(e) => setRelModal((m) => ({ ...m, sourceColumnId: e.target.value }))}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:outline-none"
                    required
                  >
                    {sourceCols.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.dataType})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Target configuration */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Target Table
                  </label>
                  <select
                    value={relModal.targetTableId}
                    onChange={(e) => handleTargetTableChange(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:outline-none"
                  >
                    {tables.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Target Column
                  </label>
                  <select
                    value={relModal.targetColumnId}
                    onChange={(e) => setRelModal((m) => ({ ...m, targetColumnId: e.target.value }))}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:outline-none"
                    required
                  >
                    {targetCols.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.dataType})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Relationship Type */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase block">Relationship Type</label>
                <select
                  value={relModal.relationshipType}
                  onChange={(e) => setRelModal((m) => ({ ...m, relationshipType: e.target.value }))}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-white focus:border-cyan-500"
                >
                  {RELATIONSHIP_TYPES.map((rt) => (
                    <option key={rt} value={rt}>
                      {rt.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setRelModal((m) => ({ ...m, open: false }))}
                  className="flex-1 px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
