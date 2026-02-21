"use client";

import type { CardDetailsModalCardViewModel } from "./types";

type CommentsSectionProps = Pick<
  CardDetailsModalCardViewModel,
  "comments" | "newComment" | "setNewComment" | "handleAddComment"
>;

export default function CommentsSection({
  comments,
  newComment,
  setNewComment,
  handleAddComment
}: CommentsSectionProps) {
  return (
    <section className="stack">
      <h3 style={{ margin: "8px 0 0 0" }}>Comments</h3>
      <form className="inline-form" onSubmit={handleAddComment}>
        <input
          className="input"
          placeholder="Add comment"
          value={newComment}
          onChange={(event) => setNewComment(event.target.value)}
        />
        <button className="btn primary" type="submit">
          Send
        </button>
      </form>
      <div className="stack">
        {comments.map((comment) => (
          <div key={comment.id} className="comment">
            <div style={{ fontSize: "0.82rem" }}>
              <strong>{comment.userName}</strong>
              <span className="muted">
                {" "}
                ({new Date(comment.createdAt).toLocaleString()})
              </span>
            </div>
            <div>{comment.content}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
