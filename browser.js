const main = async () => {
  const dateFrom = "2015";
  const dateTo = "2021-03-07";

  console.log(`Downloading BTC price from ${dateFrom} to ${dateTo}`);

  const result = await batch(100)(fetchBTCPrices)(
    getDatesRange(dateFrom, dateTo)
  );

  downloadAsJSON(result);
  return result;
};

const getDatesRange = (dateFrom, dateTo) => {
  const oneDayInMs = 24 * 60 * 60 * 1000;
  const dateFromMs = Date.parse(dateFrom);
  const dateToMs = Date.parse(dateTo);

  const numberOfDays = (dateToMs - dateFromMs) / oneDayInMs;

  return [...Array(numberOfDays)].map(
    (_, i) => new Date(i * oneDayInMs + dateFromMs)
  );
};

const fetchBTCPricesDay = async (dateObj) => {
  const date = dateObj.toISOString().slice(0, 10);
  const url = `https://bitcoincharts.com/charts/chart.json?m=bitstampUSD&SubmitButton=Draw&r=60&i=1-min&c=1&s=${date}&e=${date}&Prev=&Next=&t=S&b=&a1=&m1=10&a2=&m2=25&x=0&i1=&i2=&i3=&i4=&v=1&cv=0&ps=0&l=0&p=0&`;

  const entries = await fetch(url).then((res) => res.json());

  const normalizeResultEntry = ([
    timestamp,
    open,
    high,
    low,
    close,
    volumeBTC,
    volumeCurrency,
    weightedPriceUSD,
  ]) => ({
    timestamp,
    open,
    high,
    low,
    close,
    volumeBTC,
    volumeCurrency,
    weightedPriceUSD,
  });

  return entries.map(normalizeResultEntry);
};

const sliceArrayToChunks = (chunkSize) => (list) => {
  const numOfChunks = Math.ceil(list.length / chunkSize);

  return [...Array(numOfChunks)].map((_, i) => {
    const chunkStart = i * chunkSize;

    return list.slice(chunkStart, chunkStart + chunkSize);
  });
};

const fetchBTCPrices = async (dates) => {
  console.log(`Fetching prices for ${dates.length} different dates`);
  const resultsPerDay = await Promise.all(dates.map(fetchBTCPricesDay));

  return resultsPerDay.flat();
};

const wait = (timeMs) => new Promise((res) => setTimeout(res, timeMs));

const batch = (chunkSize, delayMs = 0) => (fn) => {
  return async (elements) => {
    const chunks = sliceArrayToChunks(chunkSize)(elements);

    let result = [];
    for (const chunk of chunks) {
      result = [...result, await fn(chunk)];
      await wait(delayMs);
    }

    return result.flat();
  };
};

const downloadAsJSON = function (data, filename = "file.json") {
  if (!data) {
    console.error("Console.save: No data");
    return;
  }

  if (typeof data === "object") {
    data = JSON.stringify(data);
  }

  const blob = new Blob([data], { type: "text/json" }),
    e = document.createEvent("MouseEvents"),
    a = document.createElement("a");

  a.download = filename;
  a.href = window.URL.createObjectURL(blob);
  a.dataset.downloadurl = ["text/json", a.download, a.href].join(":");
  e.initMouseEvent("click", true, false, window);
  a.dispatchEvent(e);
};

const result = main();
