import ProtectedPage from '../../../components/auth/ProtectedPage.jsx';
import View from '../../../views/citizen/ReportDetails.jsx';

export default function Page() { return <ProtectedPage roles={['CITIZEN', 'RANGER', 'ADMIN']}><View /></ProtectedPage>; }
