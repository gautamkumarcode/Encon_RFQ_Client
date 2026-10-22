import './globals.css';
import React from 'react';
import { cookies } from 'next/headers';
import { Inter } from 'next/font/google';
import { fetchServerMe } from '@/services/serverAuthService';
import { ProvidersShell } from '@/components/layout/ProvidersShell';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies();
  const initialUser = await fetchServerMe(cookieStore.toString());

  return (
    <html lang="en" className={`dark ${inter.variable}`}>
      <head>
        <title>Encon Command Center | Thermal Engineers Pvt Ltd</title>
        <meta name="description" content="Centralized Operations & SSO Gateway for Encon Thermal Engineers" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.className} bg-obsidian-900 text-slate-100 min-h-screen`}>
        <ProvidersShell initialUser={initialUser}>{children}</ProvidersShell>
      </body>
    </html>
  );
}
