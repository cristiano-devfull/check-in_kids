import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CheckKids - Controle de Entrada e Saída de Crianças",
  description: "Sistema seguro de check-in e check-out de crianças via QR Code para brinquedotecas, escolas, buffets infantis e espaços recreativos.",
  keywords: "check-in, crianças, segurança, QR Code, brinquedoteca, escola, buffet infantil",
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
          <a href="/" className="nav-brand" aria-label="CheckKids - Página inicial">
            <div className="nav-brand-icon" aria-hidden="true">🛡️</div>
            <div className="nav-brand-text">
              Check<span>Kids</span>
            </div>
          </a>
          <div className="nav-links">
            <a href="/checkin" className="nav-link" id="nav-checkin">📱 Entrada</a>
            <a href="/checkout" className="nav-link" id="nav-checkout">🚪 Saída</a>
            <a href="/estacao" className="nav-link" id="nav-estacao" style={{fontWeight: 700, color: 'var(--color-primary-800)'}}>🖥️ Estação</a>
            <a href="/admin" className="nav-link" id="nav-admin">⚙️ Painel</a>
          </div>
        </nav>
        <main>
          {children}
        </main>
      </body>
    </html>
  );
}
