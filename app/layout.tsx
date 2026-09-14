import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Scholarship Writing Lab • Kiran's Practice Portal",
  description: "Deliberate persuasive writing practice for Australian scholarship examinations",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-500 selection:text-white antialiased">
        {children}
      </body>
    </html>
  );
}
