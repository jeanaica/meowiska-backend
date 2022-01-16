const percentShare = (slp) => {
  if (slp >= 2000) {
    return 0.65;
  }

  return 0.6;
};

module.exports = {
  percentShare,
};
