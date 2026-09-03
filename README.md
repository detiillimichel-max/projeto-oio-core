# OIO CORE

> **Interface Orgânica por Profundidade** — o núcleo do ecossistema OIO.

O **OIO Core** é uma PWA modular construída para funcionar como o núcleo de experiência do ecossistema OIO. O projeto reúne comunicação, mídia, entretenimento e, progressivamente, conexões com outros aplicativos do ecossistema.

**Produção:** `projeto-oio-core.vercel.app`

---

## 🧬 DNA do OIO

O OIO Core não é apenas uma página com funções agrupadas. A proposta é trabalhar com uma **interface por profundidade**, na qual os módulos ficam acessíveis sem perder a identidade central da aplicação.

Princípios do projeto:

- interface mobile-first;
- experiência PWA;
- módulos independentes;
- backend separado do frontend quando necessário;
- mídia pesada fora do banco de dados;
- dados estruturados no banco;
- segredos somente no ambiente de backend;
- alterações pequenas, isoladas e testáveis;
- preservação das funcionalidades já validadas.

---

## 📱 Estrutura principal

A navegação principal do OIO Core está organizada em módulos:

```text
CHAT | VÍDEOS | ARCADE | LOJA | LIGAR
```

### CHAT

Sistema de comunicação conectado ao backend do OIO.

Recursos já implementados:

- mensagens de texto;
- envio de fotos;
- gravação de áudio;
- pré-visualização do áudio antes do envio;
- excluir/continuar/enviar áudio;
- upload de mídia para Cloudinary;
- persistência das mensagens no Turso;
- notificações Web Push;
- contagem de não lidas/badge quando suportado pelo dispositivo;
- abertura do chat pela ação **Responder** da notificação.

### VÍDEOS

Feed vertical de vídeos do OIO.

Recursos implementados:

- feed de vídeos;
- upload autorizado;
- Cloudinary para armazenamento da mídia;
- Turso para metadados;
- limite de até 10 vídeos publicados;
- limite de 30 segundos por vídeo;
- limite de 30 MB por vídeo;
- descrição de até 100 caracteres;
- exclusão administrativa;
- exclusão do ativo no Cloudinary antes da remoção do registro;
- controle para evitar reprodução de áudio simultânea entre vídeos.

### ARCADE

Área de acesso aos módulos de entretenimento do ecossistema OIO.

Atualmente funciona como um hub para os jogos e experiências externas já conectadas ao projeto.

### LOJA

**Integração planejada com o Vitorino Vitrines.**

O Vitorino Vitrines permanece como projeto independente, com seu próprio repositório e ciclo de desenvolvimento.

Arquitetura prevista:

```text
OIO CORE
CHAT | VÍDEOS | ARCADE | LOJA | LIGAR
                         ↓
                 VITORINO VITRINES
                         ↓
                Vercel / Turso / Cloudinary
```

O OIO Core será o ponto de acesso à Loja, sem transformar o Vitorino Vitrines em parte física do repositório do Core.

### LIGAR

Módulo de chamada já existente no OIO Core.

**Regra:** a implementação existente deve ser preservada. Alterações futuras no menu não devem remover, substituir ou quebrar o módulo LIGAR.

---

## 🏗️ Arquitetura atual

```text
                         OIO CORE
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
        Frontend           APIs             PWA
          │                 │                 │
          │          ┌──────┴──────┐          │
          │          │             │          │
          ▼          ▼             ▼          ▼
      teste.html   /api/chat   /api/videos   sw.js
          │          │             │
          │          └──────┬──────┘
          │                 │
          │              TURSO
          │                 │
          │       dados e metadados
          │
          └────────── CLOUDINARY
                     fotos / áudios / vídeos

                    VERCEL
              hospedagem + funções API
```

### Camadas

| Camada | Responsabilidade |
|---|---|
| Frontend | Interface e interação do usuário |
| Vercel | Hospedagem e execução das APIs |
| API | Regras de negócio e acesso aos dados |
| Turso | Persistência de dados e metadados |
| Cloudinary | Armazenamento e entrega de mídia |
| Service Worker | Recursos PWA e Push |
| Web Push | Notificações para o dispositivo |

---

## 🗄️ Turso

O projeto utiliza **Turso/libSQL** como banco principal.

