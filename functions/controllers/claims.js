const functions = require("firebase-functions");
const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");

const { validateFirebaseIdToken } = require("../helpers/validateToken.js");
const {
  year,
  month,
  date,
  hours,
  previousDate,
  isCurrentMonth,
  isCurrentYear,
  convertTime,
  epochTime,
} = require("../helpers/date.js");
const { getGameData } = require("../api/game.js");
const { percentShare } = require("../helpers/computeShare.js");

const claimApp = express();
const db = admin.firestore();

claimApp.use(cors({ origin: true }));
claimApp.use(validateFirebaseIdToken);

claimApp.get("/", async (req, res) => {
  const snapshot = await db.collection("claims").get();

  const claims = [];

  snapshot.forEach((doc) => {
    let id = doc.id;

    let data = doc.data();

    claims.push({ id, ...data });
  });

  res.status(200).send(JSON.stringify(claims));
});

claimApp.get("/:id/:year/:month/:date", async (req, res) => {
  const snapshot = await db
    .collection("claims")
    .doc(
      `${req.params.id}/${req.params.year}/${req.params.month}/${req.params.date}`
    )
    .get();

  const claimId = snapshot.id;
  const claimData = snapshot.data();

  res.status(200).send(
    JSON.stringify({
      id: claimId,
      claim_date: `${req.params.year}/${req.params.month}/${req.params.date}`,
      ...claimData,
    })
  );
});

claimApp.put("/:id/:year/:month/:date", async (req, res) => {
  const body = req.body;

  try {
    await db
      .collection("claims")
      .doc(
        `${req.params.id}/${req.params.year}/${req.params.month}/${req.params.date}`
      )
      .update({ ...body });

    res.status(200).send(
      JSON.stringify({
        id: req.params.id,
        claim_date: `${req.params.year}/${req.params.month}/${req.params.date}`,
        ...body,
      })
    );
  } catch (error) {
    res.status(400).send(error);
  }
});

claimApp.delete("/:id", async (req, res) => {
  await db.collection("claims").doc(req.params.id).delete();

  res.status(200).send("Success");
});

const slpMap = async (address, slp) => {
  const slpRef = db.collection("slp").doc(address);

  await db.runTransaction(async (t) => {
    const slpData = await t.get(slpRef).data();
    const { yesterday_date, yesterday_slp } = slpData;

    if (date() !== yesterday_date && hours() < 8 && hours() > 19) {
      const saveMonth = isCurrentMonth ? month() : previousDate().getMonth();
      const saveYear = isCurrentYear ? year() : previousDate().getYear();
      t.update(slpRef, {
        yesterday_slp: slp,
        [`${saveYear}.${saveMonth}.${yesterday_date}`]: slp - yesterday_slp,
      });
    } else {
      t.update(slpRef, {
        yesterday_slp: slp - yesterday_slp,
      });
    }
  });
};

const claimMap = async (uid, slp, nextClaim) => {
  const profileData = await db.collection("profiles").doc(uid).get();

  const { start_date, claim_date, name, program, withdrawal_address } =
    profileData;
  const claimRef = db.collection("claims").doc(`${uid}-${start_date}`);

  let claim = {};

  await db.runTransaction(async (t) => {
    const claimDate = date() === claim_date[0] ? claim_date[0] : claim_date[1];
    const doc = await t.get(claimRef);
    const claimYear = doc.data()[`${year()}`];
    const claimMonth = claimYear[`${month()}`];
    const scholarPercent = percentShare(slp);

    if (convertTime(nextClaim).getDate() <= epochTime()) {
      if (!claimYear) {
        claim = {
          [`${year()}`]: {
            [`${month()}`]: {
              [`${claimDate}`]: {
                slp_farmed: slp,
                name,
                percent_share: scholarPercent,
                scholar_slp: scholarPercent * slp,
                manager_slp: (1 - scholarPercent) * slp,
                program,
                withdrawal_address,
              },
            },
          },
        };
      } else if (!claimMonth) {
        claim = {
          [`${year()}.${month()}`]: {
            [`${claimDate}`]: {
              slp_farmed: slp,
              name,
              percent_share: scholarPercent,
              scholar_slp: scholarPercent * slp,
              manager_slp: (1 - scholarPercent) * slp,
              program,
              withdrawal_address,
            },
          },
        };
      } else {
        claim = {
          [`${year()}.${month()}.${claimDate}`]: {
            slp_farmed: slp,
            name,
            percent_share: scholarPercent,
            scholar_slp: scholarPercent * slp,
            manager_slp: (1 - scholarPercent) * slp,
            program,
            withdrawal_address,
          },
        };
      }

      t.update(claimRef, claim);

      // TODO: Add share of manager
    }
  });
};

// Generate Claimslip
claimApp.post("/", async (req, res) => {
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
        slpMap(address, gameData[address].in_game_slp);

        claimMap(
          uid,
          gameData[address].in_game_slp,
          gameData[address].next_claim
        );
      });
    }

    res.status(201).send({
      success: true,
    });
  } catch (error) {
    res.status(400).send(error);
  }
});

exports.claims = functions.region("asia-east1").https.onRequest(claimApp);
