import React, { Fragment } from "react";
import { useFirestoreConnect } from "react-redux-firebase";

function FirestoreWrapper() {
  useFirestoreConnect("latestValues");

  return <Fragment />;
}

export default FirestoreWrapper;
