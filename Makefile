.PHONY: install scrape scrape-fast frontend build clean

install:
	cd parser && npm ci
	cd frontend && npm ci

scrape:
	cd parser && npm run scrape

scrape-fast:
	cd parser && node parse.js --maxPages 50 --concurrent 50 --perPage 20

frontend:
	cd frontend && npm start

build:
	cd frontend && npm run build

clean:
	rm -rf frontend/build frontend/public/cars.json
