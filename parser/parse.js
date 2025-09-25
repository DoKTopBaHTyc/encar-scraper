import fs from "fs";
import fetch from "node-fetch";

const API_URL =
  "https://api.encar.com/search/car/list/general?count=true&q=(And.Hidden.N._.CarType.Y.)";
const PER_PAGE = 20; // сколько машин на странице
const MAX_PAGES = 2000; // максимум страниц
const CONCURRENT = 30; // параллельные запросы
const OUTPUT_FILE = "../frontend/public/cars.json";

// поток для записи
const stream = fs.createWriteStream(OUTPUT_FILE, { flags: "w" });
stream.write("[\n");
let isFirst = true;

async function fetchPage(start, end) {
  try {
    const res = await fetch(
      `${API_URL}&sr=%7CModifiedDate%7C${start - 1}%7C${end}`,
      {
        headers: {
          accept: "application/json, text/javascript, */*; q=0.01",
          origin: "https://www.encar.com",
          referer: "https://www.encar.com/",
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 YaBrowser/25.8.0.0 Safari/537.36",
        },
      }
    );

    if (!res.ok) {
      console.error(`❌ Ошибка HTTP: ${res.status} (страницы ${start}-${end})`);
      return [];
    }

    const data = await res.json();
    const results = (data.SearchResults || []).map((car) => ({
      brand: car.Manufacturer,
      model: car.Model,
      year: car.FormYear,
      mileage: car.Mileage,
      price: car.Price,
      // исправлено: берём правильный url фото
      image: car.Photos?.[0]?.location
        ? `https://ci.encar.com${car.Photos[0].location}`
        : "/placeholder.png", // если фото нет
    }));

    if (results.length) {
      console.log(
        `✅ Страница ${start}-${end}: найдено машин ${results.length}`
      );
    }
    return results;
  } catch (err) {
    console.error(`❌ Ошибка запроса страницы ${start}-${end}:`, err.message);
    return [];
  }
}

async function main() {
  console.log("🚀 Старт парсинга...");

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
