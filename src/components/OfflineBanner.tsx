import React from "react";
import { useOffline } from "../context/OfflineContext";

const OfflineBanner: React.FC = () => {
  const { offline, pendingSync } = useOffline();

  if (!offline) return null;

  return (
    <div className="bg-yellow-500 text-black text-center py-2 px-4">
      <p>
        You are currently offline. Changes will be saved locally and synced when
        you're back online.
        {pendingSync && " You have pending changes to sync."}
      </p>
    </div>
  );
};

export default OfflineBanner; 