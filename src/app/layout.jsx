export const metadata = {
  title: 'SDR-HR | RTL-SDR Manager',
  description: 'Gestor de receptor RTL-SDR para sistemas empotrados',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>{children}</body>
    </html>
  );
}
