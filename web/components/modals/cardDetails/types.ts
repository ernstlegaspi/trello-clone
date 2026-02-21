import type { OrganizationMember } from "../../../lib/types";
import type { CardDetailsViewModel } from "../../dashboard/types";

export type CardDetailsModalWorkspace = {
  selectedOrganizationRole: "owner" | "member" | undefined;
  organizationMembers: OrganizationMember[];
};

export type CardDetailsModalCardViewModel = CardDetailsViewModel;

export type CardDetailsModalProps = {
  workspace: CardDetailsModalWorkspace;
  cardDetails: CardDetailsModalCardViewModel;
};
