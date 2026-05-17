export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'SDR-HR | SDR-Headless Remote',
  description: 'Web manager for RTL-SDR on Armbian/Debian',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>{children}</body>
    </html>
  );
}
