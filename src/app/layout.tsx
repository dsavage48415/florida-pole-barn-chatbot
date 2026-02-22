import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Ask Florida Pole Barn — AI Chatbot',
  description:
    'Ask questions about pole barn construction and get expert AI-powered answers from 1,860+ analyzed videos.',
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
