import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Tablas de Multiplicación',
  description:
    'Juego de tablas de multiplicación para niños y no tan niños. Elegí la dificultad y los números a multiplicar.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0"
        />
        <title>Tablas de Multiplicación</title>
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
