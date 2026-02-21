import { query } from "../../db/pool.js";

const runQuery = (executor, text, params = []) => executor(text, params);

const COMMENT_SELECT_FIELDS = `
  id,
  card_id,
  user_id,
  content,
  created_at,
  updated_at
`;

const mapCommentRow = (row) => {
  if (!row) {
    return null;
  }
  return {
    id: row.id,
    cardId: row.card_id,
    userId: row.user_id,
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
};

export const createComment = async (
  { id, cardId, userId, content },
  executor = query
) => {
  const sql = `
    INSERT INTO card_comments (id, card_id, user_id, content)
    VALUES ($1, $2, $3, $4)
    RETURNING ${COMMENT_SELECT_FIELDS}
  `;
  const values = [id, cardId, userId, content];
  const result = await runQuery(executor, sql, values);
  return mapCommentRow(result.rows[0]);
};

export const findCommentsByCardId = async (cardId, executor = query) => {
  const sql = `
    SELECT
      c.id,
      c.card_id,
      c.user_id,
      c.content,
      c.created_at,
      c.updated_at,
      u.name AS user_name,
      u.email AS user_email
    FROM card_comments AS c
    JOIN users AS u
      ON u.id = c.user_id
    WHERE c.card_id = $1
    ORDER BY c.created_at ASC
  `;
  const result = await runQuery(executor, sql, [cardId]);
  return result.rows.map((row) => ({
    id: row.id,
    cardId: row.card_id,
    userId: row.user_id,
    content: row.content,
    userName: row.user_name,
    userEmail: row.user_email,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));
};

export const findCommentByIdAndCardId = async (
  { commentId, cardId },
  executor = query
) => {
  const sql = `
    SELECT ${COMMENT_SELECT_FIELDS}
    FROM card_comments
    WHERE id = $1
      AND card_id = $2
    LIMIT 1
  `;
  const values = [commentId, cardId];
  const result = await runQuery(executor, sql, values);
  return mapCommentRow(result.rows[0]);
};

export const updateCommentByIdAndCardId = async (
  { commentId, cardId, content },
  executor = query
) => {
  const sql = `
    UPDATE card_comments
    SET
      content = $3,
      updated_at = NOW()
    WHERE id = $1
      AND card_id = $2
    RETURNING ${COMMENT_SELECT_FIELDS}
  `;
  const values = [commentId, cardId, content];
  const result = await runQuery(executor, sql, values);
  return mapCommentRow(result.rows[0]);
};

export const deleteCommentByIdAndCardId = async (
  { commentId, cardId },
  executor = query
) => {
  const sql = `
    DELETE FROM card_comments
    WHERE id = $1
      AND card_id = $2
    RETURNING ${COMMENT_SELECT_FIELDS}
  `;
  const values = [commentId, cardId];
  const result = await runQuery(executor, sql, values);
  return mapCommentRow(result.rows[0]);
};