As APIs criam/verificam suas estruturas necessárias quando executadas.

### Estruturas principais conhecidas

#### `chat_geral`

Armazena mensagens e referências das mídias enviadas.

Campos relevantes:

- `id`
- `autor`
- `texto`
- `data`
- `media_url`
- `media_public_id`
- `media_type`
- `media_duration`

#### `push_subscriptions`

Armazena as inscrições necessárias para Web Push.

#### `videos`

Armazena os metadados dos vídeos publicados.

Campos relevantes:

- `id`
- `url`
- `public_id`
- `descricao`
- `autor`
- `duracao`
- `tamanho`
- `formato`
- `status`
- `created_at`

---

## ☁️ Cloudinary

O Cloudinary é utilizado para mídia, evitando colocar arquivos grandes diretamente no banco.

Organização adotada no projeto:

```text
oio-core/
├── audios/
├── fotos/
├── videos/
└── samples/
```

Presets atualmente utilizados pelo projeto incluem:

- `oio_core_audio`
- `oio_core_fotos_upload`
- `oio_core_videos_upload`

> **Segurança:** chaves privadas e segredos do Cloudinary não pertencem ao frontend. Valores sensíveis devem permanecer nas variáveis de ambiente da Vercel/backend.

---

## 🔔 Notificações

O OIO Core possui infraestrutura de Web Push.

Fluxo:

```text
Nova mensagem
     ↓
/api/chat
     ↓
Turso registra
     ↓
Web Push
     ↓
Service Worker
     ↓
Notificação Android/browser
     ↓
Responder
     ↓
OIO Core → campo de mensagem
```

Arquivos envolvidos:

- `sw.js`
- `api/push.js`
- `api/chat.js`
- `assets/js/oio-notifications.js`

O sistema utiliza VAPID e mantém as chaves privadas no ambiente da Vercel.

---

## 📂 Estrutura do repositório

A estrutura atual inclui:

```text
projeto-oio-core/
│
├── api/
│   ├── chat.js
│   ├── push.js
│   └── videos.js
│
├── assets/
│   └── js/
│       ├── audio-recorder.js
│       └── oio-notifications.js
│
├── css/
├── js/
│
├── games.html
├── index.html
├── portal.html
├── teste.html
├── vibe.html
│
├── icone-512.png
├── manifest.json
├── sw.js
├── package.json
└── vercel.json
```

Arquivos podem crescer ou ser reorganizados conforme a modularização avançar. Este README deve ser atualizado quando uma alteração estrutural for realmente concluída.

---

## ⚙️ APIs do projeto

### `/api/chat`

Responsável por:

- buscar mensagens;
- inserir mensagens;
- receber referências de fotos e áudios;
- acessar o Turso;
- disparar Web Push após uma mensagem válida.

### `/api/videos`

Responsável por:

- listar vídeos publicados;
- publicar metadados de vídeos autorizados;
- validar duração, tamanho e quantidade;
- excluir vídeos;
- remover o ativo correspondente do Cloudinary durante a exclusão administrativa.

### `/api/push`

Responsável pela infraestrutura necessária para registrar e consultar a configuração de Web Push do OIO.

---

## 📦 Dependências principais

O `package.json` atual mantém o projeto enxuto e inclui:

- `@libsql/client` — conexão com Turso/libSQL;
- `web-push` — envio de notificações Web Push.

O frontend utiliza **Lucide** para os ícones da interface.

---

## 🔐 Variáveis de ambiente

Os valores sensíveis ficam na Vercel e **não devem ser gravados no GitHub**.

Variáveis utilizadas pelo backend incluem:

```text
TURSO_DATABASE_URL
TURSO_AUTH_TOKEN

CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET

OIO_VIDEO_ADMIN_PASSWORD

OIO_VAPID_SUBJECT
OIO_VAPID_PUBLIC_KEY
OIO_VAPID_PRIVATE_KEY
```

### Regra de ouro

```text
Código público ≠ segredo

Frontend → pode conhecer configurações públicas necessárias.
Backend/Vercel → guarda tokens, senhas e chaves privadas.
```

Nenhum segredo deve ser colocado neste README ou em arquivos versionados.

---

## 📱 PWA

O OIO Core possui:

