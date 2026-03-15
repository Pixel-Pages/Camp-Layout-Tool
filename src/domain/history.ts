import { cloneProject } from './project';
import { applyProjectCommand } from './commands';
import type { HistoryState, LayoutProject, ProjectCommand } from './types';

export const createHistoryState = (project: LayoutProject): HistoryState<LayoutProject> => ({
  past: [],
  present: cloneProject(project),
  future: [],
});

export const applyHistoryCommand = (
  history: HistoryState<LayoutProject>,
  command: ProjectCommand,
): HistoryState<LayoutProject> => {
  const nextPresent = applyProjectCommand(history.present, command);
  if (nextPresent === history.present) {
    return history;
  }

  return {
    past: [...history.past, cloneProject(history.present)],
    present: nextPresent,
    future: [],
  };
};

export const undoHistory = (history: HistoryState<LayoutProject>): HistoryState<LayoutProject> => {
  const previous = history.past.at(-1);
  if (!previous) {
    return history;
  }

  return {
    past: history.past.slice(0, -1),
    present: cloneProject(previous),
    future: [cloneProject(history.present), ...history.future],
  };
};

export const redoHistory = (history: HistoryState<LayoutProject>): HistoryState<LayoutProject> => {
  const next = history.future[0];
  if (!next) {
    return history;
  }

  return {
    past: [...history.past, cloneProject(history.present)],
    present: cloneProject(next),
    future: history.future.slice(1),
  };
};
