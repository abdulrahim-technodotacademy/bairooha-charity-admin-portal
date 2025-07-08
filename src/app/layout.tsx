import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: 'Bairooha Foundation',
  description: 'BAIROOHA FOUNDATION is an idea inspired by a group of compassionate youngsters, who wanted to help the underprivileged in their own humble way and to be a source of happiness for them. The organisation started its activities in the year of 2015 based in Thalassery of Kannur district, Kerala. Since its launching Bairooha has been involved in various charity and community development initiatives. Its candid activities are spread across the areas of health, education, relief for destitute and homeless and especially support for improving public health infrastructures.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
