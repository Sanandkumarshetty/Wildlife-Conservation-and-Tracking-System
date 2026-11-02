// 'use client';

// import Link from 'next/link';
// import { useAuth } from '../context/AuthContext';

// const roleLinks = {
//   CITIZEN: [
//     ['About', '/about'], ['Wildlife', '/wildlife'], ['Map', '/map'], ['Sightings', '/sightings'], ['Projects', '/projects'],
//     ['Dashboard', '/citizen/dashboard'], ['Profile', '/profile'],
//   ],
//   RANGER: [
//     ['Wildlife', '/wildlife'], ['Map', '/map'], ['Sightings', '/sightings'], ['Reports', '/ranger/reports'],
//     ['Investigations', '/ranger/investigations'], ['Patrols', '/ranger/patrols'], ['Dashboard', '/ranger/dashboard'],
//   ],
//   RESEARCHER: [
//     ['Wildlife', '/wildlife'], ['Sightings', '/sightings'], ['Projects', '/projects'], ['Animals', '/researcher/animals'],
//     ['Studies', '/researcher/studies'], ['Movements', '/researcher/movements'], ['Environment', '/researcher/environment'],
//     ['Publications', '/researcher/publications'], ['Dashboard', '/researcher/dashboard'],
//   ],
//   ADMIN: [
//     ['About', '/about'], ['Wildlife', '/wildlife'], ['Map', '/map'], ['Sightings', '/sightings'], ['Projects', '/projects'],
//     ['Reports', '/admin/reports'], ['Users', '/admin/users'], ['Regions', '/admin/regions'], ['Audit', '/admin/audit'],
//     ['Dashboard', '/admin/dashboard'], ['Profile', '/profile'],
//   ],
// };

// export default function Navbar() {
//   const { user, loading, logout } = useAuth();
//   const links = user ? roleLinks[user.role] || [] : [];

//   return <header className="navbar">
//     <Link className="brand" href="/">WildLife</Link>
//     <nav className="nav-links" aria-label="Main navigation">
//       {loading ? <>
//         <Link href="/about">About</Link>
//         <Link href="/wildlife">Wildlife</Link>
//         <Link href="/login">Login</Link>
//         <Link className="button small nav-signup" href="/signup">Sign up</Link>
//       </> : user ? <>
//         {links.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
//         <button type="button" onClick={logout}>Logout</button>
//       </> : <>
//         <Link href="/about">About</Link>
//         <Link href="/wildlife">Wildlife</Link>
//         <Link href="/login">Login</Link>
//         <Link className="button small nav-signup" href="/signup">Sign up</Link>
//       </>}
//     </nav>
//   </header>;
// }
