import React, { Suspense } from "react";
import { useSelector } from "react-redux";
import { useFirestoreConnect } from "react-redux-firebase";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import { getHasLoaded } from "../reducers/latestValues";
import { getIsMinimized } from "../reducers/tableReducer";
import Chart from "./Chart";
import HideButton from "./HideButton";
import Loader from "./Loader";
import "./MainWindow.css";
import TableElement from "./TableElement";

const MapElement = React.lazy(() => import("./MapElement"));

function MainWindow() {
  useFirestoreConnect("latestValues");
  const hasLoaded = useSelector(state => getHasLoaded(state));
  const isMinimzed = useSelector(state => getIsMinimized(state));

  console.log("main render");
  if (!hasLoaded) return null;

  return (
    <div className={isMinimzed ? "wrapperMinimized" : "wrapper"}>
      <Router>
        <div id="mainMap" className="map">
          <Suspense fallback={<Loader />}>
            <MapElement />
          </Suspense>
        </div>
        <div className="hideButton">
          <HideButton />
        </div>
        <>
          <Switch>
            <Route exact path="/">
              <Chart />
            </Route>

            <Route path="/:country">
              <Chart />
            </Route>
          </Switch>
        </>
        <div className={isMinimzed ? "tableHidden" : "table"}>
          <TableElement />
        </div>
      </Router>
    </div>
  );
}

export default MainWindow;
