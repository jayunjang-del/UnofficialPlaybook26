import type { Metadata } from "next";
import "./globals.css";

const title = "2026 UNOFFICIAL PLAYBOOK: Nex Summer Internship";
const description =
  "An interactive digital edition of the 2026 Nex summer internship playbook, built from intern surveys, photos and drawings.";

export const metadata: Metadata = {
  title,
  description,
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
