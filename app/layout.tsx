import type { Metadata, Viewport } from "next";
import { PwaRegister } from "@/components/pwa-register";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://store.fgdev.tech"),
  applicationName: "FG Store",
  title: {
    default: "FG Store — Layanan Digital",
    template: "%s · FG Store",
  },
  description:
    "Dashboard layanan digital, dokumentasi GPT, dan generator kode 2FA privat dari FG Store.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "FG Store",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "/",
    siteName: "FG Store",
    title: "FG Store — Layanan Digital",
    description: "Dashboard layanan digital, dokumentasi GPT, dan generator kode 2FA privat.",
    images: [
      {
        url: "/og.png",
        width: 1732,
        height: 910,
        alt: "FG Store — Layanan Digital",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FG Store — Layanan Digital",
    description: "Dashboard layanan digital, dokumentasi GPT, dan generator kode 2FA privat.",
    images: ["/og.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "dark",
  themeColor: "#070914",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>
        <a className="skip-link" href="#main-content">
          Lewati ke konten utama
        </a>
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
