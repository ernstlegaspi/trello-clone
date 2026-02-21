CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS refresh_sessions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS refresh_sessions_user_id_idx
  ON refresh_sessions(user_id);

CREATE INDEX IF NOT EXISTS refresh_sessions_expires_at_idx
  ON refresh_sessions(expires_at);

CREATE TABLE IF NOT EXISTS revoked_access_tokens (
  jti UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS revoked_access_tokens_user_id_idx
  ON revoked_access_tokens(user_id);

CREATE INDEX IF NOT EXISTS revoked_access_tokens_expires_at_idx
  ON revoked_access_tokens(expires_at);

CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  created_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS organizations_created_by_user_id_idx
  ON organizations(created_by_user_id);

CREATE TABLE IF NOT EXISTS organization_members (
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (organization_id, user_id)
);

CREATE INDEX IF NOT EXISTS organization_members_user_id_idx
  ON organization_members(user_id);

CREATE TABLE IF NOT EXISTS organization_invites (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  invited_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS organization_invites_email_idx
  ON organization_invites(email);

CREATE INDEX IF NOT EXISTS organization_invites_status_idx
  ON organization_invites(status);

CREATE UNIQUE INDEX IF NOT EXISTS organization_invites_pending_unique_idx
  ON organization_invites(organization_id, email)
  WHERE status = 'pending';

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(120) NOT NULL,
  created_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS projects_organization_id_idx
  ON projects(organization_id);

CREATE UNIQUE INDEX IF NOT EXISTS projects_org_name_unique_idx
  ON projects(organization_id, lower(name));

CREATE TABLE IF NOT EXISTS lists (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(120) NOT NULL,
  position INTEGER NOT NULL CHECK (position > 0),
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  created_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS lists_project_id_idx
  ON lists(project_id);

CREATE INDEX IF NOT EXISTS lists_project_active_position_idx
  ON lists(project_id, is_archived, position);

CREATE TABLE IF NOT EXISTS cards (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  list_id UUID NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  position INTEGER NOT NULL CHECK (position > 0),
  due_at TIMESTAMPTZ,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  created_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS cards_project_id_idx
  ON cards(project_id);

CREATE INDEX IF NOT EXISTS cards_list_active_position_idx
  ON cards(list_id, is_archived, position);

CREATE TABLE IF NOT EXISTS card_members (
  card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  added_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (card_id, user_id)
);

CREATE INDEX IF NOT EXISTS card_members_user_id_idx
  ON card_members(user_id);

CREATE TABLE IF NOT EXISTS labels (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(80) NOT NULL,
  color VARCHAR(40) NOT NULL,
  created_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS labels_project_id_idx
  ON labels(project_id);

CREATE UNIQUE INDEX IF NOT EXISTS labels_project_name_unique_idx
  ON labels(project_id, lower(name));

CREATE TABLE IF NOT EXISTS card_labels (
  card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  label_id UUID NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (card_id, label_id)
);

CREATE INDEX IF NOT EXISTS card_labels_label_id_idx
  ON card_labels(label_id);

CREATE TABLE IF NOT EXISTS card_comments (
  id UUID PRIMARY KEY,
  card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS card_comments_card_id_idx
  ON card_comments(card_id);

CREATE TABLE IF NOT EXISTS checklists (
  id UUID PRIMARY KEY,
  card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  title VARCHAR(120) NOT NULL,
  position INTEGER NOT NULL CHECK (position > 0),
  created_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS checklists_card_position_idx
  ON checklists(card_id, position);

CREATE TABLE IF NOT EXISTS checklist_items (
  id UUID PRIMARY KEY,
  checklist_id UUID NOT NULL REFERENCES checklists(id) ON DELETE CASCADE,
  content VARCHAR(300) NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  position INTEGER NOT NULL CHECK (position > 0),
  completed_at TIMESTAMPTZ,
  completed_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS checklist_items_checklist_position_idx
  ON checklist_items(checklist_id, position);
