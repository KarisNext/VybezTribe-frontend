import '../../styles/components_styles/auth/login.css';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="auth-section">{children}</div>;
}