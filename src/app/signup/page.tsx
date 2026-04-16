'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupPage() {
  const [fullName, setFullName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const router = useRouter();
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      setLoading(false);
      return;
    }

    try {
      // 1. Cadastrar usuário no Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      if (authData.user) {
        // 2. Criar a Organização
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .insert([{ name: orgName }])
          .select()
          .single();

        if (orgError) {
          setError(`Erro ao criar organização: ${orgError.message}`);
          setLoading(false);
          return;
        }

        // 3. Criar o Perfil do usuário vinculado à Organização
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{
            id: authData.user.id,
            organization_id: orgData.id,
            full_name: fullName
          }]);

        if (profileError) {
          setError(`Erro ao criar perfil: ${profileError.message}`);
          setLoading(false);
          return;
        }

        setSuccess(true);
      }
    } catch (err) {
      setError('Ocorreu um erro inesperado.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="page-container-narrow" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="card card-elevated success-screen" style={{ width: '100%', animation: 'slideUp 0.6s var(--ease-spring)' }}>
          <div className="success-icon">🏢</div>
          <h1 className="success-title">Bem-vindo ao CheckKids!</h1>
          <p className="success-subtitle">
            Sua conta para <strong>{orgName}</strong> foi criada com sucesso. 
            Verifique seu e-mail (<strong>{email}</strong>) para confirmar o acesso.
          </p>
          <Link href="/login" className="btn btn-primary btn-full">
            Ir para o Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container-narrow" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card card-elevated" style={{ width: '100%', animation: 'slideUp 0.6s var(--ease-spring)' }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
          <div style={{
            width: '64px',
            height: '64px',
            margin: '0 auto var(--space-4)',
            background: 'linear-gradient(135deg, var(--color-secondary-500), var(--color-secondary-700))',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '32px',
            boxShadow: 'var(--shadow-md)'
          }}>
            👋
          </div>
          <h1 style={{ fontSize: 'var(--text-3xl)', marginBottom: 'var(--space-2)' }}>Criar Conta SaaS</h1>
          <p style={{ fontSize: 'var(--text-sm)' }}>Gerencie seu estabelecimento com segurança total</p>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: 'var(--space-6)' }}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSignup}>
          <div className="form-group">
            <label className="form-label" htmlFor="orgName">Nome do Estabelecimento / Empresa</label>
            <input
              id="orgName"
              type="text"
              className="form-input"
              placeholder="Ex: Academia Kids Felizes"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="fullName">Seu Nome Completo</label>
            <input
              id="fullName"
              type="text"
              className="form-input"
              placeholder="Ex: João Silva"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">E-mail Profissional</label>
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

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="password">Senha</label>
              <input
                id="password"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="confirmPassword">Confirmar</label>
              <input
                id="confirmPassword"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-secondary btn-full"
            style={{ marginTop: 'var(--space-4)' }}
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="spinner" style={{ width: '20px', height: '20px', marginRight: '10px' }} />
                Configurando Ambiente SaaS...
              </>
            ) : 'Criar Minha Empresa'}
          </button>
        </form>

        <div style={{ marginTop: 'var(--space-8)', textAlign: 'center', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-6)' }}>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
            Já possui uma conta? {' '}
            <Link href="/login" style={{ color: 'var(--color-primary-700)', fontWeight: 700, textDecoration: 'none' }}>
              Entrar agora
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
