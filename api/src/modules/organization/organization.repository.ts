import { query } from "../../db/pool.js";

const runQuery = (executor, text, params = []) => executor(text, params);

const ORGANIZATION_SELECT_FIELDS = `
  id,
  name,
  created_by_user_id,
  created_at,
  updated_at
`;

const MEMBERSHIP_SELECT_FIELDS = `
  organization_id,
  user_id,
  role,
  created_at
`;

const INVITE_SELECT_FIELDS = `
  id,
  organization_id,
  email,
  invited_by_user_id,
  status,
  expires_at,
  accepted_at,
  created_at
`;

const PROJECT_SELECT_FIELDS = `
  id,
  organization_id,
  name,
  created_by_user_id,
  created_at,
  updated_at
`;

const mapOrganizationRow = (row) => {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    name: row.name,
    createdByUserId: row.created_by_user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
};

const mapMembershipRow = (row) => {
  if (!row) {
    return null;
  }

  return {
    organizationId: row.organization_id,
    userId: row.user_id,
    role: row.role,
    createdAt: row.created_at
  };
};

const mapInviteRow = (row) => {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    organizationId: row.organization_id,
    email: row.email,
    invitedByUserId: row.invited_by_user_id,
    status: row.status,
    expiresAt: row.expires_at,
    acceptedAt: row.accepted_at,
    createdAt: row.created_at
  };
};

const mapProjectRow = (row) => {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    createdByUserId: row.created_by_user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
};

export const findUserById = async (id, executor = query) => {
  const sql = `
    SELECT id, name, email
    FROM users
    WHERE id = $1
    LIMIT 1
  `;
  const result = await runQuery(executor, sql, [id]);
  const row = result.rows[0];
  if (!row) {
    return null;
  }
  return {
    id: row.id,
    name: row.name,
    email: row.email
  };
};

export const findUserByEmail = async (email, executor = query) => {
  const sql = `
    SELECT id, name, email
    FROM users
    WHERE email = $1
    LIMIT 1
  `;
  const result = await runQuery(executor, sql, [email]);
  const row = result.rows[0];
  if (!row) {
    return null;
  }
  return {
    id: row.id,
    name: row.name,
    email: row.email
  };
};

export const createOrganization = async (
  { id, name, createdByUserId },
  executor = query
) => {
  const sql = `
    INSERT INTO organizations (id, name, created_by_user_id)
    VALUES ($1, $2, $3)
    RETURNING ${ORGANIZATION_SELECT_FIELDS}
  `;
  const values = [id, name, createdByUserId];
  const result = await runQuery(executor, sql, values);
  return mapOrganizationRow(result.rows[0]);
};

export const findOrganizationById = async (organizationId, executor = query) => {
  const sql = `
    SELECT ${ORGANIZATION_SELECT_FIELDS}
    FROM organizations
    WHERE id = $1
    LIMIT 1
  `;
  const result = await runQuery(executor, sql, [organizationId]);
  return mapOrganizationRow(result.rows[0]);
};

export const deleteOrganizationById = async (organizationId, executor = query) => {
  const sql = `
    DELETE FROM organizations
    WHERE id = $1
    RETURNING ${ORGANIZATION_SELECT_FIELDS}
  `;
  const result = await runQuery(executor, sql, [organizationId]);
  return mapOrganizationRow(result.rows[0]);
};

export const updateOrganizationName = async (
  { organizationId, name },
  executor = query
) => {
  const sql = `
    UPDATE organizations
    SET
      name = $2,
      updated_at = NOW()
    WHERE id = $1
    RETURNING ${ORGANIZATION_SELECT_FIELDS}
  `;
  const values = [organizationId, name];
  const result = await runQuery(executor, sql, values);
  return mapOrganizationRow(result.rows[0]);
};

