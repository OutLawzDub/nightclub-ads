import './globals.css';
import 'animate.css';
import { ToasterProvider } from '../components/toaster';

export const metadata = {
  title: 'Nightclub Ads - Gestion des utilisateurs',
  description: 'Tableau de bord de gestion des utilisateurs pour Nightclub Ads',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-gray-900 text-white" suppressHydrationWarning style={{ fontFamily: "'Roboto', sans-serif" }}>
        {children}
        <ToasterProvider />
      </body>
    </html>
  );
}

