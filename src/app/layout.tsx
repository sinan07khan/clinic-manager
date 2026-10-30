import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "Clinic Manager - Clinic & Healthcare Management",
  description: "Comprehensive clinic and healthcare management system. Manage patients, appointments, doctor schedules, billing, diagnostics, inventory, and staff operations.",
  icons: {
    icon: "/logo.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="font-sans antialiased bg-background text-foreground overflow-x-hidden"
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
