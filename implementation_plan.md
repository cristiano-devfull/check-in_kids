# Plano: Configurações de Marca e Segurança de Produção

Este plano visa preparar a aplicação para produção (Vercel), permitindo que cada cliente personalize sua marca e garantindo que os dados estejam protegidos por políticas de segurança (RLS) robustas.

## User Review Required

> [!IMPORTANT]
> **Políticas de Segurança (RLS)**: O script SQL fornecido desativará o acesso indiscriminado e limitará cada usuário aos seus próprios dados. Certifique-se de aplicá-lo após a atualização do código.

## Alterações Propostas

### ── Banco de Dados (Supabase) ──

#### [MANDATÓRIO] Script SQL de Segurança e Evolução
Criar um script para:
1. Adicionar coluna `logo_url` na tabela `organizations`.
2. Reativar RLS em todas as tabelas.
3. Configurar políticas de acesso:
   - `organizations`: Admin pode editar/ler sua própria org. Público (anon) pode ler (necessário para check-in).
   - `profiles`: Apenas o dono pode ver/editar.
   - `guardians`, `children`, `checkins`: Isolamento total por `organization_id`.

### ── Backend e Serviços ──

#### [MODIFY] [types.ts](file:///Users/joaocristianodasilvaaraujo/check-in_kids/src/lib/types.ts)
Adicionar `logo_url` à interface `Organization`.

#### [MODIFY] [services.ts](file:///Users/joaocristianodasilvaaraujo/check-in_kids/src/lib/services.ts)
Implementar `updateOrganization(orgId, data)` para permitir alteração de nome e logo.

#### [NEW] [/api/organizations/route.ts](file:///Users/joaocristianodasilvaaraujo/check-in_kids/src/app/api/organizations/route.ts)
Criar endpoint `PATCH` para atualização dos dados da empresa pelo administrador.

### ── Frontend e UI ──

#### [NEW] [settings/page.tsx](file:///Users/joaocristianodasilvaaraujo/check-in_kids/src/app/admin/settings/page.tsx)
Criar página de configurações com:
- Campo para Editar Nome do Estabelecimento.
- Campo para URL do Logo (placeholder/input).
- Botão "Salvar Alterações".

#### [MODIFY] [page.tsx](file:///Users/joaocristianodasilvaaraujo/check-in_kids/src/app/admin/page.tsx) (Admin)
Adicionar link/botão para acessar a página de Configurações no cabeçalho.

## Plano de Verificação

### Testes Manuais
- [ ] Alterar o nome da empresa nas Configurações e verificar se atualiza no Painel e na Estação.
- [ ] Tentar acessar dados de outra organização (via ID na URL) e verificar se o RLS bloqueia.
- [ ] Validar se o fluxo público de check-in continua funcionando após a reativação do RLS.
