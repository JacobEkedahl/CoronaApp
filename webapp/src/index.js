import { CssBaseline } from "@material-ui/core";
import { createMuiTheme, ThemeProvider } from "@material-ui/core/styles";
import firebase from "firebase/app";
import "firebase/auth";
import "firebase/firestore";
import React from "react";
import { render } from "react-dom";
import { Provider } from "react-redux";
import { ReactReduxFirebaseProvider } from "react-redux-firebase";
import { createFirestoreInstance } from "redux-firestore";
import MainWindow from "./Components/MainWindow";
import * as config from "./config";
import createStore from "./createStore";
import registerServiceWorker from "./registerServiceWorker";

const darkTheme = createMuiTheme({
  palette: {
    type: "dark"
  }
});

// Initialize Firebase instance
firebase.initializeApp(config.fbConfig);

const styles = {
  fontFamily: "sans-serif",
  textAlign: "center"
};

const store = createStore();

function App() {
  return (
    <Provider store={store}>
      <ReactReduxFirebaseProvider
        firebase={firebase}
        config={config.rfConfig}
        dispatch={store.dispatch}
        createFirestoreInstance={createFirestoreInstance}
      >
        <ThemeProvider theme={darkTheme}>
          <CssBaseline />
          <div style={styles}>
            <h2>Corona Virus Live Updates {"\u2728"}</h2>
            <MainWindow />
          </div>
        </ThemeProvider>
      </ReactReduxFirebaseProvider>
    </Provider>
  );
}

render(<App />, document.getElementById("root"));

registerServiceWorker();
