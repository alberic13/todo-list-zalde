export interface TaskAccessCheckResult {
  isOwner: boolean;
  isCollaborator: boolean;
}

export interface TaskCollaboratorMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  isOwner: boolean;
  joinedAt?: Date | null;
  user: {
    id: string;
    name: string;
    email: string;
  };
}
