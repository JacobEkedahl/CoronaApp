import { TOGGLE_TABLE } from "../actions/tableActions";

const table = (
  state = {
    isMinimized: false
  },
  action
) => {
  console.log(action.payload);
  switch (action.type) {
    case TOGGLE_TABLE:
      return { isMinimized: action.payload };
    default:
      return state;
  }
};

export default table;

export const getIsMinimized = state => state.table?.isMinimized;
