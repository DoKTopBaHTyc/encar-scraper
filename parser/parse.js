import fs from "fs";
import fetch from "node-fetch";

const DEFAULT_API_URL =
  "https://api.encar.com/search/car/list/general?count=true&q=(And.Hidden.N._.CarType.Y.)";

function getCliOption(name, fallback) {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx !== -1 && idx + 1 < process.argv.length) return process.argv[idx + 1];
  return process.env[name.toUpperCase()] ?? fallback;
}

const PER_PAGE = Number(getCliOption("perPage", 20));
const MAX_PAGES = Number(getCliOption("maxPages", 2000));
const CONCURRENT = Number(getCliOption("concurrent", 30));
const API_URL = String(getCliOption("api", DEFAULT_API_URL));
const OUTPUT_FILE = String(
  getCliOption("out", "../frontend/public/cars.json")
);
const RETRIES = Number(getCliOption("retries", 2));

// поток для записи
const stream = fs.createWriteStream(OUTPUT_FILE, { flags: "w" });
stream.write("[\n");
let isFirst = true;

async function fetchJsonWithRetry(url, options, attempts = RETRIES) {
  for (let tryIndex = 0; tryIndex <= attempts; tryIndex++) {
    try {
      const res = await fetch(url, options);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      const last = tryIndex === attempts;
      console.warn(`⚠️ Повтор запроса (${tryIndex + 1}/${attempts + 1}): ${e.message}`);
      if (last) throw e;
      await new Promise((r) => setTimeout(r, 500 * (tryIndex + 1)));
    }
  }
}

async function fetchPage(start, end) {
  try {
    const url = `${API_URL}&sr=%7CModifiedDate%7C${start - 1}%7C${end}`;
    const data = await fetchJsonWithRetry(url, {
      headers: {
        accept: "application/json, text/javascript, */*; q=0.01",
        origin: "https://www.encar.com",
        referer: "https://www.encar.com/",
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 YaBrowser/25.8.0.0 Safari/537.36",
      },
    });

    const results = (data?.SearchResults ?? []).map((car) => ({
      brand: car.Manufacturer,
      model: car.Model,
      year: car.FormYear,
      mileage: car.Mileage,
      price: car.Price,
      image: car.Photos?.[0]?.location
        ? `https://ci.encar.com${car.Photos[0].location}`
        : "/placeholder.png",
    }));

    if (results.length) {
      console.log(`✅ Страница ${start}-${end}: найдено машин ${results.length}`);
    }
    return results;
  } catch (err) {
    console.error(`❌ Ошибка запроса страницы ${start}-${end}:`, err.message);
    return [];
  }
}

async function main() {
  console.log("🚀 Старт парсинга...");
  console.log(
    `Параметры: perPage=${PER_PAGE}, maxPages=${MAX_PAGES}, concurrent=${CONCURRENT}, retries=${RETRIES}`
  );

  let totalCars = 0;
  for (let batchStart = 0; batchStart < MAX_PAGES; batchStart += CONCURRENT) {
    const promises = [];
    for (let i = 0; i < CONCURRENT; i++) {
      const page = batchStart + i;
      const start = page * PER_PAGE + 1;
      const end = start + PER_PAGE - 1;
      promises.push(fetchPage(start, end));
    }

    const results = await Promise.all(promises);
    const flatResults = results.flat();

    if (flatResults.length === 0) {
      console.log("ℹ️ Пустая пачка страниц, останавливаемся");
      break;
    }

    flatResults.forEach((car) => {
      if (!isFirst) {
        stream.write(",\n");
      }
      isFirst = false;
      stream.write(JSON.stringify(car, null, 2));
    });

    totalCars += flatResults.length;
    console.log(
      `ℹ️ Всего машин после страниц ${batchStart + CONCURRENT}: ${totalCars}`
    );
  }

  stream.end("\n]");
  console.log(`✅ Парсинг завершён. Всего машин: ${totalCars}`);
  console.log(`✅ Данные сохранены в ${OUTPUT_FILE}`);
}

main();
