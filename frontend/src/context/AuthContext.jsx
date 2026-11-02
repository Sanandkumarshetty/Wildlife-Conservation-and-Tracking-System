// 'use client';

// import { createContext, useContext, useEffect, useMemo, useState } from 'react';
// import { apiRequest } from '../services/api';
// import { login as loginRequest } from '../services/authService';

// const AuthContext = createContext(null);
// const publicProfile = profile => ({ id: profile.user_id ?? profile.id, fullName: profile.full_name ?? profile.fullName, email: profile.email, role: profile.role });

// export function AuthProvider({ children }) {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     let active = true;
//     apiRequest('/profile').then(profile => { if (active) setUser(publicProfile(profile)); })
//       .catch(() => { if (active) setUser(null); })
//       .finally(() => { if (active) setLoading(false); });
//     return () => { active = false; };
//   }, []);

//   useEffect(() => {
//     const onUnauthorized = () => { setUser(null); setLoading(false); };
//     window.addEventListener('wildtrack:unauthorized', onUnauthorized);
//     return () => window.removeEventListener('wildtrack:unauthorized', onUnauthorized);
//   }, []);

//   function setSession(data) {
//     if (!data?.user) throw new Error('The server returned an invalid login response.');
//     const nextUser = publicProfile(data.user);
//     setUser(nextUser);
//     setLoading(false);
//     return nextUser;
//   }

//   async function login(credentials) { return setSession(await loginRequest(credentials)); }
//   async function logout() {
//     try { await fetch('/api/auth/logout', { method: 'POST' }); } finally { setUser(null); setLoading(false); }
//   }

//   const value = useMemo(() => ({ user, loading, login, setSession, logout }), [user, loading]);
//   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
// }

// export function useAuth() {
//   const value = useContext(AuthContext);
//   if (!value) throw new Error('useAuth must be used within AuthProvider');
//   return value;
// }
