import ProtectedPage from '../../../components/auth/ProtectedPage.jsx';
import View from '../../../views/researcher/EnvironmentalAnalysis.jsx';

export default function Page() { return <ProtectedPage roles={['RESEARCHER', 'RANGER', 'ADMIN']}><View /></ProtectedPage>; }
