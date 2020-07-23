import React, { Suspense } from "react";
import { Helmet } from "react-helmet";
import { connect } from "react-redux";
import { useFirestoreConnect } from "react-redux-firebase";
import { useParams } from "react-router";
import { useAnalytics } from "reactfire";
import { Legend, Line, Tooltip, XAxis, YAxis } from "recharts";
import { SelectContent } from "../actions/analyticsActions";
import {
  SELECT_INFORMATION_SHOWN,
  TOGGLE_CHART,
} from "../actions/tableActions";
import { getSelectedHistory } from "../reducers/latestValues";
import {
  getCanShowChart,
  getChartInformationShown,
  getChartScope,
  getIsMinimized,
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
const ChartScope = React.lazy(() => import("./ChartScope"));

const myProjectsReduxName = "selectedHistory";

const NUMBER_OF_ENTRIES = 30;

const ChartElement = ({
  dispatch,
  isMinimzed,
  selectedHistory,
  canShow,
  scope,
  shownInformation,
}) => {
  const analytics = useAnalytics();
  let { country } = useParams();
  country = !!country ? country : "Total";

  useFirestoreConnect({
    collection: "history",
    where: ["country", "==", country],
    storeAs: myProjectsReduxName,
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
                SelectContent(analytics, "show_element", "chart");
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
                  SelectContent(analytics, "hide_element", "chart");
                  dispatch({ type: TOGGLE_CHART, payload: false });
                }}
              >
                <MinimizeIcon />
              </div>
            </div>
            <ResponsiveContainer>
              <LineChart
                data={filterOutData(selectedHistory, scope, shownInformation)}
                margin={{ bottom: 20 }}
              >
                <Line
                  type="monotone"
                  dataKey="cases"
                  stroke="#1682C0"
                  dot={true}
                />
                {shownInformation.deaths && (
                  <Line
                    type="monotone"
                    dataKey="deaths"
                    stroke="#D9190E"
                    dot={true}
                  />
                )}
                {shownInformation.critical && (
                  <Line
                    type="monotone"
                    dataKey="critical"
                    stroke="#EBE309"
                    dot={true}
                  />
                )}
                {shownInformation.recovered && (
                  <Line
                    type="monotone"
                    dataKey="recovered"
                    stroke="#00FF00"
                    dot={true}
                  />
                )}
                <XAxis
                  dataKey="date"
                  type="number"
                  tickFormatter={formatXAxis}
                  domain={[getMinTime(scope), getMaxTime(scope)]}
                  allowDuplicatedCategory={false}
                  padding={{ right: 25 }}
                />
                <YAxis
                  tickFormatter={(value) =>
                    Intl.NumberFormat("en-US", {
                      notation: "compact",
                      compactDisplay: "short",
                    }).format(value)
                  }
                />
                <Legend
                  inactive={true}
                  onClick={(e) => {
                    const key = e.dataKey;
                    dispatch({
                      type: SELECT_INFORMATION_SHOWN,
                      payload: { [key]: !shownInformation[key] },
                    });
                  }}
                />
                <Tooltip
                  labelFormatter={formatLabel}
                  contentStyle={customStyle}
                  formatter={(value) =>
                    new Intl.NumberFormat("en").format(value)
                  }
                />
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

const getMaxTime = (scope) => {
  var d = new Date();
  if (scope === "1W" || scope === "1M") {
    return d / 1000;
  }

  return "dataMax";
};

const getMinTime = (scope) => {
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

const convertHistory = (history) => {
  if (!history || history.length < NUMBER_OF_ENTRIES) {
    return history;
  }

  const result = [];
  const acutalNumberOfEntries = NUMBER_OF_ENTRIES - 2;
  const startTime = history[0].date;
  const endTime = history[history.length - 1].date;
  const spacing = (endTime - startTime) / acutalNumberOfEntries;
  var target = startTime + spacing;

  for (var i = 1; i < history.length - 1; i++) {
    const curr = history[i];
    if (curr.date + spacing > endTime) break;

    if (curr.date > target) {
      result.push(curr);
      while (target < curr.date) {
        target += spacing;
      }
    }
  }

  result.push(history[history.length - 1]);
  return result;
};

const filterOutData = (selectedHistory, scope, shownInformation) => {
  var d = new Date();

  let newHistory = null;
  switch (scope) {
    case "1W":
      d.setDate(d.getDate() - 7);
      d.setHours(0, 0, 0);
      newHistory = convertHistory(filterData(selectedHistory, d / 1000));
      break;
    case "1M":
      d.setMonth(d.getMonth() - 1);
      d.setHours(0, 0, 0);
      newHistory = convertHistory(filterData(selectedHistory, d / 1000));
      break;
    default:
      newHistory = convertHistory(selectedHistory);
  }

  const attributesToBeRemoved = getAttributesToBeRemoved(shownInformation);
  if (attributesToBeRemoved.length > 0) {
  }
  newHistory.map((h) => {
    attributesToBeRemoved.forEach((key) => {
      delete h[key];
    });

    return h;
  });

  return newHistory;
};

const getAttributesToBeRemoved = (shownInformation) => {
  const result = [];
  Object.keys(shownInformation).forEach((key) => {
    if (!shownInformation[key]) result.push(key);
  });

  return result;
};

const filterData = (selectedHistory, timeLimitSeconds) =>
  selectedHistory.filter((entry) => entry.date >= timeLimitSeconds);

const customStyle = {
  width: "180px",
  height: "fit-content",
  margin: 0,
  lineHeight: "12px",
  border: "0px",
  backgroundColor: "rgba(255, 255, 255, 0)",
  padding: "10px",
};

function formatXAxis(tickItem) {
  const t = convertToDate(tickItem);
  return t.getDate() + "/" + (t.getMonth() + 1);
}

function formatLabel(seconds) {
  const t = convertToDate(seconds);
  return (
    t.toISOString().substring(0, 10) +
    " (" +
    timeConversion(t.toLocaleTimeString()) +
    ")"
  );
}

function timeConversion(s) {
  const isPM = s.indexOf("PM") !== -1;
  let [hours, minutes] = s.replace(isPM ? "PM" : "AM", "").split(":");

  if (isPM) {
    hours = parseInt(hours, 10) + 12;
    hours = hours === 24 ? 12 : hours;
  } else {
    hours = parseInt(hours, 10);
    hours = hours === 12 ? 0 : hours;
    if (String(hours).length === 1) hours = "0" + hours;
  }

  const time = [hours, minutes].join(":");

  return time;
}

function convertToDate(tickItem) {
  var t = new Date(1970, 0, 1); // Epoch
  t.setSeconds(tickItem);
  return t;
}

export default connect((state) => ({
  isMinimzed: getIsMinimized(state),
  selectedHistory: getSelectedHistory(state),
  canShow: getCanShowChart(state),
  scope: getChartScope(state),
  shownInformation: getChartInformationShown(state),
}))(ChartElement);
