import { query } from "../../db/pool.js";

const runQuery = (executor, text, params = []) => executor(text, params);

const CHECKLIST_SELECT_FIELDS = `
  id,
  card_id,
  title,
  position,
  created_by_user_id,
  created_at,
  updated_at
`;

const CHECKLIST_ITEM_SELECT_FIELDS = `
  id,
  checklist_id,
  content,
  is_completed,
  position,
  completed_at,
  completed_by_user_id,
  created_at,
  updated_at
`;

const mapChecklistRow = (row) => {
  if (!row) {
    return null;
  }
  return {
    id: row.id,
    cardId: row.card_id,
    title: row.title,
    position: row.position,
    createdByUserId: row.created_by_user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
};

const mapChecklistItemRow = (row) => {
  if (!row) {
    return null;
  }
  return {
    id: row.id,
    checklistId: row.checklist_id,
    content: row.content,
    isCompleted: row.is_completed,
    position: row.position,
    completedAt: row.completed_at,
    completedByUserId: row.completed_by_user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
};

export const getNextChecklistPosition = async (cardId, executor = query) => {
  const sql = `
    SELECT COALESCE(MAX(position), 0)::INT + 1 AS next_position
    FROM checklists
    WHERE card_id = $1
  `;
  const result = await runQuery(executor, sql, [cardId]);
  return result.rows[0]?.next_position ?? 1;
};

export const createChecklist = async (
  { id, cardId, title, position, createdByUserId },
  executor = query
) => {
  const sql = `
    INSERT INTO checklists (id, card_id, title, position, created_by_user_id)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING ${CHECKLIST_SELECT_FIELDS}
  `;
  const values = [id, cardId, title, position, createdByUserId];
  const result = await runQuery(executor, sql, values);
  return mapChecklistRow(result.rows[0]);
};

export const findChecklistsByCardId = async (cardId, executor = query) => {
  const sql = `
    SELECT ${CHECKLIST_SELECT_FIELDS}
    FROM checklists
    WHERE card_id = $1
    ORDER BY position ASC, created_at ASC
  `;
  const result = await runQuery(executor, sql, [cardId]);
  return result.rows.map(mapChecklistRow);
};

export const findChecklistByIdAndCardId = async (
  { checklistId, cardId },
  executor = query
) => {
  const sql = `
    SELECT ${CHECKLIST_SELECT_FIELDS}
    FROM checklists
    WHERE id = $1
      AND card_id = $2
    LIMIT 1
  `;
  const values = [checklistId, cardId];
  const result = await runQuery(executor, sql, values);
  return mapChecklistRow(result.rows[0]);
};

export const updateChecklistTitle = async (
  { checklistId, cardId, title },
  executor = query
) => {
  const sql = `
    UPDATE checklists
    SET
      title = $3,
      updated_at = NOW()
    WHERE id = $1
      AND card_id = $2
    RETURNING ${CHECKLIST_SELECT_FIELDS}
  `;
  const values = [checklistId, cardId, title];
  const result = await runQuery(executor, sql, values);
  return mapChecklistRow(result.rows[0]);
};

export const deleteChecklistByIdAndCardId = async (
  { checklistId, cardId },
  executor = query
) => {
  const sql = `
    DELETE FROM checklists
    WHERE id = $1
      AND card_id = $2
    RETURNING ${CHECKLIST_SELECT_FIELDS}
  `;
  const values = [checklistId, cardId];
  const result = await runQuery(executor, sql, values);
  return mapChecklistRow(result.rows[0]);
};

export const updateChecklistPosition = async (
  { checklistId, cardId, position },
  executor = query
) => {
  const sql = `
    UPDATE checklists
    SET
      position = $3,
      updated_at = NOW()
    WHERE id = $1
      AND card_id = $2
    RETURNING id
  `;
  const values = [checklistId, cardId, position];
  const result = await runQuery(executor, sql, values);
  return result.rows[0]?.id || null;
};

export const getNextChecklistItemPosition = async (
  checklistId,
  executor = query
) => {
  const sql = `
    SELECT COALESCE(MAX(position), 0)::INT + 1 AS next_position
    FROM checklist_items
    WHERE checklist_id = $1
  `;
  const result = await runQuery(executor, sql, [checklistId]);
  return result.rows[0]?.next_position ?? 1;
};

export const createChecklistItem = async (
  { id, checklistId, content, position },
  executor = query
) => {
  const sql = `
    INSERT INTO checklist_items (id, checklist_id, content, position)
    VALUES ($1, $2, $3, $4)
    RETURNING ${CHECKLIST_ITEM_SELECT_FIELDS}
  `;
  const values = [id, checklistId, content, position];
  const result = await runQuery(executor, sql, values);
  return mapChecklistItemRow(result.rows[0]);
};

export const findChecklistItemsByChecklistId = async (
  checklistId,
  executor = query
) => {
  const sql = `
    SELECT ${CHECKLIST_ITEM_SELECT_FIELDS}
    FROM checklist_items
    WHERE checklist_id = $1
    ORDER BY position ASC, created_at ASC
  `;
  const result = await runQuery(executor, sql, [checklistId]);
  return result.rows.map(mapChecklistItemRow);
};

export const findChecklistItemByIdAndChecklistId = async (
  { itemId, checklistId },
  executor = query
) => {
  const sql = `
    SELECT ${CHECKLIST_ITEM_SELECT_FIELDS}
    FROM checklist_items
    WHERE id = $1
      AND checklist_id = $2
    LIMIT 1
  `;
  const values = [itemId, checklistId];
  const result = await runQuery(executor, sql, values);
  return mapChecklistItemRow(result.rows[0]);
};

export const updateChecklistItem = async (
  {
    itemId,
    checklistId,
    shouldUpdateContent,
    content,
    shouldUpdateCompleted,
    isCompleted,
    completedAt,
    completedByUserId
  },
  executor = query
) => {
  const sql = `
    UPDATE checklist_items
    SET
      content = CASE WHEN $3::BOOLEAN = TRUE THEN $4 ELSE content END,
      is_completed = CASE WHEN $5::BOOLEAN = TRUE THEN $6 ELSE is_completed END,
      completed_at = CASE WHEN $5::BOOLEAN = TRUE THEN $7 ELSE completed_at END,
      completed_by_user_id = CASE WHEN $5::BOOLEAN = TRUE THEN $8 ELSE completed_by_user_id END,
      updated_at = NOW()
    WHERE id = $1
      AND checklist_id = $2
    RETURNING ${CHECKLIST_ITEM_SELECT_FIELDS}
  `;
  const values = [
    itemId,
    checklistId,
    shouldUpdateContent,
    content ?? null,
    shouldUpdateCompleted,
    isCompleted ?? null,
    completedAt ?? null,
    completedByUserId ?? null
  ];
  const result = await runQuery(executor, sql, values);
  return mapChecklistItemRow(result.rows[0]);
};

export const deleteChecklistItem = async (
  { itemId, checklistId },
  executor = query
) => {
  const sql = `
    DELETE FROM checklist_items
    WHERE id = $1
      AND checklist_id = $2
    RETURNING ${CHECKLIST_ITEM_SELECT_FIELDS}
  `;
  const values = [itemId, checklistId];
  const result = await runQuery(executor, sql, values);
  return mapChecklistItemRow(result.rows[0]);
};

export const updateChecklistItemPosition = async (
  { itemId, checklistId, position },
  executor = query
) => {
  const sql = `
    UPDATE checklist_items
    SET
      position = $3,
      updated_at = NOW()
    WHERE id = $1
      AND checklist_id = $2
    RETURNING id
  `;
  const values = [itemId, checklistId, position];
  const result = await runQuery(executor, sql, values);
  return result.rows[0]?.id || null;
};
