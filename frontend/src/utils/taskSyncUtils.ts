import { Task, TaskStats } from "../types";

export function hasTaskDifferences(prev: Task[], next: Task[]): boolean {
  if (prev.length !== next.length) return true;

  return prev.some((pt, i) => {
    const ft = next[i];
    if (!ft || pt.id !== ft.id || pt.status !== ft.status) return true;
    if (pt.updatedAt !== ft.updatedAt) return true;
    if (pt.collaboratorCount !== ft.collaboratorCount) return true;

    const pCollabs = pt.collaborators || [];
    const fCollabs = ft.collaborators || [];
    if (pCollabs.length !== fCollabs.length) return true;
    if (pCollabs.some((pc, cI) => pc.userId !== fCollabs[cI]?.userId)) return true;

    const pSubs = pt.subtasks || [];
    const fSubs = ft.subtasks || [];
    if (pSubs.length !== fSubs.length) return true;

    return pSubs.some((ps, sI) => {
      const fs = fSubs[sI];
      return !fs || ps.id !== fs.id || ps.isCompleted !== fs.isCompleted || ps.title !== fs.title;
    });
  });
}

export function hasStatDifferences(prev: TaskStats | null, next: TaskStats): boolean {
  if (!prev) return true;
  return (
    prev.total !== next.total ||
    prev.done !== next.done ||
    prev.todo !== next.todo ||
    prev.inProgress !== next.inProgress
  );
}
