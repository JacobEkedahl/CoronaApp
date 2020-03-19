import React from "react";
import { VectorMap } from "react-jvectormap";
import { useDispatch } from "react-redux";
import { SELECTED_COUNTRIES } from "../actions/tableActions";
import { countries } from "../constants";
import "./MapElement.css";

const getRanking = countryInfo => {
  const cases = parseInt(countryInfo.cases.replace(/[ ,.]/g, "")) || 0;
  const deaths = parseInt(countryInfo.deaths.replace(/[ ,.]/g, "")) || 0;
  const critical = parseInt(countryInfo.critical.replace(/[ ,.]/g, "")) || 0;
  const recovered = parseInt(countryInfo.recovered.replace(/[ ,.]/g, "")) || 0;

  let diff = cases - recovered - critical;
  diff += critical * 2;
  diff += deaths * 10;

  return diff;
};

const mapDataToCountries = latestValues => {
  const result = {};
  Object.keys(countries).forEach(country => {
    if (!latestValues[country]) {
      result[countries[country]] = 0;
    } else {
      result[countries[country]] = getRanking(latestValues[country]);
    }
  });

  return result;
};

const handleClick = (countryCode, dispatch) => {
  const chosenCountry = Object.keys(countries).find(
    key => countries[key] === countryCode
  );
  console.log(chosenCountry);
  console.log(countryCode);
  dispatch({ type: SELECTED_COUNTRIES, payload: chosenCountry });
};

const MapElement = ({ latestValues }) => {
  const dispatch = useDispatch();

  console.log("loading map");
  return (
    <>
      <VectorMap
        map={"world_mill"}
        backgroundColor="transparent" //change it to ocean blue: #0077be
        zoomOnScroll={false}
        containerStyle={{
          width: "100%",
          height: "100%"
        }}
        onRegionClick={(e, countryCode) => {
          handleClick(countryCode, dispatch);
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
              values: mapDataToCountries(latestValues), //this is your data
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
    </>
  );
};

export default MapElement;
