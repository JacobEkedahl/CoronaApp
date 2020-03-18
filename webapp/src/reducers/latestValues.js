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
export const getSwedenLatest = state => state.latest.data?.Sweden;
