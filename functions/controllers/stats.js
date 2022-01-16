const functions = require("firebase-functions");
const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");

const db = admin.firestore();

const { getGameData } = require("../api/game.js");

const statsApp = express();

statsApp.use(cors({ origin: true }));

const scholarMap = async (uid, mmr, slp, rank) => {
  await db.collection("users").doc(uid).update({
    slp: slp,
    mmr: mmr,
    rank: rank,
  });
};

exports.stats = functions
  .region("asia-east1")
  .pubsub.schedule("58 7,19 * * *")
  .timeZone("Asia/Manila")
  .onRun(async () => {
    const snapshot = await db.collection("scholars").get();

    const scholars = [];
    const addresses = [];

    snapshot.forEach((doc) => {
      let id = doc.id;
      let data = doc.data();

      scholars.push({ address: id, uid: data.uid });
      addresses.push(id);
    });

    try {
      const formatAddresses = addresses.toString().replace(" ", ",");
      const gameData = await getGameData(formatAddresses);

      if (Object.keys(gameData).length !== 0) {
        scholars.forEach(({ address, uid }) => {
          scholarMap(
            uid,
            gameData[address].mmr,
            gameData[address].in_game_slp,
            gameData[address].rank
          );
        });
      }

      return functions.logger.log("Stats updated");
    } catch (error) {
      return functions.logger.error(error);
    }
  });
