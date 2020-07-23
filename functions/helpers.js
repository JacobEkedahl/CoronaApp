const cheerio = require("cheerio");
const cheerioTableparser = require("cheerio-tableparser");
const siteUrl = "https://www.worldometers.info/coronavirus/#countries";
const functions = require("firebase-functions");
const axios = require("axios");
const webhookUrl = functions.config().discordmain.url;

exports.constructCountryInfo = async (tableData) => {
  const totalCountries = [];
  const totalCases = [];
  const totalDeath = [];
  const totalSerious = [];
  const totalRecoveries = [];
  const excludeCountriesNames = [];
  const forbidden = [
    "North America",
    "South America",
    "Asia",
    "Europe",
    "Africa",
    "Oceania",
    "",
  ];

  tableData.forEach((column) => {
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

  let hasHadTotal = false;
  const result = [];
  for (index = 0; index < totalCountries.length; index++) {
    if (
      forbidden.includes(totalCountries[index]) ||
      (hasHadTotal && totalCountries[index] === "Total")
    ) {
      continue;
    }

    if (totalCountries[index] === "Total") hasHadTotal = true;

    result.push({
      country: totalCountries[index],
      cases: totalCases[index],
      critical: totalSerious[index],
      recovered: totalRecoveries[index],
      deaths: totalDeath[index],
    });
  }

  if (excludeCountriesNames.length !== 0) {
    await axios.post(webhookUrl, {
      username: "New countries with corona",
      content: `These countries have not been added for translation: ${excludeCountriesNames.toString()}`,
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

exports.createDate = (adminTime) => {
  const convertedDate = new Date(adminTime.seconds * 1000);
  return (
    convertedDate.getFullYear() +
    "-" +
    (convertedDate.getMonth() + 1) +
    "-" +
    convertedDate.getDate()
  );
};

const countries = {
  //not verified
  World: "Total",
  Burundi: "Burundi",
  Botswana: "Botswana",
  Belize: "Belize",
  "Timor-Leste": "Timor-Leste",
  Turkmenistan: "Turkmenistan",
  Tajikistan: "Tajikistan",
  "Guinea-Bissau": "Guinea-Bissau",
  Gambia: "Gambia",
  Haiti: "Haiti",
  "Papua New Guinea": "Papua New Guinea",
  Zambia: "Zambia",
  "W. Sahara": "W. Sahara",
  "Solomon Is.": "Solomon Is.",
  Zimbabwe: "Zimbabwe",
  Eritrea: "Eritrea",
  Montenegro: "Montenegro",
  Madagascar: "Madagascar",
  Myanmar: "Myanmar",
  Mali: "Mali",
  Macedonia: "Macedonia",
  Malawi: "Malawi",
  Uganda: "Uganda",
  Somaliland: "Somaliland",
  Fiji: "Fiji",
  "Falkland Is.": "Falkland Is.",
  Nicaragua: "Nicaragua",
  Vanuatu: "Vanuatu",
  "New Caledonia": "New Caledonia",
  Niger: "Niger",
  Kosovo: "Kosovo",
  "N. Cyprus": "N. Cyprus",
  "Central African Rep.": "Central African Rep.",
  "Dem. Rep. Congo": "Dem. Rep. Congo",
  Swaziland: "Swaziland",
  Syria: "Syria",
  Kyrgyzstan: "Kyrgyzstan",
  "S. Sudan": "S. Sudan",
  "El Salvador": "El Salvador",
  "Dem. Rep. Korea": "Dem. Rep. Korea",
  "Sierra Leone": "Sierra Leone",
  Djibouti: "Djibouti",
  Yemen: "Yemen",
  "Lao PDR": "Lao PDR",
  Lesotho: "Lesotho",
  "Fr. S. Antarctic Lands": "Fr. S. Antarctic Lands",
  Chad: "Chad",
  Libya: "Libya",
  Angola: "Angola",
  Mozambique: "Mozambique",

  //doesnt exist
  "Turks and Caicos": "Turks and Caicos",
  Laos: "Laos",
  Mauritius: "Mauritius",
  Bermuda: "Bermuda",
  "Sint Maarten": "Sint Maarten",
  "Isle of Man": "Isle of Man",
  Grenada: "Grenada",
  Dominica: "Dominica",

  //Confirmed
  "Cabo Verde": "Cabo Verde",
  Montserrat: "Montserrat",
  Barbados: "Barbados",
  Benin: "Benin",
  Greenland: "Greenland",
  Somalia: "Somalia",
  Tanzania: "Tanzania",
  Liberia: "Liberia",
  Bahamas: "Bahamas",
  Congo: "Congo",
  CAR: "CAR",
  Guam: "Guam",
  Uzbekistan: "Uzbekistan",
  "Equatorial Guinea": "Eq. Guinea",
  Seychelles: "Seychelles",
  Mayotte: "Mayotte",
  "Total:": "Total",
  China: "China",
  Italy: "Italy",
  Iran: "Iran",
  "S. Korea": "S. Korea",
  Spain: "Spain",
  Germany: "Germany",
  France: "France",
  USA: "USA",
  Switzerland: "Switzerland",
  UK: "United Kingdom",
  Montserat: "Montserat", //doesnt exist on jvectormap
  Norway: "Norway",
  Netherlands: "Netherlands",
  Sweden: "Sweden",
  Denmark: "Denmark",
  Japan: "Japan",
  "Diamond Princess": "Diamond Princess",
  Belgium: "Belgium",
  Austria: "Austria",
  Qatar: "Qatar",
  Australia: "Australia",
  Malaysia: "Malaysia",
  Finland: "Finland",
  Singapore: "Singapore",
  Bahrain: "Bahrain",
  Canada: "Canada",
  Greece: "Greece",
  Slovenia: "Slovenia",
  Portugal: "Portugal",
  Israel: "Israel",
  Iceland: "Iceland",
  Brazil: "Brazil",
  Czechia: "Czechia",
  "Hong Kong": "Hong Kong",
  Philippines: "Philippines",
  Estonia: "Estonia",
  Kuwait: "Kuwait",
  Romania: "Romania",
  Iraq: "Iraq",
  "San Marino": "San Marino",
  Indonesia: "Indonesia",
  Lebanon: "Lebanon",
  Egypt: "Egypt",
  Poland: "Poland",
  Ireland: "Ireland",
  "Saudi Arabia": "Saudi Arabia",
  UAE: "UAE",
  India: "India",
  Thailand: "Thailand",
  Russia: "Russia",
  Taiwan: "Taiwan",
  Vietnam: "Vietnam",
  Luxembourg: "Luxembourg",
  Chile: "Chile",
  Serbia: "Serbia",
  Albania: "Albania",
  Peru: "Peru",
  "South Africa": "South Africa",
  Palestine: "Palestine",
  Algeria: "Algeria",
  Croatia: "Croatia",
  Brunei: "Brunei",
  Panama: "Panama",
  Argentina: "Argentina",
  Slovakia: "Slovakia",
  Bulgaria: "Bulgaria",
  Pakistan: "Pakistan",
  Georgia: "Georgia",
  Belarus: "Belarus",
  Latvia: "Latvia",
  Mexico: "Mexico",
  "Costa Rica": "Costa Rica",
  Hungary: "Hungary",
  Ecuador: "Ecuador",
  Colombia: "Colombia",
  Senegal: "Senegal",
  Cyprus: "Cyprus",
  Oman: "Oman",
  "Bosnia and Herzegovina": "Bosnia and Herzegovina",
  Malta: "Malta",
  Morocco: "Morocco",
  Tunisia: "Tunisia",
  Azerbaijan: "Azerbaijan",
  Armenia: "Armenia",
  "North Macedonia": "North Macedonia",
  "Dominican Republic": "Dominican Republic",
  Afghanistan: "Afghanistan",
  Macao: "Macao",
  "Sri Lanka": "Sri Lanka",
  Bolivia: "Bolivia",
  Maldives: "Maldives",
  "Faeroe Islands": "Faeroe Islands",
  Lithuania: "Lithuania",
  Jamaica: "Jamaica",
  Cambodia: "Cambodia",
  Paraguay: "Paraguay",
  "New Zealand": "New Zealand",
  "French Guiana": "French Guiana",
  Kazakhstan: "Kazakhstan",
  Martinique: "Martinique",
  Moldova: "Moldova",
  Réunion: "Réunion",
  Turkey: "Turkey",
  Cuba: "Cuba",
  Liechtenstein: "Liechtenstein",
  Uruguay: "Uruguay",
  Ukraine: "Ukraine",
  Bangladesh: "Bangladesh",
  "Channel Islands": "Channel Islands",
  "French Polynesia": "French Polynesia",
  "Puerto Rico": "Puerto Rico",
  Monaco: "Monaco",
  Nigeria: "Nigeria",
  Aruba: "Aruba",
  "Burkina Faso": "Burkina Faso",
  Cameroon: "Cameroon",
  DRC: "DRC",
  Ghana: "Ghana",
  Honduras: "Honduras",
  Namibia: "Namibia",
  "Saint Martin": "Saint Martin",
  "Trinidad and Tobago": "Trinidad and Tobago",
  Venezuela: "Venezuela",
  Guyana: "Guyana",
  Sudan: "Sudan",
  Andorra: "Andorra",
  Jordan: "Jordan",
  Nepal: "Nepal",
  "Antigua and Barbuda": "Antigua and Barbuda",
  Bhutan: "Bhutan",
  "Cayman Islands": "Cayman Islands",
  "Ivory Coast": "Ivory Coast",
  Curaçao: "Curaçao",
  Ethiopia: "Ethiopia",
  Gabon: "Gabon",
  Gibraltar: "Gibraltar",
  Guadeloupe: "Guadeloupe",
  Guatemala: "Guatemala",
  Guinea: "Guinea",
  "Vatican City": "Vatican City",
  Kenya: "Kenya",
  Mauritania: "Mauritania",
  Mongolia: "Mongolia",
  Rwanda: "Rwanda",
  "St. Barth": "St. Barth",
  "Saint Lucia": "Saint Lucia",
  "St. Vincent Grenadines": "St. Vincent Grenadines",
  Suriname: "Suriname",
  Eswatini: "Eswatini",
  Togo: "Togo",
  "U.S. Virgin Islands": "U.S. Virgin Islands",
};
