import React, { Fragment } from "react";
import { useDispatch, useSelector } from "react-redux";
import { LOAD_ANIMATED } from "../actions/tableActions";
import { getLatestUpdated } from "../reducers/latestValues";

function UpdateComponent() {
  useSelector(state => getLatestUpdated(state));
  const dispatch = useDispatch();

  setTimeout(() => {
    dispatch({ type: LOAD_ANIMATED });
  }, getRndInteger(6000, 30000));

  return <Fragment />;
}

function getRndInteger(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

export default UpdateComponent;
