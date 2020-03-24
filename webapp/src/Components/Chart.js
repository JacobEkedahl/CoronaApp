import React, { Suspense } from "react";
import { Helmet } from "react-helmet";
import { connect } from "react-redux";
import { useFirestoreConnect } from "react-redux-firebase";
import { useParams } from "react-router";
import { Legend, Line, Tooltip, XAxis, YAxis } from "recharts";
import { selectContent } from "../actions/analyticsActions";
import { TOGGLE_CHART } from "../actions/tableActions";
import { getSelectedHistory } from "../reducers/latestValues";
import {
  getCanShowChart,
  getChartScope,
  getIsMinimized
} from "../reducers/tableReducer";
import "./Chart.css";
import Loader from "./Loader";

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
  isMinimzed,
  selectedHistory,
  canShow,
  scope
}) => {
  let { country } = useParams();
  country = !!country ? country : "Total";
  useFirestoreConnect({
    collection: "history",
    where: ["country", "==", country],
    storeAs: myProjectsReduxName
  });

  if (!country) {
    return null;
  }

  if (!canShow) {
    return (
      <>
        <Heading country={country} />
        <div className="toolbarExpand">
          <Suspense fallback={<Loader />}>
            <InsertChartIcon
              onClick={() => {
                dispatch({ type: TOGGLE_CHART, payload: true });
                selectContent("show_element", "chart");
              }}
            />
          </Suspense>
        </div>
      </>
    );
  }

  return (
    <>
      <Heading country={country} />
      <div className={isMinimzed ? "toolbarFullscreen" : "toolbar"}>
        <div className="chart">
          <Suspense fallback={<Loader />}>
            <div className="headerContainer">
              <h1 style={{ paddingLeft: 10, fontSize: "initial" }}>
                {country}
              </h1>
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
                  stroke="#1682C0"
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
    </>
  );
};

const Heading = ({ country }) => {
  const metaCountry = country === "Total" ? "the World" : country;
  const linkEnding = country === "Total" ? "" : country;
  return (
    <Helmet>
      <title>Corona is in {metaCountry}</title>

      <link rel="canonical" href={`https://coronaishere.com/${linkEnding}`} />
      <meta
        name="description"
        content={`Current spread of Corona in ${metaCountry}.
   Showcasing the history of the number of people died, recovered, confirmed cases and crtical cases of Corona/Covid19 in ${metaCountry}`}
      />
    </Helmet>
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
  isMinimzed: getIsMinimized(state),
  selectedHistory: getSelectedHistory(state),
  canShow: getCanShowChart(state),
  scope: getChartScope(state)
}))(ChartElement);
