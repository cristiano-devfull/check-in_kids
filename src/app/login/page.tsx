'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
      } else {
        router.push('/admin');
        router.refresh();
      }
    } catch (err) {
      setError('Ocorreu um erro inesperado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container-narrow" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card card-elevated" style={{ width: '100%', animation: 'slideUp 0.6s var(--ease-spring)' }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
          <div style={{
            width: '64px',
            height: '64px',
            margin: '0 auto var(--space-4)',
            background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-primary-700))',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '32px',
            boxShadow: 'var(--shadow-md)'
          }}>
            🛡️
          </div>
          <h1 style={{ fontSize: 'var(--text-3xl)', marginBottom: 'var(--space-2)' }}>Acesso Restrito</h1>
          <p style={{ fontSize: 'var(--text-sm)' }}>Identifique-se para acessar o painel administrativo</p>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: 'var(--space-6)' }}>
            <span>⚠️</span>
            <span>{error === 'Invalid login credentials' ? 'E-mail ou senha incorretos.' : error}</span>
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">E-mail</label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: 'var(--space-8)' }}>
            <label className="form-label" htmlFor="password">Senha</label>
            <input
              id="password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="spinner" style={{ width: '20px', height: '20px', marginRight: '10px' }} />
                Entrando...
              </>
            ) : 'Entrar no Painel'}
          </button>
        </form>

        <div style={{ marginTop: 'var(--space-8)', textAlign: 'center', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-6)' }}>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
            Não tem uma conta? {' '}
            <Link href="/signup" style={{ color: 'var(--color-secondary-500)', fontWeight: 700, textDecoration: 'none' }}>
              Cadastre-se grátis
            </Link>
          </p>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
            CheckKids © {new Date().getFullYear()} — Sistema de Segurança Infantil
          </p>
        </div>
      </div>
    </div>
  );
}
