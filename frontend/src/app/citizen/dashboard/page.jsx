import ProtectedPage from '../../../components/auth/ProtectedPage.jsx';
import View from '../../../views/citizen/CitizenDashboard.jsx';

export default function Page() { return <ProtectedPage roles={['CITIZEN']}><View /></ProtectedPage>; }
