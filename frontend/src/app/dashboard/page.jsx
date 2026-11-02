'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import Loading from '../../components/Loading';
const dashboard = { CITIZEN: '/citizen/dashboard', RANGER: '/ranger/dashboard', RESEARCHER: '/researcher/dashboard', ADMIN: '/admin/dashboard' };
export default function Page() { const { user, loading } = useAuth(); const router = useRouter(); useEffect(() => { if (!loading) router.replace(dashboard[user?.role] || '/login'); }, [loading, router, user]); return <Loading />; }