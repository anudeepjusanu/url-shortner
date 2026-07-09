import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { utmLinkService, UtmLinkPayload } from "@/services/jwtService";
import { useAuth } from "@/contexts/AuthContext";

export interface UTMLink {
  id: string;
  name?: string;
  destinationUrl: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  createdAt: string;
  fullTaggedUrl: string;
}

interface UTMContextValue {
  utmLinks: UTMLink[];
  isLoading: boolean;
  addUTMLink: (link: Omit<UTMLink, "id" | "createdAt">) => Promise<UTMLink>;
  deleteUTMLink: (id: string) => Promise<void>;
}

const mapFromApi = (raw: any): UTMLink => ({
  id: raw._id,
  name: raw.name ?? undefined,
  destinationUrl: raw.destinationUrl,
  utmSource: raw.utmSource ?? undefined,
  utmMedium: raw.utmMedium ?? undefined,
  utmCampaign: raw.utmCampaign ?? undefined,
  utmTerm: raw.utmTerm ?? undefined,
  utmContent: raw.utmContent ?? undefined,
  createdAt: raw.createdAt,
  fullTaggedUrl: raw.fullTaggedUrl,
});

const UTMContext = createContext<UTMContextValue | undefined>(undefined);

export const UTMProvider = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  const [utmLinks, setUtmLinks] = useState<UTMLink[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refetch = useCallback(async () => {
    if (!isAuthenticated) {
      setUtmLinks([]);
      return;
    }
    setIsLoading(true);
    try {
      const res: any = await utmLinkService.getAll();
      const links = (res?.data?.utmLinks ?? []).map(mapFromApi);
      setUtmLinks(links);
    } catch {
      // silently ignore — UTM Builder page shows its own empty state
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const addUTMLink = useCallback(
    async (link: Omit<UTMLink, "id" | "createdAt">): Promise<UTMLink> => {
      const payload: UtmLinkPayload = {
        name: link.name,
        destinationUrl: link.destinationUrl,
        utmSource: link.utmSource,
        utmMedium: link.utmMedium,
        utmCampaign: link.utmCampaign,
        utmTerm: link.utmTerm,
        utmContent: link.utmContent,
      };
      const res: any = await utmLinkService.create(payload);
      const newLink = mapFromApi(res.data.utmLink);
      setUtmLinks((prev) => [newLink, ...prev]);
      return newLink;
    },
    [],
  );

  const deleteUTMLink = useCallback(async (id: string) => {
    await utmLinkService.delete(id);
    setUtmLinks((prev) => prev.filter((link) => link.id !== id));
  }, []);

  return (
    <UTMContext.Provider value={{ utmLinks, isLoading, addUTMLink, deleteUTMLink }}>
      {children}
    </UTMContext.Provider>
  );
};

export const useUTM = () => {
  const context = useContext(UTMContext);
  if (!context) throw new Error("useUTM must be used within UTMProvider");
  return context;
};
