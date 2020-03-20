import InsertChartIcon from "@material-ui/icons/InsertChart";
import MinimizeIcon from "@material-ui/icons/Minimize";
import moment from "moment";
import React, { Fragment } from "react";
import { connect, useDispatch, useSelector } from "react-redux";
import { firestoreConnect } from "react-redux-firebase";
import {
  Legend,
  Line,
  LineChart,
  ReferenceLine,
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
      ...(entry.critical !== "" && { critical: convertToInt(entry.critical) }),
      recovered: convertToInt(entry.recovered),
      date: entry.time.seconds
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
          <LineChart data={selectedHistory} margin={{ right: 20 }}>
            <Line
              type="monotone"
              dataKey="cases"
              stroke="#8884d8"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="deaths"
              stroke="#D9190E"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="critical"
              stroke="#EBE309"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="recovered"
              stroke="#00FF00"
              dot={false}
            />
            <XAxis
              dataKey="date"
              type="number"
              tickFormatter={formatXAxis}
              domain={[1583082945, "dataMax"]}
              allowDuplicatedCategory={false}
            />
            <YAxis />
            <Legend />
            <Tooltip
              labelFormatter={formatLabel}
              contentStyle={customStyle}
              formatter={value => new Intl.NumberFormat("en").format(value)}
            />

            <ReferenceLine x="1583064000" stroke="rgba(187,225,250,0.3)" />
            <ReferenceLine x="1580558400" stroke="rgba(187,225,250,0.3)" />
            <ReferenceLine x="1585742400" stroke="rgba(187,225,250,0.3)" />
            <ReferenceLine x="1588334400" stroke="rgba(187,225,250,0.3)" />
            <ReferenceLine x="1591012800" stroke="rgba(187,225,250,0.3)" />
            <ReferenceLine x="1593604800" stroke="rgba(187,225,250,0.3)" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const customStyle = {
  width: "180px",
  height: "fit-content",
  margin: 0,
  lineHeight: "12px",
  border: "0px",
  backgroundColor: "rgba(255, 255, 255, 0)",
  padding: "10px"
};

function formatXAxis(tickItem) {
  // If using moment.js
  return moment(tickItem * 1000).format("MM-DD");
}

function formatLabel(seconds) {
  return moment(seconds * 1000).format("YYYY-MM-DD");
}

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
