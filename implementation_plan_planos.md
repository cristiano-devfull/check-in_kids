# Planejamento: Planos de Assinatura (SaaS)

Este documento detalha a implementação de níveis de serviço para monetizar a plataforma CheckKids, garantindo escalabilidade e controle de cotas.

## 📊 Definição dos Planos

| Recurso | **Grátis** | **Pro** | **Enterprise** |
| :--- | :--- | :--- | :--- |
| **Check-ins Ativos** | Até 10 simultâneos | Até 50 simultâneos | Ilimitado |
| **Crianças no Banco** | Até 50 cadastradas | Até 500 cadastradas | Ilimitado |
| **Personalização** | Logo padrão | Logo personalizada | White-label completo |
| **Relatórios** | Últimos 7 dias | Histórico completo | Exportação Avançada |

## Proposta Técnica

### 1. Extensão do Banco de Dados (Supabase)
Precisamos adicionar campos de controle na tabela `organizations`:
- `subscription_tier`: 'free' | 'pro' | 'enterprise' (padrão 'free')
- `subscription_status`: 'active' | 'past_due' | 'canceled'
- `max_active_checkins`: Integer (conforme o plano)
- `max_children`: Integer (conforme o plano)

### 2. Lógica de Negócio (Backend)
- **Validação de Quota**: Antes de permitir um novo Check-in em `services.ts`, verificaremos se a organização já atingiu o limite do seu plano.
- **Middleware de Recursos**: Bloquear o acesso à aba de Relatórios Avançados ou Configurações de Branding se o plano for 'free'.

### 3. Interface Administrativa (Frontend)
- **Nova Aba "Plano"**: Em Configurações, criar uma visualização premium mostrando o plano atual e cards de upgrade.
- **Indicadores de Uso**: Mostrar barras de progresso (ex: "8/10 check-ins usados") para incentivar o upgrade.

## Arquivos Afetados

#### [MODIFY] [types.ts](file:///Users/joaocristianodasilvaaraujo/check-in_kids/src/lib/types.ts) [NEW]
- Adicionar definições de `SubscriptionTier` e atualizar o objeto `Organization`.

#### [MODIFY] [services.ts](file:///Users/joaocristianodasilvaaraujo/check-in_kids/src/lib/services.ts)
- Implementar as travas de segurança em `createCheckIn` e `createChild`.

#### [NEW] [SubscriptionManager.tsx](file:///Users/joaocristianodasilvaaraujo/check-in_kids/src/components/SubscriptionManager.tsx)
- Componente visual para mostrar os planos e benefícios.

#### [MODIFY] [settings/page.tsx](file:///Users/joaocristianodasilvaaraujo/check-in_kids/src/app/admin/settings/page.tsx)
- Integrar a gestão de assinatura.

## Perguntas em Aberto

> [!WARNING]
> **Integração de Pagamento**: Para esta fase, faremos o controle de planos via banco de dados (manual/simulado) ou já deseja integrar com **Stripe/Pagar.me**?

> [!NOTE]
> **Migração de Usuários Reais**: Como devemos tratar organizações que já ultrapassaram o limite do plano grátis? (Sugestão: Legacy status por 30 dias).

## Verificação

- [ ] Testar bloqueio de check-in ao atingir o limite do plano Grátis.
- [ ] Validar se as informações de upgrade aparecem corretamente em dispositivos móveis.
- [ ] Confirmar que o Admin consegue visualizar o status da sua assinatura.
