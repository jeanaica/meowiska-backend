const admin = require("firebase-admin");

admin.initializeApp();

module.exports = {
  ...require("./controllers/claims"),
  ...require("./controllers/profiles"),
  ...require("./controllers/pvp"),
  ...require("./controllers/slp"),
  ...require("./controllers/stats"),
  ...require("./controllers/track"),
  ...require("./controllers/users"),
};
