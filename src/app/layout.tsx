import type { Metadata } from "next";
import { Press_Start_2P, VT323, Space_Mono } from "next/font/google";
import "./globals.css";

const pressStart2P = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pixel",
  display: "swap",
});

const vt323 = VT323({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-terminal",
  display: "swap",
});

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-space-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CO-OP BOOTH 98 - Multi-Device Link Interface v2.4",
  description: "Synchronized two-player photometric terminal & thermal receipt photo booth",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${pressStart2P.variable} ${vt323.variable} ${spaceMono.variable}`}
    >
      <head>
        {/* Material Symbols Outlined for authentic Stitch icons */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
      </head>
      <body className="bg-surface font-mono text-on-surface select-none min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
