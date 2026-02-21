import { query } from "../../db/pool.js";

const runQuery = (executor, text, params = []) => executor(text, params);

export const findProjectById = async (projectId, executor = query) => {
  const sql = `
    SELECT
      id,
      organization_id,
      name,
      created_by_user_id,
      created_at,
      updated_at
    FROM projects
    WHERE id = $1
    LIMIT 1
  `;
  const result = await runQuery(executor, sql, [projectId]);
  const row = result.rows[0];
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

export const findProjectMembership = async (
  { projectId, userId },
  executor = query
) => {
  const sql = `
    SELECT m.role
    FROM organization_members AS m
    JOIN projects AS p
      ON p.organization_id = m.organization_id
    WHERE p.id = $1
      AND m.user_id = $2
    LIMIT 1
  `;
  const result = await runQuery(executor, sql, [projectId, userId]);
  const row = result.rows[0];
  if (!row) {
    return null;
  }
  return {
    role: row.role
  };
};

export const findUserById = async (userId, executor = query) => {
  const sql = `
    SELECT id, name, email
    FROM users
    WHERE id = $1
    LIMIT 1
  `;
  const result = await runQuery(executor, sql, [userId]);
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

export const findListById = async (listId, executor = query) => {
  const sql = `
    SELECT
      id,
      project_id,
      name,
      position,
      is_archived,
      created_by_user_id,
      created_at,
      updated_at
    FROM lists
    WHERE id = $1
    LIMIT 1
  `;
  const result = await runQuery(executor, sql, [listId]);
  const row = result.rows[0];
  if (!row) {
    return null;
  }
  return {
    id: row.id,
    projectId: row.project_id,
    name: row.name,
    position: row.position,
    isArchived: row.is_archived,
    createdByUserId: row.created_by_user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
};

export const findListByIdAndProjectId = async (
  { listId, projectId },
  executor = query
) => {
  const sql = `
    SELECT
      id,
      project_id,
      name,
      position,
      is_archived,
      created_by_user_id,
      created_at,
      updated_at
    FROM lists
    WHERE id = $1
      AND project_id = $2
    LIMIT 1
  `;
  const result = await runQuery(executor, sql, [listId, projectId]);
  const row = result.rows[0];
  if (!row) {
    return null;
  }
  return {
    id: row.id,
    projectId: row.project_id,
    name: row.name,
    position: row.position,
    isArchived: row.is_archived,
    createdByUserId: row.created_by_user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
};

export const findCardById = async (cardId, executor = query) => {
  const sql = `
    SELECT
      id,
      project_id,
      list_id,
      title,
      description,
      position,
      due_at,
      is_archived,
      created_by_user_id,
      created_at,
      updated_at
    FROM cards
    WHERE id = $1
    LIMIT 1
  `;
  const result = await runQuery(executor, sql, [cardId]);
  const row = result.rows[0];
  if (!row) {
    return null;
  }
  return {
    id: row.id,
    projectId: row.project_id,
    listId: row.list_id,
    title: row.title,
    description: row.description,
    position: row.position,
    dueAt: row.due_at,
    isArchived: row.is_archived,
    createdByUserId: row.created_by_user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
};

export const findCardByIdAndProjectId = async (
  { cardId, projectId },
  executor = query
) => {
  const sql = `
    SELECT
      id,
      project_id,
      list_id,
      title,
      description,
      position,
      due_at,
      is_archived,
      created_by_user_id,
      created_at,
      updated_at
    FROM cards
    WHERE id = $1
      AND project_id = $2
    LIMIT 1
  `;
  const result = await runQuery(executor, sql, [cardId, projectId]);
  const row = result.rows[0];
  if (!row) {
    return null;
  }
  return {
    id: row.id,
    projectId: row.project_id,
    listId: row.list_id,
    title: row.title,
    description: row.description,
    position: row.position,
    dueAt: row.due_at,
    isArchived: row.is_archived,
    createdByUserId: row.created_by_user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
};
