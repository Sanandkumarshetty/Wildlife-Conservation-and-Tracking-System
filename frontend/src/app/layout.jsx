import '../index.css';
import '../ui.css';
import { AuthProvider } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export const metadata = {
  title: 'Wildlife Conservation and Tracking',
  description: 'Wildlife conservation, sightings, research, and ranger coordination.',
};

export default function RootLayout({ children }) {
  return <html lang="en"><body><AuthProvider><div className="app-shell"><Navbar /><main className="main-content">{children}</main><Footer /></div></AuthProvider></body></html>;
}
