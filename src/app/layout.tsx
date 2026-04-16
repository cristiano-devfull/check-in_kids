import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "CheckKids - Controle de Entrada e Saída de Crianças",
  description: "Sistema seguro de check-in e check-out de crianças via QR Code para brinquedotecas, escolas, buffets infantis e espaços recreativos.",
  keywords: "check-in, crianças, segurança, QR Code, brinquedoteca, escola, buffet infantil",
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <nav className="nav" role="navigation" aria-label="Navegação principal">
          <div className="nav-container">
            <Link href="/" className="nav-brand">
              <div className="nav-brand-icon" aria-hidden="true">🛡️</div>
              <div className="nav-brand-text">
                Check<span>Kids</span>
              </div>
            </Link>
            <div className="nav-links">
              <Link href="/checkin" className="nav-link" id="nav-checkin">📱 Entrada</Link>
              <Link href="/checkout" className="nav-link" id="nav-checkout">🚪 Saída</Link>
              <Link href="/estacao" className="nav-link" id="nav-estacao" style={{fontWeight: 700, color: 'var(--color-primary-800)'}}>🖥️ Estação</Link>
              <Link href="/admin" className="nav-link" id="nav-admin">⚙️ Painel</Link>
            </div>
          </div>
        </nav>
        <main>
          {children}
        </main>
        
        {/* Mobile Bottom Navigation */}
        <nav className="bottom-nav" aria-label="Navegação móvel">
          <Link href="/checkin" className="bottom-nav-item" id="mobile-nav-checkin">
            <span className="bottom-nav-icon">📱</span>
            <span>Entrada</span>
          </Link>
          <Link href="/checkout" className="bottom-nav-item" id="mobile-nav-checkout">
            <span className="bottom-nav-icon">🚪</span>
            <span>Saída</span>
          </Link>
          <Link href="/estacao" className="bottom-nav-item" id="mobile-nav-estacao">
            <span className="bottom-nav-icon">🖥️</span>
            <span>Estação</span>
          </Link>
          <Link href="/admin" className="bottom-nav-item" id="mobile-nav-admin">
            <span className="bottom-nav-icon">⚙️</span>
            <span>Painel</span>
          </Link>
        </nav>
      </body>
    </html>
  );
}
