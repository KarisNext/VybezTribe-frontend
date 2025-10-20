// frontend/src/app/client/layout.tsx
import '../../styles/Master.css';       
import '../../styles/Gallery.css';  
import { ClientSessionProvider } from '@/components/client/hooks/ClientSessions';
import { ClientSessionInitializer } from '@/components/client/ClientSessionInitializer';

export const metadata = {
  title: 'VybezTribe News - Your Voice. Your News.',
  description: 'Stay informed with the latest news, politics, business, technology, and more from VybezTribe',
  keywords: 'news, politics, business, technology, Kenya, Africa, breaking news',
  viewport: 'width=device-width, initial-scale=1',
};

export default function ClientSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        <ClientSessionProvider>
          <ClientSessionInitializer />
          <div className="client-layout">
            {children}
          </div>
        </ClientSessionProvider>
      </body>
    </html>
  );
}
