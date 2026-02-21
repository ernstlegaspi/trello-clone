import { query } from "../../db/pool.js";

const USER_SELECT_FIELDS = `
  id,
  name,
  email,
  password_hash,
  created_at,
  updated_at
`;

const SESSION_SELECT_FIELDS = `
  id,
  user_id,
  token_hash,
  expires_at,
  created_at
`;

const mapUserRow = (row) => {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.password_hash,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
};

const mapSessionRow = (row) => {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    userId: row.user_id,
    tokenHash: row.token_hash,
    expiresAt: row.expires_at,
    createdAt: row.created_at
  };
};

export const findUserByEmail = async (email) => {
  const sql = `
    SELECT ${USER_SELECT_FIELDS}
    FROM users
    WHERE email = $1
    LIMIT 1
  `;
  const result = await query(sql, [email]);
  return mapUserRow(result.rows[0]);
};

export const findUserById = async (id) => {
  const sql = `
    SELECT ${USER_SELECT_FIELDS}
    FROM users
    WHERE id = $1
    LIMIT 1
  `;
  const result = await query(sql, [id]);
  return mapUserRow(result.rows[0]);
};

export const createUser = async ({ id, name, email, passwordHash }) => {
  const sql = `
    INSERT INTO users (id, name, email, password_hash)
    VALUES ($1, $2, $3, $4)
    RETURNING ${USER_SELECT_FIELDS}
  `;
  const values = [id, name, email, passwordHash];
  const result = await query(sql, values);
  return mapUserRow(result.rows[0]);
};

export const createSession = async ({ id, userId, tokenHash, expiresAt }) => {
  const sql = `
    INSERT INTO refresh_sessions (id, user_id, token_hash, expires_at)
    VALUES ($1, $2, $3, $4)
    RETURNING ${SESSION_SELECT_FIELDS}
  `;
  const values = [id, userId, tokenHash, expiresAt];
  const result = await query(sql, values);
  return mapSessionRow(result.rows[0]);
};

export const findSessionById = async (id) => {
  const sql = `
    SELECT ${SESSION_SELECT_FIELDS}
    FROM refresh_sessions
    WHERE id = $1
      AND expires_at > NOW()
    LIMIT 1
  `;
  const result = await query(sql, [id]);
  return mapSessionRow(result.rows[0]);
};

export const deleteSessionById = async (id) => {
  const sql = `
    DELETE FROM refresh_sessions
    WHERE id = $1
  `;
  await query(sql, [id]);
};

export const deleteSessionsByUserId = async (userId) => {
  const sql = `
    DELETE FROM refresh_sessions
    WHERE user_id = $1
  `;
  await query(sql, [userId]);
};

export const pruneExpiredSessions = async () => {
  const sql = `
    DELETE FROM refresh_sessions
    WHERE expires_at <= NOW()
  `;
  await query(sql);
};

export const revokeAccessToken = async ({ jti, userId, expiresAt }) => {
  const sql = `
    INSERT INTO revoked_access_tokens (jti, user_id, expires_at)
    VALUES ($1, $2, $3)
    ON CONFLICT (jti) DO NOTHING
  `;
  await query(sql, [jti, userId, expiresAt]);
};

export const isAccessTokenRevoked = async (jti) => {
  const sql = `
    SELECT 1
    FROM revoked_access_tokens
    WHERE jti = $1
      AND expires_at > NOW()
    LIMIT 1
  `;
  const result = await query(sql, [jti]);
  return result.rowCount > 0;
};

export const pruneExpiredRevokedAccessTokens = async () => {
  const sql = `
    DELETE FROM revoked_access_tokens
    WHERE expires_at <= NOW()
  `;
  await query(sql);
};
