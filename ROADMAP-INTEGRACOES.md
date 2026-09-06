# 🧭 ROADMAP DE INTEGRAÇÕES — OIO CORE

> Documento de continuidade técnica. Este arquivo registra a ordem oficial das próximas integrações e deve refletir somente o estado realmente concluído e testado.

**Próxima fase ativa: FASE 1 — OIO ID + identidade central.**

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

**STATUS: ▶️ PRÓXIMA FASE**

### Objetivo

Completar a identidade persistente do OIO ID para os usuários existentes e preparar a identidade para ser consumida pelo OIO Core.

### Identidade de cada usuário

- [ ] Nome persistente
- [ ] E-mail persistente
- [ ] Senha com hash no backend
- [ ] OIO ID único
- [ ] Foto de perfil persistente
- [ ] Avatar enviado ao Cloudinary
- [ ] `avatar_url` salvo no perfil do Turso
- [ ] `avatar_public_id` salvo no perfil do Turso
- [ ] Recuperação da foto ao abrir novamente o OIO ID
- [ ] Testar com os 2 usuários

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

A fase só passa para ☑️ quando os dois usuários conseguirem entrar no OIO ID e a foto, nome e identidade forem recuperados corretamente após sair e entrar novamente.

---

# 🟢 FASE 2 — OIO ID → OIO Core

**STATUS: ⏳ AGUARDANDO FASE 1**

### Objetivo

Fazer o OIO Core consumir a identidade oficial do OIO ID.

- [ ] Core reconhecer sessão OIO ID
- [ ] Nome do OIO ID no Core
- [ ] OIO ID disponível para o Core
- [ ] Avatar do OIO ID no Core
- [ ] Avatar real no CHAT
- [ ] Remover dependência da identidade antiga para representar o usuário
- [ ] Testar os 2 usuários

### Fluxo

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

**STATUS: ⏳ AGUARDANDO FASE 2**

### Objetivo

Impedir qualquer acesso ao OIO Core sem uma sessão OIO ID válida.

- [ ] Proteger `/`
- [ ] Proteger `/teste.html`
- [ ] Proteger abertura pelo PWA
- [ ] Sessão válida → abrir Core diretamente
- [ ] Sem sessão → encaminhar para OIO ID
- [ ] Sessão expirada → encaminhar para OIO ID
- [ ] Sessão revogada → encaminhar para OIO ID
- [ ] Manter validade absoluta de 30 dias
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

---

# 🟣 FASE 4 — Ably / realtime

**STATUS: ⏳ AGUARDANDO FASE 3**

### Objetivo

Adicionar realtime verdadeiro ao CHAT sem usar Supabase Realtime.

- [ ] `/api/ably-token`
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

**STATUS: ⏳ AGUARDANDO FASE 4**

- [ ] Avatar oficial
- [ ] Nome oficial
- [ ] Presença
- [ ] Digitando em realtime
- [ ] Mensagens
- [ ] Fotos
- [ ] Áudio
- [ ] Web Push
- [ ] Responder
- [ ] Teste completo entre os 2 usuários

---

# 🛍️ FASE 6 — Vitorino Vitrines

**STATUS: ⏳ POSTERIOR**

O Vitorino permanece como projeto independente.

- [ ] Integração de acesso pelo OIO ID
- [ ] Identidade central quando necessária
- [ ] Preparação de autorização de vendedor
- [ ] Cloudinary para mídia
- [ ] Turso para dados
- [ ] Vercel para backend
- [ ] Ably quando necessário
- [ ] Pagamento somente no final

**Regra:** não misturar fisicamente o código do Vitorino com o repositório do OIO Core.

---

# 🌐 FASE 7 — Integrações de conteúdo e serviços

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

# 📌 Estado atual

**FASE ATIVA:** FASE 1 — OIO ID + identidade central

**PRÓXIMA TAREFA:** implementar a persistência do avatar do OIO ID no Cloudinary e vincular `avatar_url` / `avatar_public_id` ao perfil no Turso.

**Depois:** testar com os 2 usuários antes de iniciar a FASE 2.

---

**Última atualização:** 06/09/2026
