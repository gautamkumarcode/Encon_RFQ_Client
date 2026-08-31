import './globals.css';
import React from 'react';
import { cookies } from 'next/headers';
import { Arimo } from 'next/font/google';
import { fetchServerMe } from '@/services/serverAuthService';
import { ProvidersShell } from '@/components/layout/ProvidersShell';

const arimo = Arimo({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-arimo',
  display: 'swap',
});

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies();
  const initialUser = await fetchServerMe(cookieStore.toString());

  return (
    <html lang="en" className={`dark ${arimo.variable}`}>
      <head>
        <title>Encon Command Center | Thermal Engineers Pvt Ltd</title>
        <meta name="description" content="Centralized Operations & SSO Gateway for Encon Thermal Engineers" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Arimo:ital,wght@0,400..700;1,400..700&display=swap" rel="stylesheet" />
      </head>
      <body className={`${arimo.className} bg-obsidian-900 text-slate-100 min-h-screen`}>
        <ProvidersShell initialUser={initialUser}>{children}</ProvidersShell>
      </body>
    </html>
  );
}
