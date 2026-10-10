import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pulse 369 · Move to your own rhythm",
  description: "A VR rave and fitness studio. Dance, box, recover, and move together to your own music.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
