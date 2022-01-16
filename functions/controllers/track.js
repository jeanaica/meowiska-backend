const functions = require("firebase-functions");
const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");

const db = admin.firestore();

const {
  hours,
  month,
  date,
  year,
  previousDate,
} = require("../helpers/date.js");
const { getGameData } = require("../api/game.js");

const statsApp = express();

statsApp.use(cors({ origin: true }));

const pvpMap = async (address, mmr) => {
  const pvpRef = db.collection("pvp").doc(address);

  try {
    await db.runTransaction(async (t) => {
      const doc = await t.get(pvpRef);
      const pvpYear = doc.data()[`${year()}`];
      const pvpMonth = pvpYear[`${month()}`];

      if (!pvpYear) {
        t.update(pvpRef, {
          [`${year()}`]: {
            [`${month()}`]: {
              [`${date()}`]: mmr,
            },
          },
        });
      } else if (!pvpMonth) {
        t.update(pvpRef, {
          [`${year()}.${month()}`]: {
            [`${date()}`]: mmr,
          },
        });
      } else {
        t.update(pvpRef, {
          [`${year()}.${month()}.${date()}`]: mmr,
        });
      }
    });
    console.log("PVP Updated");
  } catch (e) {
    console.log("PVP Failed:", e);
  }
};

const slpMap = async (address, slp) => {
  const slpRef = db.collection("slp").doc(address);
  let dailySlp;

  try {
    await db.runTransaction(async (t) => {
      const doc = await t.get(slpRef);
      const yesterdaySlp = doc.data()["yesterday_slp"];
      const slpYear = doc.data()[`${year()}`];
      const slpMonth = slpYear[`${month()}`];
      const saveDate = hours === 7 ? previousDate().getDate() : date();

      if (yesterdaySlp) {
        dailySlp = slp - yesterdaySlp;

        if (!slpYear) {
          t.update(slpRef, {
            [`${year()}`]: {
              [`${month()}`]: {
                [`${saveDate}`]: dailySlp,
              },
            },
          });
        } else if (!slpMonth) {
          t.update(slpRef, {
            [`${year()}.${month()}`]: {
              [`${saveDate}`]: dailySlp,
            },
          });
        } else {
          t.update(slpRef, {
            [`${year()}.${month()}.${saveDate}`]: dailySlp,
          });
        }
      }

      t.update(slpRef, {
        yesterday_slp: slp,
        yesterday_date: saveDate,
      });
    });
    console.log("SLP Updated");
  } catch (e) {
    console.log("SLP Failed:", e);
  }
};

exports.track = functions
  .region("asia-east1")
  .pubsub.schedule("58 7,19 * * *")
  .timeZone("Asia/Manila")
  .onRun(async () => {
    const snapshot = await db.collection("scholars").get();

    const addresses = [];

    snapshot.forEach((doc) => {
      let id = doc.id;

      addresses.push(id);
    });

    try {
      const formatAddresses = addresses.toString().replace(" ", ",");
      const gameData = await getGameData(formatAddresses);

      if (Object.keys(gameData).length !== 0) {
        addresses.forEach((address) => {
          pvpMap(address, gameData[address].mmr);
          slpMap(address, gameData[address].in_game_slp);
        });
      }

      return functions.logger.log("Tracks updated");
    } catch (error) {
      return functions.logger.error(error);
    }
  });
