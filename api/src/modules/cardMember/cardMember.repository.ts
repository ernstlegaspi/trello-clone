import { query } from "../../db/pool.js";

const runQuery = (executor, text, params = []) => executor(text, params);

const CARD_MEMBER_SELECT_FIELDS = `
  card_id,
  user_id,
  added_by_user_id,
  created_at
`;

const mapCardMemberRow = (row) => {
  if (!row) {
    return null;
  }
  return {
    cardId: row.card_id,
    userId: row.user_id,
    addedByUserId: row.added_by_user_id,
    createdAt: row.created_at
  };
};

export const addCardMember = async (
  { cardId, userId, addedByUserId },
  executor = query
) => {
  const sql = `
    INSERT INTO card_members (card_id, user_id, added_by_user_id)
    VALUES ($1, $2, $3)
    ON CONFLICT (card_id, user_id) DO NOTHING
    RETURNING ${CARD_MEMBER_SELECT_FIELDS}
  `;
  const values = [cardId, userId, addedByUserId];
  const result = await runQuery(executor, sql, values);
  return mapCardMemberRow(result.rows[0]);
};

export const removeCardMember = async ({ cardId, userId }, executor = query) => {
  const sql = `
    DELETE FROM card_members
    WHERE card_id = $1
      AND user_id = $2
    RETURNING ${CARD_MEMBER_SELECT_FIELDS}
  `;
  const values = [cardId, userId];
  const result = await runQuery(executor, sql, values);
  return mapCardMemberRow(result.rows[0]);
};

export const findCardMembersByCardId = async (cardId, executor = query) => {
  const sql = `
    SELECT
      cm.card_id,
      cm.user_id,
      u.name,
      u.email,
      cm.created_at
    FROM card_members AS cm
    JOIN users AS u
      ON u.id = cm.user_id
    WHERE cm.card_id = $1
    ORDER BY u.name ASC
  `;
  const result = await runQuery(executor, sql, [cardId]);
  return result.rows.map((row) => ({
    cardId: row.card_id,
    userId: row.user_id,
    name: row.name,
    email: row.email,
    createdAt: row.created_at
  }));
};

export const findAssignedCardsByProjectAndUser = async (
  { projectId, userId, includeArchived = false },
  executor = query
) => {
  const sql = `
    SELECT
      c.id,
      c.project_id,
      c.list_id,
      c.title,
      c.description,
      c.position,
      c.due_at,
      c.is_archived,
      c.created_by_user_id,
      c.created_at,
      c.updated_at
    FROM card_members AS cm
    JOIN cards AS c
      ON c.id = cm.card_id
    WHERE cm.user_id = $1
      AND c.project_id = $2
      AND ($3::BOOLEAN = TRUE OR c.is_archived = FALSE)
    ORDER BY c.list_id ASC, c.position ASC
  `;
  const values = [userId, projectId, includeArchived];
  const result = await runQuery(executor, sql, values);
  return result.rows.map((row) => ({
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
  }));
};
