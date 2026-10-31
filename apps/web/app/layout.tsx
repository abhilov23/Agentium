import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Agentium — Local Browser Automation for AI Agents",
  description:
    "Agentium is the MCP server for browser agents. Connect Claude Desktop, Cursor, or any MCP client directly to your Chrome tabs. Local-only, zero cloud.",
  openGraph: {
    title: "Agentium — Local Browser Automation for AI Agents",
    description: "MCP server that gives AI agents real browser control over Chrome. No cloud. No proxy.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
