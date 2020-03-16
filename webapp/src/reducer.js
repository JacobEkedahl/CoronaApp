import { combineReducers } from "redux";
import { firestoreReducer as firestore } from "redux-firestore";
import table from "./reducers/tableReducer";

const rootReducer = combineReducers({
  firestore,
  table
});

export default rootReducer;
