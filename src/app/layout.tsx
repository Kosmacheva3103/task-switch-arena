import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TaskSwitch Arena',
  description: 'Командный тренажёр переключения задач',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}