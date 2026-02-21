import { query } from "../../db/pool.js";

const runQuery = (executor, text, params = []) => executor(text, params);

const LABEL_SELECT_FIELDS = `
  id,
  project_id,
  name,
  color,
  created_by_user_id,
  created_at,
  updated_at
`;

const CARD_LABEL_SELECT_FIELDS = `
  card_id,
  label_id,
  created_at
`;

const mapLabelRow = (row) => {
  if (!row) {
    return null;
  }
  return {
    id: row.id,
    projectId: row.project_id,
    name: row.name,
    color: row.color,
    createdByUserId: row.created_by_user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
};

const mapCardLabelRow = (row) => {
  if (!row) {
    return null;
  }
  return {
    cardId: row.card_id,
    labelId: row.label_id,
    createdAt: row.created_at
  };
};

export const createLabel = async (
  { id, projectId, name, color, createdByUserId },
  executor = query
) => {
  const sql = `
    INSERT INTO labels (id, project_id, name, color, created_by_user_id)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING ${LABEL_SELECT_FIELDS}
  `;
  const values = [id, projectId, name, color, createdByUserId];
  const result = await runQuery(executor, sql, values);
  return mapLabelRow(result.rows[0]);
};

export const findLabelsByProjectId = async (projectId, executor = query) => {
  const sql = `
    SELECT ${LABEL_SELECT_FIELDS}
    FROM labels
    WHERE project_id = $1
    ORDER BY name ASC
  `;
  const result = await runQuery(executor, sql, [projectId]);
  return result.rows.map(mapLabelRow);
};

export const findLabelByIdAndProjectId = async (
  { labelId, projectId },
  executor = query
) => {
  const sql = `
    SELECT ${LABEL_SELECT_FIELDS}
    FROM labels
    WHERE id = $1
      AND project_id = $2
    LIMIT 1
  `;
  const values = [labelId, projectId];
  const result = await runQuery(executor, sql, values);
  return mapLabelRow(result.rows[0]);
};

export const updateLabelByIdAndProjectId = async (
  { labelId, projectId, name, color, shouldUpdateName, shouldUpdateColor },
  executor = query
) => {
  const sql = `
    UPDATE labels
    SET
      name = CASE WHEN $3::BOOLEAN = TRUE THEN $4 ELSE name END,
      color = CASE WHEN $5::BOOLEAN = TRUE THEN $6 ELSE color END,
      updated_at = NOW()
    WHERE id = $1
      AND project_id = $2
    RETURNING ${LABEL_SELECT_FIELDS}
  `;
  const values = [
    labelId,
    projectId,
    shouldUpdateName,
    name ?? null,
    shouldUpdateColor,
    color ?? null
  ];
  const result = await runQuery(executor, sql, values);
  return mapLabelRow(result.rows[0]);
};

export const deleteLabelByIdAndProjectId = async (
  { labelId, projectId },
  executor = query
) => {
  const sql = `
    DELETE FROM labels
    WHERE id = $1
      AND project_id = $2
    RETURNING ${LABEL_SELECT_FIELDS}
  `;
  const values = [labelId, projectId];
  const result = await runQuery(executor, sql, values);
  return mapLabelRow(result.rows[0]);
};

export const addLabelToCard = async ({ cardId, labelId }, executor = query) => {
  const sql = `
    INSERT INTO card_labels (card_id, label_id)
    VALUES ($1, $2)
    ON CONFLICT (card_id, label_id) DO NOTHING
    RETURNING ${CARD_LABEL_SELECT_FIELDS}
  `;
  const values = [cardId, labelId];
  const result = await runQuery(executor, sql, values);
  return mapCardLabelRow(result.rows[0]);
};

export const removeLabelFromCard = async ({ cardId, labelId }, executor = query) => {
  const sql = `
    DELETE FROM card_labels
    WHERE card_id = $1
      AND label_id = $2
    RETURNING ${CARD_LABEL_SELECT_FIELDS}
  `;
  const values = [cardId, labelId];
  const result = await runQuery(executor, sql, values);
  return mapCardLabelRow(result.rows[0]);
};

export const findLabelsByCardId = async (cardId, executor = query) => {
  const sql = `
    SELECT
      l.id,
      l.project_id,
      l.name,
      l.color,
      l.created_by_user_id,
      l.created_at,
      l.updated_at
    FROM card_labels AS cl
    JOIN labels AS l
      ON l.id = cl.label_id
    WHERE cl.card_id = $1
    ORDER BY l.name ASC
  `;
  const result = await runQuery(executor, sql, [cardId]);
  return result.rows.map(mapLabelRow);
};
