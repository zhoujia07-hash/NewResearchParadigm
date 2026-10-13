import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'New Research Paradigm · Public Showcase',
  description: 'A simulated indoor navigation story: AI handles routine cases, humans take over at the long tail.',
  icons: { icon: '/icon.svg' },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
