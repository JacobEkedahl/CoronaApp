import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { selectContent } from "../actions/analyticsActions";
import { TOGGLE_TABLE } from "../actions/tableActions";
import { getIsMinimized } from "../reducers/tableReducer";
import "./HideButton.css";

const HideButton = () => {
  const isMinimzed = useSelector(state => getIsMinimized(state));
  const dispatch = useDispatch();

  return (
    <div
      style={{ paddingLeft: isMinimzed ? -2 : 2 }}
      className="circle-element"
      onClick={() => {
        dispatch({ type: TOGGLE_TABLE, payload: !isMinimzed });
        if (!isMinimzed) {
          selectContent("hide_element", "table");
        } else {
          selectContent("show_element", "table");
        }
      }}
    >
      <span>{isMinimzed ? "<" : ">"}</span>
    </div>
  );
};

export default HideButton;
