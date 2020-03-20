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
    cases: "580",
    country: "Total",
    critical: "0",
    deaths: "17",
    recovered: "0",
    time: "2020-01-22T12:00:00"
  },
  {
    cases: "845",
    country: "Total",
    critical: "0",
    deaths: "25",
    recovered: "0",
    time: "2020-01-23T12:00:00"
  },
  {
    cases: "1,317",
    country: "Total",
    critical: "0",
    deaths: "41",
    recovered: "0",
    time: "2020-01-24T12:00:00"
  },
  {
    cases: "2,015",
    country: "Total",
    critical: "0",
    deaths: "56",
    recovered: "0",
    time: "2020-01-25T12:00:00"
  },
  {
    cases: "2,800",
    country: "Total",
    critical: "0",
    deaths: "80",
    recovered: "0",
    time: "2020-01-26T12:00:00"
  },
  {
    cases: "4,581",
    country: "Total",
    critical: "0",
    deaths: "106",
    recovered: "0",
    time: "2020-01-27T12:00:00"
  },
  {
    cases: "6,058",
    country: "Total",
    critical: "0",
    deaths: "132",
    recovered: "0",
    time: "2020-01-28T12:00:00"
  },
  {
    cases: "7,813",
    country: "Total",
    critical: "0",
    deaths: "170",
    recovered: "0",
    time: "2020-01-29T12:00:00"
  },
  {
    cases: "9,823",
    country: "Total",
    critical: "0",
    deaths: "213",
    recovered: "0",
    time: "2020-01-30T12:00:00"
  },
  {
    cases: "11,950",
    country: "Total",
    critical: "0",
    deaths: "259",
    recovered: "0",
    time: "2020-01-31T12:00:00"
  },
  {
    cases: "14,553",
    country: "Total",
    critical: "0",
    deaths: "304",
    recovered: "0",
    time: "2020-02-01T12:00:00"
  },
  {
    cases: "17,391",
    country: "Total",
    critical: "2,298",
    deaths: "362",
    recovered: "504",
    time: "2020-02-02T12:00:00"
  },
  {
    cases: "20,630",
    country: "Total",
    critical: "2,790",
    deaths: "426",
    recovered: "643",
    time: "2020-02-03T12:00:00"
  },
  {
    cases: "24,545",
    country: "Total",
    critical: "3,223",
    deaths: "492",
    recovered: "907",
    time: "2020-02-04T12:00:00"
  },
  {
    cases: "28,266",
    country: "Total",
    critical: "3,863",
    deaths: "565",
    recovered: "1,173",
    time: "2020-02-05T12:00:00"
  },
  {
    cases: "31,429",
    country: "Total",
    critical: "4,825",
    deaths: "638",
    recovered: "1,562",
    time: "2020-02-06T12:00:00"
  },
  {
    cases: "34,876",
    country: "Total",
    critical: "6,106",
    deaths: "724",
    recovered: "2,083",
    time: "2020-02-07T12:00:00"
  },
  {
    cases: "37,552",
    country: "Total",
    critical: "6,196",
    deaths: "813",
    recovered: "2,684",
    time: "2020-02-08T12:00:00"
  },
  {
    cases: "40,553",
    country: "Total",
    critical: "6,494",
    deaths: "910",
    recovered: "3,323",
    time: "2020-02-09T12:00:00"
  },
  {
    cases: "43,099",
    country: "Total",
    critical: "7,344",
    deaths: "1,018",
    recovered: "4,043",
    time: "2020-02-10T12:00:00"
  },
  {
    cases: "45,134",
    country: "Total",
    critical: "8,216",
    deaths: "1,115",
    recovered: "4,803",
    time: "2020-02-11T12:00:00"
  },
  {
    cases: "59,287",
    country: "Total",
    critical: "8,049",
    deaths: "1,261",
    recovered: "5,987",
    time: "2020-02-12T12:00:00"
  },
  {
    cases: "64,438",
    country: "Total",
    critical: "10,228",
    deaths: "1,383",
    recovered: "6,808",
    time: "2020-02-13T12:00:00"
  },
  {
    cases: "67,100",
    country: "Total",
    critical: "11,082",
    deaths: "1,526",
    recovered: "8,196",
    time: "2020-02-14T12:00:00"
  },
  {
    cases: "69,197",
    country: "Total",
    critical: "11,299",
    deaths: "1,669",
    recovered: "9,538",
    time: "2020-02-15T12:00:00"
  },
  {
    cases: "71,329",
    country: "Total",
    critical: "10,670",
    deaths: "1,775",
    recovered: "10,973",
    time: "2020-02-16T12:00:00"
  },
  {
    cases: "73,332",
    country: "Total",
    critical: "11,795",
    deaths: "1,873",
    recovered: "12,712",
    time: "2020-02-17T12:00:00"
  },
  {
    cases: "75,184",
    country: "Total",
    critical: "12,057",
    deaths: "2,009",
    recovered: "14,553",
    time: "2020-02-18T12:00:00"
  },
  {
    cases: "75,700",
    country: "Total",
    critical: "11,911",
    deaths: "2,126",
    recovered: "16,357",
    time: "2020-02-19T12:00:00"
  },
  {
    cases: "76,677",
    country: "Total",
    critical: "11,681",
    deaths: "2,247",
    recovered: "18,524",
    time: "2020-02-20T12:00:00"
  },
  {
    cases: "77,673",
    country: "Total",
    critical: "11,531",
    deaths: "2,360",
    recovered: "20,895",
    time: "2020-02-21T12:00:00"
  },
  {
    cases: "78,651",
    country: "Total",
    critical: "11,553",
    deaths: "2,460",
    recovered: "22,650",
    time: "2020-02-22T12:00:00"
  },
  {
    cases: "79,205",
    country: "Total",
    critical: "10,007",
    deaths: "2,618",
    recovered: "24,991",
    time: "2020-02-23T12:00:00"
  },
  {
    cases: "80,087",
    country: "Total",
    critical: "9,216",
    deaths: "2,699",
    recovered: "27,466",
    time: "2020-02-24T12:00:00"
  },
  {
    cases: "80,828",
    country: "Total",
    critical: "8,839",
    deaths: "2,763",
    recovered: "30,051",
    time: "2020-02-25T12:00:00"
  },
  {
    cases: "81,820",
    country: "Total",
    critical: "8,469",
    deaths: "2,800",
    recovered: "32,805",
    time: "2020-02-26T12:00:00"
  },
  {
    cases: "83,112",
    country: "Total",
    critical: "8,100",
    deaths: "2,858",
    recovered: "36,520",
    time: "2020-02-27T12:00:00"
  },
  {
    cases: "84,615",
    country: "Total",
    critical: "7,816",
    deaths: "2,923",
    recovered: "39,430",
    time: "2020-02-28T12:00:00"
  },
  {
    cases: "86,604",
    country: "Total",
    critical: "7,570",
    deaths: "2,977",
    recovered: "42,330",
    time: "2020-02-29T12:00:00"
  },
  {
    cases: "88,585",
    country: "Total",
    critical: "7,375",
    deaths: "3,050",
    recovered: "45,122",
    time: "2020-03-01T12:00:00"
  },
  {
    cases: "90,443",
    country: "Total",
    critical: "7,094",
    deaths: "3,117",
    recovered: "48,108",
    time: "2020-03-02T12:00:00"
  },
  {
    cases: "93,016",
    country: "Total",
    critical: "6,771",
    deaths: "3,202",
    recovered: "50,944",
    time: "2020-03-03T12:00:00"
  },
  {
    cases: "95,314",
    country: "Total",
    critical: "6,420",
    deaths: "3,285",
    recovered: "53,524",
    time: "2020-03-04T12:00:00"
  },
  {
    cases: "98,425",
    country: "Total",
    critical: "6,272",
    deaths: "3,387",
    recovered: "55,605",
    time: "2020-03-05T12:00:00"
  },
  {
    cases: "102,050",
    country: "Total",
    critical: "6,401",
    deaths: "3,494",
    recovered: "57,609",
    time: "2020-03-06T12:00:00"
  },
  {
    cases: "106,099",
    country: "Total",
    critical: "6,035",
    deaths: "3,599",
    recovered: "60,172",
    time: "2020-03-07T12:00:00"
  },
  {
    cases: "109,991",
    country: "Total",
    critical: "5,977",
    deaths: "3,827",
    recovered: "62,278",
    time: "2020-03-08T12:00:00"
  },
  {
    cases: "114,381",
    country: "Total",
    critical: "5,772",
    deaths: "4,025",
    recovered: "64,056",
    time: "2020-03-09T12:00:00"
  },
  {
    cases: "118,948",
    country: "Total",
    critical: "5,748",
    deaths: "4,296",
    recovered: "66,621",
    time: "2020-03-10T12:00:00"
  },
  {
    cases: "126,214",
    country: "Total",
    critical: "5,707",
    deaths: "4,628",
    recovered: "68,307",
    time: "2020-03-11T12:00:00"
  },
  {
    cases: "134,576",
    country: "Total",
    critical: "5,958",
    deaths: "4,981",
    recovered: "70,383",
    time: "2020-03-12T12:00:00"
  },
  {
    cases: "145,483",
    country: "Total",
    critical: "6,082",
    deaths: "5,429",
    recovered: "72,607",
    time: "2020-03-13T12:00:00"
  },
  {
    cases: "156,653",
    country: "Total",
    critical: "5,652",
    deaths: "5,833",
    recovered: "75,932",
    time: "2020-03-14T12:00:00"
  }
];
