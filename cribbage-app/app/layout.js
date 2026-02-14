import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Cribbage - Free Online Cribbage Card Game",
  description: "Play cribbage online for free. Classic card game with pegging, hand counting, muggins rule, and smart computer opponent. No download required - play in your browser.",
  metadataBase: new URL('https://cribbage.chrisk.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Cribbage - Free Online Cribbage Card Game',
    description: 'Play cribbage online for free. Classic card game with pegging, hand counting, and smart computer opponent.',
    url: 'https://cribbage.chrisk.com',
    siteName: 'Cribbage',
    type: 'website',
    locale: 'en_US',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
