import React from "react";
import { useSelector } from "react-redux";
import { getIsMinimized } from "../reducers/tableReducer";
import "./ChartElement.css";

const ChartElement = () => {
  const isMinimized = useSelector(state => getIsMinimized(state));
  return <div className={isMinimized ? "chartFullScreen" : "chart"}></div>;
};

export default ChartElement;
