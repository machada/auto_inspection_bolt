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
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Home route with town suggestions
router.get('/', (req, res) => {
  const townNames = towns.map(t => t.town).sort();
  res.render('index', { towns: townNames });
});

router.get('/search', (req, res) => {
    const selectedTown = req.query.town;
    const town = towns.find(t => t.town.toLowerCase() === selectedTown.toLowerCase());
  
    if (!town) {
      return res.render('results', { error: 'Town not found.', stations: [], selectedTown });
    }
  
    const results = stations.map(station => {
      const lat = parseFloat(station['gmap_lat']);
      const lon = parseFloat(station['gmap_lng']);
  
      if (isNaN(lat) || isNaN(lon)) return null;
  
      const distance = haversine(town.latitude, town.longitude, lat, lon);
  
      const phone = station['gmap_phone'] || station['original_phone_base'] || null;
      const callLink = phone ? `tel:${phone.replace(/\s+/g, '')}` : null;
      const rating = station['gmap_rating'] ? `${station['gmap_rating']} ⭐ (${station['gmap_rating_count'] || 0})` : null;
      const directions = station['gmap_url'] || null;
      const hours = station['gmap_hours'] || null;
  
      return {
        name: station['gmap_name'] || station['original_name'] || 'N/A',
        city: station['original_citystatezip'] || 'N/A',
        class: station['station_class'] || 'N/A',
        distance: distance.toFixed(2),
        callLink,
        rating,
        directions,
        hours
      };
    }).filter(Boolean);
  
    results.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
  
    res.render('results', {
      stations: results.slice(0, 50),
      selectedTown,
      error: null
    });
  });
  

module.exports = router;
