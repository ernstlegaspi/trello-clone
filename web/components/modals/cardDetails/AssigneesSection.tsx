"use client";

import type {
  CardDetailsModalCardViewModel,
  CardDetailsModalWorkspace
} from "./types";

type AssigneesSectionProps = Pick<
  CardDetailsModalWorkspace,
  "organizationMembers"
> &
  Pick<
    CardDetailsModalCardViewModel,
    "cardMembers" | "handleAssignMember" | "handleUnassignMember"
>;

export default function AssigneesSection({
  organizationMembers,
  cardMembers,
  handleAssignMember,
  handleUnassignMember
}: AssigneesSectionProps) {
  return (
    <section>
      <h3 style={{ margin: "0 0 8px 0" }}>Assignees</h3>
      <div className="stack">
        {organizationMembers.map((member) => {
          const assigned = cardMembers.some((item) => item.userId === member.userId);
          return (
            <button
              key={member.userId}
              className="btn"
              style={{ justifyContent: "space-between", display: "flex" }}
              onClick={() =>
                assigned
                  ? handleUnassignMember(member.userId)
                  : handleAssignMember(member.userId)
              }
              type="button"
            >
              <span>{member.name}</span>
              <span className="badge">{assigned ? "Assigned" : "Assign"}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
