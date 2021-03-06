import React, { Suspense, useState } from "react";
import { store } from "react-notifications-component";
import { connect, useSelector } from "react-redux";
import { useHistory } from "react-router";
import "react-table-6/react-table.css";
import { useAnalytics } from "reactfire";
import { SearchEvent, SelectContent } from "../actions/analyticsActions";
import { DONT_SHOW_NOTIFICATIONS, TOGGLE_CHART } from "../actions/tableActions";
import {
  getCanShowNotification,
  getNewValue,
  getTransformedValues
} from "../reducers/latestValues";
import { getIsMinimized } from "../reducers/tableReducer";
import Loader from "./Loader";
import {
  newCases,
  newCritical,
  newDeaths,
  newRecovered
} from "./Notifications";
import "./TableElement.css";

const ReactTable = React.lazy(() => import("react-table-6"));
const TextField = React.lazy(() => import("@material-ui/core/TextField"));

function isString(value) {
  return typeof value === "string" || value instanceof String;
}

const TableElement = ({ allValues, newValue, dispatch }) => {
  const [search, setSearch] = useState("");
  const analytics = useAnalytics();
  let history = useHistory();
  const canShowNotification = useSelector(state =>
    getCanShowNotification(state)
  );

  if (!!newValue && canShowNotification) {
    if (newValue["cases"]) {
      store.addNotification(newCases(newValue.country, newValue.cases));
    }
    if (newValue["deaths"]) {
      store.addNotification(newDeaths(newValue.country, newValue.deaths));
    }
    if (newValue["critical"]) {
      store.addNotification(newCritical(newValue.country, newValue.critical));
    }
    if (newValue["recovered"]) {
      store.addNotification(newRecovered(newValue.country, newValue.recovered));
    }
    dispatch({ type: DONT_SHOW_NOTIFICATIONS });
  }

  let filteredData = allValues;
  if (!!search) {
    filteredData = filteredData.filter(info => {
      return info.country.toLowerCase().startsWith(search.toLowerCase());
    });
  }
  return (
    <>
      <Suspense fallback={<Loader />}>
        <ReactTable
          getProps={() => {
            return {
              style: {
                width: "100%"
              }
            };
          }}
          getTrProps={(state, rowInfo, column, instance) => {
            if (
              !!newValue &&
              !!rowInfo &&
              rowInfo.original.country === newValue.country
            ) {
              return {
                style: {
                  animation: "FADEIN 1.1s"
                }
              };
            }

            return {
              onClick: e => {
                dispatch({ type: TOGGLE_CHART, payload: true });
                SelectContent(
                  analytics,
                  "select_country_table",
                  rowInfo.original.country
                );
                history.push("/" + rowInfo.original.country);
              }
            };
          }}
          getTdProps={(state, rowInfo, column, instance) => {
            if (
              !!newValue &&
              !!rowInfo &&
              rowInfo.original.country === newValue.country &&
              isString(column.Header) &&
              Object.keys(newValue).includes(
                column.Header.toString().toLowerCase()
              )
            ) {
              return {
                style: {
                  animation: "FADEIN_TD 2.2s"
                }
              };
            }
            return {};
          }}
          minRows={19}
          data={filteredData}
          pageSizeOptions={[]}
          sortable
          showPagination={false}
          resizable={false}
          columns={[
            {
              sortable: false,
              Header: (
                <TextField
                  style={{ height: 40 }}
                  label="Country"
                  variant="outlined"
                  size="small"
                  id="countryField"
                  onChange={event => {
                    setSearch(event.target.value);
                    SearchEvent(analytics, event.target.value);
                  }}
                />
              ),
              accessor: "country"
            },
            {
              Header: "Cases",
              id: "cases",
              accessor: "cases",
              sortMethod: (a, b, desc) => {
                const numberB = b.replace(/[ ,.]/g, "");
                const numberA = a.replace(/[ ,.]/g, "");
                return numberB - numberA;
              }
            },
            {
              Header: "Deaths",
              id: "deaths",
              accessor: "deaths",
              sortMethod: (a, b, desc) => {
                const numberB = b.replace(/[ ,.]/g, "");
                const numberA = a.replace(/[ ,.]/g, "");
                return numberB - numberA;
              }
            },
            {
              Header: "Critical",
              id: "critical",
              accessor: "critical",
              sortMethod: (a, b, desc) => {
                const numberB = b.replace(/[ ,.]/g, "");
                const numberA = a.replace(/[ ,.]/g, "");
                return numberB - numberA;
              }
            },
            {
              Header: "Recovered",
              id: "recovered",
              accessor: "recovered",
              sortMethod: (a, b, desc) => {
                const numberB = b.replace(/[ ,.]/g, "");
                const numberA = a.replace(/[ ,.]/g, "");
                return numberB - numberA;
              }
            }
          ]}
          defaultPageSize={filteredData.length}
          className="-striped -highlight"
        />
      </Suspense>
    </>
  );
};

export default connect(state => ({
  allValues: getTransformedValues(state),
  newValue: getNewValue(state),
  isMinimzed: getIsMinimized(state)
}))(TableElement);
