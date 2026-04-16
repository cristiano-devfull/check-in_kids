'use client';

import { useState, useEffect, useCallback } from 'react';
import type { DashboardStats, CheckInWithDetails } from '@/lib/types';

type Tab = 'dashboard' | 'history';

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [history, setHistory] = useState<CheckInWithDetails[]>([]);
  const [dateFilter, setDateFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [qrCodes, setQrCodes] = useState<{ checkin?: string; checkout?: string }>({});
  const [showQR, setShowQR] = useState(false);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard');
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch {
      setError('Erro ao carregar dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const dateParam = dateFilter ? `&date=${dateFilter}` : '';
      const res = await fetch(`/api/checkins?type=history${dateParam}`);
      const data = await res.json();
      if (data.success) {
        setHistory(data.data);
      }
    } catch {
      setError('Erro ao carregar histórico.');
    } finally {
      setLoading(false);
    }
  }, [dateFilter]);

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
    } catch {
      console.error('Erro ao gerar QR Codes');
    }
  }, []);

  useEffect(() => {
    if (tab === 'dashboard') {
      fetchDashboard();
      const interval = setInterval(fetchDashboard, 15000);
      return () => clearInterval(interval);
    } else {
      fetchHistory();
    }
  }, [tab, fetchDashboard, fetchHistory]);

  useEffect(() => {
    fetchQRCodes();
  }, [fetchQRCodes]);

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>⚙️ Painel Administrativo</h1>
        <p>Controle e monitore todas as crianças no estabelecimento</p>
      </div>

      {/* Station CTA */}
      <div style={{
        background: 'linear-gradient(135deg, #1A1A2E, #0F3460)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-6) var(--space-8)',
        marginBottom: 'var(--space-6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'var(--space-6)',
        flexWrap: 'wrap',
        border: '1px solid rgba(255,193,7,0.3)',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
            <span style={{ fontSize: '28px' }}>🖥️</span>
            <h3 style={{ color: 'white', margin: 0, fontSize: 'var(--text-xl)' }}>Estação de Check-in/Out</h3>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.6)', margin: 0, fontSize: 'var(--text-sm)' }}>
            Abra em um tablet ou TV na recepção. Exibe QR Codes para os responsáveis escanearem com o celular.
          </p>
        </div>
        <a
          href="/estacao"
          className="btn btn-primary"
          id="btn-open-estacao"
          target="_blank"
          rel="noopener noreferrer"
          style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
        >
          📱 Abrir Estação
        </a>
      </div>

      {/* QR Code Toggle */}
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
        <button
          className="btn btn-outline"
          onClick={() => setShowQR(!showQR)}
          id="btn-toggle-qr"
        >
          {showQR ? '🔽 Ocultar QR Codes' : '🖨️ Exibir QR Codes para impressão'}
        </button>
      </div>

      {/* QR Codes Section */}
      {showQR && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 'var(--space-6)',
          marginBottom: 'var(--space-8)',
          animation: 'slideUp 0.4s var(--ease-out) both',
        }}>
          <div className="card card-elevated" style={{ textAlign: 'center' }}>
            <h3 style={{ marginBottom: 'var(--space-4)', color: 'var(--color-secondary-700)' }}>
              📱 QR Code de Entrada
            </h3>
            {qrCodes.checkin && (
              <img
                src={qrCodes.checkin}
                alt="QR Code para Check-in"
                style={{ width: '240px', height: '240px', margin: '0 auto', borderRadius: 'var(--radius-sm)' }}
              />
            )}
            <p style={{ marginTop: 'var(--space-3)', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
              Escaneie para fazer check-in
            </p>
          </div>

          <div className="card card-elevated" style={{ textAlign: 'center' }}>
            <h3 style={{ marginBottom: 'var(--space-4)', color: 'var(--color-accent)' }}>
              🚪 QR Code de Saída
            </h3>
            {qrCodes.checkout && (
              <img
                src={qrCodes.checkout}
                alt="QR Code para Check-out"
                style={{ width: '240px', height: '240px', margin: '0 auto', borderRadius: 'var(--radius-sm)' }}
              />
            )}
            <p style={{ marginTop: 'var(--space-3)', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
              Escaneie para fazer check-out
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs" role="tablist">
        <button
          className={`tab ${tab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setTab('dashboard')}
          role="tab"
          aria-selected={tab === 'dashboard'}
          id="tab-dashboard"
        >
          📊 Dashboard
        </button>
        <button
          className={`tab ${tab === 'history' ? 'active' : ''}`}
          onClick={() => setTab('history')}
          role="tab"
          aria-selected={tab === 'history'}
          id="tab-history"
        >
          📋 Histórico
        </button>
      </div>

      {error && (
        <div className="alert alert-error mb-6" role="alert">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Dashboard Tab */}
      {tab === 'dashboard' && (
        <>
          {loading && !stats ? (
            <div className="loading-screen">
              <div className="spinner" />
              <p>Carregando dashboard...</p>
            </div>
          ) : stats ? (
            <>
              {/* Stats Grid */}
              <div className="dashboard-grid" style={{ animation: 'slideUp 0.4s var(--ease-out) both' }}>
                <div className="stat-card stat-card-present card">
                  <div className="stat-number" style={{ color: 'var(--color-secondary-700)' }}>
                    {stats.presentChildren}
                  </div>
                  <div className="stat-label">Crianças Presentes</div>
                </div>

                <div className="stat-card stat-card-checkin card">
                  <div className="stat-number" style={{ color: 'var(--color-primary-800)' }}>
                    {stats.totalCheckinsToday}
                  </div>
                  <div className="stat-label">Entradas Hoje</div>
                </div>

                <div className="stat-card stat-card-checkout card">
                  <div className="stat-number" style={{ color: 'var(--color-accent)' }}>
                    {stats.totalCheckoutsToday}
                  </div>
                  <div className="stat-label">Saídas Hoje</div>
                </div>
              </div>

              {/* Active Children Table */}
              <div className="card card-elevated" style={{ animation: 'slideUp 0.5s var(--ease-out) 0.1s both' }}>
                <h3 style={{ marginBottom: 'var(--space-4)' }}>
                  👶 Crianças Presentes ({stats.activeCheckins.length})
                </h3>

                {stats.activeCheckins.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon">🏠</div>
                    <h3>Nenhuma criança presente</h3>
                    <p>As crianças registradas aparecerão aqui</p>
                  </div>
                ) : (
                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Criança</th>
                          <th>Responsável</th>
                          <th>Entrada</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.activeCheckins.map((checkin, index) => (
                          <tr key={checkin.id} style={{ animation: `slideIn 0.3s var(--ease-out) ${index * 0.05}s both` }}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                                <span style={{ fontSize: '24px' }}>
                                  {checkin.child_gender === 'male' ? '👦' : checkin.child_gender === 'female' ? '👧' : '🧒'}
                                </span>
                                <div>
                                  <div style={{ fontWeight: 700, fontFamily: 'var(--font-display)' }}>{checkin.child_name}</div>
                                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{checkin.child_age} anos</div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div style={{ fontWeight: 600 }}>{checkin.guardian_name}</div>
                              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{checkin.guardian_phone}</div>
                            </td>
                            <td style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>
                              {formatTime(checkin.checkin_time)}
                            </td>
                            <td>
                              <span className="badge badge-active badge-pulse">Presente</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </>
      )}

      {/* History Tab */}
      {tab === 'history' && (
        <div style={{ animation: 'slideUp 0.4s var(--ease-out) both' }}>
          {/* Filter */}
          <div className="filter-bar">
            <div className="form-group">
              <label className="form-label" htmlFor="date-filter">Filtrar por data</label>
              <input
                id="date-filter"
                type="date"
                className="form-input"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>
            <button
              className="btn btn-outline"
              onClick={() => setDateFilter('')}
              style={{ marginBottom: 0, alignSelf: 'flex-end', minHeight: '52px' }}
            >
              Limpar filtro
            </button>
          </div>

          <div className="card card-elevated">
            <h3 style={{ marginBottom: 'var(--space-4)' }}>
              📋 Histórico de Registros
            </h3>

            {loading ? (
              <div className="loading-screen">
                <div className="spinner" />
                <p>Carregando histórico...</p>
              </div>
            ) : history.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📭</div>
                <h3>Nenhum registro encontrado</h3>
                <p>{dateFilter ? 'Nenhum registro para esta data' : 'Os registros de check-in/check-out aparecerão aqui'}</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Criança</th>
                      <th>Responsável</th>
                      <th>Entrada</th>
                      <th>Saída</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((record, index) => (
                      <tr key={record.id} style={{ animation: `slideIn 0.3s var(--ease-out) ${index * 0.03}s both` }}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                            <span style={{ fontSize: '20px' }}>
                              {record.child_gender === 'male' ? '👦' : record.child_gender === 'female' ? '👧' : '🧒'}
                            </span>
                            <div>
                              <div style={{ fontWeight: 700, fontFamily: 'var(--font-display)' }}>{record.child_name}</div>
                              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{record.child_age} anos</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{record.guardian_name}</div>
                          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{record.guardian_phone}</div>
                        </td>
                        <td style={{ fontSize: 'var(--text-sm)' }}>
                          {formatDateTime(record.checkin_time)}
                        </td>
                        <td style={{ fontSize: 'var(--text-sm)' }}>
                          {record.checkout_time ? formatDateTime(record.checkout_time) : '—'}
                        </td>
                        <td>
                          <span className={`badge ${record.status === 'active' ? 'badge-active badge-pulse' : 'badge-completed'}`}>
                            {record.status === 'active' ? 'Presente' : 'Retirada'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
