import React, { Suspense, useEffect, useRef } from "react";
import { connect } from "react-redux";
import { useHistory } from "react-router";
import { selectContent } from "../actions/analyticsActions";
import { TOGGLE_CHART } from "../actions/tableActions";
import { countries } from "../constants";
import { getAllValues } from "../reducers/latestValues";
import "./MapElement.css";

const VectorMap = React.lazy(() =>
  import("react-jvectormap").then(module => ({ default: module.VectorMap }))
);

const MapElement = ({ allValues, dispatch }) => {
  let history = useHistory();
  const transformed = transformMap(allValues);

  return (
    <>
      <Suspense>
        <VectorMap
          map={"world_mill"}
          backgroundColor="transparent" //change it to ocean blue: #0077be
          zoomOnScroll={false}
          containerStyle={{
            width: "100%",
            height: "100%"
          }}
          onRegionClick={(e, countryCode) => {
            setTimeout(() => {
              Array.from(
                document.getElementsByClassName("jvectormap-tip")
              ).forEach(el => {
                el.style.display = "none";
              });
            }, 40);
            handleClick(countryCode, dispatch, history);
          }} //gets the country code
          containerClassName="map"
          regionStyle={{
            initial: {
              fill: "#e4e4e4",
              "fill-opacity": 0.9,
              stroke: "none",
              "stroke-width": 0,
              "stroke-opacity": 0
            },
            hover: {
              "fill-opacity": 0.8,
              cursor: "pointer"
            }
          }}
          regionsSelectable={false}
          series={{
            regions: [
              {
                values: transformed, //this is your data
                scale: [
                  "#e4e4e4",
                  "#FFFF00",
                  "#FFB422",
                  "#FF9B44",
                  "#FF000E",
                  "#BF4500",
                  "#580000",
                  "#441C00",
                  "#2F2800"
                ], //your color game's here
                normalizeFunction: "polynomial"
              }
            ]
          }}
        ></VectorMap>
      </Suspense>
    </>
  );
};

export default React.memo(
  connect(state => ({
    allValues: getAllValues(state)
  }))(MapElement, useTraceUpdate)
);

const handleClick = (countryCode, dispatch, history) => {
  const chosenCountry = Object.keys(countries).find(
    key => countries[key] === countryCode
  );
  history.push("/" + chosenCountry);
  selectContent("select_country_map", chosenCountry);
  dispatch({ type: TOGGLE_CHART, payload: true });
};

function useTraceUpdate(props) {
  const prev = useRef(props);
  useEffect(() => {
    const changedProps = Object.entries(props).reduce((ps, [k, v]) => {
      if (prev.current[k] !== v) {
        ps[k] = [prev.current[k], v];
      }
      return ps;
    }, {});

    prev.current = props;
    if (Object.keys(changedProps).length > 0) {
      return false;
    }
  });

  return true;
}

const transformMap = allValues => {
  const result = {};
  Object.keys(countries).forEach(country => {
    if (!allValues[country]) {
      result[countries[country]] = 0;
    } else {
      result[countries[country]] = getRanking(allValues[country]);
    }
  });

  return result;
};

const getRanking = countryInfo => {
  const cases = parseInt(countryInfo.cases.replace(/[ ,.]/g, "")) || 0;
  const deaths = parseInt(countryInfo.deaths.replace(/[ ,.]/g, "")) || 0;
  const critical = parseInt(countryInfo.critical.replace(/[ ,.]/g, "")) || 0;
  const recovered = parseInt(countryInfo.recovered.replace(/[ ,.]/g, "")) || 0;

  let diff = cases - recovered - critical;
  diff += critical * 2;
  diff += deaths * 4;

  return diff;
};