export const addOrganizationMember = async (
  { organizationId, userId, role },
  executor = query
) => {
  const sql = `
    INSERT INTO organization_members (organization_id, user_id, role)
    VALUES ($1, $2, $3)
    ON CONFLICT (organization_id, user_id) DO NOTHING
    RETURNING ${MEMBERSHIP_SELECT_FIELDS}
  `;
  const values = [organizationId, userId, role];
  const result = await runQuery(executor, sql, values);
  return mapMembershipRow(result.rows[0]);
};

export const findMembership = async (
  { organizationId, userId },
  executor = query
) => {
  const sql = `
    SELECT ${MEMBERSHIP_SELECT_FIELDS}
    FROM organization_members
    WHERE organization_id = $1
      AND user_id = $2
    LIMIT 1
  `;
  const result = await runQuery(executor, sql, [organizationId, userId]);
  return mapMembershipRow(result.rows[0]);
};

export const countMembersInOrganization = async (
  organizationId,
  executor = query
) => {
  const sql = `
    SELECT COUNT(*)::INT AS total
    FROM organization_members
    WHERE organization_id = $1
  `;
  const result = await runQuery(executor, sql, [organizationId]);
  return result.rows[0]?.total ?? 0;
};

export const countOwnersInOrganization = async (
  organizationId,
  executor = query
) => {
  const sql = `
    SELECT COUNT(*)::INT AS total
    FROM organization_members
    WHERE organization_id = $1
      AND role = 'owner'
  `;
  const result = await runQuery(executor, sql, [organizationId]);
  return result.rows[0]?.total ?? 0;
};

export const removeOrganizationMember = async (
  { organizationId, userId },
  executor = query
) => {
  const sql = `
    DELETE FROM organization_members
    WHERE organization_id = $1
      AND user_id = $2
    RETURNING ${MEMBERSHIP_SELECT_FIELDS}
  `;
  const values = [organizationId, userId];
  const result = await runQuery(executor, sql, values);
  return mapMembershipRow(result.rows[0]);
};

export const updateOrganizationMemberRole = async (
  { organizationId, userId, role },
  executor = query
) => {
  const sql = `
    UPDATE organization_members
    SET role = $3
    WHERE organization_id = $1
      AND user_id = $2
    RETURNING ${MEMBERSHIP_SELECT_FIELDS}
  `;
  const values = [organizationId, userId, role];
  const result = await runQuery(executor, sql, values);
  return mapMembershipRow(result.rows[0]);
};

export const findOrganizationsForUser = async (userId) => {
  const sql = `
    SELECT
      o.id,
      o.name,
      o.created_by_user_id,
      o.created_at,
      o.updated_at,
      m.role,
      m.created_at AS joined_at
    FROM organization_members AS m
    JOIN organizations AS o
      ON o.id = m.organization_id
    WHERE m.user_id = $1
    ORDER BY o.created_at DESC
  `;
  const result = await query(sql, [userId]);
  return result.rows.map((row) => ({
    id: row.id,
    name: row.name,
    createdByUserId: row.created_by_user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    membershipRole: row.role,
    joinedAt: row.joined_at
  }));
};

export const findOrganizationMembers = async (organizationId) => {
  const sql = `
    SELECT
      m.organization_id,
      m.user_id,
      m.role,
      m.created_at AS joined_at,
      u.name,
      u.email
    FROM organization_members AS m
    JOIN users AS u
      ON u.id = m.user_id
    WHERE m.organization_id = $1
    ORDER BY
      CASE WHEN m.role = 'owner' THEN 0 ELSE 1 END,
      u.name ASC
  `;
  const result = await query(sql, [organizationId]);
  return result.rows.map((row) => ({
    organizationId: row.organization_id,
    userId: row.user_id,
    role: row.role,
    joinedAt: row.joined_at,
    name: row.name,
    email: row.email
  }));
};

export const createProject = async (
  { id, organizationId, name, createdByUserId },
  executor = query
) => {
  const sql = `
    INSERT INTO projects (id, organization_id, name, created_by_user_id)
    VALUES ($1, $2, $3, $4)
    RETURNING ${PROJECT_SELECT_FIELDS}
  `;
  const values = [id, organizationId, name, createdByUserId];
  const result = await runQuery(executor, sql, values);
  return mapProjectRow(result.rows[0]);
};

