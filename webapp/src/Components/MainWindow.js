import React, { Suspense } from "react";
import { useSelector } from "react-redux";
import { useFirestoreConnect } from "react-redux-firebase";
import { getHasLoaded, getLatestValues } from "../reducers/latestValues";
import { getIsMinimized } from "../reducers/tableReducer";
import Chart from "./Chart";
import HideButton from "./HideButton";
import Loader from "./Loader";
import "./MainWindow.css";
import { TableElement } from "./TableElement";

const MapElement = React.lazy(() => import("./MapElement"));

function MainWindow() {
  useFirestoreConnect("latestValues");
  const hasLoaded = useSelector(state => getHasLoaded(state));
  const isMinimzed = useSelector(state => getIsMinimized(state));
  const latestValues = useSelector(state => getLatestValues(state));

  if (!hasLoaded) return null;

  return (
    <div className={isMinimzed ? "wrapperMinimized" : "wrapper"}>
      <div id="mainMap" className="map">
        <Suspense fallback={<Loader />}>
          <MapElement latestValues={latestValues.allValues} />
        </Suspense>
      </div>
      <div className="hideButton">
        <HideButton />
      </div>
      <>
        <Chart />
      </>
      <div className={isMinimzed ? "tableHidden" : "table"}>
        <TableElement
          allValues={transformLatestValues(latestValues.allValues)}
          newValue={latestValues.newValue}
        />
      </div>
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
