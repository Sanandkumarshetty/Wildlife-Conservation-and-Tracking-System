import ProtectedPage from '../../../components/auth/ProtectedPage.jsx';
import View from '../../../views/researcher/MovementAnalysis.jsx';

export default function Page() { return <ProtectedPage roles={['RESEARCHER']}><View /></ProtectedPage>; }
