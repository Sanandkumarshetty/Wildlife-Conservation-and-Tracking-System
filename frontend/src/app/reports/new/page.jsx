import ProtectedPage from '../../../components/auth/ProtectedPage.jsx';
import View from '../../../views/citizen/ReportSuspiciousActivity.jsx';

export default function Page() { return <ProtectedPage roles={['CITIZEN']}><View /></ProtectedPage>; }
