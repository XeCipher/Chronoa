import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import "./globals.css";

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
  description: "Your personal sanctuary.",
  openGraph: {
    title: "Chronoa",
    description: "Your personal sanctuary.",
    images: [{ url: '/opengraph-image.png', width: 1200, height: 630 }],
    type: 'website',
  },
  // Force Next.js to NOT inject any default icons
  icons: { icon: [], apple: [] }, 
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
                  
                  // 1. Set the dark mode class immediately
                  if (isDark) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }

                  // 2. Create and inject the correct icon immediately
                  var link = document.createElement('link');
                  link.rel = 'icon';
                  link.type = 'image/svg+xml';
                  link.href = isDark ? '/icon-dark.svg' : '/icon-light.svg';
                  document.head.appendChild(link);
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={`${cormorant.variable} ${dmSans.variable} font-sans antialiased bg-[#f7f5f0] dark:bg-[#121212] text-[#3d3b33] dark:text-[#e0e0e0] transition-colors duration-300`}>
        {children}
      </body>
    </html>
  );
}