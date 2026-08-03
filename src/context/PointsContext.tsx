'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { UserPoints, PointTransaction, LuckySpinHistory } from '@/types';
import { pointsService } from '@/lib/services/points.service';
import { luckySpinService } from '@/lib/services/lucky-spin.service';

interface PointsContextType {
  points: UserPoints | null;
  transactions: PointTransaction[];
  spinHistory: LuckySpinHistory[];
  availablePoints: number;
  canSpin: boolean;
  spinCost: number;
  loading: boolean;
  refreshPoints: () => Promise<void>;
  redeemPoints: (planSlug: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  spin: () => Promise<{ success: boolean; reward?: any; error?: string }>;
}

const PointsContext = createContext<PointsContextType | undefined>(undefined);

export function PointsProvider({ children }: { children: ReactNode }) {
  const [points, setPoints] = useState<UserPoints | null>(null);
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [spinHistory, setSpinHistory] = useState<LuckySpinHistory[]>([]);
  const [availablePoints, setAvailablePoints] = useState(0);
  const [canSpin, setCanSpin] = useState(false);
  const [loading, setLoading] = useState(true);

  const refreshPoints = async () => {
    try {
      setLoading(true);
      const [pointsData, transactionsData, spinData, canSpinData, availableData] = await Promise.all([
        pointsService.getUserPoints(),
        pointsService.getUserTransactions(50),
        luckySpinService.getSpinHistory(20),
        luckySpinService.canSpin(),
        luckySpinService.getAvailablePoints(),
      ]);

      setPoints(pointsData);
      setTransactions(transactionsData);
      setSpinHistory(spinData);
      setCanSpin(canSpinData);
      setAvailablePoints(availableData);
    } catch (error) {
      console.error('Error refreshing points:', error);
    } finally {
      setLoading(false);
    }
  };

  const redeemPoints = async (planSlug: string) => {
    const result = await pointsService.redeemPoints(planSlug);
    if (result.success) {
      await refreshPoints();
    }
    return result;
  };

  const spin = async () => {
    const result = await luckySpinService.spin();
    if (result.success) {
      await refreshPoints();
    }
    return result;
  };

  useEffect(() => {
    refreshPoints();
  }, []);

  return (
    <PointsContext.Provider
      value={{
        points,
        transactions,
        spinHistory,
        availablePoints,
        canSpin,
        spinCost: luckySpinService.SPIN_COST,
        loading,
        refreshPoints,
        redeemPoints,
        spin,
      }}
    >
      {children}
    </PointsContext.Provider>
  );
}

export function usePoints() {
  const context = useContext(PointsContext);
  if (context === undefined) {
    throw new Error('usePoints must be used within a PointsProvider');
  }
  return context;
}