'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Organization } from '@/lib/types';

import SubscriptionManager from '@/components/SubscriptionManager';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'branding' | 'subscription'>('branding');
  const [org, setOrg] = useState<Organization | null>(null);
  const [name, setName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchOrg();
  }, []);

  const fetchOrg = async () => {
    try {
      const res = await fetch('/api/organizations');
      const data = await res.json();
      if (data.success) {
        setOrg(data.data);
        setName(data.data.name);
        setLogoUrl(data.data.logo_url || '');
      } else {
        setError(data.error || 'Erro ao carregar dados.');
      }
    } catch {
      setError('Erro de conexão.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      const res = await fetch('/api/organizations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, logo_url: logoUrl }),
      });
      const data = await res.json();

      if (data.success) {
        setSuccess(true);
        router.refresh();
      } else {
        setError(data.error || 'Erro ao salvar alterações.');
      }
    } catch {
      setError('Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Carregando configurações...</p>
      </div>
    );
  }

  return (
    <div className="page-container-narrow" style={{ paddingTop: 'var(--space-8)' }}>
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <Link href="/admin" className="btn btn-outline" style={{ marginBottom: 'var(--space-4)' }}>
          ← Voltar ao Painel
        </Link>
        <h1>🛠️ Configurações</h1>
        <p>Gerencie sua marca e plano de assinatura</p>
      </div>

      {/* Navegação de Abas */}
      <div className="tabs-nav mb-8" style={{ display: 'flex', gap: 'var(--space-4)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-1)' }}>
        <button 
          className={`tab-item ${activeTab === 'branding' ? 'active' : ''}`}
          onClick={() => setActiveTab('branding')}
          style={{ 
            padding: 'var(--space-2) var(--space-4)', 
            border: 'none', 
            background: 'none', 
            cursor: 'pointer',
            fontSize: 'var(--text-sm)',
            fontWeight: activeTab === 'branding' ? 'bold' : 'normal',
            borderBottom: activeTab === 'branding' ? '2px solid var(--color-primary-500)' : 'none',
            color: activeTab === 'branding' ? 'var(--color-primary-700)' : 'var(--color-text-muted)'
          }}
        >
          🎨 Marca
        </button>
        <button 
          className={`tab-item ${activeTab === 'subscription' ? 'active' : ''}`}
          onClick={() => setActiveTab('subscription')}
          style={{ 
            padding: 'var(--space-2) var(--space-4)', 
            border: 'none', 
            background: 'none', 
            cursor: 'pointer',
            fontSize: 'var(--text-sm)',
            fontWeight: activeTab === 'subscription' ? 'bold' : 'normal',
            borderBottom: activeTab === 'subscription' ? '2px solid var(--color-primary-500)' : 'none',
            color: activeTab === 'subscription' ? 'var(--color-primary-700)' : 'var(--color-text-muted)'
          }}
        >
          📦 Plano e Assinatura
        </button>
      </div>

      {activeTab === 'branding' ? (
        <div style={{ animation: 'fadeIn 0.4s ease' }}>
          {error && (
            <div className="alert alert-error mb-6">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="alert alert-success mb-6">
              <span>✅</span>
              <span>Alterações salvas com sucesso!</span>
            </div>
          )}

          <div className="card card-elevated">
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label" htmlFor="org-name">Nome do Estabelecimento</label>
                <input
                  id="org-name"
                  type="text"
                  className="form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Ex: Kids Play Park"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="logo-url" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  URL do Logotipo
                  {org?.subscription_tier === 'free' && (
                    <span className="badge" style={{ background: 'var(--color-secondary-100)', color: 'var(--color-secondary-700)', fontSize: '9px', padding: '1px 5px', borderRadius: '4px' }}>🔒 PRO</span>
                  )}
                </label>
                <input
                  id="logo-url"
                  type="url"
                  className="form-input"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://sua-url.com/logo.png"
                  disabled={org?.subscription_tier === 'free'}
                  style={{ 
                    opacity: org?.subscription_tier === 'free' ? 0.6 : 1,
                    cursor: org?.subscription_tier === 'free' ? 'not-allowed' : 'text'
                  }}
                />
                {org?.subscription_tier === 'free' ? (
                  <p className="form-help-text" style={{ fontSize: 'var(--text-xs)', marginTop: 'var(--space-2)', color: 'var(--color-secondary-600)', fontWeight: '500' }}>
                    ✨ Faça upgrade para o plano **Pro** para personalizar o logotipo do sistema.
                  </p>
                ) : (
                  <p className="form-help-text" style={{ fontSize: 'var(--text-xs)', marginTop: 'var(--space-1)', color: 'var(--color-text-muted)' }}>
                    Insira a URL de uma imagem quadrada para melhores resultados.
                  </p>
                )}
              </div>

              {logoUrl && org?.subscription_tier !== 'free' && (
                <div style={{ marginBottom: 'var(--space-6)', textAlign: 'center' }}>
                    <p style={{ fontSize: 'var(--text-xs)', marginBottom: 'var(--space-2)' }}>Prévia do Logo:</p>
                    <img 
                      src={logoUrl} 
                      alt="Logo Preview" 
                      style={{ width: 80, height: 80, objectFit: 'contain', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }} 
                      onError={() => setError('A URL da imagem parece ser inválida.')}
                    />
                </div>
              )}

              <button
                type="submit"
                className="btn btn-secondary btn-full btn-lg"
                disabled={saving}
              >
                {saving ? 'Salvando...' : '💾 Salvar Alterações'}
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div style={{ animation: 'fadeIn 0.4s ease' }}>
          {org && <SubscriptionManager org={org} onUpdate={fetchOrg} />}
        </div>
      )}

      <div className="card mt-8" style={{ borderStyle: 'dashed', borderColor: 'var(--color-border)', background: 'var(--color-background-subtle)' }}>
        <h3 style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-3)' }}>ℹ️ Informações da Conta</h3>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
          <p><strong>ID da Organização:</strong> {org?.id}</p>
          <p><strong>Data de Criação:</strong> {org && new Date(org.created_at).toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
}
