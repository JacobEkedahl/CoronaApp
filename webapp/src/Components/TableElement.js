import { TextField } from "@material-ui/core";
import React, { useState } from "react";
import { store } from "react-notifications-component";
import { useDispatch, useSelector } from "react-redux";
import ReactTable from "react-table-6";
import "react-table-6/react-table.css";
import { DONT_SHOW_NOTIFICATIONS } from "../actions/tableActions";
import { getCanShowNotification } from "../reducers/latestValues";
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

export const TableElement = ({ allValues, newValue }) => {
  const [search, setSearch] = useState("");
  const canShowNotification = useSelector(state =>
    getCanShowNotification(state)
  );
  const dispatch = useDispatch();

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
      <ReactTable
        getTrProps={(state, rowInfo, column, instance) => {
          // console.log(rowInfo);
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

          return {};
        }}
        getTdProps={(state, rowInfo, column, instance) => {
          // console.log(rowInfo);
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
