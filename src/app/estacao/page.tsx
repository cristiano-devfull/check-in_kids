'use client';

import { useState, useEffect, useCallback } from 'react';

export default function EstacaoPage() {
  const [qrCodes, setQrCodes] = useState<{ checkin?: string; checkout?: string }>({});
  const [orgName, setOrgName] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState('');

  const fetchQRCodes = useCallback(async () => {
    try {
      const baseUrl = window.location.origin;
      const [checkinRes, checkoutRes] = await Promise.all([
        fetch(`/api/qrcode?type=checkin&baseUrl=${encodeURIComponent(baseUrl)}`),
        fetch(`/api/qrcode?type=checkout&baseUrl=${encodeURIComponent(baseUrl)}`),
      ]);
      const [checkinData, checkoutData] = await Promise.all([
        checkinRes.json(),
        checkoutRes.json(),
      ]);
      setQrCodes({
        checkin: checkinData.data?.qrCode,
        checkout: checkoutData.data?.qrCode,
      });

      if (checkinData.data?.orgName) {
        setOrgName(checkinData.data.orgName);
      }
      if (checkinData.data?.logoUrl) {
        setLogoUrl(checkinData.data.logoUrl);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQRCodes();
  }, [fetchQRCodes]);

  useEffect(() => {
    const update = () => {
      setCurrentTime(
        new Date().toLocaleString('pt-BR', {
          weekday: 'long',
          day: '2-digit',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="estacao-loading">
        <div className="spinner" />
        <p>Carregando estação...</p>
      </div>
    );
  }

  return (
    <div className="estacao-root">
      {/* Header */}
      <header className="estacao-header">
        <div className="estacao-brand">
          {logoUrl ? (
            <img 
              src={logoUrl} 
              alt={orgName} 
              style={{ width: 44, height: 44, objectFit: 'contain', borderRadius: 'var(--radius-sm)' }} 
            />
          ) : (
            <span className="estacao-brand-icon" role="img" aria-label="CheckKids">🛡️</span>
          )}
          <div>
            <div className="estacao-brand-name">
              {orgName ? (
                <> {orgName.split(' ')[0]}<span>{orgName.split(' ').slice(1).join(' ')}</span> </>
              ) : (
                <>Check<span>Kids</span></>
              )}
            </div>
            <div className="estacao-brand-sub">Sistema de Controle de Entrada/Saída</div>
          </div>
        </div>
        <div className="estacao-clock">{currentTime}</div>
      </header>

      {/* Instruction Banner */}
      <div className="estacao-banner">
        <span className="estacao-banner-icon">📱</span>
        <span>Aponte a câmera do seu celular para o QR Code desejado</span>
      </div>

      {/* QR Codes */}
      <main className="estacao-main">
        {/* Check-in */}
        <div className="estacao-card estacao-card-entry">
          <div className="estacao-card-header">
            <div className="estacao-card-emoji">🟢</div>
            <div>
              <h2 className="estacao-card-title">ENTRADA</h2>
              <p className="estacao-card-subtitle">Check-in de criança</p>
            </div>
          </div>

          <div className="estacao-qr-wrapper">
            {qrCodes.checkin && (
              <img
                src={qrCodes.checkin}
                alt="QR Code para Check-in"
                className="estacao-qr"
              />
            )}
            <div className="estacao-qr-shine" />
          </div>

          <div className="estacao-steps">
            <div className="estacao-step">
              <span className="estacao-step-num">1</span>
              <span>Escaneie o QR Code</span>
            </div>
            <div className="estacao-step">
              <span className="estacao-step-num">2</span>
              <span>Preencha os dados</span>
            </div>
            <div className="estacao-step">
              <span className="estacao-step-num">3</span>
              <span>Assine o termo</span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="estacao-divider">
          <div className="estacao-divider-line" />
          <div className="estacao-divider-text">OU</div>
          <div className="estacao-divider-line" />
        </div>

        {/* Check-out */}
        <div className="estacao-card estacao-card-exit">
          <div className="estacao-card-header">
            <div className="estacao-card-emoji">🔴</div>
            <div>
              <h2 className="estacao-card-title">SAÍDA</h2>
              <p className="estacao-card-subtitle">Check-out / Retirada</p>
            </div>
          </div>

          <div className="estacao-qr-wrapper">
            {qrCodes.checkout && (
              <img
                src={qrCodes.checkout}
                alt="QR Code para Check-out"
                className="estacao-qr"
              />
            )}
            <div className="estacao-qr-shine estacao-qr-shine-exit" />
          </div>

          <div className="estacao-steps">
            <div className="estacao-step">
              <span className="estacao-step-num estacao-step-num-exit">1</span>
              <span>Escaneie o QR Code</span>
            </div>
            <div className="estacao-step">
              <span className="estacao-step-num estacao-step-num-exit">2</span>
              <span>Informe seu telefone</span>
            </div>
            <div className="estacao-step">
              <span className="estacao-step-num estacao-step-num-exit">3</span>
              <span>Confirme a retirada</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="estacao-footer">
        <span>🔒 Dados protegidos e registrados com segurança</span>
        <a href="/admin" className="estacao-admin-link">Painel Admin →</a>
      </footer>

      {/* Styles */}
      <style>{`
        nav.nav, .bottom-nav {
          display: none !important;
        }

        body {
          background: #1A1A2E !important;
          overflow: hidden;
          padding-bottom: 0 !important;
        }

        .estacao-root {
          min-height: 100vh;
          height: 100vh;
          background: linear-gradient(160deg, #1A1A2E 0%, #0F3460 50%, #1A1A2E 100%);
          display: flex;
          flex-direction: column;
          padding: 0 32px 16px;
          overflow: hidden;
          position: fixed;
          inset: 0;
          z-index: 10;
        }

        .estacao-loading {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          background: #1A1A2E;
          color: white;
        }

        .estacao-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 0 16px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          flex-shrink: 0;
        }

        .estacao-brand {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .estacao-brand-icon {
          font-size: 40px;
          filter: drop-shadow(0 0 12px rgba(255,193,7,0.5));
        }

        .estacao-brand-name {
          font-family: 'Nunito', sans-serif;
          font-size: 28px;
          font-weight: 900;
          color: white;
          line-height: 1.1;
        }

        .estacao-brand-name span {
          color: #FFC107;
        }

        .estacao-brand-sub {
          font-size: 12px;
          color: rgba(255,255,255,0.5);
          font-weight: 500;
          letter-spacing: 0.05em;
          margin-top: 2px;
        }

        .estacao-clock {
          font-family: 'Inter', monospace;
          font-size: 15px;
          color: rgba(255,255,255,0.6);
          text-transform: capitalize;
          text-align: right;
        }

        .estacao-banner {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          background: rgba(255,193,7,0.1);
          border: 1px solid rgba(255,193,7,0.25);
          border-radius: 16px;
          padding: 12px 24px;
          margin: 16px 0;
          color: #FFD54F;
          font-family: 'Nunito', sans-serif;
          font-weight: 700;
          font-size: 18px;
          flex-shrink: 0;
        }

        .estacao-banner-icon {
          font-size: 22px;
          animation: bounce 2s ease-in-out infinite;
        }

        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }

        .estacao-main {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0;
          min-height: 0;
          overflow: hidden;
        }

        .estacao-card {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 24px 32px;
          border-radius: 28px;
          max-width: 440px;
          height: 100%;
          max-height: 520px;
          position: relative;
          overflow: hidden;
          transition: transform 0.3s ease;
        }

        .estacao-card:hover {
          transform: scale(1.01);
        }

        .estacao-card-entry {
          background: linear-gradient(160deg, rgba(46,125,50,0.2) 0%, rgba(46,125,50,0.05) 100%);
          border: 1px solid rgba(46,125,50,0.4);
        }

        .estacao-card-exit {
          background: linear-gradient(160deg, rgba(255,107,107,0.2) 0%, rgba(255,107,107,0.05) 100%);
          border: 1px solid rgba(255,107,107,0.4);
        }

        .estacao-card-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
          align-self: flex-start;
        }

        .estacao-card-emoji {
          font-size: 28px;
          filter: drop-shadow(0 0 8px currentColor);
        }

        .estacao-card-title {
          font-family: 'Nunito', sans-serif;
          font-size: 32px;
          font-weight: 900;
          color: white;
          letter-spacing: 0.05em;
          line-height: 1;
        }

        .estacao-card-subtitle {
          font-size: 14px;
          color: rgba(255,255,255,0.6);
          font-weight: 500;
          margin-top: 2px;
        }

        .estacao-qr-wrapper {
          position: relative;
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
        }

        .estacao-qr {
          width: min(240px, 90%);
          height: min(240px, 90%);
          border-radius: 16px;
          background: white;
          padding: 8px;
          box-shadow: 0 0 0 1px rgba(255,255,255,0.1),
                      0 8px 32px rgba(0,0,0,0.4),
                      0 0 60px rgba(46,125,50,0.15);
          animation: qrPulse 3s ease-in-out infinite;
        }

        .estacao-card-exit .estacao-qr {
          box-shadow: 0 0 0 1px rgba(255,255,255,0.1),
                      0 8px 32px rgba(0,0,0,0.4),
                      0 0 60px rgba(255,107,107,0.15);
          animation: qrPulseExit 3s ease-in-out infinite;
        }

        @keyframes qrPulse {
          0%, 100% { box-shadow: 0 0 0 1px rgba(255,255,255,0.1), 0 8px 32px rgba(0,0,0,0.4), 0 0 40px rgba(46,125,50,0.1); }
          50% { box-shadow: 0 0 0 1px rgba(255,255,255,0.1), 0 8px 32px rgba(0,0,0,0.4), 0 0 60px rgba(46,125,50,0.35); }
        }

        @keyframes qrPulseExit {
          0%, 100% { box-shadow: 0 0 0 1px rgba(255,255,255,0.1), 0 8px 32px rgba(0,0,0,0.4), 0 0 40px rgba(255,107,107,0.1); }
          50% { box-shadow: 0 0 0 1px rgba(255,255,255,0.1), 0 8px 32px rgba(0,0,0,0.4), 0 0 60px rgba(255,107,107,0.35); }
        }

        .estacao-steps {
          display: flex;
          flex-direction: column;
          gap: 8px;
          width: 100%;
          margin-top: 16px;
        }

        .estacao-step {
          display: flex;
          align-items: center;
          gap: 10px;
          color: rgba(255,255,255,0.75);
          font-size: 14px;
          font-weight: 600;
        }

        .estacao-step-num {
          width: 26px;
          height: 26px;
          min-width: 26px;
          border-radius: 50%;
          background: rgba(46,125,50,0.5);
          border: 1px solid rgba(46,125,50,0.8);
          color: #A5D6A7;
          font-family: 'Nunito', sans-serif;
          font-weight: 800;
          font-size: 13px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .estacao-step-num-exit {
          background: rgba(255,107,107,0.3);
          border-color: rgba(255,107,107,0.7);
          color: #FFCDD2;
        }

        .estacao-divider {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 0 24px;
          flex-shrink: 0;
        }

        .estacao-divider-line {
          width: 1px;
          height: 80px;
          background: linear-gradient(180deg, transparent, rgba(255,255,255,0.15), transparent);
        }

        .estacao-divider-text {
          font-family: 'Nunito', sans-serif;
          font-weight: 800;
          font-size: 14px;
          color: rgba(255,255,255,0.3);
          letter-spacing: 0.1em;
        }

        .estacao-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 0 4px;
          border-top: 1px solid rgba(255,255,255,0.06);
          font-size: 13px;
          color: rgba(255,255,255,0.35);
          flex-shrink: 0;
        }

        .estacao-admin-link {
          color: rgba(255,193,7,0.6);
          text-decoration: none;
          font-weight: 600;
          transition: color 0.2s;
        }

        .estacao-admin-link:hover {
          color: #FFC107;
        }

        @media (max-width: 768px) {
          .estacao-root {
            padding: 0 16px 12px;
            overflow-y: auto;
          }

          .estacao-main {
            flex-direction: column;
            gap: 16px;
            height: auto;
            overflow: visible;
          }

          .estacao-divider {
            flex-direction: row;
            padding: 0;
            width: 100%;
          }

          .estacao-divider-line {
            width: 100%;
            height: 1px;
            flex: 1;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
          }

          .estacao-card {
            width: 100%;
            max-width: 100%;
            max-height: none;
          }

          .estacao-clock {
            display: none;
          }

          .estacao-brand-name {
            font-size: 22px;
          }
        }
      `}</style>
    </div>
  );
}
