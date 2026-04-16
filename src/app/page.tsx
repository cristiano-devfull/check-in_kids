import Link from 'next/link';

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <section className="hero" id="hero">
        <span className="hero-emoji" role="img" aria-label="Escudo de proteção">🛡️</span>
        <h1>
          Segurança <span className="highlight">inteligente</span> para seus filhos
        </h1>
        <p>
          Controle de entrada e saída de crianças via QR Code.
          Rápido, seguro e com total rastreabilidade.
        </p>
        <div className="hero-actions">
          <Link href="/checkin" className="btn btn-primary btn-lg" id="cta-checkin">
            📱 Fazer Check-in
          </Link>
          <Link href="/checkout" className="btn btn-secondary btn-lg" id="cta-checkout">
            🚪 Fazer Check-out
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="features" id="features">
        <div className="section-title">
          <h2>Como funciona</h2>
          <p>Processo simples e seguro em poucos passos</p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <span className="feature-icon" role="img" aria-label="QR Code">📱</span>
            <h3>Escaneie o QR Code</h3>
            <p>
              Ao chegar no estabelecimento, escaneie o QR Code de entrada
              com seu celular. Rápido e sem filas.
            </p>
          </div>

          <div className="feature-card">
            <span className="feature-icon" role="img" aria-label="Formulário">📝</span>
            <h3>Cadastre os dados</h3>
            <p>
              Preencha os dados do responsável e da criança. Se já tiver
              cadastro, os dados são carregados automaticamente.
            </p>
          </div>

          <div className="feature-card">
            <span className="feature-icon" role="img" aria-label="Consentimento">✅</span>
            <h3>Assine o termo</h3>
            <p>
              Aceite o termo de consentimento digital autorizando a
              permanência e cuidados básicos com a criança.
            </p>
          </div>

          <div className="feature-card">
            <span className="feature-icon" role="img" aria-label="Proteção">🔒</span>
            <h3>Retirada segura</h3>
            <p>
              Na saída, escaneie o QR Code de retirada e confirme sua
              identidade. Apenas o responsável cadastrado pode retirar.
            </p>
          </div>
        </div>
      </section>

      {/* Stats / Trust Section */}
      <section className="features" id="trust">
        <div className="section-title">
          <h2>Por que usar o CheckKids?</h2>
          <p>Segurança e praticidade para estabelecimentos e famílias</p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <span className="feature-icon" role="img" aria-label="Velocidade">⚡</span>
            <h3>Check-in em 30 segundos</h3>
            <p>
              Processo rápido e intuitivo. Sem papel, sem filas,
              sem complicação.
            </p>
          </div>

          <div className="feature-card">
            <span className="feature-icon" role="img" aria-label="Rastreabilidade">📊</span>
            <h3>Rastreabilidade total</h3>
            <p>
              Logs completos de entrada e saída com data, hora e
              responsável. Auditoria completa.
            </p>
          </div>

          <div className="feature-card">
            <span className="feature-icon" role="img" aria-label="Celular">📲</span>
            <h3>100% Mobile</h3>
            <p>
              Interface otimizada para celular. Funciona em qualquer
              dispositivo com câmera.
            </p>
          </div>

          <div className="feature-card">
            <span className="feature-icon" role="img" aria-label="Painel">🖥️</span>
            <h3>Painel em tempo real</h3>
            <p>
              Dashboard administrativo com visão de todas as crianças
              presentes e histórico completo.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        textAlign: 'center',
        padding: 'var(--space-12) var(--space-4)',
        borderTop: '1px solid var(--color-border)',
        color: 'var(--color-text-muted)',
        fontSize: 'var(--text-sm)',
      }}>
        <p>
          <strong style={{ fontFamily: 'var(--font-display)' }}>
            Check<span style={{ color: 'var(--color-secondary-500)' }}>Kids</span>
          </strong>
          {' '}— Segurança para quem você mais ama
        </p>
        <p style={{ marginTop: 'var(--space-2)' }}>
          © {new Date().getFullYear()} CheckKids. Todos os direitos reservados.
        </p>
      </footer>
    </>
  );
}
