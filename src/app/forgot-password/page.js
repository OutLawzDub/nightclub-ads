'use client';

import { useState } from 'react';
import Link from 'next/link';
import { SimpleCaptcha } from '@/components/SimpleCaptcha';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    
    if (!isCaptchaVerified) {
      setError('Veuillez compléter la vérification mathématique');
      return;
    }
    
    setIsLoading(true);

    try {
      const response = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
      } else {
        setError(data.error || 'Échec de l\'envoi de l\'e-mail de réinitialisation');
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
            Mot de passe oublié ?
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Entrez votre adresse e-mail et nous vous enverrons un lien pour réinitialiser votre mot de passe.
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {message && (
            <div className="bg-green-900 border border-green-700 text-green-200 px-4 py-3 rounded-lg animate__animated animate__fadeInDown">
              {message}
            </div>
          )}
          {error && (
            <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg animate__animated animate__shakeX">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300">
              Adresse e-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-4 py-3 border border-gray-600 bg-gray-700 text-white rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300 hover:bg-gray-600"
              placeholder="Entrez votre e-mail"
            />
          </div>

          <SimpleCaptcha onVerify={setIsCaptchaVerified} />

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 transform transition-all duration-300 hover:scale-105 active:scale-95"
            >
              {isLoading ? 'Envoi...' : 'Envoyer le lien'}
            </button>
          </div>

          <div className="text-center">
            <Link
              href="/"
              className="font-medium text-purple-400 hover:text-purple-300 transition-colors duration-200"
            >
              Retour à la connexion
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

