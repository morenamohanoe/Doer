import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

export const useAdmin = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      user.getIdTokenResult().then((tokenResult) => {
        setIsAdmin(!!tokenResult.claims.admin);
        setLoading(false);
      });
    } else {
      setIsAdmin(false);
      setLoading(false);
    }
  }, [user]);

  return { isAdmin, canAccessAdmin: isAdmin, loading };
};
