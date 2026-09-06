# 🧭 ROADMAP DE INTEGRAÇÕES — OIO CORE

> Documento de continuidade técnica. Este arquivo registra a ordem oficial das próximas integrações e deve refletir somente o estado realmente concluído e testado.

**Estado atual: grande parte da infraestrutura já foi construída. A próxima tarefa real é o fechamento da identidade/avatar e, em seguida, o bloqueio de acesso do Core por sessão OIO ID.**

---

## 🎯 Objetivo geral

Construir o ecossistema OIO com uma identidade central e integrações separadas por responsabilidade, preservando o que já funciona.

```text
                         OIO ID
                  identidade central
                         │
          ┌──────────────┼──────────────┐
          ↓              ↓              ↓
      OIO CORE       VITORINO        futuros apps
          │
   ┌──────┼──────┐
   ↓      ↓      ↓
 CHAT  VÍDEOS  ARCADE
          │
   Turso / Cloudinary / Ably / Vercel
```

---

# 🔵 FASE 1 — OIO ID + identidade central

**STATUS: 🟡 EM FECHAMENTO**

### Já concluído e testado

- ☑️ Nome persistente no perfil
- ☑️ E-mail persistente
- ☑️ Senha com hash no backend
- ☑️ OIO ID único por conta
- ☑️ Estrutura `accounts` no Turso
- ☑️ Estrutura `credentials` no Turso
- ☑️ Estrutura `profiles` no Turso
- ☑️ Estrutura `sessions` no Turso
- ☑️ Estrutura `auth_events` no Turso
- ☑️ Cadastro real `/api/auth/register`
- ☑️ Login real `/api/auth/login`
- ☑️ Verificação real `/api/auth/session`
- ☑️ Cookie de sessão HttpOnly/Secure
- ☑️ Sessão persistente
- ☑️ Validade absoluta de 30 dias
- ☑️ OIO ID abre diretamente no perfil quando existe sessão válida
- ☑️ OIO ID visual aprovado
- ☑️ Avatar com câmera/galeria no OIO ID
- ☑️ Navegação OIO ID → OIO Core
- ☑️ Navegação OIO ID → Vitorino Vitrines

### Ainda falta fechar

- [ ] Foto de perfil persistente
- [ ] Avatar enviado ao Cloudinary
- [ ] `avatar_url` salvo no perfil do Turso
- [ ] `avatar_public_id` salvo no perfil do Turso
- [ ] Recuperação da foto ao abrir novamente o OIO ID
- [ ] Testar identidade completa com os 2 usuários

### Arquitetura do avatar

```text
Usuário escolhe foto
        ↓
     Cloudinary
        ↓
 URL permanente + public_id
        ↓
       Turso
        ↓
    Perfil OIO ID
```

### Critério de conclusão

A fase passa para ☑️ quando os dois usuários conseguirem entrar no OIO ID e nome, identidade e foto forem recuperados corretamente após sair e entrar novamente.

---

# 🟢 FASE 2 — OIO ID → OIO Core

**STATUS: 🟡 PARCIALMENTE CONCLUÍDA**

### Já concluído

- ☑️ OIO ID possui sessão real
- ☑️ OIO ID consegue abrir o OIO Core
- ☑️ Usuário autenticado consegue entrar no Core sem novo login
- ☑️ Fluxo OIO ID → OIO Core preservado

### Falta

- [ ] Core reconhecer e consumir a sessão OIO ID internamente
- [ ] Nome oficial do OIO ID no Core
- [ ] OIO ID disponível para as APIs do Core
- [ ] Avatar oficial do OIO ID no Core
- [ ] Avatar real no CHAT
- [ ] Remover dependência da identidade antiga para representar o usuário
- [ ] Testar os 2 usuários

### Fluxo final

```text
OIO ID
  ↓
sessão válida
  ↓
OIO ID + nome + avatar
  ↓
OIO Core
  ↓
CHAT
```

---

# 🔐 FASE 3 — Segurança de acesso ao OIO Core

**STATUS: 🔴 PRÓXIMA IMPLEMENTAÇÃO CRÍTICA**

### Objetivo

Impedir qualquer acesso ao OIO Core sem uma sessão OIO ID válida.

- [ ] Proteger `/`
- [ ] Proteger `/teste.html`
- [ ] Proteger abertura pelo PWA
- [ ] Sessão válida → abrir Core diretamente
- [ ] Sem sessão → encaminhar para OIO ID
- [ ] Sessão expirada → encaminhar para OIO ID
- [ ] Sessão revogada → encaminhar para OIO ID
- ☑️ Manter validade absoluta de 30 dias
- [ ] Testar acesso sem login
- [ ] Testar sessão expirada

### Regra de acesso

```text
                 OIO CORE
                    ↓
          sessão OIO ID válida?
              ↙          ↘
            SIM           NÃO
             ↓             ↓
        entra direto     OIO ID
```

**Importante:** a proteção deve considerar também acesso direto a `teste.html` e a abertura pelo PWA. Não basta proteger apenas o `index.html`.

---

# 🟣 FASE 4 — Ably / realtime

**STATUS: 🟡 INFRAESTRUTURA PREPARADA**

### Já concluído

- ☑️ Aplicação Ably criada para o OIO Core
- ☑️ API key dedicada do servidor configurada
- ☑️ Capacidades necessárias selecionadas para realtime
- ☑️ `ABLY_API_KEY` configurada no backend/Vercel
- ☑️ `/api/ably-health`
- ☑️ Validação Vercel → Ably
- ☑️ Emissão de token de validação

