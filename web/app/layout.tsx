import type { Metadata } from "next";
import { Anton, Hanken_Grotesk, Space_Mono } from "next/font/google";
import "./globals.css";

const anton = Anton({ subsets: ["latin"], weight: "400", variable: "--font-anton", display: "swap" });
const hanken = Hanken_Grotesk({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-hanken", display: "swap" });
const mono = Space_Mono({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL("https://aval-casper.vercel.app"),
  title: "AVAL — money shouldn't wait",
  description: "Get paid 90 days early. An autonomous AI agent verifies, prices, and funds your invoices on Casper.",
  openGraph: {
    title: "AVAL — money shouldn't wait",
    description: "Get paid 90 days early. Autonomous invoice financing on Casper.",
    images: ["/og.png"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AVAL — money shouldn't wait",
    description: "Get paid 90 days early. Autonomous invoice financing on Casper.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${anton.variable} ${hanken.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
