'use client';

import { useState, useCallback, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Guardian, Child, CheckIn } from '@/lib/types';

type Step = 'search' | 'register' | 'consent' | 'confirmation';

interface FormData {
  full_name: string;
  phone: string;
  email: string;
  child_name: string;
  child_age: string;
  child_gender: string;
  has_medical_condition: boolean;
  medical_description: string;
  uses_medication: boolean;
  medication_description: string;
}

const INITIAL_FORM: FormData = {
  full_name: '',
  phone: '',
  email: '',
  child_name: '',
  child_age: '',
  child_gender: '',
  has_medical_condition: false,
  medical_description: '',
  uses_medication: false,
  medication_description: '',
};

const STEPS: { key: Step; label: string }[] = [
  { key: 'search', label: 'Busca' },
  { key: 'register', label: 'Cadastro' },
  { key: 'consent', label: 'Termo' },
  { key: 'confirmation', label: 'Confirmação' },
];

function CheckInContent() {
  const searchParams = useSearchParams();
  const orgId = searchParams.get('orgId');

  const [step, setStep] = useState<Step>('search');
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [guardian, setGuardian] = useState<Guardian | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [checkinResult, setCheckinResult] = useState<CheckIn | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [isNewRegistration, setIsNewRegistration] = useState(false);

  useEffect(() => {
    if (!orgId) {
      setError('ID da organização não encontrado. Por favor, escaneie o QR Code novamente.');
    }
  }, [orgId]);

  const currentStepIndex = STEPS.findIndex(s => s.key === step);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      setError('Digite seu telefone ou e-mail para buscar.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const isEmail = searchQuery.includes('@');
      const param = isEmail ? `email=${encodeURIComponent(searchQuery)}` : `phone=${encodeURIComponent(searchQuery)}`;
      const res = await fetch(`/api/guardians?${param}&org_id=${orgId}`);
      const data = await res.json();

      if (data.success && data.data) {
        setGuardian(data.data);
        setForm(prev => ({
          ...prev,
          full_name: data.data.full_name,
          phone: data.data.phone,
          email: data.data.email,
        }));

        const childRes = await fetch(`/api/children?guardian_id=${data.data.id}&org_id=${orgId}`);
        const childData = await childRes.json();
        if (childData.success) {
          setChildren(childData.data);
        }

        setIsNewRegistration(false);
        setStep('register');
      } else {
        setIsNewRegistration(true);
        setForm(prev => ({
          ...prev,
          phone: searchQuery.includes('@') ? '' : searchQuery,
          email: searchQuery.includes('@') ? searchQuery : '',
        }));
        setStep('register');
      }
    } catch {
      setError('Erro ao buscar cadastro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, orgId]);

  const handleRegister = useCallback(async () => {
    if (!form.full_name || !form.phone || !form.email) {
      setError('Preencha todos os dados do responsável.');
      return;
    }

    if (!form.child_name || !form.child_age || !form.child_gender) {
      setError('Preencha todos os dados da criança.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create/update guardian
      const guardianRes = await fetch('/api/guardians', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: form.full_name,
          phone: form.phone,
          email: form.email,
          org_id: orgId,
        }),
      });
      const guardianData = await guardianRes.json();

      if (!guardianData.success) {
        setError(guardianData.error || 'Erro ao cadastrar responsável.');
        return;
      }

      setGuardian(guardianData.data);

      // Create child
      const childRes = await fetch('/api/children', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guardian_id: guardianData.data.id,
          name: form.child_name,
          age: parseInt(form.child_age),
          gender: form.child_gender,
          has_medical_condition: form.has_medical_condition,
          medical_description: form.medical_description || undefined,
          uses_medication: form.uses_medication,
          medication_description: form.medication_description || undefined,
          org_id: orgId,
        }),
      });
      const childData = await childRes.json();

      if (!childData.success) {
        setError(childData.error || 'Erro ao cadastrar criança.');
        return;
      }

      setSelectedChild(childData.data);
      setStep('consent');
    } catch {
      setError('Erro ao processar cadastro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [form, orgId]);

  const handleSelectExistingChild = useCallback((child: Child) => {
    setSelectedChild(child);
    setStep('consent');
  }, []);

  const handleConsent = useCallback(async () => {
    if (!consentAccepted) {
      setError('Você precisa aceitar o termo de consentimento.');
      return;
    }

    if (!guardian || !selectedChild) {
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
          action: 'checkin',
          child_id: selectedChild.id,
          guardian_id: guardian.id,
          org_id: orgId,
        }),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'Erro ao realizar check-in.');
        return;
      }

      setCheckinResult(data.data);
      setStep('confirmation');
    } catch {
      setError('Erro ao realizar check-in. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [consentAccepted, guardian, selectedChild, orgId]);

  const handleReset = () => {
    setStep('search');
    setForm(INITIAL_FORM);
    setGuardian(null);
    setChildren([]);
    setSelectedChild(null);
    setCheckinResult(null);
    setSearchQuery('');
    setError('');
    setConsentAccepted(false);
    setIsNewRegistration(false);
  };

  return (
    <div className="page-container-narrow">
      <div className="page-header">
        <h1>📱 Check-in</h1>
        <p>Registre a entrada da criança</p>
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

      {/* Step 1: Search */}
      {step === 'search' && (
        <div className="card card-elevated" style={{ animation: 'slideUp 0.5s var(--ease-out) both' }}>
          <h3 style={{ marginBottom: 'var(--space-2)' }}>Identificação</h3>
          <p style={{ marginBottom: 'var(--space-6)', fontSize: 'var(--text-sm)' }}>
            Digite seu telefone ou e-mail para verificar se já possui cadastro
          </p>

          <div className="form-group">
            <label className="form-label" htmlFor="search-input">Telefone ou E-mail</label>
            <input
              id="search-input"
              type="text"
              className="form-input"
              placeholder="(11) 99999-9999 ou email@exemplo.com"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              autoFocus
              autoComplete="tel"
            />
          </div>

          <button
            className="btn btn-primary btn-full btn-lg"
            onClick={handleSearch}
            disabled={loading}
            id="btn-search"
          >
            {loading ? (
              <><span className="spinner" style={{ width: 24, height: 24, borderWidth: 3 }} /> Buscando...</>
            ) : (
              '🔍 Buscar cadastro'
            )}
          </button>

          <p style={{ textAlign: 'center', marginTop: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
            Não tem cadastro? Sem problema! Vamos criar um agora.
          </p>
        </div>
      )}

      {/* Step 2: Registration */}
      {step === 'register' && (
        <div className="card card-elevated" style={{ animation: 'slideUp 0.5s var(--ease-out) both' }}>
          {!isNewRegistration && children.length > 0 ? (
            <>
              <h3 style={{ marginBottom: 'var(--space-2)' }}>Bem-vindo(a) de volta, {guardian?.full_name?.split(' ')[0]}! 👋</h3>
              <p style={{ marginBottom: 'var(--space-6)', fontSize: 'var(--text-sm)' }}>
                Selecione a criança ou cadastre uma nova
              </p>

              {children.map((child) => (
                <div
                  key={child.id}
                  className="info-card"
                  onClick={() => handleSelectExistingChild(child)}
                  style={{ cursor: 'pointer' }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleSelectExistingChild(child)}
                >
                  <div className="info-card-icon" style={{ background: 'var(--color-primary-100)' }}>
                    {child.gender === 'male' ? '👦' : child.gender === 'female' ? '👧' : '🧒'}
                  </div>
                  <div className="info-card-content">
                    <div className="info-card-title">{child.name}</div>
                    <div className="info-card-subtitle">{child.age} anos • {child.gender === 'male' ? 'Masculino' : child.gender === 'female' ? 'Feminino' : 'Outro'}</div>
                  </div>
                  <span style={{ fontSize: '24px' }}>→</span>
                </div>
              ))}

              <div style={{ textAlign: 'center', margin: 'var(--space-6) 0 var(--space-4)', color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
                — ou cadastre uma nova criança —
              </div>
            </>
          ) : (
            <>
              <h3 style={{ marginBottom: 'var(--space-2)' }}>Novo Cadastro</h3>
              <p style={{ marginBottom: 'var(--space-6)', fontSize: 'var(--text-sm)' }}>
                Preencha os dados abaixo para registrar
              </p>
            </>
          )}

          {/* Guardian Fields */}
          <h4 style={{ marginBottom: 'var(--space-4)', color: 'var(--color-secondary-700)', fontSize: 'var(--text-base)' }}>
            👤 Dados do Responsável
          </h4>

          <div className="form-group">
            <label className="form-label" htmlFor="full_name">Nome completo</label>
            <input
              id="full_name"
              type="text"
              className="form-input"
              placeholder="Nome completo do responsável"
              value={form.full_name}
              onChange={(e) => setForm(prev => ({ ...prev, full_name: e.target.value }))}
              autoComplete="name"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="phone">Telefone</label>
              <input
                id="phone"
                type="tel"
                className="form-input"
                placeholder="(11) 99999-9999"
                value={form.phone}
                onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
                autoComplete="tel"
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="email">E-mail</label>
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="email@exemplo.com"
                value={form.email}
                onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                autoComplete="email"
              />
            </div>
          </div>

          {/* Child Fields */}
          <h4 style={{ marginTop: 'var(--space-6)', marginBottom: 'var(--space-4)', color: 'var(--color-secondary-700)', fontSize: 'var(--text-base)' }}>
            🧒 Dados da Criança
          </h4>

          <div className="form-group">
            <label className="form-label" htmlFor="child_name">Nome da criança</label>
            <input
              id="child_name"
              type="text"
              className="form-input"
              placeholder="Nome completo da criança"
              value={form.child_name}
              onChange={(e) => setForm(prev => ({ ...prev, child_name: e.target.value }))}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="child_age">Idade</label>
              <input
                id="child_age"
                type="number"
                className="form-input"
                placeholder="Ex: 5"
                min={0}
                max={17}
                value={form.child_age}
                onChange={(e) => setForm(prev => ({ ...prev, child_age: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="child_gender">Sexo</label>
              <select
                id="child_gender"
                className="form-select"
                value={form.child_gender}
                onChange={(e) => setForm(prev => ({ ...prev, child_gender: e.target.value }))}
              >
                <option value="">Selecione</option>
                <option value="male">Masculino</option>
                <option value="female">Feminino</option>
                <option value="other">Outro</option>
              </select>
            </div>
          </div>

          {/* Medical Info */}
          <div className="form-group" style={{ marginTop: 'var(--space-4)' }}>
            <div className="toggle-group">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={form.has_medical_condition}
                  onChange={(e) => setForm(prev => ({ ...prev, has_medical_condition: e.target.checked }))}
                />
                <span className="toggle-slider" />
              </label>
              <span className="form-label" style={{ marginBottom: 0 }}>Possui condição médica?</span>
            </div>
            {form.has_medical_condition && (
              <div style={{ marginTop: 'var(--space-3)', animation: 'slideUp 0.3s var(--ease-out) both' }}>
                <textarea
                  className="form-textarea"
                  placeholder="Descreva a condição médica, alergias ou sintomas..."
                  value={form.medical_description}
                  onChange={(e) => setForm(prev => ({ ...prev, medical_description: e.target.value }))}
                />
              </div>
            )}
          </div>

          <div className="form-group">
            <div className="toggle-group">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={form.uses_medication}
                  onChange={(e) => setForm(prev => ({ ...prev, uses_medication: e.target.checked }))}
                />
                <span className="toggle-slider" />
              </label>
              <span className="form-label" style={{ marginBottom: 0 }}>Usa alguma medicação?</span>
            </div>
            {form.uses_medication && (
              <div style={{ marginTop: 'var(--space-3)', animation: 'slideUp 0.3s var(--ease-out) both' }}>
                <textarea
                  className="form-textarea"
                  placeholder="Descreva a medicação e dosagem..."
                  value={form.medication_description}
                  onChange={(e) => setForm(prev => ({ ...prev, medication_description: e.target.value }))}
                />
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
            <button className="btn btn-outline" onClick={() => setStep('search')} style={{ flex: '0 0 auto' }}>
              ← Voltar
            </button>
            <button
              className="btn btn-primary btn-full btn-lg"
              onClick={handleRegister}
              disabled={loading}
              id="btn-register"
            >
              {loading ? 'Processando...' : 'Continuar →'}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Consent */}
      {step === 'consent' && (
        <div className="card card-elevated" style={{ animation: 'slideUp 0.5s var(--ease-out) both' }}>
          <h3 style={{ marginBottom: 'var(--space-2)' }}>Termo de Consentimento</h3>
          <p style={{ marginBottom: 'var(--space-6)', fontSize: 'var(--text-sm)' }}>
            Leia e aceite o termo abaixo para autorizar a permanência da criança
          </p>

          {selectedChild && (
            <div className="info-card mb-6">
              <div className="info-card-icon" style={{ background: 'var(--color-primary-100)' }}>
                {selectedChild.gender === 'male' ? '👦' : selectedChild.gender === 'female' ? '👧' : '🧒'}
              </div>
              <div className="info-card-content">
                <div className="info-card-title">{selectedChild.name}</div>
                <div className="info-card-subtitle">{selectedChild.age} anos</div>
              </div>
            </div>
          )}

          <div className="consent-box">
            <h3>📜 Termo de Autorização e Responsabilidade</h3>
            <p>
              Eu, <strong>{form.full_name || guardian?.full_name}</strong>, responsável pela criança
              <strong> {selectedChild?.name}</strong>, declaro que:
            </p>
            <ul>
              <li>
                <strong>Autorizo</strong> a permanência da criança neste estabelecimento durante o período
                compreendido entre o check-in e o check-out.
              </li>
              <li>
                <strong>Reconheço</strong> que o estabelecimento se compromete a zelar pela segurança e
                bem-estar da criança durante sua permanência.
              </li>
              <li>
                <strong>Autorizo</strong> a equipe do estabelecimento a prestar cuidados básicos
                (hidratação, alimentação leve, primeiros socorros) à criança, caso necessário.
              </li>
              <li>
                <strong>Declaro</strong> que as informações fornecidas sobre condições médicas e
                medicações são verdadeiras e completas.
              </li>
              <li>
                <strong>Comprometo-me</strong> a realizar a retirada da criança pessoalmente,
                mediante identificação, no momento do check-out.
              </li>
              <li>
                <strong>Estou ciente</strong> de que apenas o responsável cadastrado poderá
                realizar a retirada da criança.
              </li>
            </ul>
          </div>

          <label className="checkbox-group" htmlFor="consent-checkbox">
            <input
              type="checkbox"
              id="consent-checkbox"
              className="checkbox-input"
              checked={consentAccepted}
              onChange={(e) => setConsentAccepted(e.target.checked)}
            />
            <span className="checkbox-label">
              <strong>Li e concordo</strong> com todos os termos e condições acima descritos,
              autorizando a permanência da criança no estabelecimento.
            </span>
          </label>

          <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
            <button className="btn btn-outline" onClick={() => setStep('register')} style={{ flex: '0 0 auto' }}>
              ← Voltar
            </button>
            <button
              className="btn btn-secondary btn-full btn-lg"
              onClick={handleConsent}
              disabled={loading || !consentAccepted}
              id="btn-consent"
            >
              {loading ? 'Registrando...' : '✅ Confirmar Entrada'}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Confirmation */}
      {step === 'confirmation' && checkinResult && (
        <div style={{ animation: 'slideUp 0.5s var(--ease-out) both' }}>
          <div className="success-screen">
            <div className="success-icon">✅</div>
            <h2 className="success-title">Entrada registrada!</h2>
            <p className="success-subtitle">
              A criança foi registrada com sucesso no sistema.
            </p>
          </div>

          <div className="card card-elevated">
            <h4 style={{ marginBottom: 'var(--space-4)', color: 'var(--color-secondary-700)' }}>Detalhes do Check-in</h4>

            <div className="info-card">
              <div className="info-card-icon" style={{ background: 'var(--color-secondary-50)' }}>🧒</div>
              <div className="info-card-content">
                <div className="info-card-title">{selectedChild?.name}</div>
                <div className="info-card-subtitle">Criança</div>
              </div>
            </div>

            <div className="info-card">
              <div className="info-card-icon" style={{ background: 'var(--color-primary-50)' }}>👤</div>
              <div className="info-card-content">
                <div className="info-card-title">{guardian?.full_name}</div>
                <div className="info-card-subtitle">Responsável</div>
              </div>
            </div>

            <div className="info-card">
              <div className="info-card-icon" style={{ background: 'var(--color-info-bg)' }}>🕐</div>
              <div className="info-card-content">
                <div className="info-card-title">
                  {new Date(checkinResult.checkin_time).toLocaleString('pt-BR')}
                </div>
                <div className="info-card-subtitle">Data e hora da entrada</div>
              </div>
            </div>

            <div className="info-card">
              <div className="info-card-icon" style={{ background: 'var(--color-warning-bg)' }}>🔑</div>
              <div className="info-card-content">
                <div className="info-card-title" style={{ fontFamily: 'monospace', letterSpacing: '0.1em' }}>
                  {checkinResult.unique_code}
                </div>
                <div className="info-card-subtitle">Código único de identificação</div>
              </div>
            </div>

            <button
              className="btn btn-primary btn-full btn-lg mt-6"
              onClick={handleReset}
              id="btn-new-checkin"
            >
              📱 Novo Check-in
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CheckInPage() {
  return (
    <Suspense fallback={<div className="loading-screen"><div className="spinner" /><p>Carregando...</p></div>}>
      <CheckInContent />
    </Suspense>
  );
}
