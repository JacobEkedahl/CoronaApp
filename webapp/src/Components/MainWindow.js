import React from "react";
import { useSelector } from "react-redux";
import { getLatestValues } from "../reducers/latestValues";
import { getIsMinimized } from "../reducers/tableReducer";
import HideButton from "./HideButton";
import "./MainWindow.css";
import MapElement from "./MapElement";
import { TableElement } from "./TableElement";

function MainWindow() {
  const isMinimzed = useSelector(state => getIsMinimized(state));
  const latestValues = useSelector(state => getLatestValues(state));

  if (!latestValues) return null;
  console.log(latestValues);
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
      {!isMinimzed && (
        <div className="table">
          <TableElement
            data={transformLatestValues(latestValues.allValues)}
            newValues={latestValues.newValue}
          />
        </div>
      )}
    </div>
  );
}

const transformLatestValues = data => {
  const countriesWithInfo = Object.keys(data).map(key => {
    const cases = data[key].cases || "0";
    const deaths = data[key].deaths || "0";
    const critical = data[key].critical || "0";
    const recovered = data[key].recovered || "0";

    return {
      country: key,
      cases: cases,
      deaths: deaths,
      critical: critical,
      recovered: recovered
    };
  });

  countriesWithInfo.sort(function(a, b) {
    const numberB = b.cases.replace(/[ ,.]/g, "");
    const numberA = a.cases.replace(/[ ,.]/g, "");
    return numberB - numberA;
  });

  return countriesWithInfo;
};

export default MainWindow;
