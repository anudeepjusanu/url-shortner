import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useProject } from "@/contexts/ProjectContext";

// Bio Pages are personal by nature (not shared team work) and never belong
// to a shared/team project. Redirects away if an enterprise account has a
// shared project (or "All projects") active — same hide-the-nav-entry-AND-
// guard-the-route pattern as useRequireEditAccess.
export const useRequirePersonalProject = (redirectTo: string) => {
  const { isEnterpriseAccount, isPersonalActive, isLoading } = useProject();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && isEnterpriseAccount && !isPersonalActive) {
      navigate(redirectTo, { replace: true });
    }
  }, [isLoading, isEnterpriseAccount, isPersonalActive, redirectTo, navigate]);
};
