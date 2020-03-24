import { cloneDeep } from "lodash";
import { LATEST_INIT, LATEST_MODIFIED } from "../actions/firestoreActions";
import {
  DONT_SHOW_NOTIFICATIONS,
  LOAD_ANIMATED
} from "../actions/tableActions";

const getDifferenceTwoString = (numberA, numberB) => {
  const a = parseInt(numberA.replace(/[ ,.]/g, "")) || 0;
  const b = parseInt(numberB.replace(/[ ,.]/g, "")) || 0;
  return Math.abs(a - b);
};

const latest = (
  state = {
    toBeAnimated: [],
    data: null,
    lastUpdated: null,
    hasLoaded: false,
    canShowNotification: true,
    total: null
  },
  action
) => {
  switch (action.type) {
    case DONT_SHOW_NOTIFICATIONS:
      return {
        ...state,
        canShowNotification: false
      };
    case LOAD_ANIMATED:
      if (state.toBeAnimated.length === 0) {
        return {
          ...state,
          data: {
            allValues: state.data.allValues,
            newValue: null
          },
          canShowNotification: false
        };
      }

      const oldToBeAnimated = cloneDeep(state.toBeAnimated);
      let newLatest = cloneDeep(state.data.allValues);

      const nextToBeAnimated = oldToBeAnimated.shift();
      const nextToBeAnimatedData = nextToBeAnimated.data;
      const oldData = newLatest[nextToBeAnimated.country];
      newLatest[nextToBeAnimated.country] = { ...nextToBeAnimatedData };

      const diffCases = getDifferenceTwoString(
        nextToBeAnimatedData.cases,
        oldData.cases
      );
      const diffDeaths = getDifferenceTwoString(
        nextToBeAnimatedData.deaths,
        oldData.deaths
      );
      const diffCritical = getDifferenceTwoString(
        nextToBeAnimatedData.critical,
        oldData.critical
      );
      const diffRecovered = getDifferenceTwoString(
        nextToBeAnimatedData.recovered,
        oldData.recovered
      );

      const updatedData = {
        ...(diffCases !== 0 && {
          cases: diffCases
        }),
        ...(diffDeaths !== 0 && {
          deaths: diffDeaths
        }),
        ...(diffCritical !== 0 && {
          critical: diffCritical
        }),
        ...(diffRecovered !== 0 && {
          recovered: diffRecovered
        })
      };

      return {
        ...state,
        lastUpdated: Date.now(),
        toBeAnimated: oldToBeAnimated,
        data: {
          allValues: newLatest,
          newValue: { country: nextToBeAnimated.country, ...updatedData }
        },
        canShowNotification: true
      };

    case LATEST_MODIFIED:
      if (action.meta.doc === "Total") {
        return {
          ...state,
          total: { ...action.payload.data }
        };
      }
      return {
        ...state,
        lastUpdated: canUpdate(state.lastUpdated)
          ? Date.now()
          : state.lastUpdated,
        toBeAnimated: [
          ...state.toBeAnimated,
          {
            country: action.meta.doc,
            data: {
              ...action.payload.data
            }
          }
        ]
      };
    case LATEST_INIT:
      const collection = action.meta.collection;
      if (collection !== "latestValues") {
        return state;
      }

      const total = action.payload.data["Total"];
      let incomingPayload = cloneDeep(action.payload.data);
      delete incomingPayload.Total;
      return {
        ...state,
        data: { allValues: incomingPayload, newValue: null },
        hasLoaded: true,
        total: total
      };

    default:
      return state;
  }
};

const canUpdate = oldDate => {
  return oldDate === null || Date.now() - oldDate > 5000;
};

export default latest;

export const getCanShowNotification = state => state.latest.canShowNotification;
export const getHasLoaded = state => state.latest.hasLoaded;
export const getLatestUpdated = state => state.latest.lastUpdated;
export const getCountriesToBeAnimated = state => state.latest.toBeAnimated;
export const getLatestValues = state => state.latest.data;
export const getAllValues = state => state.latest.data?.allValues;
export const getNewValue = state => state.latest.data?.newValue;
export const getTransformedValues = state => {
  const data = getAllValues(state);
  const countriesWithInfo = Object.keys(data).map(key => {
    const cases = data[key].cases || "0";
    const deaths = data[key].deaths || "0";
    const critical = data[key].critical || "0";
    const recovered = data[key].recovered || "0";

    return {
      country: key,
      cases: cases,
      deaths: deaths,
      critical: critical,
      recovered: recovered
    };
  });

  countriesWithInfo.sort(function(a, b) {
    const numberB = b.cases.replace(/[ ,.]/g, "");
    const numberA = a.cases.replace(/[ ,.]/g, "");
    return numberB - numberA;
  });

  return countriesWithInfo;
};

//history
export const getSelectedHistory = state => {
  const tempHistory = state.firestore.ordered?.selectedHistory;
  if (!tempHistory) return [];
  const sorted = tempHistory.slice().sort((a, b) => {
    return new Date(a.time.seconds) - new Date(b.time.seconds);
  });
  return sorted.map(entry => ({
    cases: convertToInt(entry.cases),
    ...(convertToInt(entry.deaths) !== 0 && {
      deaths: convertToInt(entry.deaths)
    }),
    ...(convertToInt(entry.critical) !== 0 && {
      critical: convertToInt(entry.critical)
    }),
    ...(convertToInt(entry.recovered) !== 0 && {
      recovered: convertToInt(entry.recovered)
    }),
    date: entry.time.seconds
  }));
};

const convertToInt = entry => {
  if (!entry) {
    return 0;
  }
  return parseInt(entry.replace(/[ ,.]/g, ""));
};
