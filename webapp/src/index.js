import { CssBaseline } from "@material-ui/core";
import { createMuiTheme, ThemeProvider } from "@material-ui/core/styles";
import "firebase/analytics";
import firebase from "firebase/app";
import "firebase/auth";
import "firebase/firestore";
import React, { Suspense, useState } from "react";
import { render } from "react-dom";
import ReactNotification from "react-notifications-component";
import "react-notifications-component/dist/theme.css";
import { Provider } from "react-redux";
import { ReactReduxFirebaseProvider } from "react-redux-firebase";
import { createFirestoreInstance } from "redux-firestore";
import Loader from "./Components/Loader";
import MainWindow from "./Components/MainWindow.js";
import UpdateComponent from "./Components/UpdateComponent";
import createStore from "./createStore";
import registerServiceWorker from "./registerServiceWorker";

const firebaseConfig = {
  apiKey: "AIzaSyAtmYK_5Wvl6pvzEu5BwuUWqi3kg1awLng",
  authDomain: "corona-live-updates.firebaseapp.com",
  databaseURL: "https://corona-live-updates.firebaseio.com",
  projectId: "corona-live-updates",
  storageBucket: "corona-live-updates.appspot.com",
  messagingSenderId: "770208119300",
  appId: "1:770208119300:web:6cdc18adacf346c2eb1351",
  measurementId: "G-S9GTCFE311"
};

const rfConfig = {
  userProfile: "users", // root that user profiles are written to
  useFirestoreForProfile: true, // Save profile to Firestore instead of Real Time Database
  useFirestoreForStorageMeta: true // Metadata associated with storage file uploads goes to Firestore
};

const darkTheme = createMuiTheme({
  palette: {
    type: "dark"
  }
});

let show = false;

// Initialize Firebase instance
firebase.initializeApp(firebaseConfig);
firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL);
firebase.analytics();

const styles = {
  textAlign: "left"
};

const App = () => {
  const store = createStore();
  console.log(show);
  return (
    <Suspense fallback={<Loader />}>
      <Provider store={store}>
        <ReactReduxFirebaseProvider
          firebase={firebase}
          config={rfConfig}
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
              <UpdateComponent />

              <MainWindow />
            </div>
          </ThemeProvider>
        </ReactReduxFirebaseProvider>
      </Provider>
    </Suspense>
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
