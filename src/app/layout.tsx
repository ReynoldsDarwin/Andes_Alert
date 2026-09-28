import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Andes Alert - Taraco / Huancané',
  description: 'Sistema de alerta climática temprana',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="light">
      <body className="min-h-screen bg-slate-100 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
        {children}
      </body>
    </html>
  );
}