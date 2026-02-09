import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ProctorGuard - Staff Portal',
  description: 'Staff management portal for ProctorGuard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
