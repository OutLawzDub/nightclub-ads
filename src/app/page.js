'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SimpleCaptcha } from '@/components/SimpleCaptcha';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!isCaptchaVerified) {
      setError('Veuillez compléter la vérification mathématique');
      return;
    }
    
    setIsLoading(true);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log('🔍 [Login] Response data:', data);

      if (response.ok) {
        if (data.token) {
          console.log('✅ [Login] Token received, storing in localStorage');
          localStorage.setItem('authToken', data.token);
          console.log('✅ [Login] Token stored, redirecting to dashboard in 100ms');
          setTimeout(() => {
            console.log('🔄 [Login] Redirecting to /dashboard');
            window.location.href = '/dashboard';
          }, 100);
        } else {
          console.error('❌ [Login] No token in response');
          setError('Token manquant dans la réponse');
        }
      } else {
        console.error('❌ [Login] Login failed:', data.error);
        setError(data.error || 'Échec de la connexion');
      }
    } catch (err) {
      setError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-md w-full space-y-8 p-8 bg-gray-800 rounded-2xl shadow-2xl animate__animated animate__fadeIn">
        <div className="animate__animated animate__fadeInDown">
          <h2 className="mt-6 text-center text-4xl font-extrabold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
            Connexion à votre compte
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg animate__animated animate__shakeX">
              {error}
            </div>
          )}
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="relative block w-full px-4 py-3 border border-gray-600 placeholder-gray-400 text-white bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 hover:bg-gray-600"
                placeholder="Adresse e-mail"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="relative block w-full px-4 py-3 border border-gray-600 placeholder-gray-400 text-white bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 hover:bg-gray-600"
                placeholder="Mot de passe"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <a
                href="/forgot-password"
                className="font-medium text-purple-400 hover:text-purple-300 transition-colors duration-200"
              >
                Mot de passe oublié ?
              </a>
            </div>
          </div>

          <SimpleCaptcha onVerify={setIsCaptchaVerified} />

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 text-sm font-medium rounded-lg text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 transform transition-all duration-300 hover:scale-105 active:scale-95 animate__animated animate__pulse"
            >
              {isLoading ? 'Connexion...' : 'Se connecter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

