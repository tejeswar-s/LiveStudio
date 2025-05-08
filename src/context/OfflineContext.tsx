import React, { createContext, useContext, useState, useEffect } from "react";
import { openDB } from "idb";

interface OfflineContextType {
  offline: boolean;
  pendingSync: boolean;
  setPendingSync: (value: boolean) => void;
}

const OfflineContext = createContext<OfflineContextType | null>(null);

export const OfflineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [offline, setOffline] = useState(!navigator.onLine);
  const [pendingSync, setPendingSync] = useState(false);

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  // Initialize IndexedDB
  useEffect(() => {
    openDB("live-studio", 1, {
      upgrade(db) {
        db.createObjectStore("annotations", { keyPath: "id" });
        db.createObjectStore("pending-sync", { keyPath: "id" });
      },
    });
  }, []);

  return (
    <OfflineContext.Provider value={{ offline, pendingSync, setPendingSync }}>
      {children}
    </OfflineContext.Provider>
  );
};

export const useOffline = () => {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error("useOffline must be used within an OfflineProvider");
  }
  return context;
}; 