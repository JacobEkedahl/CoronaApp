import React from "react";
import { useDispatch, useSelector } from "react-redux";
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
      onClick={() => dispatch({ type: TOGGLE_TABLE, payload: !isMinimzed })}
    >
      <span>{isMinimzed ? "<" : ">"}</span>
    </div>
  );
};

export default HideButton;
