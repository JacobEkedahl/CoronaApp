import {
  SCOPE_CHART,
  SELECT_INFORMATION_SHOWN,
  TOGGLE_CHART,
  TOGGLE_TABLE,
} from "../actions/tableActions";

export const CASES = "cases";
export const DEATHS = "deaths";
export const CRITICAL = "critical";
export const RECOVERED = "recovered";

const table = (
  state = {
    isMinimized: false,
    showChart: true,
    chartScope: "ALL",
    shownInformation: {
      cases: true,
      deaths: true,
      critical: true,
      recovered: true,
    },
  },
  action
) => {
  switch (action.type) {
    case SCOPE_CHART:
      return {
        ...state,
        chartScope: action.payload,
      };
    case TOGGLE_TABLE:
      return { ...state, isMinimized: action.payload };
    case TOGGLE_CHART:
      return {
        ...state,
        showChart: action.payload,
      };
    case SELECT_INFORMATION_SHOWN:
      const payload = action.payload;
      const newInformation = { ...state.shownInformation, ...payload };

      return {
        ...state,
        shownInformation: newInformation,
      };
    default:
      return state;
  }
};

export default table;

export const getIsMinimized = (state) => state.table?.isMinimized;
export const getCanShowChart = (state) => state.table?.showChart;
export const getChartScope = (state) => state.table.chartScope;
export const getChartInformationShown = (state) => state.table.shownInformation;
