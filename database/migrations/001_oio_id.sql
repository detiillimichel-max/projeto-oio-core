-- OIO ID — Fase C.1
-- Estrutura inicial de identidade central.
-- Esta migração NÃO altera as tabelas existentes do OIO Core.
-- Não contém senhas, tokens ou outros segredos.

PRAGMA foreign_keys = ON;

-- Identidade pública e dados básicos da conta.
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'blocked', 'deleted')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Credenciais separadas do perfil e da identidade pública.
-- password_hash deverá receber somente um hash seguro da senha.
CREATE TABLE IF NOT EXISTS credentials (
  account_id TEXT PRIMARY KEY,
  password_hash TEXT NOT NULL,
  password_updated_at INTEGER NOT NULL,
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until INTEGER,
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
);

-- Perfil do usuário. A foto poderá ser ligada ao Cloudinary em fase posterior.
CREATE TABLE IF NOT EXISTS profiles (
  account_id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  avatar_public_id TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
);

-- Sessões por dispositivo. O banco armazenará somente o hash do token de sessão.
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  user_agent TEXT,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL,
  revoked_at INTEGER,
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessions_account_id ON sessions(account_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- Registro de eventos de autenticação para auditoria e segurança.
CREATE TABLE IF NOT EXISTS auth_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id TEXT,
  event_type TEXT NOT NULL,
  ip_hash TEXT,
  user_agent TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_auth_events_account_id ON auth_events(account_id);
CREATE INDEX IF NOT EXISTS idx_auth_events_created_at ON auth_events(created_at);

-- Normalização de e-mail será feita pela API antes de inserir/consultar a conta.
-- OAuth clients ficam para uma migração futura, quando a integração externa for necessária.
