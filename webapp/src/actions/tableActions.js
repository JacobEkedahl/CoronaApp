import { SelectContent } from "./analyticsActions";

export const TOGGLE_TABLE = "TOGGLE_TABLE";
export const LOAD_ANIMATED = "LOAD_ANIMATED";
export const DONT_SHOW_NOTIFICATIONS = "DONT_SHOW_NOTIFICATIONS";
export const TOGGLE_CHART = "TOGGLE_CHART";
export const SCOPE_CHART = "SCOPE_CHART";
export const SELECT_INFORMATION_SHOWN = "SELECT_INFORMATION_SHOWN";

export const selectScope = (analytics, dispatch, chosenScope) => {
  SelectContent(analytics, "chart_scope", chosenScope);
  dispatch({ type: SCOPE_CHART, payload: chosenScope });
};
