import ProtectedPage from '../../../components/auth/ProtectedPage.jsx';
import View from '../../../views/ranger/RangerDashboard.jsx';

export default function Page() { return <ProtectedPage roles={['RANGER']}><View /></ProtectedPage>; }
