import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Scholva",
  description: "Research intelligence for Nigerian universities and industry."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
