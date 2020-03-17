import { combineReducers } from "redux";
import { firestoreReducer as firestore } from "redux-firestore";
import latest from "./reducers/latestValues";
import table from "./reducers/tableReducer";

const rootReducer = combineReducers({
  firestore,
  latest,
  table
});

export default rootReducer;
