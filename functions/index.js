/* eslint-disable promise/catch-or-return */
/* eslint-disable promise/always-return */
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const errorHook =
  "https://discordapp.com/api/webhooks/688523920500064329/YtmNszuWwKwGREYKmQZfPVebJaeGbPs_6AiNrC-0n1nS3JenqoNy2g2KxSg8rWNog5ew";
const axios = require("axios");
const helpers = require("./helpers");

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

//exports.scrapeAndUpdateData = functions.https.onRequest(async (req, res) => {
exports.scrapeAndUpdateData = functions
  .region("europe-west2")
  .pubsub.topic("scrapeAndUpdate")
  .onPublish(async (message, context) => {
    const tableData = await helpers.fetchData();

    if (tableData.length === 0) {
      await axios.post(errorHook, {
        username: "No data fetched",
        content: `The data scraping returned an empty array`
      });
    }

    const countriesData = await helpers.constructCountryInfo(tableData); // Get a new write batch
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

    // res.send({
    //   fullList: countriesData
    // });
  });
