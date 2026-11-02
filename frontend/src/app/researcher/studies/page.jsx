import ProtectedPage from '../../../components/auth/ProtectedPage.jsx';
import View from '../../../views/researcher/Studies.jsx';

export default function Page() { return <ProtectedPage roles={['RESEARCHER']}><View /></ProtectedPage>; }
