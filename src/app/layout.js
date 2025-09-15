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

export const metadata = {
  title: "Cesspit - Argue About Everything",
  description: "The platform for passionate arguments and heated debates",
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
