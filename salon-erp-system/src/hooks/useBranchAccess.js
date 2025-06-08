import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import branchApi from '../../src/utils/api';

export default function useBranchAccess() {
  const { user } = useAuth();
  const isAdmin = user?.role?.toLowerCase() === 'admin';
  const userBranchId = user?.branchId;

  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await branchApi.getAll();
        const fetchedBranches = res.data || [];

        setBranches(fetchedBranches);

        if (isAdmin) {
          setSelectedBranch(fetchedBranches[0] || null);
        } else {
          const matchedBranch = fetchedBranches.find(
            (b) => b.branch_id === parseInt(userBranchId)
          );
          setSelectedBranch(matchedBranch || null);
        }
      } catch (err) {
        console.error('Error fetching branches:', err);
        setError('Failed to load branches');
      } finally {
        setLoading(false);
      }
    };

    if (user?.role) fetchBranches();
  }, [userBranchId, isAdmin, user?.role]);

  return {
    isAdmin,
    branches,
    selectedBranch,
    setSelectedBranch,
    loading,
    error
  };
}
