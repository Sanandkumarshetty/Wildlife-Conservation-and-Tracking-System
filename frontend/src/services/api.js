// export const API_URL = '/api/backend';

// export async function apiRequest(path, options = {}) {
//   let response;
//   try {
//     response = await fetch(`${API_URL}${path}`, {
//       ...options,
//       credentials: 'same-origin',
//       headers: { 'Content-Type': 'application/json', ...options.headers },
//     });
//   } catch {
//     throw new Error('Cannot reach the WildLife API. Confirm the Next.js frontend and Express backend are running.');
//   }
//   if (response.status === 401) window.dispatchEvent(new Event('wildtrack:unauthorized'));
//   if (!response.ok) {
//     const result = await response.json().catch(() => ({}));
//     const error = new Error(result.error || `The server returned HTTP ${response.status}.`);
//     error.status = response.status;
//     throw error;
//   }
//   return response.status === 204 ? null : response.json();
// }
