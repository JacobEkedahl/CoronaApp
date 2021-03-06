/* eslint-disable promise/catch-or-return */
/* eslint-disable promise/always-return */
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");
const helpers = require("./helpers");
const regionalFunctions = functions.region("europe-west2");

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});
const db = admin.firestore();

exports.updateHistory = regionalFunctions.firestore
  .document("latestValues/{country}")
  .onUpdate(async (change, context) => {
    const newValue = change.after.data();
    const historyRef = db.collection("history").doc();

    const querySnapshot = await db
      .collection("history")
      .where("country", "==", change.before.id)
      .orderBy("time", "desc")
      .limit(1)
      .get();

    let lastItem = null;
    querySnapshot.forEach((doc, i) => {
      if (doc.data() !== undefined) {
        lastItem = doc.data();
        return;
      }
    });

    if (!lastItem) {
      return "Not a new entry for this day";
    }

    const lastEntryDate = helpers.createDate(lastItem.time);
    const currentDate = helpers.createDate(admin.firestore.Timestamp.now());

    const canSave = currentDate !== lastEntryDate;

    if (canSave) {
      historyRef
        .set({
          cases: newValue.cases,
          critical: newValue.critical,
          recovered: newValue.recovered,
          deaths: newValue.deaths,
          time: admin.firestore.FieldValue.serverTimestamp(),
          country: change.before.id,
        })
        .then((_) => {
          return "Update succeeded";
        })
        .catch((error) => {
          return "Update failed" + error;
        });
    }

    return "Not a new entry for this day";
  });

exports.scrapeAndUpdateData = regionalFunctions.pubsub
  .topic("scrapeAndUpdate")
  .onPublish(async (message, context) => {
    const tableData = await helpers.fetchData();

    if (tableData.length === 0) {
      await axios.post(errorHook, {
        username: "No data fetched",
        content: `The data scraping returned an empty array`,
      });
    }

    const countriesData = await helpers.constructCountryInfo(tableData); // Get a new write batch
    var batch = db.batch();

    countriesData.forEach((info) => {
      batch.set(
        db.collection("latestValues").doc(info["country"]),
        {
          cases: info["cases"],
          critical: info["critical"],
          recovered: info["recovered"],
          deaths: info["deaths"],
        },
        { merge: true }
      );
    });

    batch
      .commit()
      .then((commitResult) => {
        console.log("update completed");
      })
      .catch((error) => {
        console.error(error);
      });

    // res.send({
    //   fullList: countriesData,
    // });
  });

exports.transformDatabase = regionalFunctions.https.onRequest(
  async (req, res) => {
    try {
      await db
        .collection("history")
        .where("country", "==", req.body.country)
        .orderBy("time")
        .get()
        .then((querySnapshot) => {
          const takenDays = {};
          querySnapshot.forEach((doc, i) => {
            const currDate = doc.data().time;
            const convertedDate = new Date(currDate.seconds * 1000);
            const uniqueDate =
              convertedDate.getFullYear() +
              "-" +
              (convertedDate.getMonth() + 1) +
              "-" +
              convertedDate.getDate();

            if (!takenDays[uniqueDate]) {
              takenDays[uniqueDate] = true;
            } else {
              console.log("delete");
              doc.ref.delete();
            }
          });
        })
        .catch((error) => {
          console.log("Error getting documents: ", error);
          res.send("Failed");
        })
        .then(() => {
          res.send("Finsihed");
        });
    } catch (err) {
      console.log("fail");
      res.send("failed");
    }
  }
);

/*
exports.printLastOne = functions.https.onRequest(async (req, res) => {
  try {
    await db
      .collection("history")
      .where("country", "==", "Sweden")
      .orderBy("time", "desc")
      .limit(1)
      .get()
      .then((querySnapshot) => {
        querySnapshot.forEach((doc, i) => {
          console.log(doc.data());
        });
      })
      .catch((error) => {
        console.log("Error getting documents: ", error);
        res.send("Failed");
      })
      .then(() => {
        res.send("Finsihed");
      });
  } catch (err) {
    console.log("fail");
    res.send("failed");
  }
});


exports.removeEntries = functions.https.onRequest(async (req, res) => {
  var from = new Date("Wed, 2 April 2020 00:25:00 UTC+2");
  var to = new Date("Sat, 2 April 2020 00:30:00 UTC+2");
  try {
    await db
      .collection("history")
      .where("country", "==", "Total")
      .where("time", ">", from)
      .where("time", "<", to)
      .orderBy("time")
      .get()
      .then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
          // doc.data() is never undefined for query doc snapshots
          doc.ref.delete();
          // console.log(doc.data());
        });
      })
      .catch((error) => {
        console.log("Error getting documents: ", error);
        res.send("Failed");
      })
      .then(() => {
        res.send("Finsihed");
      });
  } catch (err) {
    console.log("fail");
    res.send("failed");
  }
});

*/
