import { useAuth } from "@/contexts/AuthContext";

/**
 * Returns a smart link resolver for auth-aware navigation.
 * smartLink(guestRoute, authRoute?) → authRoute (or /dashboard) when logged in, guestRoute otherwise.
 */
export function useSmartLink() {
  const { isAuthenticated } = useAuth();

  const smartLink = (guestRoute: string, authRoute?: string): string => {
    if (!isAuthenticated) return guestRoute;
    return authRoute ?? "/dashboard";
  };

  return { smartLink, isAuthenticated };
}
