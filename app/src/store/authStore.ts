import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthUser } from '../types';

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  setUser: (user: AuthUser) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setUser: (user) => {
        console.log('🔐 [Auth Store] Setting user:', user);

        // Compute active branch based on priority: managedBranch > branch
        const activeBranch = user.managedBranch || user.branch || null;

        console.log('🏢 [Auth Store] Branch resolution:', {
          hasManagedBranch: !!user.managedBranch,
          managedBranchId: user.managedBranch?.id,
          managedBranchName: user.managedBranch?.name,
          hasBranch: !!user.branch,
          branchId: user.branch?.id,
          branchName: user.branch?.name,
          finalActiveBranchId: activeBranch?.id,
          finalActiveBranchName: activeBranch?.name,
        });

        if (!activeBranch) {
          console.warn('⚠️ [Auth Store] No active branch assigned to user! This will cause empty pages.');
          console.warn('⚠️ [Auth Store] User should have either managedBranch or branch assigned.');
        } else {
          console.log('✅ [Auth Store] Active branch set successfully:', {
            id: activeBranch.id,
            name: activeBranch.name,
          });
        }

        set({
          user: { ...user, activeBranch },
          isAuthenticated: true
        });

        console.log('✅ [Auth Store] User state updated. isAuthenticated:', true);
      },
      logout: () => {
        console.log('🚪 [Auth Store] Logging out user');
        set({ user: null, isAuthenticated: false });
        console.log('✅ [Auth Store] User logged out. isAuthenticated:', false);
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
