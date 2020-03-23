import React, { Suspense } from "react";
import { useDispatch, useSelector } from "react-redux";
import { selectScope } from "../actions/tableActions";
import { getChartScope } from "../reducers/tableReducer";
import "./ChartScope.css";
import Loader from "./Loader";
const Button = React.lazy(() => import("@material-ui/core/Button"));

function ChartScope() {
  const dispatch = useDispatch();
  const scope = useSelector(state => getChartScope(state));

  return (
    <div className="scopeWrapper">
      <Suspense fallback={<Loader />}>
        <Button
          disabled={scope === "1W"}
          size="small"
          onClick={() => selectScope(dispatch, "1W")}
        >
          1W
        </Button>
        <Button
          disabled={scope === "1M"}
          size="small"
          onClick={() => selectScope(dispatch, "1M")}
        >
          1M
        </Button>
        <Button
          disabled={scope === "ALL"}
          size="small"
          onClick={() => selectScope(dispatch, "ALL")}
        >
          All
        </Button>
      </Suspense>
    </div>
  );
}

export default ChartScope;
