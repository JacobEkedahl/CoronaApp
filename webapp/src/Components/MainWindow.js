import React from "react";
import { useSelector } from "react-redux";
import { useFirestoreConnect } from "react-redux-firebase";
import { getLatestValues } from "../reducers/latestValues";
import "./MainWindow.css";
import MapElement from "./MapElement";
import { TableElement } from "./TableElement";

function MainWindow() {
  useFirestoreConnect("latestValues"); // sync todos collection from Firestore into redux
  const latestValues = useSelector(state => getLatestValues(state));

  return (
    <div className="wrapper">
      <div className="map">
        <MapElement />
      </div>
      <div className="table">
        <TableElement data={latestValues} />
      </div>
    </div>
  );
}

export default MainWindow;