### Falta

- [ ] `/api/ably-token` definitivo
- [ ] Validar sessão OIO ID antes de emitir token
- [ ] `clientId` baseado no OIO ID autenticado
- [ ] Presença online
- [ ] Indicador verde
- [ ] `typing:start`
- [ ] `typing:stop`
- [ ] Indicador de digitação
- [ ] Avatar + nome no indicador
- [ ] Teste entre os 2 usuários

### Responsabilidades

```text
Turso       → dados persistentes
Ably        → realtime / presença / digitação
Cloudinary  → mídia
Vercel      → APIs e backend
OIO ID      → identidade e sessão
```

---

# 💬 FASE 5 — CHAT + identidade OIO

**STATUS: 🟢 CHAT BASE CONCLUÍDO / REALTIME PENDENTE**

### Já concluído e validado

- ☑️ Chat por texto
- ☑️ Persistência no Turso
- ☑️ Envio de fotos
- ☑️ Upload de fotos no Cloudinary
- ☑️ Gravação de áudio
- ☑️ Pré-visualização antes do envio
- ☑️ Excluir / continuar / enviar áudio
- ☑️ Upload de áudio no Cloudinary
- ☑️ Player personalizado para áudio enviado
- ☑️ Descrição/caption associada à mídia
- ☑️ Web Push
- ☑️ Service Worker
- ☑️ Badge de não lidas quando suportado
- ☑️ Ação Responder da notificação
- ☑️ Regra de uma reprodução de áudio por vez

### Falta

- [ ] Avatar oficial do OIO ID
- [ ] Nome oficial do OIO ID
- [ ] Presença realtime
- [ ] Digitando em realtime
- [ ] Indicador visual de digitação
- [ ] Teste completo entre os 2 usuários com Ably

---

# 🎬 FASE 6 — VÍDEOS

**STATUS: ☑️ CONCLUÍDA / VALIDADA**

- ☑️ Feed vertical
- ☑️ Upload autorizado
- ☑️ Cloudinary para mídia
- ☑️ Turso para metadados
- ☑️ Limite de 10 vídeos publicados
- ☑️ Limite de 30 segundos
- ☑️ Limite de 30 MB
- ☑️ Descrição de até 100 caracteres
- ☑️ Exclusão administrativa
- ☑️ Remoção do ativo no Cloudinary
- ☑️ Controle de áudio entre vídeos
- ☑️ Fluxo administrativo protegido por senha

---

# 🎮 FASE 7 — ARCADE

**STATUS: ☑️ CONCLUÍDA / PRESERVADA**

- ☑️ Módulo ARCADE existente
- ☑️ Hub de jogos/experiências
- ☑️ Preservação do módulo durante as evoluções do Core

---

# 🛍️ FASE 8 — Vitorino Vitrines

**STATUS: 🟡 ACESSO CONECTADO / INTEGRAÇÃO FUTURA**

O Vitorino permanece como projeto independente.

### Já concluído

- ☑️ Repositório independente
- ☑️ Separação física do código
- ☑️ Acesso pelo perfil do OIO ID
- ☑️ OIO Core mantém a Loja como ponto de acesso

### Falta

- [ ] Identidade central do OIO ID no Vitorino
- [ ] Autorização de vendedor
- [ ] Fluxo de publicação por usuário autenticado
- [ ] Cloudinary para mídia do Vitorino conforme arquitetura do projeto
- [ ] Turso para dados do Vitorino conforme arquitetura do projeto
- [ ] Ably quando houver necessidade real
- [ ] Pagamento somente no final

**Regra:** não misturar fisicamente o código do Vitorino com o repositório do OIO Core.

---

# 🌐 FASE 9 — Integrações de conteúdo e serviços

**STATUS: ⏳ POSTERIOR**

As integrações entram somente quando houver uma função clara no aplicativo.

Possíveis grupos:

- [ ] Vídeos e conteúdo
- [ ] Música
- [ ] Notícias
- [ ] Livros
- [ ] Clima
- [ ] Países
- [ ] Imagens
- [ ] Afiliados
- [ ] Marketing
- [ ] Outras APIs específicas dos módulos

---

# 🧱 Regras do roadmap

1. **Uma fase por vez.**
2. **Uma alteração → um commit → teste.**
3. Não marcar uma tarefa como concluída antes de testar.
4. Não alterar funcionalidades já validadas sem necessidade.
5. Não colocar segredos no GitHub ou frontend.
6. Turso guarda dados; Cloudinary guarda mídia.
7. Ably fica responsável pelo realtime, não pelo armazenamento permanente.
8. OIO ID é a identidade central.
9. Vitorino permanece independente do OIO Core.
10. O roadmap deve ser atualizado após cada fase realmente concluída.

---

# 📌 PRÓXIMO PASSO OFICIAL

A infraestrutura principal do OIO já está bastante avançada. Não devemos voltar para fases antigas como se ainda não existissem.

### Ordem imediata

```text
1. FECHAR AVATAR / IDENTIDADE OIO ID
             ↓
2. CONSUMIR OIO ID NO CORE
             ↓
3. BLOQUEAR CORE SEM SESSÃO VÁLIDA
             ↓
4. FINALIZAR ABLY REALTIME
             ↓
5. UNIFICAR IDENTIDADE NO CHAT
             ↓
6. AVANÇAR VITORINO
```

**PRÓXIMA TAREFA:** persistência do avatar do OIO ID no Cloudinary + Turso.

---

**Última atualização:** 06/09/2026
