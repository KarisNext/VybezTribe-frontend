import '../../styles/components_styles/auth/login.css';
import '../../styles/components_styles/news/News.css';
import '../../styles/components_styles/admin/Users.css';
import '../../styles/components_styles/news/Retrieval.css';
import '../../styles/components_styles/news/Createposts.css';
import '../../styles/Admin.css';
import AdminLayout from './AdminLayout';

export const metadata = {
  title: 'VybezTribe Admin Dashboard',
  description: 'Admin dashboard for VybezTribe news management',
};

export default function AdminSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayout>{children}</AdminLayout>;
}