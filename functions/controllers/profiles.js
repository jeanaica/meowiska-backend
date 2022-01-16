const functions = require("firebase-functions");
const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");

const { validateFirebaseIdToken } = require("../helpers/validateToken.js");
const { percentShare } = require("../helpers/computeShare.js");

const profileApp = express();
const db = admin.firestore();

profileApp.use(cors({ origin: true }));
profileApp.use(validateFirebaseIdToken);

profileApp.get("/", async (req, res) => {
  try {
    const snapshot = await db.collection("profiles").get();

    const profiles = [];

    snapshot.forEach((doc) => {
      let id = doc.id;

      let data = doc.data();

      profiles.push({ id, ...data });
    });

    res.status(200).send(JSON.stringify(profiles));
  } catch (error) {
    res.status(400).send(error);
  }
});

profileApp.get("/:id", async (req, res) => {
  try {
    const snapshot = await db.collection("profiles").doc(req.params.id).get();
    const userSnapshot = await db.collection("users").doc(req.params.id).get();

    const profileId = snapshot.id;
    const profileData = snapshot.data();
    const userData = userSnapshot.data();

    const computedShare = percentShare(userData.slp);

    await db
      .collection("profiles")
      .doc(req.params.id)
      .update({ percent_share: computedShare });

    res.status(200).send(
      JSON.stringify({
        id: profileId,
        ...profileData,
        percent_share: computedShare,
      })
    );
  } catch (error) {
    res.status(400).send(error);
  }
});

profileApp.put("/edit-address", async (req, res) => {
  const { uid, withdrawal_address } = req.body;

  try {
    await db.collection("profiles").doc(uid).update({ withdrawal_address });

    res.status(200).send(JSON.stringify({ id: uid, withdrawal_address }));
  } catch (error) {
    res.status(400).send(error);
  }
});

profileApp.delete("/:id", async (req, res) => {
  await db.collection("profiles").doc(req.params.id).delete();

  res.status(200).send("Success");
});

exports.profiles = functions.region("asia-east1").https.onRequest(profileApp);
