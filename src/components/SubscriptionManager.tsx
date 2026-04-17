'use client';

import { useState } from 'react';
import type { Organization, SubscriptionTier } from '@/lib/types';

interface SubscriptionManagerProps {
  org: Organization;
  onUpdate: () => void;
}

const PLAN_DETAILS = {
  free: {
    name: 'Grátis',
    price: 'R$ 0',
    description: 'Ideal para pequenos espaços ou testes.',
    features: ['Até 10 check-ins ativos', 'Até 50 crianças no banco', 'Suporte via e-mail'],
    color: 'var(--color-primary-500)',
  },
  pro: {
    name: 'Pro',
    price: 'R$ 97',
    description: 'Para estabelecimentos em crescimento.',
    features: ['Até 50 check-ins ativos', 'Até 500 crianças no banco', 'Personalização de Logo', 'Relatórios Mensais'],
    color: 'var(--color-secondary-500)',
  },
  enterprise: {
    name: 'Enterprise',
    price: 'Sob Consulta',
    description: 'Controle total para grandes redes.',
    features: ['Check-ins ilimitados', 'Crianças ilimitadas', 'White-label completo', 'Suporte Prioritário'],
    color: 'var(--color-accent-500)',
  },
};

export default function SubscriptionManager({ org, onUpdate }: SubscriptionManagerProps) {
  const [loading, setLoading] = useState<SubscriptionTier | null>(null);

  const handleUpgrade = async (tier: SubscriptionTier) => {
    if (tier === org.subscription_tier) return;
    
    setLoading(tier);
    try {
      const res = await fetch('/api/organizations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          subscription_tier: tier,
          max_active_checkins: tier === 'free' ? 10 : tier === 'pro' ? 50 : 999999,
          max_children: tier === 'free' ? 50 : tier === 'pro' ? 500 : 999999,
        }),
      });

      if (res.ok) {
        onUpdate();
      }
    } catch (error) {
      console.error('Erro ao atualizar plano:', error);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="subscription-container">
      <div className="section-header mb-8">
        <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-2)' }}>📦 Plano e Assinatura</h2>
        <p style={{ color: 'var(--color-text-muted)' }}>Gerencie seu nível de serviço e limites do sistema</p>
      </div>

      <div className="current-plan-card mb-8 p-6" style={{ background: 'var(--color-primary-50)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-primary-200)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span className="badge badge-primary mb-2" style={{ background: 'var(--color-primary-100)', color: 'var(--color-primary-700)', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' }}>Plano Atual</span>
            <h3 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'bold', color: 'var(--color-primary-900)' }}>
              {PLAN_DETAILS[org.subscription_tier].name}
            </h3>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-primary-700)' }}>Status</p>
            <p style={{ fontWeight: '600', color: 'var(--color-success-700)' }}>● {(org.subscription_status || 'ATIVA').toUpperCase()}</p>
          </div>
        </div>
      </div>

      <div className="pricing-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-6)' }}>
        {(Object.keys(PLAN_DETAILS) as SubscriptionTier[]).map((tier) => {
          const detail = PLAN_DETAILS[tier];
          const isCurrent = tier === org.subscription_tier;

          return (
            <div 
              key={tier} 
              className={`card ${isCurrent ? 'card-active' : ''}`}
              style={{ 
                display: 'flex', 
                flexDirection: 'column',
                padding: 'var(--space-6)',
                background: '#fff',
                borderRadius: 'var(--radius-lg)',
                border: isCurrent ? `2px solid ${detail.color}` : '1px solid var(--color-border)',
                transform: isCurrent ? 'scale(1.02)' : 'none',
                transition: 'all 0.3s ease',
                boxShadow: isCurrent ? '0 10px 25px -5px rgba(0, 0, 0, 0.1)' : 'var(--shadow-sm)'
              }}
            >
              <div style={{ marginBottom: 'var(--space-6)' }}>
                <h4 style={{ fontSize: 'var(--text-lg)', fontWeight: 'bold' }}>{detail.name}</h4>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-1)', margin: 'var(--space-4) 0' }}>
                  <span style={{ fontSize: 'var(--text-3xl)', fontWeight: '800' }}>{detail.price}</span>
                  {tier !== 'enterprise' && <span style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>/mês</span>}
                </div>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', lineHeight: '1.5' }}>
                  {detail.description}
                </p>
              </div>

              <ul style={{ flex: '1', padding: 0, listStyle: 'none', marginBottom: 'var(--space-8)' }}>
                {detail.features.map((feat, idx) => (
                  <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)', fontSize: 'var(--text-sm)' }}>
                    <span style={{ color: 'var(--color-success-600)', fontWeight: 'bold' }}>✓</span>
                    {feat}
                  </li>
                ))}
              </ul>

              <button
                className="btn btn-full"
                onClick={() => handleUpgrade(tier)}
                disabled={isCurrent || (loading !== null)}
                style={{
                  background: isCurrent ? 'transparent' : detail.color,
                  borderColor: detail.color,
                  color: isCurrent ? detail.color : '#fff',
                  border: '1px solid',
                  cursor: isCurrent ? 'default' : 'pointer'
                }}
              >
                {loading === tier ? 'Processando...' : isCurrent ? 'Plano Atual' : 'Fazer Upgrade'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
