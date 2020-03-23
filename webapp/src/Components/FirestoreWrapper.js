import React, { Fragment, PureComponent } from "react";
import { useFirestoreConnect } from "react-redux-firebase";

class FirestoreWrapper extends PureComponent {
  state = {
    connection: useFirestoreConnect("latestValues")
  };
  render() {
    return <Fragment />;
  }
}

export default FirestoreWrapper;
