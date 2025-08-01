const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// Load town and station data
const towns = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/mass_towns.json')));
const stations = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/stations_db.json')));

// Haversine formula
function haversine(lat1, lon1, lat2, lon2) {
  const toRad = x => (x * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Home page
router.get('/', (req, res) => {
  const townNames = towns.map(t => t.town).sort();
  res.render('index', { towns: townNames });
});

// Search results
router.get('/search', (req, res) => {
  const selectedTown = req.query.town;
  const town = towns.find(t => t.town.toLowerCase() === selectedTown.toLowerCase());

  if (!town) {
    return res.render('results', { error: 'Town not found', stations: [], selectedTown });
  }

  const results = stations.map(station => {
    const distance = haversine(town.latitude, town.longitude, station.latitude, station.longitude);
    return { ...station, distance: distance.toFixed(2) };
  });

  results.sort((a, b) => a.distance - b.distance);
  res.render('results', { stations: results.slice(0, 50), selectedTown, error: null });
});

module.exports = router;
