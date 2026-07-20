import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Class 8 Result",
  description: "View exam results, rankings, and performance analytics for Class 8 — Dahlia (B)",
  icons: {
    icon: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSTZ8N1jkOgd4MHMNEN2wN70OWVAAkZt3ZlU6zqVnGadw&s=10",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Anek+Bangla:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-bg text-charcoal antialiased">{children}</body>
    </html>
  );
}
