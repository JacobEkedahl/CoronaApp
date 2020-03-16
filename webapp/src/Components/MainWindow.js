import React from "react";
import { useSelector } from "react-redux";
import { useFirestoreConnect } from "react-redux-firebase";
import { getLatestValues } from "../reducers/latestValues";
import { getIsMinimized } from "../reducers/tableReducer";
import HideButton from "./HideButton";
import "./MainWindow.css";
import MapElement from "./MapElement";
import { TableElement } from "./TableElement";

function MainWindow() {
  useFirestoreConnect("latestValues"); // sync todos collection from Firestore into redux
  const latestValues = useSelector(state => getLatestValues(state));
  const isMinimzed = useSelector(state => getIsMinimized(state));

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
        <TableElement data={latestValues} />
      </div>
    </div>
  );
}

export default MainWindow;
