import InsertChartIcon from "@material-ui/icons/InsertChart";
import MinimizeIcon from "@material-ui/icons/Minimize";
import React, { Fragment } from "react";
import { connect, useDispatch, useSelector } from "react-redux";
import { firestoreConnect } from "react-redux-firebase";
import {
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { compose } from "redux";
import { TOGGLE_CHART } from "../actions/tableActions";
import { getCurrentSelected } from "../reducers/latestValues";
import { getCanShowChart, getIsMinimized } from "../reducers/tableReducer";
import "./Chart.css";
const myProjectsReduxName = "selectedHistory";

const convertToInt = entry => {
  if (!entry) {
    return 0;
  }
  return parseInt(entry.replace(/[ ,.]/g, ""));
};

const ChartElement = () => {
  const dispatch = useDispatch();
  const isMinimzed = useSelector(state => getIsMinimized(state));
  const currentSelected = useSelector(state => getCurrentSelected(state));
  const selectedHistory = useSelector(({ firestore: { ordered } }) => {
    const tempHistory = ordered.selectedHistory;
    if (!tempHistory) return [];
    const sorted = tempHistory.slice().sort((a, b) => {
      return new Date(a.time.seconds) - new Date(b.time.seconds);
    });
    return sorted.map(entry => ({
      cases: convertToInt(entry.cases),
      deaths: convertToInt(entry.deaths),
      critical: convertToInt(entry.critical),
      recovered: convertToInt(entry.recovered),
      date:
        new Date(entry.time.seconds * 1000).getDate() +
        "/" +
        (new Date(entry.time.seconds * 1000).getMonth() + 1)
    }));
  });
  const canShow = useSelector(state => getCanShowChart(state));

  if (!currentSelected) {
    return null;
  }
  if (!canShow) {
    return (
      <div className="toolbarExpand">
        <InsertChartIcon
          onClick={() => dispatch({ type: TOGGLE_CHART, payload: true })}
        />
      </div>
    );
  }

  return (
    <div className={isMinimzed ? "toolbarFullscreen" : "toolbar"}>
      <div className="chart">
        <DummyElement country={currentSelected} />
        <div className="headerContainer">
          <h2 style={{ paddingLeft: 10 }}>{currentSelected}</h2>
          <div
            className="minimize"
            onClick={() => dispatch({ type: TOGGLE_CHART, payload: false })}
          >
            <MinimizeIcon />
          </div>
        </div>
        <ResponsiveContainer>
          <LineChart data={selectedHistory}>
            <Line type="monotone" dataKey="cases" stroke="#8884d8" />
            <Line type="monotone" dataKey="deaths" stroke="#D9190E" />
            <Line type="monotone" dataKey="critical" stroke="#EBE309" />
            <Line type="monotone" dataKey="recovered" stroke="#00FF00" />
            <XAxis dataKey="date" />
            <YAxis />

            <Legend />
            <Tooltip />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ChartElement;

const enhance = compose(
  firestoreConnect(props => [
    {
      collection: "history",
      where: [["country", "==", props.country]],
      storeAs: myProjectsReduxName
    }
  ]),
  connect((state, props) => ({
    selectedHistory: state.firestore.data[myProjectsReduxName] // use storeAs path to gather from redux
  }))
);

export const DummyElement = enhance(country => {
  return <Fragment />;
});
