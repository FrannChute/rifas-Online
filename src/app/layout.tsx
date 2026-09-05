import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Club Sportivo Bolivar",
    template: "%s | Club Sportivo Bolivar",
  },
  description: "Rifas online del Club Sportivo Bolivar.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
