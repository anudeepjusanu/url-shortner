import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { projectsAPI } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";

export type ProjectRole =
  | "owner"
  | "admin"
  | "editor"
  | "viewer"
  | "personal-owner";

export interface ProjectSummary {
  id: string;
  name: string;
  isPersonal: boolean;
  role: ProjectRole | null;
  createdAt: string;
}

// Sentinel id for the Account Owner's "All projects" aggregate view.
const ALL_PROJECTS_ID = "__all__";
const ACTIVE_PROJECT_STORAGE_KEY = "snip.activeProjectId";

interface ProjectContextType {
  isEnterpriseAccount: boolean;
  isAccountOwner: boolean;
  sharedProjects: ProjectSummary[];
  personalProject: ProjectSummary | null;
  activeProject: ProjectSummary | null;
  isAllProjectsView: boolean;
  isPersonalActive: boolean;
  isLoading: boolean;
  role: ProjectRole | null;
  canManageUsers: boolean;
  canEdit: boolean;
  setActiveProjectId: (id: string | null) => void;
  refresh: () => Promise<void>;
  createProject: (name: string) => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error("useProject must be used within a ProjectProvider");
  }
  return context;
};

export const ProjectProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated } = useAuth();

  const [sharedProjects, setSharedProjects] = useState<ProjectSummary[]>([]);
  const [personalProject, setPersonalProject] = useState<ProjectSummary | null>(
    null,
  );
  const [isAccountOwner, setIsAccountOwner] = useState(false);
  // Not known from the AuthContext user object (which doesn't reliably carry
  // organization membership across every login path) — derived instead from
  // whether /api/projects actually returned any projects.
  const [isEnterpriseAccount, setIsEnterpriseAccount] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeProjectId, setActiveProjectIdState] = useState<string | null>(
    () => localStorage.getItem(ACTIVE_PROJECT_STORAGE_KEY),
  );

  const load = useCallback(async () => {
    if (!isAuthenticated) {
      setSharedProjects([]);
      setPersonalProject(null);
      setIsAccountOwner(false);
      setIsEnterpriseAccount(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await projectsAPI.list();
      if (response.success) {
        const shared = response.data.sharedProjects || [];
        const personal = response.data.personalProject || null;
        setSharedProjects(shared);
        setPersonalProject(personal);
        setIsAccountOwner(!!response.data.isAccountOwner);
        setIsEnterpriseAccount(
          !!response.data.isAccountOwner || shared.length > 0 || !!personal,
        );
      }
    } catch (error) {
      console.error("Failed to load projects:", error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    load();
  }, [load]);

  // Pick a sensible default once projects are loaded: the personal project
  // (pinned first) if nothing valid is already selected.
  useEffect(() => {
    if (isLoading || !isEnterpriseAccount) return;
    if (activeProjectId === ALL_PROJECTS_ID) return;

    const knownIds = [
      personalProject?.id,
      ...sharedProjects.map((p) => p.id),
    ].filter(Boolean);
    if (activeProjectId && knownIds.includes(activeProjectId)) return;

    const fallback = personalProject?.id || sharedProjects[0]?.id || null;
    if (fallback) {
      setActiveProjectIdState(fallback);
      localStorage.setItem(ACTIVE_PROJECT_STORAGE_KEY, fallback);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, isEnterpriseAccount, sharedProjects, personalProject]);

  const setActiveProjectId = (id: string | null) => {
    const value = id ?? ALL_PROJECTS_ID;
    setActiveProjectIdState(value);
    localStorage.setItem(ACTIVE_PROJECT_STORAGE_KEY, value);
  };

  const isAllProjectsView =
    isEnterpriseAccount && activeProjectId === ALL_PROJECTS_ID;
  const activeProject = isAllProjectsView
    ? null
    : [personalProject, ...sharedProjects].find(
        (p) => p?.id === activeProjectId,
      ) || null;

  const isPersonalActive = !!activeProject?.isPersonal;
  const role: ProjectRole | null = isAllProjectsView
    ? isAccountOwner
      ? "owner"
      : null
    : (activeProject?.role ?? null);

  const canManageUsers =
    isEnterpriseAccount && (role === "owner" || role === "admin");
  // Solo (non-enterprise) accounts keep today's unrestricted behavior.
  const canEdit =
    !isEnterpriseAccount ||
    ["owner", "admin", "editor", "personal-owner"].includes(role || "");

  const createProject = async (name: string) => {
    await projectsAPI.create(name);
    await load();
  };

  const value: ProjectContextType = {
    isEnterpriseAccount,
    isAccountOwner,
    sharedProjects,
    personalProject,
    activeProject,
    isAllProjectsView,
    isPersonalActive,
    isLoading,
    role,
    canManageUsers,
    canEdit,
    setActiveProjectId,
    refresh: load,
    createProject,
  };

  return (
    <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
  );
};
