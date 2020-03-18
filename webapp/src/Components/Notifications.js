export const newCases = (country, numberOfCases) => {
  return {
    title: `New cases detected in ${country}`,
    message: `${numberOfCases} new cases of Corona has been discovered in ${country}`,
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
    title: `New deaths detected in ${country}`,
    message: `${numberOfCases} new deaths from the Corona virus in ${country}`,
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
    title: `Critical cases detected in ${country}`,
    message: `${numberOfCases} of persons with Corona virus has moved into a critical state in ${country}`,
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
    title: `Recoveries in ${country}`,
    message: `${numberOfCases} persons has recovered from the Corona virus in ${country}`,
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
