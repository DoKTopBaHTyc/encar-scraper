import React, { useEffect, useMemo, useState } from "react";

function CarCard({ car }) {
  return (
    <div className="card h-100 shadow-sm">
      <img
        src={car.image || "/placeholder.png"}
        className="card-img-top"
        alt={`${car.brand} ${car.model}`}
        style={{ height: 200, objectFit: "cover" }}
      />
      <div className="card-body d-flex flex-column">
        <h5 className="card-title">
          {car.brand} {car.model}
        </h5>
        <p className="card-text mb-1">
          {car.year || "—"} • {car.mileage || "—"} km
        </p>
        <p className="card-text fw-bold text-primary">
          {car.price ? `${car.price} 만원` : "—"}
        </p>
        <div className="mt-auto">
          <button className="btn btn-outline-primary w-100">Подробнее</button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("date");

  useEffect(() => {
    fetch("/cars.json")
      .then((r) => r.json())
      .then((data) => {
        setCars(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setCars([]);
        setError("Не удалось загрузить данные");
        setLoading(false);
      });
  }, []);

  const normalizedQuery = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!normalizedQuery) return cars;
    return cars.filter((c) => {
      const hay = `${c.brand ?? ""} ${c.model ?? ""} ${
        c.year ?? ""
      }`.toLowerCase();
      return hay.includes(normalizedQuery);
    });
  }, [cars, normalizedQuery]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    switch (sortBy) {
      case "priceAsc":
        return copy.sort(
          (a, b) => (a.price ?? Infinity) - (b.price ?? Infinity)
        );
      case "priceDesc":
        return copy.sort(
          (a, b) => (b.price ?? -Infinity) - (a.price ?? -Infinity)
        );
      case "yearDesc":
        return copy.sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
      case "mileageAsc":
        return copy.sort(
          (a, b) => (a.mileage ?? Infinity) - (b.mileage ?? Infinity)
        );
      default:
        return copy;
    }
  }, [filtered, sortBy]);

  const totalPages = Math.ceil(sorted.length / pageSize) || 1;
  const indexOfLast = currentPage * pageSize;
  const indexOfFirst = indexOfLast - pageSize;
  const currentCars = sorted.slice(indexOfFirst, indexOfLast);

  if (loading)
    return <div className="container py-5 text-center">Загрузка...</div>;

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: "smooth" }); // прокрутка наверх
    }
  };

  return (
    <div className="container py-4">
      <h1 className="mb-3 text-center">Список автомобилей</h1>

      <div className="row g-2 align-items-center mb-3">
        <div className="col-12 col-md-6">
          <input
            type="search"
            className="form-control"
            placeholder="Поиск по марке, модели или году"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        <div className="col-6 col-md-3">
          <select
            className="form-select"
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="date">По дате</option>
            <option value="priceAsc">Цена: по возрастанию</option>
            <option value="priceDesc">Цена: по убыванию</option>
            <option value="yearDesc">Год: новые сперва</option>
            <option value="mileageAsc">Пробег: меньше сперва</option>
          </select>
        </div>
        <div className="col-6 col-md-3">
          <select
            className="form-select"
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
          >
            <option value={8}>8 на странице</option>
            <option value={12}>12 на странице</option>
            <option value={24}>24 на странице</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {sorted.length === 0 ? (
        <div className="text-center text-muted py-5">Нет результатов</div>
      ) : (
        <>
          <div className="row g-3">
            {currentCars.map((car, i) => (
              <div key={i} className="col-12 col-sm-6 col-md-4 col-lg-3">
                <CarCard car={car} />
              </div>
            ))}
          </div>

          {/* Bootstrap Pagination */}
          <nav aria-label="Навигация страниц" className="mt-4">
            <ul className="pagination justify-content-center flex-wrap">
              <li
                className={`page-item ${currentPage === 1 ? "disabled" : ""}`}
              >
                <button
                  className="page-link"
                  onClick={() => goToPage(currentPage - 1)}
                >
                  <i className="bi bi-chevron-left"></i>
                </button>
              </li>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .slice(
                  Math.max(currentPage - 3, 0),
                  Math.min(currentPage + 2, totalPages)
                )
                .map((num) => (
                  <li
                    key={num}
                    className={`page-item ${
                      currentPage === num ? "active" : ""
                    }`}
                  >
                    <button className="page-link" onClick={() => goToPage(num)}>
                      {num}
                    </button>
                  </li>
                ))}

              <li
                className={`page-item ${
                  currentPage === totalPages ? "disabled" : ""
                }`}
              >
                <button
                  className="page-link"
                  onClick={() => goToPage(currentPage + 1)}
                >
                  <i className="bi bi-chevron-right"></i>
                </button>
              </li>
            </ul>
          </nav>
        </>
      )}
    </div>
  );
}
