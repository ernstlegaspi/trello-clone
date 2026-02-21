import { query } from "../../db/pool.js";

const runQuery = (executor, text, params = []) => executor(text, params);

const PROJECT_SELECT_FIELDS = `
  id,
  organization_id,
  name,
  created_by_user_id,
  created_at,
  updated_at
`;

const LIST_SELECT_FIELDS = `
  id,
  project_id,
  name,
  position,
  is_archived,
  created_by_user_id,
  created_at,
  updated_at
`;

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

const mapListRow = (row) => {
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

export const findProjectById = async (projectId, executor = query) => {
  const sql = `
    SELECT ${PROJECT_SELECT_FIELDS}
    FROM projects
    WHERE id = $1
    LIMIT 1
  `;
  const result = await runQuery(executor, sql, [projectId]);
  return mapProjectRow(result.rows[0]);
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

export const getNextListPosition = async (projectId, executor = query) => {
  const sql = `
    SELECT COALESCE(MAX(position), 0)::INT + 1 AS next_position
    FROM lists
    WHERE project_id = $1
  `;
  const result = await runQuery(executor, sql, [projectId]);
  return result.rows[0]?.next_position ?? 1;
};

export const createList = async (
  { id, projectId, name, position, createdByUserId },
  executor = query
) => {
  const sql = `
    INSERT INTO lists (id, project_id, name, position, created_by_user_id)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING ${LIST_SELECT_FIELDS}
  `;
  const values = [id, projectId, name, position, createdByUserId];
  const result = await runQuery(executor, sql, values);
  return mapListRow(result.rows[0]);
};

export const findListsByProjectId = async (
  { projectId, includeArchived = false },
  executor = query
) => {
  const sql = `
    SELECT ${LIST_SELECT_FIELDS}
    FROM lists
    WHERE project_id = $1
      AND ($2::BOOLEAN = TRUE OR is_archived = FALSE)
    ORDER BY position ASC, created_at ASC
  `;
  const values = [projectId, includeArchived];
  const result = await runQuery(executor, sql, values);
  return result.rows.map(mapListRow);
};

export const findListByIdAndProjectId = async (
  { listId, projectId },
  executor = query
) => {
  const sql = `
    SELECT ${LIST_SELECT_FIELDS}
    FROM lists
    WHERE id = $1
      AND project_id = $2
    LIMIT 1
  `;
  const values = [listId, projectId];
  const result = await runQuery(executor, sql, values);
  return mapListRow(result.rows[0]);
};

export const updateListName = async (
  { listId, projectId, name },
  executor = query
) => {
  const sql = `
    UPDATE lists
    SET
      name = $3,
      updated_at = NOW()
    WHERE id = $1
      AND project_id = $2
    RETURNING ${LIST_SELECT_FIELDS}
  `;
  const values = [listId, projectId, name];
  const result = await runQuery(executor, sql, values);
  return mapListRow(result.rows[0]);
};

export const updateListArchivedState = async (
  {
    listId,
    projectId,
    isArchived,
    position
  }: {
    listId: string;
    projectId: string;
    isArchived: boolean;
    position?: number;
  },
  executor = query
) => {
  if (typeof position === "number") {
    const sql = `
      UPDATE lists
      SET
        is_archived = $3,
        position = $4,
        updated_at = NOW()
      WHERE id = $1
        AND project_id = $2
      RETURNING ${LIST_SELECT_FIELDS}
    `;
    const values = [listId, projectId, isArchived, position];
    const result = await runQuery(executor, sql, values);
    return mapListRow(result.rows[0]);
  }

  const sql = `
    UPDATE lists
    SET
      is_archived = $3,
      updated_at = NOW()
    WHERE id = $1
      AND project_id = $2
    RETURNING ${LIST_SELECT_FIELDS}
  `;
  const values = [listId, projectId, isArchived];
  const result = await runQuery(executor, sql, values);
  return mapListRow(result.rows[0]);
};

export const updateListPosition = async (
  { listId, projectId, position },
  executor = query
) => {
  const sql = `
    UPDATE lists
    SET
      position = $3,
      updated_at = NOW()
    WHERE id = $1
      AND project_id = $2
    RETURNING id
  `;
  const values = [listId, projectId, position];
  const result = await runQuery(executor, sql, values);
  return result.rows[0]?.id || null;
};

export const deleteListByIdAndProjectId = async (
  { listId, projectId },
  executor = query
) => {
  const sql = `
    DELETE FROM lists
    WHERE id = $1
      AND project_id = $2
    RETURNING ${LIST_SELECT_FIELDS}
  `;
  const values = [listId, projectId];
  const result = await runQuery(executor, sql, values);
  return mapListRow(result.rows[0]);
};
