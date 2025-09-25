import React, { useEffect, useState } from "react";

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
  const [currentPage, setCurrentPage] = useState(1);
  const carsPerPage = 12;

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
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="container py-5">Загрузка...</div>;

  const totalPages = Math.ceil(cars.length / carsPerPage);
  const indexOfLast = currentPage * carsPerPage;
  const indexOfFirst = indexOfLast - carsPerPage;
  const currentCars = cars.slice(indexOfFirst, indexOfLast);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: "smooth" }); // прокрутка наверх
    }
  };

  return (
    <div className="container py-4">
      <h1 className="mb-4 text-center">Список автомобилей</h1>
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
          <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
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
                className={`page-item ${currentPage === num ? "active" : ""}`}
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
    </div>
  );
}
