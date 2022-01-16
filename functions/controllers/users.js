const functions = require("firebase-functions");
const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");

const { validateFirebaseIdToken } = require("../helpers/validateToken.js");
const { year, month } = require("../helpers/date.js");

const userApp = express();
const db = admin.firestore();

userApp.use(cors({ origin: true }));
userApp.use(validateFirebaseIdToken);

userApp.get("/", async (req, res) => {
  const snapshot = await db.collection("users").get();

  const users = [];

  snapshot.forEach((doc) => {
    let id = doc.id;

    let data = doc.data();

    users.push({ id, ...data });
  });

  res.status(200).send(JSON.stringify(users));
});

userApp.get("/:id", async (req, res) => {
  const snapshot = await db.collection("users").doc(req.params.id).get();

  const userId = snapshot.id;
  const userData = snapshot.data();

  res.status(200).send(JSON.stringify({ id: userId, ...userData }));
});

userApp.post("/register", async (req, res) => {
  const {
    email,
    password,
    first_name,
    last_name,
    address,
    display_name,
    account_handle,
    program,
    start_date,
  } = req.body;

  try {
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: display_name,
    });

    const uid = userRecord.uid;

    const programsSnapshot = await db.collection("programs").get();
    let claim_date;

    programsSnapshot.forEach((doc) => {
      let data = doc.data();

      functions.logger.log("DATA PROGRAM", data, data.claim_date);

      functions.logger.log("PROGRAM", program, doc.id);

      if (program[0] === doc.id) {
        claim_date = data.claim_date;
      }
      functions.logger.log("CLAIM", claim_date);
    });

    await db.collection("users").doc(uid).set({
      address: address,
      mmr: 0,
      rank: 0,
      slp: 0,
    });

    await db.collection("scholars").doc(address).set({
      uid,
    });

    await db.collection("profiles").doc(uid).set({
      claim_date,
      daily_slp_average: 0,
      first_name: first_name,
      last_name: last_name,
      display_name: display_name,
      account_handle: account_handle,
      percent_share: 0.6,
      program: program,
      start_date: start_date,
      withdrawal_address: "",
    });

    await db
      .collection("slp")
      .doc(`${address}`)
      .set({
        [`${year()}`]: {
          [`${month()}`]: {},
        },
      });

    await db
      .collection("pvp")
      .doc(`${address}`)
      .set({
        [`${year()}`]: {
          [`${month()}`]: {},
        },
      });

    await db
      .collection("claims")
      .doc(`${uid}-${start_date}`)
      .set({
        [`${year()}`]: {},
      });

    res.status(200).send(JSON.stringify({ id: uid }));
  } catch (error) {
    functions.logger.log(error);
    res.status(400).send(error);
  }
});

userApp.put("/:id", async (req, res) => {
  const body = req.body;

  try {
    await db
      .collection("users")
      .doc(req.params.id)
      .update({ ...body });

    res.status(200).send(JSON.stringify({ id: req.params.id, ...body }));
  } catch (error) {
    res.status(400).send(error);
  }
});

userApp.delete("/:id", async (req, res) => {
  await db.collection("users").doc(req.params.id).delete();

  res.status(200).send("Success");
});

exports.user = functions.region("asia-east1").https.onRequest(userApp);
