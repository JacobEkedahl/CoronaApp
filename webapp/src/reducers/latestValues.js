import { cloneDeep } from "lodash";
import { LATEST_INIT, LATEST_MODIFIED } from "../actions/firestoreActions";
import { LOAD_ANIMATED } from "../actions/tableActions";

const getDifferenceTwoString = (numberA, numberB) => {
  const a = parseInt(numberA) || 0;
  const b = parseInt(numberB) || 0;
  return Math.abs(a - b);
};

const latest = (
  state = {
    toBeAnimated: [],
    data: null,
    lastUpdated: null
  },
  action
) => {
  switch (action.type) {
    case LOAD_ANIMATED:
      if (state.toBeAnimated.length === 0) {
        return {
          ...state,
          data: {
            allValues: state.data.allValues,
            newValue: null
          }
        };
      }

      const oldToBeAnimated = cloneDeep(state.toBeAnimated);
      let newLatest = cloneDeep(state.data.allValues);

      const nextToBeAnimated = oldToBeAnimated.shift();
      const nextToBeAnimatedData = nextToBeAnimated.data;
      const oldData = newLatest[nextToBeAnimated.country];
      newLatest[nextToBeAnimated.country] = { ...nextToBeAnimatedData };

      const updatedData = {
        ...(nextToBeAnimatedData.cases !== oldData.cases && {
          cases: getDifferenceTwoString(
            nextToBeAnimatedData.cases,
            oldData.cases
          )
        }),
        ...(nextToBeAnimatedData.deaths !== oldData.deaths && {
          deaths: getDifferenceTwoString(
            nextToBeAnimatedData.deaths,
            oldData.deaths
          )
        }),
        ...(nextToBeAnimatedData.critical !== oldData.critical && {
          critical: getDifferenceTwoString(
            nextToBeAnimatedData.critical,
            oldData.critical
          )
        }),
        ...(nextToBeAnimatedData.recovered !== oldData.recovered && {
          recovered: getDifferenceTwoString(
            nextToBeAnimatedData.recovered,
            oldData.recovered
          )
        })
      };

      return {
        ...state,
        lastUpdated: Date.now(),
        toBeAnimated: oldToBeAnimated,
        data: {
          allValues: newLatest,
          newValue: { country: nextToBeAnimated.country, ...updatedData }
        }
      };

    case LATEST_MODIFIED:
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

      return {
        ...state,
        data: { allValues: action.payload.data, newValue: null }
      };

    default:
      return state;
  }
};

const canUpdate = oldDate => {
  return oldDate === null || Date.now() - oldDate > 5000;
};

export default latest;

export const getLatestUpdated = state => state.latest.lastUpdated;
export const getCountriesToBeAnimated = state => state.latest.toBeAnimated;
export const getLatestValues = state => state.latest.data;
export const getSwedenLatest = state => state.latest.data?.Sweden;
