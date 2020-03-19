/* eslint-disable promise/catch-or-return */
/* eslint-disable promise/always-return */
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const siteUrl = "https://www.worldometers.info/coronavirus/#countries";
const webhookUrl =
  "https://discordapp.com/api/webhooks/688444307598082072/5xRtv3WSub2jE7np1RMdNh18xLBUnRHHAJce1fqLLqJSy51dA5vriAmLYEkbSXDSc6wf";
const errorHook =
  "https://discordapp.com/api/webhooks/688523920500064329/YtmNszuWwKwGREYKmQZfPVebJaeGbPs_6AiNrC-0n1nS3JenqoNy2g2KxSg8rWNog5ew";
const axios = require("axios");
const cheerio = require("cheerio");
const cheerioTableparser = require("cheerio-tableparser");

admin.initializeApp({
  credential: admin.credential.applicationDefault()
});
const db = admin.firestore();

exports.updateHistory = functions
  .region("europe-west2")
  .firestore.document("latestValues/{country}")
  .onUpdate((change, context) => {
    const newValue = change.after.data();

    return db
      .collection("history")
      .doc()
      .set({
        cases: newValue.cases,
        critical: newValue.critical,
        recovered: newValue.recovered,
        deaths: newValue.deaths,
        time: admin.firestore.FieldValue.serverTimestamp(),
        country: change.before.id
      })
      .then(_ => {
        return "Update succeeded";
      })
      .catch(error => {
        return "Update failed" + error;
      });
  });

exports.newFunction = functions.https.onRequest(async (req, res) => {
  let fromDate = new Date(2020, 2, 14, 22, 0, 0);
  let toDate = new Date(2020, 2, 15, 23, 5, 0);
  const result = [];

  await db
    .collection("history")
    .where("time", ">", fromDate)
    .where("time", "<", toDate)
    .get()
    .then(querySnapshot => {
      querySnapshot.forEach(documentSnapshot => {
        var data = documentSnapshot.data();
        const id = documentSnapshot.id;
        result.push({ id: documentSnapshot.id, country: data.country });
        // do something with the data of each document.
        console.log(data);
        // documentSnapshot.delete();
      });
    })
    .catch(error => {
      res.send({ error: error });
    });

  const count = result.length;
  const newResult = result.filter(entry => entry.country === "Total");
  //res.send({ count });

  newResult.forEach(toRemove => {
    db.collection("history")
      .doc(toRemove.id)
      .delete()
      .then(() => {
        console.log("Document successfully deleted!");
      })
      .catch(error => {
        console.error("Error removing document: ", error);
      });
  });

  res.send({ docDeleted: count });
});

//exports.scrapeAndUpdateData = functions.https.onRequest(async (req, res) => {
exports.scrapeAndUpdateData = async (pubSubEvent, context) => {
  const tableData = await fetchData();

  if (tableData.length === 0) {
    await axios.post(errorHook, {
      username: "No data fetched",
      content: `The data scraping returned an empty array`
    });
  }

  const countriesData = await constructCountryInfo(tableData); // Get a new write batch
  var batch = db.batch();

  countriesData.forEach(info => {
    batch.set(
      db.collection("latestValues").doc(info["country"]),
      {
        cases: info["cases"],
        critical: info["critical"],
        recovered: info["recovered"],
        deaths: info["deaths"]
      },
      { merge: true }
    );
  });

  batch
    .commit()
    .then(commitResult => {
      console.log("update completed");
    })
    .catch(error => {
      console.error(error);
    });

  /*res.send({
    fullList: countriesData
  });*/
};

const constructCountryInfo = async tableData => {
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

const fetchData = async () => {
  const result = await axios.get(siteUrl);
  const $ = cheerio.load(result.data);
  cheerioTableparser($);
  return $("#main_table_countries_today").parsetable(true, true, true);
};

const countries = {
  //not verified
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
  Mauritius: "Mauritius",
  Bermuda: "Bermuda",
  "Sint Maarten": "Sint Maarten",

  //Confirmed
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
  "U.S. Virgin Islands": "U.S. Virgin Islands"
};
