import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useProject } from "@/contexts/ProjectContext";

// Route guard for mutating pages (create/add/edit): redirects a Viewer who
// navigates here directly back to a safe read-only route, matching the
// enterprise RBAC permission-enforcement pattern (hide the control AND
// guard the route).
export const useRequireEditAccess = (redirectTo: string) => {
  const { canEdit, isLoading } = useProject();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !canEdit) {
      navigate(redirectTo, { replace: true });
    }
  }, [isLoading, canEdit, redirectTo, navigate]);
};
