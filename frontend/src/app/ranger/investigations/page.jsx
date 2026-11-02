import ProtectedPage from '../../../components/auth/ProtectedPage.jsx';
import View from '../../../views/ranger/Investigations.jsx';

export default function Page() { return <ProtectedPage roles={['RANGER', 'ADMIN']}><View /></ProtectedPage>; }
