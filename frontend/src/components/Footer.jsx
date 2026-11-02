// 'use client';

// import Link from 'next/link';
// import { useAuth } from '../context/AuthContext';

// const roleLinks = {
//   CITIZEN: [['Map', '/map'], ['Sightings', '/sightings'], ['Projects', '/projects'], ['My reports', '/citizen/reports']],
//   RANGER: [['Map', '/map'], ['Sightings', '/sightings'], ['Reports', '/ranger/reports'], ['Patrols', '/ranger/patrols']],
//   RESEARCHER: [['Sightings', '/sightings'], ['Projects', '/projects'], ['Studies', '/researcher/studies'], ['Movements', '/researcher/movements']],
//   ADMIN: [['Map', '/map'], ['Sightings', '/sightings'], ['Projects', '/projects'], ['Users', '/admin/users']],
// };

// export default function Footer() {
//   const { user } = useAuth();
//   const links = user ? roleLinks[user.role] || [] : [];
//   return <footer className="footer">
//     <div className="footer-grid">
//       <div><Link className="brand" href="/">WildLife</Link><p>Conservation through shared knowledge, careful reporting, and regional collaboration.</p></div>
//       <div><h3>Explore</h3><p><Link href="/wildlife">Wildlife species</Link></p></div>
//       <div><h3>{user ? 'Your workspace' : 'Learn'}</h3>{user ? links.map(([label, href]) => <p key={href}><Link href={href}>{label}</Link></p>) : <p><Link href="/about">About the project</Link></p>}</div>
//     </div>
//     <small>WildLife Conservation and Monitoring · Location access follows account permissions.</small>
//   </footer>;
// }
