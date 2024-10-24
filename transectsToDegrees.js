const fs = require('fs');
const path = require('path');

// Read the JSON file
const filePath = path.join(__dirname, 'surfSpotsWithTransects.json');
fs.readFile(filePath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading the file:', err);
    return;
  }

  const surfSpots = JSON.parse(data);

  Object.keys(surfSpots).forEach((key) => {
    const country = surfSpots[key];
    country.map((spot) => {
      if (
        spot.transect &&
        spot.transect.geometry &&
        spot.transect.geometry.coordinates.length === 2
      ) {
        // Add transectBearing key
        const directions = [
          'N',
          'NNE',
          'NE',
          'ENE',
          'E',
          'ESE',
          'SE',
          'SSE',
          'S',
          'SSW',
          'SW',
          'WSW',
          'W',
          'WNW',
          'NW',
          'NNW',
        ];
        const index = Math.round(spot.transectBearing / 22.5) % 16; // Adjust degree by 180 for wind direction
        spot.transectDirection = directions[index]; // Add transectDirection key
      } else {
        spot.transectBearing = null; // Set to null if data is incomplete or invalid
      }
    });
  });

  const outputFilePath = path.join(
    __dirname,
    'surfSpotsWithDegrees.json'
  );
  fs.writeFile(
    outputFilePath,
    JSON.stringify(surfSpots, null, 2),
    (err) => {
      if (err) {
        console.error('Error writing the file:', err);
        return;
      }
      console.log('File has been written successfully.');
    }
  );
});
