import '../../styles/Master.css';       
import '../../styles/Gallery.css';  
import ClientLayout from './ClientLayout';

export const metadata = {
  title: 'VybezTribe News - Your Voice. Your News.',
  description: 'Stay informed with the latest news, politics, business, technology, and more from VybezTribe',
  keywords: 'news, politics, business, technology, Kenya, Africa, breaking news',
};

export default function ClientSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClientLayout>
      {children}
    </ClientLayout>
  );
}