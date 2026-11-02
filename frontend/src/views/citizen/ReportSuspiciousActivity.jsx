'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '../../services/api';
import LeafletMap from '../../components/LeafletMap';

const types = ['POSSIBLE_POACHING', 'SUSPICIOUS_VEHICLE', 'ILLEGAL_FOREST_ENTRY', 'WILDLIFE_TRAFFICKING', 'ANIMAL_IN_DANGER', 'OTHER'];
const toDataUrl = file => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

export default function ReportSuspiciousActivity() {
  const router = useRouter();
  const lookupSequence = useRef(0);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');
  const [locationLabel, setLocationLabel] = useState('Click a location on the map');
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    regionId: null,
    locationName: '',
    activityType: types[0],
    reportedAt: new Date().toISOString().slice(0, 16),
    latitude: '',
    longitude: '',
    description: '',
  });

  function choose(patch) {
    setForm(current => ({ ...current, ...patch }));
  }

  async function selectMapLocation({ latitude, longitude }) {
    const requestId = ++lookupSequence.current;
    const fallback = `Outside protected regions (${latitude.toFixed(5)}, ${longitude.toFixed(5)})`;
    choose({ latitude: String(latitude), longitude: String(longitude), regionId: null, locationName: '' });
    setLocationLabel('Detecting location...');
    setError('');
    try {
      const result = await apiRequest(`/regions/locate?latitude=${encodeURIComponent(latitude)}&longitude=${encodeURIComponent(longitude)}`);
      if (requestId !== lookupSequence.current) return;
      const name = result.locationName || fallback;
      choose({ regionId: result.regionId ?? null, locationName: name });
      setLocationLabel(result.geocoder === 'unavailable' ? `${fallback} — reverse geocoding unavailable; coordinates can still be submitted` : name);
    } catch {
      if (requestId !== lookupSequence.current) return;
      choose({ regionId: null, locationName: fallback });
      setLocationLabel(`${fallback} (location lookup unavailable)`);
    }
  }

  async function submit(event) {
    event.preventDefault();
    setError('');
    setDone('');
    const invalid = files.find(file => file.size > 5 * 1024 * 1024 || !['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(file.type));
    if (invalid) return setError(`${invalid.name} is unsupported or exceeds 5 MB.`);
    if (!form.latitude || !form.longitude || !form.locationName) return setError('Select a point on the map and wait for its location to be detected.');

    setBusy(true);
    let reportId;
    try {
      const result = await apiRequest('/reports', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          latitude: Number(form.latitude),
          longitude: Number(form.longitude),
          reportedAt: form.reportedAt.replace('T', ' '),
        }),
      });
      reportId = result.reportId;
      for (const file of files) {
        await apiRequest(`/reports/${reportId}/evidence`, {
          method: 'POST',
          body: JSON.stringify({ fileName: file.name, mimeType: file.type, data: await toDataUrl(file) }),
        });
      }
      setDone(`Report #${reportId} submitted${files.length ? ` with ${files.length} evidence file(s)` : ' without evidence'}. Status: PENDING.`);
      setTimeout(() => router.push('/citizen/reports'), 1000);
    } catch (submitError) {
      setError(reportId ? `Report #${reportId} was created, but its evidence upload failed: ${submitError.message}` : submitError.message);
      if (reportId) setTimeout(() => router.push(`/reports/${reportId}`), 1800);
    } finally {
      setBusy(false);
    }
  }

  return <section>
    <span className="eyebrow">Private report</span>
    <h1 className="page-heading">Report suspicious activity</h1>
    <p className="muted">Your report is visible to you and authorized rangers for its protected region. Reports outside protected regions are available to administrators.</p>
    <div className="content-layout">
      <form className="form" onSubmit={submit}>
        <label>Region / Location<input aria-label="Detected region or location" readOnly value={locationLabel}/></label>
        <label>Activity type<select required value={form.activityType} onChange={event => choose({ activityType: event.target.value })}>{types.map(type => <option key={type}>{type}</option>)}</select></label>
        <label>Date and time<input type="datetime-local" required value={form.reportedAt} onChange={event => choose({ reportedAt: event.target.value })}/></label>
        <div className="form-row">
          <label>Latitude<input type="number" step="any" min="-90" max="90" required readOnly value={form.latitude}/></label>
          <label>Longitude<input type="number" step="any" min="-180" max="180" required readOnly value={form.longitude}/></label>
        </div>
        <label>Description<textarea required value={form.description} onChange={event => choose({ description: event.target.value })}/></label>
        <label>Evidence files (optional; JPEG, PNG, WebP, PDF; 5 MB each)<input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" multiple onChange={event => { setFiles(Array.from(event.target.files || [])); setError(''); }}/></label>
        {error && <p className="alert" role="alert">{error}</p>}
        {done && <p className="success" role="status">{done}</p>}
        <button className="button danger" disabled={busy}>{busy ? 'Submitting...' : 'Submit report'}</button>
      </form>
      <div>
        <p className="muted">Click anywhere on the map to set the report coordinates and detect its location.</p>
        <LeafletMap selectLocation={selectMapLocation}/>
        <small className="muted">Location names © OpenStreetMap contributors (ODbL).</small>
      </div>
    </div>
  </section>;
}
