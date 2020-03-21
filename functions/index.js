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
const {
  _objectWithOptions
} = require("firebase-functions/lib/providers/storage");

admin.initializeApp({
  credential: admin.credential.applicationDefault()
});
const db = admin.firestore();

exports.updateHistory = functions
  .region("europe-west2")
  .firestore.document("latestValues/{country}")
  .onUpdate((change, context) => {
    const newValue = change.after.data();
    const now = new Date();
    const docId =
      change.before.id + "-" + (now.getMonth() + 1) + "-" + now.getDate();

    return db
      .collection("historyV2")
      .doc(docId)
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

exports.addHistory = functions.https.onRequest(async (req, res) => {
  var batch = db.batch();
  currHistory.forEach(entry => {
    batch.set(db.collection("history").doc(), {
      cases: entry["cases"],
      critical: entry["critical"],
      recovered: entry["recovered"],
      deaths: entry["deaths"],
      time: admin.firestore.Timestamp.fromDate(new Date(entry["time"])),
      country: entry["country"]
    });
  });

  batch
    .commit()
    .then(commitResult => {
      res.send("history adding completed");
    })
    .catch(error => {
      console.error(error);
    });
  res.send("history adding failed");
});

exports.extractHistory = functions.https.onRequest(async (req, res) => {
  var chosenCountry = req.query.country;
  var batch = db.batch();
  let result = {};

  await db
    .collection("history")
    .where("country", "==", chosenCountry)
    .get()
    .then(querySnapshot => {
      querySnapshot.forEach(documentSnapshot => {
        var data = documentSnapshot.data();
        const id = documentSnapshot.id;
        // do something with the data of each document.
        const date = data.time.toDate();
        const dateId =
          data.country + "-" + (date.getMonth() + 1) + "-" + date.getDate();

        //if (date.getDate() === 16) console.log(date);
        //result["hi"] = data;
        if (dateId in result) {
          if (result[dateId].time.valueOf() < data.time.valueOf()) {
            result[dateId] = data;
          }
        } else {
          result[dateId] = data;
        }
        // documentSnapshot.delete();
      });
    })
    .catch(error => {
      res.send({ error: error });
    });

  Object.keys(result).forEach(key => {
    console.log(key);
    batch.set(
      db.collection("historyV2").doc(key),
      {
        cases: result[key]["cases"],
        critical: result[key]["critical"],
        recovered: result[key]["recovered"],
        deaths: result[key]["deaths"],
        time: result[key].time,
        country: result[key].country
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
  res.send("Completed");
});

exports.newFunction = functions.https.onRequest(async (req, res) => {
  let fromDate = new Date(2020, 2, 14, 22, 0, 0);
  let toDate = new Date(2020, 2, 14, 15, 5, 0);
  const result = [];

  await db
    .collection("history")
    .where("country", "==", "Germany")
    .where("time", "==", "0")
    .get()
    .then(querySnapshot => {
      querySnapshot.forEach(documentSnapshot => {
        var data = documentSnapshot.data();
        const id = documentSnapshot.id;
        result.push({ id: id, country: data.country });
        // do something with the data of each document.
        console.log(id, data.time);
        // documentSnapshot.delete();
      });
    })
    .catch(error => {
      res.send({ error: error });
    });

  const count = result.length;
  // const newResult = result.filter(entry => entry.country === "Total");
  res.send({ count });
  /*
  result.forEach(toRemove => {
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
  */
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

const currHistory = [
  {
    cases: "28",
    country: "S. Korea",
    critical: "",
    deaths: "0",
    recovered: "0",
    time: "2020-02-15T12:00:00"
  },
  {
    cases: "29",
    country: "S. Korea",
    critical: "",
    deaths: "0",
    recovered: "0",
    time: "2020-02-16T12:00:00"
  },
  {
    cases: "30",
    country: "S. Korea",
    critical: "",
    deaths: "0",
    recovered: "1",
    time: "2020-02-17T12:00:00"
  },
  {
    cases: "31",
    country: "S. Korea",
    critical: "",
    deaths: "0",
    recovered: "3",
    time: "2020-02-18T12:00:00"
  },
  {
    cases: "58",
    country: "S. Korea",
    critical: "",
    deaths: "0",
    recovered: "7",
    time: "2020-02-19T12:00:00"
  },
  {
    cases: "111",
    country: "S. Korea",
    critical: "",
    deaths: "1",
    recovered: "7",
    time: "2020-02-20T12:00:00"
  },
  {
    cases: "209",
    country: "S. Korea",
    critical: "",
    deaths: "2",
    recovered: "8",
    time: "2020-02-21T12:00:00"
  },
  {
    cases: "436",
    country: "S. Korea",
    critical: "",
    deaths: "2",
    recovered: "9",
    time: "2020-02-22T12:00:00"
  },
  {
    cases: "602",
    country: "S. Korea",
    critical: "",
    deaths: "6",
    recovered: "9",
    time: "2020-02-23T12:00:00"
  },
  {
    cases: "833",
    country: "S. Korea",
    critical: "",
    deaths: "8",
    recovered: "13",
    time: "2020-02-24T12:00:00"
  },
  {
    cases: "977",
    country: "S. Korea",
    critical: "",
    deaths: "11",
    recovered: "13",
    time: "2020-02-25T12:00:00"
  },
  {
    cases: "1,261",
    country: "S. Korea",
    critical: "",
    deaths: "12",
    recovered: "15",
    time: "2020-02-26T12:00:00"
  },
  {
    cases: "1,766",
    country: "S. Korea",
    critical: "",
    deaths: "13",
    recovered: "15",
    time: "2020-02-27T12:00:00"
  },
  {
    cases: "2,337",
    country: "S. Korea",
    critical: "",
    deaths: "16",
    recovered: "15",
    time: "2020-02-28T12:00:00"
  },
  {
    cases: "3,150",
    country: "S. Korea",
    critical: "",
    deaths: "17",
    recovered: "15",
    time: "2020-02-29T12:00:00"
  },
  {
    cases: "3,736",
    country: "S. Korea",
    critical: "",
    deaths: "21",
    recovered: "21",
    time: "2020-03-01T12:00:00"
  },
  {
    cases: "4,335",
    country: "S. Korea",
    critical: "",
    deaths: "28",
    recovered: "21",
    time: "2020-03-02T12:00:00"
  },
  {
    cases: "5,186",
    country: "S. Korea",
    critical: "",
    deaths: "32",
    recovered: "25",
    time: "2020-03-03T12:00:00"
  },
  {
    cases: "5,621",
    country: "S. Korea",
    critical: "",
    deaths: "35",
    recovered: "79",
    time: "2020-03-04T12:00:00"
  },
  {
    cases: "6,284",
    country: "S. Korea",
    critical: "",
    deaths: "42",
    recovered: "126",
    time: "2020-03-05T12:00:00"
  },
  {
    cases: "6,593",
    country: "S. Korea",
    critical: "",
    deaths: "43",
    recovered: "126",
    time: "2020-03-06T12:00:00"
  },
  {
    cases: "7,041",
    country: "S. Korea",
    critical: "",
    deaths: "48",
    recovered: "109",
    time: "2020-03-07T12:00:00"
  },
  {
    cases: "7,313",
    country: "S. Korea",
    critical: "",
    deaths: "50",
    recovered: "157",
    time: "2020-03-08T12:00:00"
  },
  {
    cases: "7,478",
    country: "S. Korea",
    critical: "",
    deaths: "53",
    recovered: "238",
    time: "2020-03-09T12:00:00"
  },
  {
    cases: "7,513",
    country: "S. Korea",
    critical: "",
    deaths: "60",
    recovered: "279",
    time: "2020-03-10T12:00:00"
  },
  {
    cases: "7,755",
    country: "S. Korea",
    critical: "",
    deaths: "60",
    recovered: "324",
    time: "2020-03-11T12:00:00"
  },
  {
    cases: "7,869",
    country: "S. Korea",
    critical: "",
    deaths: "66",
    recovered: "501",
    time: "2020-03-12T12:00:00"
  },
  {
    cases: "7,979",
    country: "S. Korea",
    critical: "",
    deaths: "67",
    recovered: "705",
    time: "2020-03-13T12:00:00"
  },
  {
    cases: "8,086",
    country: "S. Korea",
    critical: "",
    deaths: "72",
    recovered: "825",
    time: "2020-03-14T12:00:00"
  }
];
