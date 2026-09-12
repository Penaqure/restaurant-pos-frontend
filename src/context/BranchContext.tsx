"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { listBranches, Branch } from "@/services/branchService";
import { getActiveBranchId, setActiveBranchId } from "@/lib/branchStorage";

type BranchContextValue = {
  branches: Branch[];
  activeBranchId: string | null;
  // Staff pinned to one branch (cashier/waiter) can't switch; owner/manager can.
  canSwitch: boolean;
  setBranch: (id: string) => void;
  loading: boolean;
};

const BranchContext = createContext<BranchContextValue | undefined>(undefined);

export function BranchProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [activeBranchId, setActiveBranchIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !user.vendorId) {
      setLoading(false);
      return;
    }

    if (user.branchId) {
      setActiveBranchId(user.branchId);
      setActiveBranchIdState(user.branchId);
      setLoading(false);
      return;
    }

    listBranches().then((list) => {
      setBranches(list);
      const stored = getActiveBranchId();
      const initial = (stored && list.some((b) => b.id === stored) ? stored : list[0]?.id) || null;
      setActiveBranchId(initial);
      setActiveBranchIdState(initial);
      setLoading(false);
    });
  }, [user]);

  function setBranch(id: string) {
    setActiveBranchId(id);
    setActiveBranchIdState(id);
  }

  return (
    <BranchContext.Provider
      value={{ branches, activeBranchId, canSwitch: !user?.branchId, setBranch, loading }}
    >
      {children}
    </BranchContext.Provider>
  );
}

export function useBranch() {
  const ctx = useContext(BranchContext);
  if (!ctx) throw new Error("useBranch must be used within a BranchProvider");
  return ctx;
}
