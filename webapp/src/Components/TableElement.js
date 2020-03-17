import { TextField } from "@material-ui/core";
import React, { useState } from "react";
import ReactTable from "react-table-6";
import "react-table-6/react-table.css";
import "./TableElement.css";

function isString(value) {
  return typeof value === "string" || value instanceof String;
}

export const TableElement = ({ data, newValues }) => {
  const [search, setSearch] = useState("");

  if (!data) return null;

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
