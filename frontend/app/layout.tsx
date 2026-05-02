// frontend/app/layout.tsx
import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import "./globals.css";
import GoogleAnalytics from "@/components/GoogleAnalytics";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-cormorant",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-dm-sans",
});

export const metadata: Metadata = {
  title: "Chronoa",
  description: "Your personal workspace.",
  openGraph: {
    title: "Chronoa",
    description: "Your personal workspace.",
    images: [{ url: '/opengraph-image.png', width: 1200, height: 630 }],
    type: 'website',
  },
  appleWebApp: {
    capable: true,
    title: "Chronoa",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: '/icon-light.svg', media: '(prefers-color-scheme: light)' },
      { url: '/icon-dark.svg', media: '(prefers-color-scheme: dark)' }
    ],
    apple: [{ url: '/apple-icon.png' }]
  }, 
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var localState = localStorage.getItem('chronoa-settings');
                  var theme = 'system';
                  if (localState) {
                    var parsed = JSON.parse(localState);
                    if (parsed && parsed.state && parsed.state.theme) {
                      theme = parsed.state.theme;
                    }
                  }
                  var isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                  
                  if (isDark) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }

                  // Register Service Worker for PWA / APK Support
                  if ('serviceWorker' in navigator) {
                    window.addEventListener('load', function() {
                      navigator.serviceWorker.register('/sw.js');
                    });
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={`${cormorant.variable} ${dmSans.variable} font-sans antialiased bg-[#f7f5f0] dark:bg-[#121212] text-[#3d3b33] dark:text-[#e0e0e0] transition-colors duration-300`}>
        {children}
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID || ""} />
      </body>
    </html>
  );
}