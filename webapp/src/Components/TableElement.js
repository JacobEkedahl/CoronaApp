import { TextField } from "@material-ui/core";
import React, { useState } from "react";
import ReactTable from "react-table-6";
import "react-table-6/react-table.css";
import "./TableElement.css";

export const TableElement = ({ data }) => {
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
        getTheadFilterProps={(state, rowInfo, column, instance) => {
          return {
            style: { zIndex: 10, position: "relative" }
          };
        }}
        getTheadProps={(state, rowInfo, column, instance) => {
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
                onChange={event => setSearch(event.target.value)}
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
        defaultPageSize={data.length}
        className="-striped -highlight"
      />
    </>
  );
};