export const findProjectsByOrganizationId = async (organizationId) => {
  const sql = `
    SELECT
      p.id,
      p.organization_id,
      p.name,
      p.created_by_user_id,
      p.created_at,
      p.updated_at,
      u.name AS created_by_name,
      u.email AS created_by_email
    FROM projects AS p
    JOIN users AS u
      ON u.id = p.created_by_user_id
    WHERE p.organization_id = $1
    ORDER BY p.created_at DESC
  `;
  const result = await query(sql, [organizationId]);
  return result.rows.map((row) => ({
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    createdByUserId: row.created_by_user_id,
    createdByName: row.created_by_name,
    createdByEmail: row.created_by_email,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));
};

export const findProjectViewByIdAndOrganizationId = async (
  { projectId, organizationId },
  executor = query
) => {
  const sql = `
    SELECT
      p.id,
      p.organization_id,
      p.name,
      p.created_by_user_id,
      p.created_at,
      p.updated_at,
      u.name AS created_by_name,
      u.email AS created_by_email
    FROM projects AS p
    JOIN users AS u
      ON u.id = p.created_by_user_id
    WHERE p.id = $1
      AND p.organization_id = $2
    LIMIT 1
  `;
  const values = [projectId, organizationId];
  const result = await runQuery(executor, sql, values);
  const row = result.rows[0];
  if (!row) {
    return null;
  }
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    createdByUserId: row.created_by_user_id,
    createdByName: row.created_by_name,
    createdByEmail: row.created_by_email,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
};

export const findProjectByIdAndOrganizationId = async (
  { projectId, organizationId },
  executor = query
) => {
  const sql = `
    SELECT ${PROJECT_SELECT_FIELDS}
    FROM projects
    WHERE id = $1
      AND organization_id = $2
    LIMIT 1
  `;
  const values = [projectId, organizationId];
  const result = await runQuery(executor, sql, values);
  return mapProjectRow(result.rows[0]);
};

export const updateProjectName = async (
  { projectId, organizationId, name },
  executor = query
) => {
  const sql = `
    UPDATE projects
    SET
      name = $3,
      updated_at = NOW()
    WHERE id = $1
      AND organization_id = $2
    RETURNING ${PROJECT_SELECT_FIELDS}
  `;
  const values = [projectId, organizationId, name];
  const result = await runQuery(executor, sql, values);
  return mapProjectRow(result.rows[0]);
};

export const deleteProjectByIdAndOrganizationId = async (
  { projectId, organizationId },
  executor = query
) => {
  const sql = `
    DELETE FROM projects
    WHERE id = $1
      AND organization_id = $2
    RETURNING ${PROJECT_SELECT_FIELDS}
  `;
  const values = [projectId, organizationId];
  const result = await runQuery(executor, sql, values);
  return mapProjectRow(result.rows[0]);
};

export const pruneExpiredInvites = async (executor = query) => {
  const sql = `
    UPDATE organization_invites
    SET status = 'expired'
    WHERE status = 'pending'
      AND expires_at <= NOW()
  `;
  await runQuery(executor, sql);
};

export const createInvite = async (
  { id, organizationId, email, invitedByUserId, expiresAt },
  executor = query
) => {
  const sql = `
    INSERT INTO organization_invites (
      id,
      organization_id,
      email,
      invited_by_user_id,
      status,
      expires_at
    )
    VALUES ($1, $2, $3, $4, 'pending', $5)
    RETURNING ${INVITE_SELECT_FIELDS}
  `;
  const values = [id, organizationId, email, invitedByUserId, expiresAt];
  const result = await runQuery(executor, sql, values);
  return mapInviteRow(result.rows[0]);
};

export const findInviteById = async (inviteId, executor = query) => {
  const sql = `
    SELECT ${INVITE_SELECT_FIELDS}
    FROM organization_invites
    WHERE id = $1
    LIMIT 1
  `;
  const result = await runQuery(executor, sql, [inviteId]);
  return mapInviteRow(result.rows[0]);
};

export const findInviteDetailsById = async (inviteId, executor = query) => {
  const sql = `
    SELECT
      oi.id,
      oi.organization_id,
      oi.email,
      oi.invited_by_user_id,
      oi.status,
      oi.expires_at,
      oi.accepted_at,
      oi.created_at,
      o.name AS organization_name,
      inviter.name AS invited_by_name,
      inviter.email AS invited_by_email
    FROM organization_invites AS oi
    JOIN organizations AS o
      ON o.id = oi.organization_id
    JOIN users AS inviter
      ON inviter.id = oi.invited_by_user_id
    WHERE oi.id = $1
    LIMIT 1
  `;
  const result = await runQuery(executor, sql, [inviteId]);
  const row = result.rows[0];
  if (!row) {
    return null;
  }
  return {
    id: row.id,
    organizationId: row.organization_id,
    organizationName: row.organization_name,
    email: row.email,
    invitedByUserId: row.invited_by_user_id,
    invitedByName: row.invited_by_name,
    invitedByEmail: row.invited_by_email,
    status: row.status,
    expiresAt: row.expires_at,
    acceptedAt: row.accepted_at,
    createdAt: row.created_at
  };
};

export const findPendingInvitesByEmail = async (email) => {
  const sql = `
    SELECT
      oi.id,
      oi.organization_id,
      oi.email,
      oi.invited_by_user_id,
      oi.status,
      oi.expires_at,
      oi.accepted_at,
      oi.created_at,
      o.name AS organization_name,
      inviter.name AS invited_by_name,
      inviter.email AS invited_by_email
    FROM organization_invites AS oi
    JOIN organizations AS o
      ON o.id = oi.organization_id
    JOIN users AS inviter
      ON inviter.id = oi.invited_by_user_id
    WHERE oi.email = $1
      AND oi.status = 'pending'
      AND oi.expires_at > NOW()
    ORDER BY oi.created_at DESC
  `;
  const result = await query(sql, [email]);
  return result.rows.map((row) => ({
    id: row.id,
    organizationId: row.organization_id,
    organizationName: row.organization_name,
    email: row.email,
    invitedByUserId: row.invited_by_user_id,
    invitedByName: row.invited_by_name,
    invitedByEmail: row.invited_by_email,
    status: row.status,
    expiresAt: row.expires_at,
    acceptedAt: row.accepted_at,
    createdAt: row.created_at
  }));
};

export const findInviteByIdForUpdate = async (inviteId, executor = query) => {
  const sql = `
    SELECT ${INVITE_SELECT_FIELDS}
    FROM organization_invites
    WHERE id = $1
    LIMIT 1
    FOR UPDATE
  `;
  const result = await runQuery(executor, sql, [inviteId]);
  return mapInviteRow(result.rows[0]);
};

export const markInviteAccepted = async (inviteId, executor = query) => {
  const sql = `
    UPDATE organization_invites
    SET
      status = 'accepted',
      accepted_at = NOW()
    WHERE id = $1
      AND status = 'pending'
    RETURNING ${INVITE_SELECT_FIELDS}
  `;
  const result = await runQuery(executor, sql, [inviteId]);
  return mapInviteRow(result.rows[0]);
};

export const markInviteExpired = async (inviteId, executor = query) => {
  const sql = `
    UPDATE organization_invites
    SET status = 'expired'
    WHERE id = $1
      AND status = 'pending'
    RETURNING ${INVITE_SELECT_FIELDS}
  `;
  const result = await runQuery(executor, sql, [inviteId]);
  return mapInviteRow(result.rows[0]);
};

export const markInviteRevoked = async (inviteId, executor = query) => {
  const sql = `
    UPDATE organization_invites
    SET status = 'revoked'
    WHERE id = $1
      AND status = 'pending'
    RETURNING ${INVITE_SELECT_FIELDS}
  `;
  const result = await runQuery(executor, sql, [inviteId]);
  return mapInviteRow(result.rows[0]);
};
