import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Script from 'next/script';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const GA_ID = process.env.NEXT_PUBLIC_GA_ID || 'G-ZF1FSM8N07';

export const metadata: Metadata = {
  title: 'Color Palette Extractor — Get a Color Palette From Any Photo or Logo Free',
  description:
    'Extract a color palette from any photo or logo free online. Get HEX codes to copy for Canva, Figma, branding and home decor. No upload, no sign-up.',
  metadataBase: new URL('https://tools.abidmahmud.cv'),
  alternates: {
    canonical: '/palette-extractor',
  },
  openGraph: {
    type: 'website',
    url: 'https://tools.abidmahmud.cv/palette-extractor',
    title: 'Color Palette Extractor — Get a Color Palette From Any Photo or Logo Free',
    description:
      'Extract a color palette from any photo or logo free online. Get HEX codes to copy for Canva, Figma, branding and home decor. No upload, no sign-up.',
    siteName: 'Abid Mahmud Tools',
    images: [
      {
        url: 'https://www.abidmahmud.cv/portfolio/image-8alhqtH1Md4dMuVzWc9h9zGXzle4X4-CX4u5bOLrtBzKEgBwedaKhTBilZZZQ.webp',
        width: 1200,
        height: 630,
        alt: 'Color Palette Extractor by Abid Mahmud',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Color Palette Extractor — Get a Color Palette From Any Photo or Logo Free',
    description:
      'Extract a color palette from any photo or logo free online. Get HEX codes to copy for Canva, Figma, branding and home decor. No upload, no sign-up.',
    creator: '@abirabidog',
    images: [
      'https://www.abidmahmud.cv/portfolio/image-8alhqtH1Md4dMuVzWc9h9zGXzle4X4-CX4u5bOLrtBzKEgBwedaKhTBilZZZQ.webp',
    ],
  },
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        {/* Google tag (gtag.js) */}
        <Script
          strategy="afterInteractive"
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        />
        <Script
          id="google-analytics"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_ID}', {
                page_path: window.location.pathname,
              });
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-white text-[#0B0B0D] antialiased flex flex-col font-sans selection:bg-[#EBF7F5] selection:text-[#176E64]">
        <Header />
        <main className="flex-1 pt-24 pb-16">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
