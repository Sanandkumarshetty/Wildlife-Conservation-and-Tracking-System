// async function authRequest(path, body) {
//   const response = await fetch(`/api/auth/${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), credentials: 'same-origin' });
//   const data = await response.json().catch(() => ({}));
//   if (!response.ok) {
//     const error = new Error(data.error || `The server returned HTTP ${response.status}.`);
//     error.status = response.status;
//     throw error;
//   }
//   return data;
// }

// export const login = credentials => authRequest('login', credentials);
// export const register = details => authRequest('register', details);
