import React from "react";
import { useSelector } from "react-redux";
import { getHasLoaded } from "../reducers/latestValues";
import { getIsMinimized } from "../reducers/tableReducer";
import HideButton from "./HideButton";
import "./MainWindow.css";
import MapElement from "./MapElement";
import { TableElement } from "./TableElement";

function MainWindow() {
  const hasLoaded = useSelector(state => getHasLoaded(state));
  const isMinimzed = useSelector(state => getIsMinimized(state));

  if (!hasLoaded) return null;

  return (
    <div
      className="wrapper"
      style={{
        gridTemplateColumns: isMinimzed ? "1fr 20px 0px" : "1fr 20px 520px"
      }}
    >
      <div className="map">
        <MapElement />
      </div>
      <div className="hideButton">
        <HideButton />
      </div>

      <div className="table">
        <TableElement />
      </div>
    </div>
  );
}

export default MainWindow;
