import ProtectedPage from '../../../components/auth/ProtectedPage.jsx';
import View from '../../../views/researcher/ResearcherDashboard.jsx';

export default function Page() { return <ProtectedPage roles={['RESEARCHER']}><View /></ProtectedPage>; }
