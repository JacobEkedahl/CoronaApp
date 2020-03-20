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
  let toDate = new Date(2020, 3, 14, 23, 5, 0);
  const result = [];

  await db
    .collection("history")
    .where("country", "==", "China")
    .where("critical", "==", "")
    .get()
    .then(querySnapshot => {
      querySnapshot.forEach(documentSnapshot => {
        var data = documentSnapshot.data();
        const id = documentSnapshot.id;
        result.push({ id: id, country: data.country });
        // do something with the data of each document.
        console.log(id);
        // documentSnapshot.delete();
      });
    })
    .catch(error => {
      res.send({ error: error });
    });

  const count = result.length;
  // const newResult = result.filter(entry => entry.country === "Total");
  //res.send({ count });

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

const currHistory = [
  {
    cases: "571",
    country: "China",
    critical: "",
    deaths: "17",
    recovered: "0",
    time: "2020-01-22T12:00:00"
  },
  {
    cases: "830",
    country: "China",
    critical: "",
    deaths: "25",
    recovered: "34",
    time: "2020-01-23T12:00:00"
  },
  {
    cases: "1.287",
    country: "China",
    critical: "",
    deaths: "41",
    recovered: "38",
    time: "2020-01-24T12:00:00"
  },
  {
    cases: "1.975",
    country: "China",
    critical: "",
    deaths: "56",
    recovered: "49",
    time: "2020-01-25T12:00:00"
  },
  {
    cases: "2.744",
    country: "China",
    critical: "",
    deaths: "80",
    recovered: "51",
    time: "2020-01-26T12:00:00"
  },
  {
    cases: "4.515",
    country: "China",
    critical: "",
    deaths: "106",
    recovered: "60",
    time: "2020-01-27T12:00:00"
  },
  {
    cases: "5.974",
    country: "China",
    critical: "",
    deaths: "132",
    recovered: "103",
    time: "2020-01-28T12:00:00"
  },
  {
    cases: "7.711",
    country: "China",
    critical: "",
    deaths: "170",
    recovered: "124",
    time: "2020-01-29T12:00:00"
  },
  {
    cases: "9.692",
    country: "China",
    critical: "",
    deaths: "213",
    recovered: "171",
    time: "2020-01-30T12:00:00"
  },
  {
    cases: "11.791",
    country: "China",
    critical: "",
    deaths: "259",
    recovered: "243",
    time: "2020-01-31T12:00:00"
  },
  {
    cases: "14,380",
    country: "China",
    critical: "",
    deaths: "304",
    recovered: "328",
    time: "2020-02-01T12:00:00"
  },
  {
    cases: "17.205",
    country: "China",
    critical: "",
    deaths: "361",
    recovered: "475",
    time: "2020-02-02T12:00:00"
  },
  {
    cases: "20,440",
    country: "China",
    critical: "",
    deaths: "425",
    recovered: "632",
    time: "2020-02-03T12:00:00"
  },
  {
    cases: "24.324",
    country: "China",
    critical: "",
    deaths: "490",
    recovered: "892",
    time: "2020-02-04T12:00:00"
  },
  {
    cases: "28.018",
    country: "China",
    critical: "",
    deaths: "563",
    recovered: "1,153",
    time: "2020-02-05T12:00:00"
  },
  {
    cases: "31.161",
    country: "China",
    critical: "",
    deaths: "636",
    recovered: "1,540",
    time: "2020-02-06T12:00:00"
  },
  {
    cases: "34.546",
    country: "China",
    critical: "",
    deaths: "722",
    recovered: "2,050",
    time: "2020-02-07T12:00:00"
  },
  {
    cases: "37.198",
    country: "China",
    critical: "",
    deaths: "811",
    recovered: "2,649",
    time: "2020-02-08T12:00:00"
  },
  {
    cases: "40.171",
    country: "China",
    critical: "",
    deaths: "908",
    recovered: "3,281",
    time: "2020-02-09T12:00:00"
  },
  {
    cases: "42.638",
    country: "China",
    critical: "",
    deaths: "1.016",
    recovered: "3,996",
    time: "2020-02-10T12:00:00"
  },
  {
    cases: "44.653",
    country: "China",
    critical: "",
    deaths: "1.113",
    recovered: "4,749",
    time: "2020-02-11T12:00:00"
  },
  {
    cases: "58.761",
    country: "China",
    critical: "",
    deaths: "1.259",
    recovered: "5,911",
    time: "2020-02-12T12:00:00"
  },
  {
    cases: "63.851",
    country: "China",
    critical: "",
    deaths: "1,380",
    recovered: "6,723",
    time: "2020-02-13T12:00:00"
  },
  {
    cases: "66.492",
    country: "China",
    critical: "",
    deaths: "1,523",
    recovered: "8,096",
    time: "2020-02-14T12:00:00"
  },
  {
    cases: "68,500",
    country: "China",
    critical: "",
    deaths: "1,665",
    recovered: "9,419",
    time: "2020-02-15T12:00:00"
  },
  {
    cases: "70,548",
    country: "China",
    critical: "",
    deaths: "1,770",
    recovered: "10,844",
    time: "2020-02-16T12:00:00"
  },
  {
    cases: "72,436",
    country: "China",
    critical: "",
    deaths: "1,868",
    recovered: "12,552",
    time: "2020-02-17T12:00:00"
  },
  {
    cases: "74,185",
    country: "China",
    critical: "",
    deaths: "2,004",
    recovered: "14,376",
    time: "2020-02-18T12:00:00"
  },
  {
    cases: "74,576",
    country: "China",
    critical: "",
    deaths: "2,118",
    recovered: "16,157",
    time: "2020-02-19T12:00:00"
  },
  {
    cases: "75,465",
    country: "China",
    critical: "",
    deaths: "2,236",
    recovered: "18,308",
    time: "2020-02-20T12:00:00"
  },
  {
    cases: "76,288",
    country: "China",
    critical: "",
    deaths: "2,345",
    recovered: "20,659",
    time: "2020-02-21T12:00:00"
  },
  {
    cases: "76,936",
    country: "China",
    critical: "",
    deaths: "2,442",
    recovered: "22,401",
    time: "2020-02-22T12:00:00"
  },
  {
    cases: "77,150",
    country: "China",
    critical: "",
    deaths: "2,592",
    recovered: "24,734",
    time: "2020-02-23T12:00:00"
  },
  {
    cases: "77,658",
    country: "China",
    critical: "",
    deaths: "2,663",
    recovered: "27,230",
    time: "2020-02-24T12:00:00"
  },
  {
    cases: "78,064",
    country: "China",
    critical: "",
    deaths: "2,715",
    recovered: "29,749",
    time: "2020-02-25T12:00:00"
  },
  {
    cases: "78,497",
    country: "China",
    critical: "",
    deaths: "2,744",
    recovered: "32,495",
    time: "2020-02-26T12:00:00"
  },
  {
    cases: "78,824",
    country: "China",
    critical: "",
    deaths: "2,788",
    recovered: "36,117",
    time: "2020-02-27T12:00:00"
  },
  {
    cases: "79,251",
    country: "China",
    critical: "",
    deaths: "2,835",
    recovered: "39,002",
    time: "2020-02-28T12:00:00"
  },
  {
    cases: "79,824",
    country: "China",
    critical: "",
    deaths: "2,870",
    recovered: "41,825",
    time: "2020-02-29T12:00:00"
  },
  {
    cases: "80,026",
    country: "China",
    critical: "",
    deaths: "2,912",
    recovered: "44,498",
    time: "2020-03-01T12:00:00"
  },
  {
    cases: "80,151",
    country: "China",
    critical: "",
    deaths: "2,943",
    recovered: "47,204",
    time: "2020-03-02T12:00:00"
  },
  {
    cases: "80,270",
    country: "China",
    critical: "",
    deaths: "2,981",
    recovered: "49,866",
    time: "2020-03-03T12:00:00"
  },
  {
    cases: "80,409",
    country: "China",
    critical: "",
    deaths: "3,012",
    recovered: "52,044",
    time: "2020-03-04T12:00:00"
  },
  {
    cases: "80,522",
    country: "China",
    critical: "",
    deaths: "3,042",
    recovered: "53,726",
    time: "2020-03-05T12:00:00"
  },
  {
    cases: "80,651",
    country: "China",
    critical: "",
    deaths: "3,070",
    recovered: "55,402",
    time: "2020-03-06T12:00:00"
  },
  {
    cases: "80,695",
    country: "China",
    critical: "",
    deaths: "3,097",
    recovered: "57,065",
    time: "2020-03-07T12:00:00"
  },
  {
    cases: "80,735",
    country: "China",
    critical: "",
    deaths: "3,119",
    recovered: "58,600",
    time: "2020-03-08T12:00:00"
  },
  {
    cases: "80,754",
    country: "China",
    critical: "",
    deaths: "3,136",
    recovered: "59,897",
    time: "2020-03-09T12:00:00"
  },
  {
    cases: "80,778",
    country: "China",
    critical: "",
    deaths: "3,158",
    recovered: "61,484",
    time: "2020-03-10T12:00:00"
  },
  {
    cases: "80,793",
    country: "China",
    critical: "",
    deaths: "3,169",
    recovered: "62,793",
    time: "2020-03-11T12:00:00"
  },
  {
    cases: "80,813",
    country: "China",
    critical: "",
    deaths: "3,176",
    recovered: "64,113",
    time: "2020-03-12T12:00:00"
  },
  {
    cases: "80,824",
    country: "China",
    critical: "",
    deaths: "3,189",
    recovered: "65,547",
    time: "2020-03-13T12:00:00"
  },
  {
    cases: "80,844",
    country: "China",
    critical: "",
    deaths: "3,199",
    recovered: "66,912",
    time: "2020-03-14T12:00:00"
  },
  {
    cases: "80,860",
    country: "China",
    critical: "",
    deaths: "3,213",
    recovered: "67,754",
    time: "2020-03-15T12:00:00"
  },
  {
    cases: "80,881",
    country: "China",
    critical: "",
    deaths: "3,226",
    recovered: "68,688",
    time: "2020-03-16T12:00:00"
  }
];

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
