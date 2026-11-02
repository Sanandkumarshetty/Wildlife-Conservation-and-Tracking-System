import ProtectedPage from '../../../components/auth/ProtectedPage.jsx';
import View from '../../../views/citizen/MyReports.jsx';

export default function Page() { return <ProtectedPage roles={['CITIZEN']}><View /></ProtectedPage>; }
