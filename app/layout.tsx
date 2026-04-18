import "./globals.css";

export const metadata = {
  title: "Configurator MVP",
  description: "Simple configurator test",
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