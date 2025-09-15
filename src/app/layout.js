import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import BottomNav from "../components/BottomNav";
import ProfileGuard from "../components/ProfileGuard";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata = {
  title: "Cesspit - Argue About Everything",
  description: "The platform for passionate arguments and heated debates",
  metadataBase: new URL(siteUrl),
  openGraph: {
    title: "Cesspit - Argue About Everything",
    description: "The platform for passionate arguments and heated debates",
    url: siteUrl,
    siteName: "Cesspit",
    images: [
      {
        url: `${siteUrl}/images/Cesspit_logo.png`,
        width: 1200,
        height: 630,
        alt: "Cesspit logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cesspit - Argue About Everything",
    description: "The platform for passionate arguments and heated debates",
    images: [`${siteUrl}/images/Cesspit_logo.png`],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <ProfileGuard>
            {children}
            <BottomNav />
          </ProfileGuard>
        </AuthProvider>
      </body>
    </html>
  );
}
