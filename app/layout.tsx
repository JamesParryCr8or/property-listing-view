import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Listwise — Your home, listed brilliantly",
  description: "Create a beautiful, data-rich property listing and sell your home your way.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en-GB"><body>{children}</body></html>;
}
