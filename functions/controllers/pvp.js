const functions = require("firebase-functions");
const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");

const { validateFirebaseIdToken } = require("../helpers/validateToken.js");

const pvpApp = express();
const db = admin.firestore();

pvpApp.use(cors({ origin: true }));

pvpApp.use(validateFirebaseIdToken);

pvpApp.get("/", async (req, res) => {
  const snapshot = await db.collection("pvp").get();

  const pvp = [];

  snapshot.forEach((doc) => {
    let id = doc.id;

    let data = doc.data();

    pvp.push({ id, ...data });
  });

  res.status(200).send(JSON.stringify(pvp));
});

pvpApp.get("/:id", async (req, res) => {
  const snapshot = await admin
    .firestore()
    .collection("pvp")
    .doc(req.params.id)
    .get();

  const pvpId = snapshot.id;
  const pvpData = snapshot.data();

  res.status(200).send(JSON.stringify({ id: pvpId, ...pvpData }));
});

exports.pvp = functions.region("asia-east1").https.onRequest(pvpApp);
