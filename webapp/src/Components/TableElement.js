import { TextField } from "@material-ui/core";
import React, { useState } from "react";
import { store } from "react-notifications-component";
import { useSelector } from "react-redux";
import ReactTable from "react-table-6";
import "react-table-6/react-table.css";
import { getLatestValues } from "../reducers/latestValues";
import {
  newCases,
  newCritical,
  newDeaths,
  newRecovered
} from "./Notifications";
import "./TableElement.css";

function isString(value) {
  return typeof value === "string" || value instanceof String;
}

export const TableElement = () => {
  const [search, setSearch] = useState("");
  const latestValues = useSelector(state => getLatestValues(state));

  console.log("loading table");
  if (!latestValues || !latestValues.allValues) {
    return null;
  }

  const data = transformLatestValues(latestValues.allValues);
  const newValues = latestValues.newValue;

  if (!!latestValues.newValue) {
    if (latestValues.newValue["cases"]) {
      store.addNotification(
        newCases(latestValues.newValue.country, latestValues.newValue.cases)
      );
    }
    if (latestValues.newValue["deaths"]) {
      store.addNotification(
        newDeaths(latestValues.newValue.country, latestValues.newValue.deaths)
      );
    }
    if (latestValues.newValue["critical"]) {
      store.addNotification(
        newCritical(
          latestValues.newValue.country,
          latestValues.newValue.critical
        )
      );
    }
    if (latestValues.newValue["recovered"]) {
      store.addNotification(
        newRecovered(
          latestValues.newValue.country,
          latestValues.newValue.recovered
        )
      );
    }
  }

  let filteredData = data;
  if (!!search) {
    filteredData = filteredData.filter(info => {
      return info.country.toLowerCase().startsWith(search.toLowerCase());
    });
  }
  return (
    <>
      <ReactTable
        getTrProps={(state, rowInfo, column, instance) => {
          // console.log(rowInfo);
          if (
            !!newValues &&
            !!rowInfo &&
            rowInfo.original.country === newValues.country
          ) {
            return {
              style: {
                animation: "FADEIN 1.1s"
              }
            };
          }

          return {};
        }}
        getTdProps={(state, rowInfo, column, instance) => {
          // console.log(rowInfo);
          if (
            !!newValues &&
            !!rowInfo &&
            rowInfo.original.country === newValues.country &&
            isString(column.Header) &&
            Object.keys(newValues).includes(
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
        getTheadProps={() => {
          return {
            style: {
              display: "block"
            }
          };
        }}
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
                label="Country"
                variant="outlined"
                size="small"
                onChange={event => {
                  setSearch(event.target.value);
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
    </>
  );
};

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