- `manifest.json`;
- ícone de aplicativo;
- modo `standalone`;
- Service Worker;
- suporte à instalação como aplicativo;
- infraestrutura de notificações Web Push.

A aplicação é pensada prioritariamente para uso em dispositivos móveis.

---

## 🧪 Estado do projeto

### Concluído / validado

- ☑️ Repositório GitHub do OIO Core
- ☑️ Deploy em Vercel
- ☑️ Conexão do backend com Turso
- ☑️ Chat por texto
- ☑️ Envio de fotos
- ☑️ Upload de fotos no Cloudinary
- ☑️ Gravação de áudio
- ☑️ Pré-visualização do áudio antes do envio
- ☑️ Upload de áudio no Cloudinary
- ☑️ Player personalizado para áudio enviado
- ☑️ Feed de vídeos
- ☑️ Upload de vídeos no Cloudinary
- ☑️ Metadados de vídeos no Turso
- ☑️ Limites administrativos do feed
- ☑️ Exclusão administrativa de vídeos
- ☑️ Web Push
- ☑️ Service Worker
- ☑️ Badge de não lidas quando suportado
- ☑️ Módulo ARCADE
- ☑️ Módulo LIGAR preservado

### Em evolução

- 🌫️ Inserção do módulo **LOJA** no menu principal
- 🌫️ Integração do OIO Core com **Vitorino Vitrines**
- 🌫️ Evolução da arquitetura para módulos ainda mais independentes
- 🌫️ Expansão das notificações para eventos de vídeo
- 🌫️ Auditorias de segurança e performance conforme novos módulos forem adicionados

---

## 🛣️ Próximas etapas

A ordem de evolução deve privilegiar estabilidade:

1. **LOJA** — adicionar o acesso ao Vitorino Vitrines sem alterar os módulos existentes.
2. **Integração OIO Core ↔ Vitorino Vitrines**.
3. **Notificação de novos vídeos**, somente após a infraestrutura de mensagens estar comprovadamente estável.
4. **Auditoria de segurança** das APIs, uploads e autenticação administrativa.
5. **Otimização de mídia e consumo de dados** para dispositivos móveis.
6. **Modularização gradual** do frontend sem quebrar funcionalidades validadas.

---

## 🧭 Regras de desenvolvimento

Estas regras fazem parte da governança do projeto.

### 1. Não quebrar o que funciona

Uma nova funcionalidade não deve substituir uma funcionalidade validada sem necessidade.

### 2. Alterações isoladas

Sempre que possível:

```text
1 alteração
   ↓
1 commit
   ↓
teste
   ↓
próxima alteração
```

### 3. Preservar contratos existentes

Antes de modificar uma API, elemento de interface, banco ou fluxo de mídia, verificar quem depende dele.

### 4. Segredos nunca no frontend

Senhas, tokens e chaves privadas permanecem no ambiente de backend.

### 5. Banco para dados; Cloudinary para mídia

Não transformar Turso em armazenamento de arquivos grandes.

### 6. Mobile-first

Toda evolução deve ser testada considerando o uso real em Android/mobile.

### 7. Não misturar projetos

```text
OIO Core                  Vitorino Vitrines
   │                              │
   └────── integração ────────────┘
```

Os projetos permanecem independentes, mesmo quando estiverem conectados.

### 8. Documentar depois de validar

O README descreve o estado real do projeto. Uma ideia futura não deve ser documentada como se já estivesse implementada.

---

## 🔗 Ecossistema OIO

O OIO Core é o núcleo, mas não precisa conter fisicamente todos os projetos.

```text
                         ECOSSISTEMA OIO
                                │
                            OIO CORE
                                │
        ┌───────────────┬───────┼────────┬───────────────┐
        │               │       │        │               │
       CHAT          VÍDEOS   ARCADE    LOJA           LIGAR
                                        │
                                        ▼
                              VITORINO VITRINES
```

Essa separação permite que cada projeto evolua sem transformar o Core em um monólito.

---

## 📌 Documentação viva

Este README é o **caderno técnico do OIO Core**.

Sempre que uma etapa importante for concluída e testada, atualizar o documento para refletir a realidade do repositório.

**Última atualização:** 03/09/2026

---

## 👤 Projeto

**OIO Core — Interface Orgânica por Profundidade**

Desenvolvimento e evolução: **Michel / detiillimichel-max**
