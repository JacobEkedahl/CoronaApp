import CircularProgress from "@material-ui/core/CircularProgress";
import React from "react";

const Loader = () => {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      <CircularProgress />
    </div>
  );
};

export default Loader;
