import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as workspaceService from '../services/workspaceService.js';
import { useAuth } from './AuthContext.jsx';

const WorkspaceContext = createContext();

export function WorkspaceProvider({ children }) {
  const [workspaces, setWorkspaces] = useState([]);
  const [currentWorkspace, setCurrentWorkspace] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  const fetchWorkspaces = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const list = await workspaceService.listWorkspaces();
      setWorkspaces(list);
      
      // Auto-select workspace if currentWorkspace is not set or not in list
      const savedId = localStorage.getItem('selectedWorkspaceId');
      const found = list.find((w) => w.id === savedId) || list[0] || null;
      setCurrentWorkspace(found);
      if (found) {
        localStorage.setItem('selectedWorkspaceId', found.id);
      } else {
        localStorage.removeItem('selectedWorkspaceId');
      }
    } catch (error) {
      console.error('Failed to fetch workspaces:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Fetch workspaces when user logs in
  useEffect(() => {
    if (isAuthenticated) {
      fetchWorkspaces();
    } else {
      setWorkspaces([]);
      setCurrentWorkspace(null);
      localStorage.removeItem('selectedWorkspaceId');
    }
  }, [isAuthenticated, fetchWorkspaces]);

  const selectWorkspace = (workspace) => {
    setCurrentWorkspace(workspace);
    if (workspace) {
      localStorage.setItem('selectedWorkspaceId', workspace.id);
    } else {
      localStorage.removeItem('selectedWorkspaceId');
    }
  };

  const addWorkspace = async (data) => {
    const newWs = await workspaceService.createWorkspace(data);
    setWorkspaces((prev) => [newWs, ...prev]);
    // If it's the first workspace, select it
    if (workspaces.length === 0) {
      selectWorkspace(newWs);
    }
    return newWs;
  };

  const editWorkspace = async (id, data) => {
    const updated = await workspaceService.updateWorkspace(id, data);
    setWorkspaces((prev) => prev.map((w) => (w.id === id ? updated : w)));
    if (currentWorkspace?.id === id) {
      setCurrentWorkspace(updated);
    }
    return updated;
  };

  const removeWorkspace = async (id) => {
    await workspaceService.deleteWorkspace(id);
    setWorkspaces((prev) => prev.filter((w) => w.id !== id));
    if (currentWorkspace?.id === id) {
      const remaining = workspaces.filter((w) => w.id !== id);
      const nextSel = remaining[0] || null;
      selectWorkspace(nextSel);
    }
  };

  const value = {
    workspaces,
    currentWorkspace,
    isLoading,
    fetchWorkspaces,
    selectWorkspace,
    addWorkspace,
    editWorkspace,
    removeWorkspace,
  };

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}
