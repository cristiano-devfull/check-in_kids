'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Organization } from '@/lib/types';

export default function SettingsPage() {
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
        <h1>🛠️ Configurações da Marca</h1>
        <p>Personalize como sua empresa aparece para os clientes</p>
      </div>

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
            <label className="form-label" htmlFor="logo-url">URL do Logotipo</label>
            <input
              id="logo-url"
              type="url"
              className="form-input"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://sua-url.com/logo.png"
            />
            <p className="form-help-text" style={{ fontSize: 'var(--text-xs)', marginTop: 'var(--space-1)', color: 'var(--color-text-muted)' }}>
              Insira a URL de uma imagem quadrada para melhores resultados.
            </p>
          </div>

          {logoUrl && (
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

      <div className="card mt-8" style={{ borderStyle: 'dashed', borderColor: 'var(--color-border)' }}>
        <h3 style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-3)' }}>ℹ️ Informações da Conta</h3>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
          <p><strong>ID da Organização:</strong> {org?.id}</p>
          <p><strong>Data de Criação:</strong> {org && new Date(org.created_at).toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
}
