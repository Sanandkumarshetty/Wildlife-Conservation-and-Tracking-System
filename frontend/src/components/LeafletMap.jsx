// 'use client';
// import { useEffect, useRef, useState } from 'react';

// let leafletPromise;
// const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({
//   '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
// }[char]));

// function loadLeaflet() {
//   if (window.L) return Promise.resolve(window.L);
//   if (!leafletPromise) {
//     leafletPromise = new Promise((resolve, reject) => {
//       const css = document.createElement('link');
//       css.rel = 'stylesheet';
//       css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
//       document.head.appendChild(css);

//       const script = document.createElement('script');
//       script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
//       script.onload = () => resolve(window.L);
//       script.onerror = () => {
//         leafletPromise = undefined;
//         reject(new Error('Map library could not be loaded'));
//       };
//       document.head.appendChild(script);
//     });
//   }
//   return leafletPromise;
// }

// export default function LeafletMap({
//   sightings = [], reports = [], movements = [], regions = [],
//   selectLocation, center = [11.8, 76.1], zoom = 8,
// }) {
//   const node = useRef(null);
//   const map = useRef(null);
//   const selectionMarker = useRef(null);
//   const layers = useRef({});
//   const [ready, setReady] = useState(false);
//   const [error, setError] = useState('');

//   useEffect(() => {
//     let alive = true;
//     loadLeaflet().then(L => {
//       if (!alive || !node.current) return;
//       const instance = L.map(node.current).setView(center, zoom);
//       L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//         maxZoom: 19,
//         attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
//       }).addTo(instance);

//       layers.current = {
//         sightings: L.layerGroup().addTo(instance),
//         reports: L.layerGroup(),
//         movements: L.layerGroup(),
//         regions: L.layerGroup(),
//       };
//       instance.on('click', event => {
//         selectionMarker.current?.setLatLng(event.latlng);
//         if (!selectionMarker.current) {
//           selectionMarker.current = L.circleMarker(event.latlng, {
//             radius: 8, color: '#7f1d1d', weight: 2, fillColor: '#ef4444', fillOpacity: 0.95,
//           }).addTo(instance);
//         }
//         selectLocation?.({
//           latitude: +event.latlng.lat.toFixed(6),
//           longitude: +event.latlng.lng.toFixed(6),
//         });
//       });
//       map.current = instance;
//       setReady(true);
//     }).catch(loadError => { if (alive) setError(loadError.message); });

//     return () => {
//       alive = false;
//       map.current?.remove();
//       map.current = null;
//       selectionMarker.current = null;
//     };
//   }, []);

//   useEffect(() => {
//     const L = window.L;
//     if (!ready || !L || !map.current) return;

//     for (const group of Object.values(layers.current)) group.clearLayers();
//     for (const item of sightings) {
//       if (item.latitude == null || item.longitude == null) continue;
//       L.circleMarker([Number(item.latitude), Number(item.longitude)], {
//         radius: 7, color: '#14532d', fillColor: '#22c55e', fillOpacity: 0.9,
//       }).bindPopup(`<strong>${esc(item.common_name || 'Wildlife sighting')}</strong><br><i>${esc(item.scientific_name || '')}</i><br>${esc(item.region_name)}<br>${esc(new Date(item.sighting_time).toLocaleString())}<br>${esc(item.status)}`).addTo(layers.current.sightings);
//     }
//     for (const item of reports) {
//       if (item.latitude == null || item.longitude == null) continue;
//       L.circleMarker([Number(item.latitude), Number(item.longitude)], {
//         radius: 8, color: '#991b1b', fillColor: '#ef4444', fillOpacity: 0.9,
//       }).bindPopup(`<strong>Report #${esc(item.report_id)}</strong><br>${esc(item.activity_type)}<br>${esc(item.region_name)}<br>${esc(item.status)}`).addTo(layers.current.reports);
//     }
//     for (const item of movements) {
//       if (item.latitude == null || item.longitude == null) continue;
//       L.circleMarker([Number(item.latitude), Number(item.longitude)], {
//         radius: 5, color: '#1d4ed8', fillColor: '#60a5fa', fillOpacity: 0.85,
//       }).bindPopup(`<strong>Movement point</strong><br>${esc(new Date(item.observed_at || item.checkpoint_time).toLocaleString())}`).addTo(layers.current.movements);
//     }
//     for (const item of regions) {
//       try {
//         const geometry = typeof item.geometry === 'string' ? JSON.parse(item.geometry) : item.geometry;
//         if (geometry) L.geoJSON(geometry, {
//           style: { color: '#15803d', weight: 2, fillColor: '#86efac', fillOpacity: 0.12 },
//         }).bindPopup(`<strong>${esc(item.region_name)}</strong><br>${Number(item.verified_sightings || 0)} verified sightings`).addTo(layers.current.regions);
//       } catch { /* Ignore a malformed optional region geometry. */ }
//     }
//   }, [ready, sightings, reports, movements, regions]);

//   function toggle(key, visible) {
//     const group = layers.current[key];
//     if (!group || !map.current) return;
//     if (visible) group.addTo(map.current);
//     else map.current.removeLayer(group);
//   }

//   return <div>
//     <div className="toolbar map-layers">
//       {[
//         ['sightings', 'Wildlife sightings', true],
//         ['reports', 'Suspicious reports', false],
//         ['regions', 'Protected regions', false],
//         ['movements', 'Animal movements', false],
//       ].map(([key, label, checked]) => <label key={key}>
//         <input type="checkbox" defaultChecked={checked} onChange={event => toggle(key, event.target.checked)} />{label}
//       </label>)}
//     </div>
//     {error && <p className="alert">{error}. Map tiles and library require an internet connection.</p>}
//     <div className="map-frame"><div ref={node} className="leaflet-container" aria-label="Map of wildlife conservation records" /></div>
//     <small className="muted">Map tiles © OpenStreetMap contributors. Coordinates shown depend on your access permissions.</small>
//   </div>;
// }
