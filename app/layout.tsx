import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/react";

export const metadata = {
  title: "ZerroMax Configurator",
  description: "ZerroMax configurator",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}

