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

const CARD_SELECT_FIELDS = `
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

const mapCardRow = (row) => {
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
  return { role: row.role };
};

export const findListById = async (listId, executor = query) => {
  const sql = `
    SELECT ${LIST_SELECT_FIELDS}
    FROM lists
    WHERE id = $1
    LIMIT 1
  `;
  const result = await runQuery(executor, sql, [listId]);
  return mapListRow(result.rows[0]);
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
  const result = await runQuery(executor, sql, [listId, projectId]);
  return mapListRow(result.rows[0]);
};

export const getNextCardPositionByList = async (listId, executor = query) => {
  const sql = `
    SELECT COALESCE(MAX(position), 0)::INT + 1 AS next_position
    FROM cards
    WHERE list_id = $1
      AND is_archived = FALSE
  `;
  const result = await runQuery(executor, sql, [listId]);
  return result.rows[0]?.next_position ?? 1;
};

export const createCard = async (
  { id, projectId, listId, title, description, position, dueAt, createdByUserId },
  executor = query
) => {
  const sql = `
    INSERT INTO cards (
      id,
      project_id,
      list_id,
      title,
      description,
      position,
      due_at,
      created_by_user_id
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING ${CARD_SELECT_FIELDS}
  `;
  const values = [
    id,
    projectId,
    listId,
    title,
    description,
    position,
    dueAt,
    createdByUserId
  ];
  const result = await runQuery(executor, sql, values);
  return mapCardRow(result.rows[0]);
};

export const findCardsByListId = async (
  { listId, includeArchived = false },
  executor = query
) => {
  const sql = `
    SELECT ${CARD_SELECT_FIELDS}
    FROM cards
    WHERE list_id = $1
      AND ($2::BOOLEAN = TRUE OR is_archived = FALSE)
    ORDER BY position ASC, created_at ASC
  `;
  const values = [listId, includeArchived];
  const result = await runQuery(executor, sql, values);
  return result.rows.map(mapCardRow);
};

export const findCardsByProjectId = async (
  { projectId, listId, includeArchived = false, search },
  executor = query
) => {
  const sql = `
    SELECT ${CARD_SELECT_FIELDS}
    FROM cards
    WHERE project_id = $1
      AND ($2::UUID IS NULL OR list_id = $2::UUID)
      AND ($3::BOOLEAN = TRUE OR is_archived = FALSE)
      AND (
        $4::TEXT IS NULL
        OR title ILIKE '%' || $4 || '%'
        OR COALESCE(description, '') ILIKE '%' || $4 || '%'
      )
    ORDER BY list_id ASC, position ASC, created_at ASC
  `;
  const values = [projectId, listId || null, includeArchived, search || null];
  const result = await runQuery(executor, sql, values);
  return result.rows.map(mapCardRow);
};

export const findCardByIdAndProjectId = async (
  { cardId, projectId },
  executor = query
) => {
  const sql = `
    SELECT ${CARD_SELECT_FIELDS}
    FROM cards
    WHERE id = $1
      AND project_id = $2
    LIMIT 1
  `;
  const values = [cardId, projectId];
  const result = await runQuery(executor, sql, values);
  return mapCardRow(result.rows[0]);
};

export const updateCardByIdAndProjectId = async (
  { cardId, projectId, title, description, dueAt },
  executor = query
) => {
  const sql = `
    UPDATE cards
    SET
      title = CASE WHEN $3::BOOLEAN = TRUE THEN $4 ELSE title END,
      description = CASE WHEN $5::BOOLEAN = TRUE THEN $6 ELSE description END,
      due_at = CASE WHEN $7::BOOLEAN = TRUE THEN $8 ELSE due_at END,
      updated_at = NOW()
    WHERE id = $1
      AND project_id = $2
    RETURNING ${CARD_SELECT_FIELDS}
  `;
  const shouldUpdateTitle = title !== undefined;
  const shouldUpdateDescription = description !== undefined;
  const shouldUpdateDueAt = dueAt !== undefined;
  const values = [
    cardId,
    projectId,
    shouldUpdateTitle,
    title ?? null,
    shouldUpdateDescription,
    description ?? null,
    shouldUpdateDueAt,
    dueAt ?? null
  ];
  const result = await runQuery(executor, sql, values);
  return mapCardRow(result.rows[0]);
};

export const updateCardPlacement = async (
  { cardId, projectId, listId, position },
  executor = query
) => {
  const sql = `
    UPDATE cards
    SET
      list_id = $3,
      position = $4,
      updated_at = NOW()
    WHERE id = $1
      AND project_id = $2
    RETURNING id
  `;
  const values = [cardId, projectId, listId, position];
  const result = await runQuery(executor, sql, values);
  return result.rows[0]?.id || null;
};

export const updateCardArchiveState = async (
  {
    cardId,
    projectId,
    isArchived,
    position
  }: {
    cardId: string;
    projectId: string;
    isArchived: boolean;
    position?: number;
  },
  executor = query
) => {
  if (typeof position === "number") {
    const sql = `
      UPDATE cards
      SET
        is_archived = $3,
        position = $4,
        updated_at = NOW()
      WHERE id = $1
        AND project_id = $2
      RETURNING ${CARD_SELECT_FIELDS}
    `;
    const values = [cardId, projectId, isArchived, position];
    const result = await runQuery(executor, sql, values);
    return mapCardRow(result.rows[0]);
  }

  const sql = `
    UPDATE cards
    SET
      is_archived = $3,
      updated_at = NOW()
    WHERE id = $1
      AND project_id = $2
    RETURNING ${CARD_SELECT_FIELDS}
  `;
  const values = [cardId, projectId, isArchived];
  const result = await runQuery(executor, sql, values);
  return mapCardRow(result.rows[0]);
};

export const deleteCardByIdAndProjectId = async (
  { cardId, projectId },
  executor = query
) => {
  const sql = `
    DELETE FROM cards
    WHERE id = $1
      AND project_id = $2
    RETURNING ${CARD_SELECT_FIELDS}
  `;
  const values = [cardId, projectId];
  const result = await runQuery(executor, sql, values);
  return mapCardRow(result.rows[0]);
};
