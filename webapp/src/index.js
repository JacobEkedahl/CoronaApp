import { CssBaseline } from "@material-ui/core";
import { createMuiTheme, ThemeProvider } from "@material-ui/core/styles";
import firebase from "firebase/app";
import "firebase/auth";
import "firebase/firestore";
import React, { useState } from "react";
import { render } from "react-dom";
import ReactNotification from "react-notifications-component";
import "react-notifications-component/dist/theme.css";
import { Provider } from "react-redux";
import { ReactReduxFirebaseProvider } from "react-redux-firebase";
import { createFirestoreInstance } from "redux-firestore";
import FirestoreWrapper from "./Components/FirestoreWrapper";
import MainWindow from "./Components/MainWindow";
import UpdateComponent from "./Components/UpdateComponent";
import * as config from "./config";
import createStore from "./createStore";
import registerServiceWorker from "./registerServiceWorker";

const darkTheme = createMuiTheme({
  palette: {
    type: "dark"
  }
});

let show = false;

// Initialize Firebase instance
firebase.initializeApp(config.fbConfig);
firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL);

const styles = {
  textAlign: "left"
};

const App = () => {
  const store = createStore();
  console.log(show);
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
          <div style={{ styles }}>
            <ReactNotification
              types={[
                {
                  htmlClasses: ["notification-awesome"],
                  name: "awesome"
                }
              ]}
              isMobile={true}
            />
            <FirestoreWrapper />
            <UpdateComponent />
            <MainWindow />
          </div>
        </ThemeProvider>
      </ReactReduxFirebaseProvider>
    </Provider>
  );
};

const AuthMiddleware = () => {
  const [isLoggedIn, setLoggedIn] = useState(false);

  if (!isLoggedIn) {
    var user = firebase.auth().currentUser;
    if (!user) {
      firebase
        .auth()
        .signInAnonymously()
        .then(() => {
          setLoggedIn(true);
        });
    } else {
      setLoggedIn(true);
    }
  }

  return isLoggedIn ? (
    <App />
  ) : (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <div style={{ width: 400, height: 400 }}></div>
    </ThemeProvider>
  );
};

render(<AuthMiddleware />, document.getElementById("root"));

registerServiceWorker();
