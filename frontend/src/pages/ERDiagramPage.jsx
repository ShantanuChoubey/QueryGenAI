import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { getWorkspaceDiagram } from '../services/diagramService.js';
import { useToast } from '../components/Toast.jsx';

/* ─────────────────────────────────────────────────────────
   Helper: pick badge colour per data-type
───────────────────────────────────────────────────────── */
function typeColor(dataType = '') {
  const t = dataType.toUpperCase();
  if (t.includes('INT') || t.includes('SERIAL') || t.includes('NUMERIC') || t.includes('FLOAT') || t.includes('DECIMAL')) return '#a78bfa';
  if (t.includes('CHAR') || t.includes('TEXT') || t.includes('VARCHAR')) return '#34d399';
  if (t.includes('BOOL')) return '#fb923c';
  if (t.includes('DATE') || t.includes('TIME') || t.includes('TIMESTAMP')) return '#38bdf8';
  if (t.includes('UUID')) return '#f472b6';
  if (t.includes('JSON')) return '#facc15';
  return '#94a3b8';
}

/* ─────────────────────────────────────────────────────────
   Custom node: Table card
───────────────────────────────────────────────────────── */
function TableNode({ data }) {
  return (
    <div
      style={{
        background: 'linear-gradient(145deg, #0f172a 0%, #1e293b 100%)',
        border: '1px solid #334155',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(99,102,241,0.08)',
        minWidth: 220,
        fontFamily: "'Inter', sans-serif",
        overflow: 'hidden',
      }}
    >
      {/* Table header */}
      <div
        style={{
          background: 'linear-gradient(90deg, #4f46e5 0%, #7c3aed 100%)',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 5.25h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5" />
        </svg>
        <span style={{ color: '#fff', fontWeight: 700, fontSize: 12, letterSpacing: '0.04em' }}>
          {data.name}
        </span>
        {data.description && (
          <span
            title={data.description}
            style={{ marginLeft: 'auto', cursor: 'help', opacity: 0.6 }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" strokeLinecap="round" />
            </svg>
          </span>
        )}
      </div>

      {/* Columns */}
      <div style={{ padding: '4px 0' }}>
        {data.columns.map((col, i) => (
          <div
            key={col.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '5px 14px',
              borderBottom: i < data.columns.length - 1 ? '1px solid #1e293b' : 'none',
              background: 'transparent',
            }}
          >
            {/* PK/FK icons */}
            <span style={{ width: 14, flexShrink: 0, color: col.primaryKey ? '#fbbf24' : '#475569', fontSize: 9 }}>
              {col.primaryKey ? '🔑' : col.isForeignKey ? '🔗' : ''}
            </span>

            {/* Column name */}
            <span
              style={{
                flex: 1,
                fontSize: 11,
                fontWeight: col.primaryKey ? 700 : 400,
                color: col.primaryKey ? '#f8fafc' : '#94a3b8',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {col.name}
              {!col.nullable && !col.primaryKey && (
                <span style={{ color: '#f87171', fontSize: 10, marginLeft: 2 }}>*</span>
              )}
            </span>

            {/* Type badge */}
            <span
              style={{
                fontSize: 9,
                fontWeight: 600,
                color: typeColor(col.dataType),
                background: `${typeColor(col.dataType)}18`,
                border: `1px solid ${typeColor(col.dataType)}30`,
                borderRadius: 4,
                padding: '1px 5px',
                letterSpacing: '0.02em',
                textTransform: 'uppercase',
                flexShrink: 0,
              }}
            >
              {col.dataType}
            </span>
          </div>
        ))}

        {data.columns.length === 0 && (
          <div style={{ padding: '8px 14px', color: '#475569', fontSize: 11, fontStyle: 'italic' }}>
            No columns defined
          </div>
        )}
      </div>
    </div>
  );
}

const NODE_TYPES = { tableNode: TableNode };

/* ─────────────────────────────────────────────────────────
   Layout helper: simple grid positioning
───────────────────────────────────────────────────────── */
const CARD_WIDTH = 250;
const CARD_HEIGHT_BASE = 80; // header + padding
const COL_HEIGHT = 32;
const H_GAP = 80;
const V_GAP = 60;
const COLS_PER_ROW = 3;

function computeLayout(tables) {
  return tables.map((t, i) => {
    const col = i % COLS_PER_ROW;
    const row = Math.floor(i / COLS_PER_ROW);
    const prevInSameRow = tables
      .filter((_, idx) => idx < i && Math.floor(idx / COLS_PER_ROW) === row)
      .reduce(
        (acc, pt) => acc + CARD_WIDTH + H_GAP,
        0
      );
    const tallestInPrevRows = [];
    for (let r = 0; r < row; r++) {
      const rowTables = tables.filter((_, idx) => Math.floor(idx / COLS_PER_ROW) === r);
      const tallest = Math.max(...rowTables.map((pt) => CARD_HEIGHT_BASE + pt.columns.length * COL_HEIGHT));
      tallestInPrevRows.push(tallest);
    }
    const yOffset = tallestInPrevRows.reduce((a, b) => a + b + V_GAP, 0);
    return { x: col * (CARD_WIDTH + H_GAP), y: yOffset };
  });
}

/* ─────────────────────────────────────────────────────────
   Relationship type → label
───────────────────────────────────────────────────────── */
function relLabel(type = '') {
  switch (type.toUpperCase()) {
    case 'ONE_TO_ONE': return '1 : 1';
    case 'ONE_TO_MANY': return '1 : N';
    case 'MANY_TO_MANY': return 'N : N';
    default: return type;
  }
}

/* ─────────────────────────────────────────────────────────
   Main ER Diagram Page
───────────────────────────────────────────────────────── */
export default function ERDiagramPage() {
  const { id } = useParams();
  const { showToast } = useToast();

  const [diagram, setDiagram] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  /* ── Fetch diagram data ── */
  const fetchDiagram = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getWorkspaceDiagram(id);
      setDiagram(data);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to load diagram.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [id, showToast]);

  useEffect(() => {
    fetchDiagram();
  }, [fetchDiagram]);

  /* ── Build react-flow nodes & edges whenever diagram changes ── */
  useEffect(() => {
    if (!diagram) return;

    const positions = computeLayout(diagram.tables);

    // Mark columns that appear as FK source
    const fkColumnIds = new Set(diagram.relationships.map((r) => r.sourceColumnId));

    const flowNodes = diagram.tables.map((table, i) => ({
      id: table.id,
      type: 'tableNode',
      position: positions[i],
      data: {
        ...table,
        columns: table.columns.map((c) => ({
          ...c,
          isForeignKey: fkColumnIds.has(c.id),
        })),
      },
    }));

    const flowEdges = diagram.relationships.map((rel) => ({
      id: rel.id,
      source: rel.sourceTableId,
      target: rel.targetTableId,
      label: relLabel(rel.relationshipType),
      labelStyle: { fontSize: 10, fontWeight: 600, fill: '#94a3b8' },
      labelBgStyle: { fill: '#0f172a', fillOpacity: 0.85 },
      labelBgPadding: [4, 6],
      labelBgBorderRadius: 4,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#6366f1',
        width: 16,
        height: 16,
      },
      style: {
        stroke: '#6366f1',
        strokeWidth: 2,
      },
      type: 'smoothstep',
      animated: rel.relationshipType?.toUpperCase() === 'MANY_TO_MANY',
    }));

    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [diagram, setNodes, setEdges]);

  /* ── Loading ── */
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] space-y-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
        <span className="text-sm text-slate-400">Assembling ER diagram…</span>
      </div>
    );
  }

  /* ── Error ── */
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 text-center">
        <div className="h-12 w-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-red-400 text-sm">{error}</p>
        <button
          onClick={fetchDiagram}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const isEmpty = !diagram || diagram.tables.length === 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── Nav Bar ── */}
      <div className="flex border-b border-slate-800 pb-px gap-6">
        <Link
          to={`/workspaces/${id}`}
          className="text-sm font-medium text-slate-400 hover:text-white pb-2 px-1 transition-colors"
        >
          Overview
        </Link>
        <Link
          to={`/workspaces/${id}/schema`}
          className="text-sm font-medium text-slate-400 hover:text-white pb-2 px-1 transition-colors"
        >
          Schema Builder
        </Link>
        <span className="text-sm font-bold text-indigo-400 border-b-2 border-indigo-400 pb-2 px-1">
          ER Diagram
        </span>
        <Link
          to="/dashboard"
          className="text-sm font-medium text-slate-400 hover:text-white pb-2 px-1 transition-colors"
        >
          SQL Generator
        </Link>
      </div>

      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">
            {diagram?.workspaceName || 'Workspace'} &mdash; ER Diagram
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {diagram?.tables.length ?? 0} tables · {diagram?.relationships.length ?? 0} relationships
            {diagram?.databaseType && (
              <span className="ml-2 inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-slate-800 border border-slate-700 text-slate-300 rounded">
                {diagram.databaseType}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-3 shrink-0">
          <button
            onClick={fetchDiagram}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582M20 20v-5h-.581M4.582 9A7.972 7.972 0 0112 4c4.418 0 8 3.582 8 8M19.418 15A7.972 7.972 0 0112 20c-4.418 0-8-3.582-8-8" />
            </svg>
            Refresh
          </button>
          <Link
            to={`/workspaces/${id}/schema`}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white transition-all shadow shadow-indigo-500/20"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Schema
          </Link>
        </div>
      </div>

      {/* ── Empty state ── */}
      {isEmpty ? (
        <div
          className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-900/20 backdrop-blur-md"
          style={{ minHeight: 480 }}
        >
          <div className="h-16 w-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4">
            <svg className="h-7 w-7 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7.5 3.75H6A2.25 2.25 0 003.75 6v1.5M16.5 3.75H18A2.25 2.25 0 0120.25 6v1.5m0 9V18A2.25 2.25 0 0118 20.25h-1.5M3.75 16.5V18A2.25 2.25 0 006 20.25h1.5" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-white mb-2">No Tables Yet</h2>
          <p className="text-sm text-slate-400 text-center max-w-xs mb-6">
            Add tables to your workspace to see them visualised as an ER diagram here.
          </p>
          <Link
            to={`/workspaces/${id}/schema`}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
          >
            Open Schema Builder →
          </Link>
        </div>
      ) : (
        /* ── React Flow canvas ── */
        <div
          className="rounded-2xl border border-slate-800 overflow-hidden shadow-2xl"
          style={{ height: 620, background: '#060c18' }}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={NODE_TYPES}
            fitView
            fitViewOptions={{ padding: 0.18 }}
            proOptions={{ hideAttribution: true }}
            minZoom={0.2}
            maxZoom={2.5}
          >
            <Background
              color="#1e293b"
              gap={20}
              size={1}
              variant="dots"
            />
            <Controls
              style={{
                background: '#0f172a',
                border: '1px solid #1e293b',
                borderRadius: 10,
              }}
            />
            <MiniMap
              nodeColor="#4f46e5"
              maskColor="rgba(6,12,24,0.85)"
              style={{
                background: '#0f172a',
                border: '1px solid #1e293b',
                borderRadius: 10,
              }}
            />

            {/* Legend */}
            <Panel position="top-right">
              <div
                style={{
                  background: '#0f172a',
                  border: '1px solid #1e293b',
                  borderRadius: 10,
                  padding: '10px 14px',
                  fontSize: 11,
                  color: '#94a3b8',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                <span style={{ fontWeight: 700, fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#475569' }}>Legend</span>
                <span>🔑 Primary Key</span>
                <span>🔗 Foreign Key</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <svg width="18" height="8">
                    <line x1="0" y1="4" x2="18" y2="4" stroke="#6366f1" strokeWidth="2" />
                  </svg>
                  Relationship
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <svg width="18" height="8">
                    <line x1="0" y1="4" x2="18" y2="4" stroke="#6366f1" strokeWidth="2" strokeDasharray="3 2" />
                  </svg>
                  M:N (animated)
                </div>
                <span style={{ color: '#f87171' }}>* Required field</span>
              </div>
            </Panel>
          </ReactFlow>
        </div>
      )}

      {/* ── Relationship table (read-only) ── */}
      {diagram && diagram.relationships.length > 0 && (
        <div className="bg-slate-900/30 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
          <div className="px-6 py-4 border-b border-slate-800 flex items-center gap-3">
            <svg className="h-4 w-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <h2 className="text-sm font-bold text-white">Relationships</h2>
            <span className="ml-auto text-xs text-slate-500">{diagram.relationships.length} defined</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-3 text-left font-semibold">Source Table</th>
                  <th className="px-6 py-3 text-left font-semibold">Source Column</th>
                  <th className="px-6 py-3 text-left font-semibold">Type</th>
                  <th className="px-6 py-3 text-left font-semibold">Target Table</th>
                  <th className="px-6 py-3 text-left font-semibold">Target Column</th>
                </tr>
              </thead>
              <tbody>
                {diagram.relationships.map((rel, i) => (
                  <tr
                    key={rel.id}
                    className={`border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors ${i % 2 === 0 ? '' : 'bg-slate-900/10'}`}
                  >
                    <td className="px-6 py-3 font-medium text-white">{rel.sourceTableName}</td>
                    <td className="px-6 py-3 text-slate-400">{rel.sourceColumnName}</td>
                    <td className="px-6 py-3">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 uppercase tracking-wider">
                        {relLabel(rel.relationshipType)}
                      </span>
                    </td>
                    <td className="px-6 py-3 font-medium text-white">{rel.targetTableName}</td>
                    <td className="px-6 py-3 text-slate-400">{rel.targetColumnName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
