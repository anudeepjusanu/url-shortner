import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

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
  addUTMLink: (link: Omit<UTMLink, "id" | "createdAt">) => UTMLink;
  deleteUTMLink: (id: string) => void;
}

const UTM_STORAGE_KEY = "utm_builder_links";

const UTMContext = createContext<UTMContextValue | undefined>(undefined);

export const UTMProvider = ({ children }: { children: React.ReactNode }) => {
  const [utmLinks, setUtmLinks] = useState<UTMLink[]>(() => {
    try {
      const stored = localStorage.getItem(UTM_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(utmLinks));
  }, [utmLinks]);

  const addUTMLink = useCallback((link: Omit<UTMLink, "id" | "createdAt">): UTMLink => {
    const newLink: UTMLink = {
      ...link,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setUtmLinks((prev) => [newLink, ...prev]);
    return newLink;
  }, []);

  const deleteUTMLink = useCallback((id: string) => {
    setUtmLinks((prev) => prev.filter((link) => link.id !== id));
  }, []);

  return (
    <UTMContext.Provider value={{ utmLinks, addUTMLink, deleteUTMLink }}>
      {children}
    </UTMContext.Provider>
  );
};

export const useUTM = () => {
  const context = useContext(UTMContext);
  if (!context) throw new Error("useUTM must be used within UTMProvider");
  return context;
};
