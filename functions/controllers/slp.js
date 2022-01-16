const functions = require("firebase-functions");
const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");

const { validateFirebaseIdToken } = require("../helpers/validateToken.js");

const slpApp = express();
const db = admin.firestore();

slpApp.use(cors({ origin: true }));

slpApp.use(validateFirebaseIdToken);

slpApp.get("/", async (req, res) => {
  const snapshot = await db.collection("slp").get();

  const slps = [];

  snapshot.forEach((doc) => {
    let id = doc.id;

    let data = doc.data();

    slps.push({ id, ...data });
  });

  res.status(200).send(JSON.stringify(slps));
});

slpApp.get("/:id", async (req, res) => {
  const snapshot = await admin
    .firestore()
    .collection("slp")
    .doc(req.params.id)
    .get();

  const slpId = snapshot.id;
  const slpData = snapshot.data();

  res.status(200).send(JSON.stringify({ id: slpId, ...slpData }));
});

exports.slp = functions.region("asia-east1").https.onRequest(slpApp);
