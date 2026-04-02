import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CareQueue — Smart Clinic Manager",
  description:
    "Automated slot recovery, smart waitlist ranking, and no-show prevention for clinics.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
