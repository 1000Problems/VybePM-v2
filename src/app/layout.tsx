import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VybePM",
  description: "Task orchestration hub for 1000Problems",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('vybepm-theme');if(t==='light')document.documentElement.setAttribute('data-theme','light')})()`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
