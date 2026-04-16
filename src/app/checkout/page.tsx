'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Guardian, CheckInWithDetails } from '@/lib/types';

type Step = 'identify' | 'select' | 'confirm' | 'done';

const STEPS: { key: Step; label: string }[] = [
  { key: 'identify', label: 'Identificação' },
  { key: 'select', label: 'Selecionar' },
  { key: 'confirm', label: 'Confirmar' },
  { key: 'done', label: 'Concluído' },
];

export default function CheckOutPage() {
  const searchParams = useSearchParams();
  const orgId = searchParams.get('orgId');

  const [step, setStep] = useState<Step>('identify');
  const [searchQuery, setSearchQuery] = useState('');
  const [guardian, setGuardian] = useState<Guardian | null>(null);
  const [activeCheckins, setActiveCheckins] = useState<CheckInWithDetails[]>([]);
  const [selectedCheckin, setSelectedCheckin] = useState<CheckInWithDetails | null>(null);
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!orgId) {
      setError('ID da organização não encontrado. Por favor, escaneie o QR Code novamente.');
    }
  }, [orgId]);

  const currentStepIndex = STEPS.findIndex(s => s.key === step);

  const handleIdentify = useCallback(async () => {
    if (!searchQuery.trim()) {
      setError('Digite seu telefone ou e-mail.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const isEmail = searchQuery.includes('@');
      const param = isEmail ? `email=${encodeURIComponent(searchQuery)}` : `phone=${encodeURIComponent(searchQuery)}`;
      const res = await fetch(`/api/guardians?${param}&org_id=${orgId}`);
      const data = await res.json();

      if (!data.success || !data.data) {
        setError('Responsável não encontrado. Verifique os dados e tente novamente.');
        return;
      }

      setGuardian(data.data);

      const checkinsRes = await fetch(`/api/checkins?type=active&guardian_id=${data.data.id}&org_id=${orgId}`);
      const checkinsData = await checkinsRes.json();

      if (!checkinsData.success || !checkinsData.data.length) {
        setError('Nenhuma criança com check-in ativo encontrada para este responsável.');
        return;
      }

      setActiveCheckins(checkinsData.data);
      setStep('select');
    } catch {
      setError('Erro ao buscar dados. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  const handleSelectCheckin = useCallback((checkin: CheckInWithDetails) => {
    setSelectedCheckin(checkin);
    setStep('confirm');
  }, []);

  const handleCheckout = useCallback(async () => {
    if (!confirmChecked) {
      setError('Confirme que está retirando a criança.');
      return;
    }

    if (!selectedCheckin || !guardian) {
      setError('Dados incompletos. Reinicie o processo.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/checkins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'checkout',
          checkin_id: selectedCheckin.id,
          guardian_id: guardian.id,
          org_id: orgId,
        }),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'Erro ao realizar check-out.');
        return;
      }

      setStep('done');
    } catch {
      setError('Erro ao processar retirada. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [confirmChecked, selectedCheckin, guardian]);

  const handleReset = () => {
    setStep('identify');
    setSearchQuery('');
    setGuardian(null);
    setActiveCheckins([]);
    setSelectedCheckin(null);
    setConfirmChecked(false);
    setError('');
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
    });
  };

  return (
    <div className="page-container-narrow">
      <div className="page-header">
        <h1>🚪 Check-out</h1>
        <p>Registre a saída da criança</p>
      </div>

      {/* Stepper */}
      <div className="stepper" role="progressbar" aria-valuenow={currentStepIndex + 1} aria-valuemin={1} aria-valuemax={4}>
        {STEPS.map((s, i) => (
          <div key={s.key} className="stepper-step">
            <div className={`stepper-dot ${i === currentStepIndex ? 'active' : ''} ${i < currentStepIndex ? 'completed' : ''}`}>
              {i < currentStepIndex ? '✓' : i + 1}
            </div>
            <span className={`stepper-label ${i === currentStepIndex ? 'active' : ''} ${i < currentStepIndex ? 'completed' : ''}`}>
              {s.label}
            </span>
            {i < STEPS.length - 1 && (
              <div className={`stepper-line ${i < currentStepIndex ? 'completed' : ''}`} />
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="alert alert-error mb-6" role="alert">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Step 1: Identify */}
      {step === 'identify' && (
        <div className="card card-elevated" style={{ animation: 'slideUp 0.5s var(--ease-out) both' }}>
          <h3 style={{ marginBottom: 'var(--space-2)' }}>Identificação do Responsável</h3>
          <p style={{ marginBottom: 'var(--space-6)', fontSize: 'var(--text-sm)' }}>
            Digite seu telefone ou e-mail cadastrado para localizar as crianças
          </p>

          <div className="form-group">
            <label className="form-label" htmlFor="checkout-search">Telefone ou E-mail</label>
            <input
              id="checkout-search"
              type="text"
              className="form-input"
              placeholder="(11) 99999-9999 ou email@exemplo.com"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleIdentify()}
              autoFocus
            />
          </div>

          <button
            className="btn btn-secondary btn-full btn-lg"
            onClick={handleIdentify}
            disabled={loading}
            id="btn-identify"
          >
            {loading ? (
              <><span className="spinner" style={{ width: 24, height: 24, borderWidth: 3 }} /> Buscando...</>
            ) : (
              '🔍 Identificar'
            )}
          </button>
        </div>
      )}

      {/* Step 2: Select Child */}
      {step === 'select' && (
        <div className="card card-elevated" style={{ animation: 'slideUp 0.5s var(--ease-out) both' }}>
          <h3 style={{ marginBottom: 'var(--space-2)' }}>Selecione a Criança</h3>
          <p style={{ marginBottom: 'var(--space-6)', fontSize: 'var(--text-sm)' }}>
            {guardian?.full_name}, selecione qual criança deseja retirar
          </p>

          {activeCheckins.map((checkin) => (
            <div
              key={checkin.id}
              className="info-card"
              onClick={() => handleSelectCheckin(checkin)}
              style={{ cursor: 'pointer' }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleSelectCheckin(checkin)}
            >
              <div className="info-card-icon" style={{ background: 'var(--color-success-bg)' }}>
                {checkin.child_gender === 'male' ? '👦' : checkin.child_gender === 'female' ? '👧' : '🧒'}
              </div>
              <div className="info-card-content">
                <div className="info-card-title">{checkin.child_name}</div>
                <div className="info-card-subtitle">
                  Entrada: {formatTime(checkin.checkin_time)}
                </div>
              </div>
              <span className="badge badge-active badge-pulse">Presente</span>
            </div>
          ))}

          <button className="btn btn-outline btn-full mt-6" onClick={() => setStep('identify')}>
            ← Voltar
          </button>
        </div>
      )}

      {/* Step 3: Confirm */}
      {step === 'confirm' && selectedCheckin && (
        <div className="card card-elevated" style={{ animation: 'slideUp 0.5s var(--ease-out) both' }}>
          <h3 style={{ marginBottom: 'var(--space-2)' }}>Confirmar Retirada</h3>
          <p style={{ marginBottom: 'var(--space-6)', fontSize: 'var(--text-sm)' }}>
            Verifique os dados e confirme a retirada da criança
          </p>

          <div className="info-card">
            <div className="info-card-icon" style={{ background: 'var(--color-success-bg)' }}>🧒</div>
            <div className="info-card-content">
              <div className="info-card-title">{selectedCheckin.child_name}</div>
              <div className="info-card-subtitle">Criança • {selectedCheckin.child_age} anos</div>
            </div>
          </div>

          <div className="info-card">
            <div className="info-card-icon" style={{ background: 'var(--color-primary-50)' }}>👤</div>
            <div className="info-card-content">
              <div className="info-card-title">{selectedCheckin.guardian_name}</div>
              <div className="info-card-subtitle">Responsável</div>
            </div>
          </div>

          <div className="info-card">
            <div className="info-card-icon" style={{ background: 'var(--color-info-bg)' }}>🕐</div>
            <div className="info-card-content">
              <div className="info-card-title">{formatTime(selectedCheckin.checkin_time)}</div>
              <div className="info-card-subtitle">Hora de entrada</div>
            </div>
          </div>

          <div style={{ margin: 'var(--space-6) 0' }}>
            <label className="checkbox-group" htmlFor="confirm-checkout">
              <input
                type="checkbox"
                id="confirm-checkout"
                className="checkbox-input"
                checked={confirmChecked}
                onChange={(e) => setConfirmChecked(e.target.checked)}
              />
              <span className="checkbox-label">
                <strong>Confirmo</strong> que estou retirando a criança <strong>{selectedCheckin.child_name}</strong> e
                assumo total responsabilidade a partir deste momento.
              </span>
            </label>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <button className="btn btn-outline" onClick={() => setStep('select')} style={{ flex: '0 0 auto' }}>
              ← Voltar
            </button>
            <button
              className="btn btn-danger btn-full btn-lg"
              onClick={handleCheckout}
              disabled={loading || !confirmChecked}
              id="btn-checkout"
            >
              {loading ? 'Processando...' : '🚪 Finalizar Retirada'}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Done */}
      {step === 'done' && (
        <div style={{ animation: 'slideUp 0.5s var(--ease-out) both' }}>
          <div className="success-screen">
            <div className="success-icon" style={{ background: 'var(--color-primary-50)', boxShadow: 'var(--shadow-glow)' }}>
              👋
            </div>
            <h2 className="success-title" style={{ color: 'var(--color-primary-800)' }}>
              Saída registrada!
            </h2>
            <p className="success-subtitle">
              A retirada de <strong>{selectedCheckin?.child_name}</strong> foi registrada com sucesso.
            </p>
          </div>

          <div className="card card-elevated">
            <div className="info-card">
              <div className="info-card-icon" style={{ background: 'var(--color-success-bg)' }}>🧒</div>
              <div className="info-card-content">
                <div className="info-card-title">{selectedCheckin?.child_name}</div>
                <div className="info-card-subtitle">Criança</div>
              </div>
            </div>

            <div className="info-card">
              <div className="info-card-icon" style={{ background: 'var(--color-info-bg)' }}>🕐</div>
              <div className="info-card-content">
                <div className="info-card-title">
                  {selectedCheckin && formatTime(selectedCheckin.checkin_time)} → {new Date().toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="info-card-subtitle">Entrada → Saída</div>
              </div>
            </div>

            <div className="alert alert-success mt-4">
              <span>✅</span>
              <span>Sessão encerrada. Obrigado por usar o CheckKids!</span>
            </div>

            <button
              className="btn btn-secondary btn-full btn-lg mt-6"
              onClick={handleReset}
              id="btn-new-checkout"
            >
              🔄 Nova Retirada
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
