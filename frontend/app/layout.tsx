import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import "./globals.css";

// The elegant serif font for headings
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-cormorant",
});

// The clean sans-serif for UI elements
const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-dm-sans",
});

export const metadata: Metadata = {
  title: "Chronoa",
  description: "Your personal sanctuary.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* We apply the font variables and a global text/bg color here */}
      <body className={`${cormorant.variable} ${dmSans.variable} font-sans antialiased bg-[#f7f5f0] text-[#3d3b33]`}>
        {children}
      </body>
    </html>
  );
}