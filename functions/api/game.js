const axios = require("axios");

const getGameData = async (address) => {
  const response = await axios.get(
    `https://game-api.axie.technology/api/v1/${address}`
  );

  return response.data;
};

module.exports = { getGameData };
