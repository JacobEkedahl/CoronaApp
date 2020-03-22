export const newCases = (country, numberOfCases) => {
  return {
    title: "New cases",
    message: `${numberOfCases} new cases in ${country}`,
    type: "info",
    insert: "top",
    container: "top-left",
    animationIn: ["animated", "fadeIn"],
    animationOut: ["animated", "fadeOut"],
    dismiss: {
      duration: 5000
    }
  };
};

export const newDeaths = (country, numberOfCases) => {
  return {
    title: `New deaths`,
    message: `${numberOfCases} people have died in ${country}`,
    type: "danger",
    insert: "top",
    container: "top-left",
    animationIn: ["animated", "fadeIn"],
    animationOut: ["animated", "fadeOut"],
    dismiss: {
      duration: 5000
    }
  };
};

export const newCritical = (country, numberOfCases) => {
  return {
    title: "New critical cases",
    message: `${numberOfCases} people have moved into a critical state in ${country}`,
    type: "warning",
    insert: "top",
    container: "top-left",
    animationIn: ["animated", "fadeIn"],
    animationOut: ["animated", "fadeOut"],
    dismiss: {
      duration: 5000
    }
  };
};

export const newRecovered = (country, numberOfCases) => {
  return {
    title: `New recoveries`,
    message: `${numberOfCases} people has recovered in ${country}`,
    type: "success",
    insert: "top",
    container: "top-left",
    animationIn: ["animated", "fadeIn"],
    animationOut: ["animated", "fadeOut"],
    dismiss: {
      duration: 5000
    }
  };
};
