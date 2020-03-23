import React, { Suspense } from "react";
import { connect } from "react-redux";
import { useFirestoreConnect } from "react-redux-firebase";
import { Legend, Line, Tooltip, XAxis, YAxis } from "recharts";
import { selectContent } from "../actions/analyticsActions";
import { TOGGLE_CHART } from "../actions/tableActions";
import {
  getCurrentSelected,
  getSelectedHistory
} from "../reducers/latestValues";
import {
  getCanShowChart,
  getChartScope,
  getIsMinimized
} from "../reducers/tableReducer";
import "./Chart.css";

//Lazy loading
const InsertChartIcon = React.lazy(() =>
  import("@material-ui/icons/InsertChart")
);
const MinimizeIcon = React.lazy(() => import("@material-ui/icons/Minimize"));
const LineChart = React.lazy(() => import("recharts/lib/chart/LineChart"));
const ResponsiveContainer = React.lazy(() =>
  import("recharts/lib/component/ResponsiveContainer")
);
const ReferenceLine = React.lazy(() =>
  import("recharts/lib/cartesian/ReferenceLine")
);
const ChartScope = React.lazy(() => import("./ChartScope"));

const myProjectsReduxName = "selectedHistory";

const ChartElement = ({
  dispatch,
  currentSelected,
  isMinimzed,
  selectedHistory,
  canShow,
  scope
}) => {
  useFirestoreConnect({
    collection: "history",
    where: ["country", "==", currentSelected],
    storeAs: myProjectsReduxName
  });

  if (!currentSelected) {
    return null;
  }
  if (!canShow) {
    return (
      <div className="toolbarExpand">
        <Suspense fallback={<div>Loading</div>}>
          <InsertChartIcon
            onClick={() => {
              dispatch({ type: TOGGLE_CHART, payload: true });
              selectContent("show_element", "chart");
            }}
          />
        </Suspense>
      </div>
    );
  }

  return (
    <div className={isMinimzed ? "toolbarFullscreen" : "toolbar"}>
      <div className="chart">
        <Suspense fallback={<div>Loading</div>}>
          <div className="headerContainer">
            <h2 style={{ paddingLeft: 10 }}>{currentSelected}</h2>

            <ChartScope />
            <div
              className="minimize"
              onClick={() => {
                selectContent("hide_element", "chart");
                dispatch({ type: TOGGLE_CHART, payload: false });
              }}
            >
              <MinimizeIcon />
            </div>
          </div>
          <ResponsiveContainer>
            <LineChart
              data={filterOutData(selectedHistory, scope)}
              margin={{ bottom: 20 }}
            >
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
                domain={[getMinTime(scope), getMaxTime(scope)]}
                allowDuplicatedCategory={false}
                padding={{ right: 25 }}
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
        </Suspense>
      </div>
    </div>
  );
};

const getMaxTime = scope => {
  var d = new Date();
  if (scope === "1W" || scope === "1M") {
    return d / 1000;
  }

  return "dataMax";
};

const getMinTime = scope => {
  var d = new Date();
  switch (scope) {
    case "1W":
      d.setDate(d.getDate() - 7);
      d.setHours(0, 0, 0);
      return d / 1000;
    case "1M":
      d.setMonth(d.getMonth() - 1);
      d.setHours(0, 0, 0);
      return d / 1000;
    default:
      return "dataMin";
  }
};

const filterOutData = (selectedHistory, scope) => {
  var d = new Date();
  switch (scope) {
    case "1W":
      d.setDate(d.getDate() - 7);
      d.setHours(0, 0, 0);
      return filterData(selectedHistory, d / 1000);
    case "1M":
      d.setMonth(d.getMonth() - 1);
      d.setHours(0, 0, 0);
      return filterData(selectedHistory, d / 1000);
    default:
      return selectedHistory;
  }
};

const filterData = (selectedHistory, timeLimitSeconds) =>
  selectedHistory.filter(entry => entry.date >= timeLimitSeconds);

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
  const t = convertToDate(tickItem);
  return t.getDate() + "/" + (t.getMonth() + 1);
}

function formatLabel(seconds) {
  const t = convertToDate(seconds);
  return t.toISOString().substring(0, 10);
}

function convertToDate(tickItem) {
  var t = new Date(1970, 0, 1); // Epoch
  t.setSeconds(tickItem);
  return t;
}

export default connect(state => ({
  currentSelected: getCurrentSelected(state),
  isMinimzed: getIsMinimized(state),
  selectedHistory: getSelectedHistory(state),
  canShow: getCanShowChart(state),
  scope: getChartScope(state)
}))(ChartElement);
