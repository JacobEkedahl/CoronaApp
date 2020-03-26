import { createMuiTheme } from "@material-ui/core/styles";
import "animate.css/animate.css";
import React, { Suspense, useEffect, useState } from "react";
import { render } from "react-dom";
import Helmet from "react-helmet";
import "react-notifications-component/dist/theme.css";
import { Provider } from "react-redux";
import { ReactReduxFirebaseProvider } from "react-redux-firebase";
import {
  FirebaseAppProvider,
  preloadAuth,
  preloadFirestore,
  useAnalytics,
  useAuth,
  useFirebaseApp,
  usePerformance
} from "reactfire";
import { createFirestoreInstance } from "redux-firestore";
import Loader from "./Components/Loader";
import createStore from "./createStore";
import registerServiceWorker from "./registerServiceWorker";

const MainWindow = React.lazy(() => import("./Components/MainWindow.js"));
const ReactNotification = React.lazy(() =>
  import("react-notifications-component")
);
const CssBaseline = React.lazy(() =>
  import("@material-ui/core").then(module => ({ default: module.CssBaseline }))
);

const ThemeProvider = React.lazy(() =>
  import("@material-ui/core").then(module => ({
    default: module.ThemeProvider
  }))
);

const UpdateComponent = React.lazy(() =>
  import("./Components/UpdateComponent")
);

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

// Initialize Firebase instance
//firebase.initializeApp(firebaseConfig);
//firebase.firestore();
//firebase.analytics();

const styles = {
  textAlign: "left"
};

const App = () => {
  const store = createStore();
  useAnalytics();
  usePerformance();
  preloadFirestore();
  preloadAuth();
  return (
    <Provider store={store}>
      <ReactReduxFirebaseProvider
        firebase={useFirebaseApp()}
        config={rfConfig}
        dispatch={store.dispatch}
        createFirestoreInstance={createFirestoreInstance}
      >
        <Suspense fallback={<div>hi</div>}>
          <ReactNotification
            types={[
              {
                htmlClasses: ["notification-awesome"],
                name: "awesome"
              }
            ]}
            isMobile={true}
          />
        </Suspense>
        <ThemeProvider theme={darkTheme}>
          <Suspense fallback={<></>}>
            <CssBaseline />
          </Suspense>
          <div style={{ styles }}>
            <UpdateComponent />
            <Suspense fallback={<div>loading..</div>}>
              <AuthMiddleware>
                <Suspense fallback={<Loader />}>
                  <MainWindow />
                </Suspense>
              </AuthMiddleware>
            </Suspense>
          </div>
        </ThemeProvider>
      </ReactReduxFirebaseProvider>
    </Provider>
  );
};

const AuthMiddleware = ({ children }) => {
  const [isLoggedIn, setLoggedIn] = useState(false);
  const auth = useAuth();

  useEffect(() => {
    auth.signInAnonymously().then(() => setLoggedIn(true));
  }, [auth]);

  return isLoggedIn ? children : null;
};

render(
  <Suspense fallback={<></>}>
    <FirebaseAppProvider firebaseConfig={firebaseConfig}>
      <Helmet>
        <title>Corona is here</title>
        <meta
          name="description"
          content="Corona updates in realtime. Displaying the number of new cases, deaths, recoveries and critical cases for all countries."
        />
        <link rel="canonical" href="https://coronaishere.com/" />
      </Helmet>
      <App />
    </FirebaseAppProvider>
  </Suspense>,
  document.getElementById("root")
);

registerServiceWorker();
