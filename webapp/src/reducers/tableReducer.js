import { TOGGLE_CHART, TOGGLE_TABLE } from "../actions/tableActions";

const table = (
  state = {
    isMinimized: false,
    showChart: true
  },
  action
) => {
  switch (action.type) {
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
