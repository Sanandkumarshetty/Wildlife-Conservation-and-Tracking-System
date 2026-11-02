import ProtectedPage from '../../components/auth/ProtectedPage.jsx';
import View from '../../views/Profile.jsx';

export default function Page() { return <ProtectedPage roles={['CITIZEN', 'RANGER', 'RESEARCHER', 'ADMIN']}><View /></ProtectedPage>; }
