'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import Loading from '../Loading';
import RoleWorkspace from '../RoleWorkspace';

const dashboard = { CITIZEN: '/citizen/dashboard', RANGER: '/ranger/dashboard', RESEARCHER: '/researcher/dashboard', ADMIN: '/admin/dashboard' };

export default function ProtectedPage({ roles, children }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const allowed = Boolean(user && roles.includes(user.role));

  useEffect(() => {
    if (!loading && !allowed) router.replace(user ? (dashboard[user.role] || '/') : '/login');
  }, [allowed, loading, router, user]);

  if (loading || !allowed) return <Loading />;
  return <RoleWorkspace role={user.role}>{children}</RoleWorkspace>;
}
