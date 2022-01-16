const monthString = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const phDate = () => {
  return new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" });
};

const year = () => {
  const currentYear = new Date(phDate()).getFullYear();

  return currentYear;
};

const month = () => {
  const currentMonth = new Date(phDate()).getMonth();

  return monthString[currentMonth];
};

const date = () => {
  const currentDate = new Date(phDate()).getDate();

  return currentDate;
};

const previousDate = () => {
  const d = new Date(phDate());
  d.setDate(d.getDate() - 1);

  return d;
};

const hours = () => {
  const currentDate = new Date(phDate()).getHours();

  return currentDate;
};

const isCurrentMonth = () => {
  const yestermonth = previousDate().getMonth();

  return monthString[yestermonth] === month();
};

const isCurrentYear = () => {
  const yesteryear = previousDate().getFullYear();

  return yesteryear === year();
};

const convertTime = (seconds) => {
  const d = new Date(0);
  d.setUTCSeconds(seconds);

  return d;
};

const epochTime = () => {
  return new Date().valueof();
};

module.exports = {
  phDate,
  hours,
  month,
  date,
  year,
  previousDate,
  isCurrentMonth,
  isCurrentYear,
  convertTime,
  epochTime,
  monthString,
};
