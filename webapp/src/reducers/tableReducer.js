import {
  SCOPE_CHART,
  TOGGLE_CHART,
  TOGGLE_TABLE
} from "../actions/tableActions";

const table = (
  state = {
    isMinimized: false,
    showChart: true,
    chartScope: "ALL"
  },
  action
) => {
  switch (action.type) {
    case SCOPE_CHART:
      return {
        ...state,
        chartScope: action.payload
      };
    case TOGGLE_TABLE:
      return { ...state, isMinimized: action.payload };
    case TOGGLE_CHART:
      return {
        ...state,
        showChart: action.payload
      };
    default:
      return state;
  }
};

export default table;

export const getIsMinimized = state => state.table?.isMinimized;
export const getCanShowChart = state => state.table?.showChart;
export const getChartScope = state => state.table.chartScope;
