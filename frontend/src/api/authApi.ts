const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/learner';

export async function login(email: string, password: string) {
  const response = await fetch(`${API_BASE_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Erreur de connexion');
  }

  return response.json();
}

export async function register(data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  company?: string;
  position?: string;
}) {
  const response = await fetch(`${API_BASE_URL}/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Erreur lors de l\'inscription');
  }

  return response.json();
} 