import ProtectedPage from '../../../components/auth/ProtectedPage.jsx';
import View from '../../../views/ranger/Patrols.jsx';

export default function Page() { return <ProtectedPage roles={['RANGER']}><View /></ProtectedPage>; }
