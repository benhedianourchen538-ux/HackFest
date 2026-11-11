// Toutes les requêtes vers l'API Express passent par ce fichier.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const TOKEN_KEY = 'hackfest_token';

export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export class ApiError extends Error {
  constructor(message, status, errors = {}) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

async function request(path, { method = 'GET', body, params } = {}) {
  const url = new URL(API_URL + path);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value);
    });
  }

  const headers = { 'Content-Type': 'application/json' };
  const token = tokenStorage.get();
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
  } catch {
    throw new ApiError('Impossible de joindre le serveur. Vérifie que l’API est lancée.', 0);
  }

  if (response.status === 204) return null;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(data.message || 'Une erreur est survenue.', response.status, data.errors);
  return data;
}

export const api = {
  // Authentification
  login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password } }),
  register: (payload) => request('/auth/register', { method: 'POST', body: payload }),
  me: () => request('/auth/me'),

  // Hackathons
  getHackathons: (params) => request('/hackathons', { params }),
  getHackathon: (id) => request(`/hackathons/${id}`),
  getMesPublications: () => request('/hackathons/mine'),
  getInscrits: (id) => request(`/hackathons/${id}/inscrits`),
  publierHackathon: (payload) => request('/hackathons', { method: 'POST', body: payload }),
  supprimerHackathon: (id) => request(`/hackathons/${id}`, { method: 'DELETE' }),

  // Inscriptions
  sInscrire: (id, payload) => request(`/hackathons/${id}/inscriptions`, { method: 'POST', body: payload }),
  getMesInscriptions: () => request('/inscriptions/me'),
  annulerInscription: (id) => request(`/inscriptions/${id}`, { method: 'DELETE' }),

  // Contact
  envoyerMessage: (payload) => request('/contact', { method: 'POST', body: payload }),
};
