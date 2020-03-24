const cheerio = require("cheerio");
const cheerioTableparser = require("cheerio-tableparser");
const countries = require("./countries");
const siteUrl = "https://www.worldometers.info/coronavirus/#countries";
const webhookUrl =
  "https://discordapp.com/api/webhooks/688444307598082072/5xRtv3WSub2jE7np1RMdNh18xLBUnRHHAJce1fqLLqJSy51dA5vriAmLYEkbSXDSc6wf";
const axios = require("axios");

exports.constructCountryInfo = async tableData => {
  const totalCountries = [];
  const totalCases = [];
  const totalDeath = [];
  const totalSerious = [];
  const totalRecoveries = [];
  const excludedCountries = [];
  const excludeCountriesNames = [];

  tableData.forEach(column => {
    const title = column[0];

    switch (title) {
      case "Country,Other":
        for (index = 1; index < column.length; index++) {
          const country = column[index];
          if (country in countries) {
            totalCountries.push(countries[country]);
          } else {
            totalCountries.push(country);
            excludeCountriesNames.push(country);
          }
        }
        break;

      case "TotalCases":
        for (index = 1; index < column.length; index++) {
          const cases = column[index];
          totalCases.push(cases);
        }
        break;

      case "TotalDeaths":
        for (index = 1; index < column.length; index++) {
          const deaths = column[index];
          totalDeath.push(deaths);
        }
        break;

      case "TotalRecovered":
        for (index = 1; index < column.length; index++) {
          const recovered = column[index];
          totalRecoveries.push(recovered);
        }

        break;
      case "Serious,Critical":
        for (index = 1; index < column.length; index++) {
          const serious = column[index];
          totalSerious.push(serious);
        }
    }
  });

  const result = [];
  for (index = 0; index < totalCountries.length; index++) {
    result.push({
      country: totalCountries[index],
      cases: totalCases[index],
      critical: totalSerious[index],
      recovered: totalRecoveries[index],
      deaths: totalDeath[index]
    });
  }

  if (excludeCountriesNames.length !== 0) {
    await axios.post(webhookUrl, {
      username: "New countries with corona",
      content: `These countries have not been added for translation: ${excludeCountriesNames.toString()}`
    });
  }

  return result;
};

exports.fetchData = async () => {
  const result = await axios.get(siteUrl);
  const $ = cheerio.load(result.data);
  cheerioTableparser($);
  return $("#main_table_countries_today").parsetable(true, true, true);
};
