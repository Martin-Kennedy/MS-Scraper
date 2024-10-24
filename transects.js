const fs = require('fs');
const turf = require('@turf/turf');
const axios = require('axios');

// Load surf spots data
const surfSpots = JSON.parse(fs.readFileSync('surfSpots.json'));

// Function to get shoreline data from OpenStreetMap
async function getShorelineData(lat, lon) {
  if (!lat || !lon) {
    return;
  }
  const overpassUrl = `https://overpass-api.de/api/interpreter?data=[out:json];way(around:500,${lat},${lon})["natural"="coastline"];out geom;`;
  try {
    const response = await axios.get(overpassUrl);

    return response.data.elements;
  } catch (error) {
    console.error(`Error fetching shoreline data: ${error}`);
    return;
  }
}

async function createTransect(lat, lon) {
  const shorelineData = await getShorelineData(lat, lon);

  if (!shorelineData || shorelineData.length === 0) {
    console.error(
      'Could not retrieve necessary data to create transect.'
    );
    return;
  }

  // Get the bounding box of the shoreline points
  const shorelinePoints = shorelineData.flatMap((way) =>
    way?.geometry
      ?.filter((point) => !isNaN(point.lon) && !isNaN(point.lat))
      .map((point) => [point.lon, point.lat])
  );

  // Ensure the shorelinePoints form a straight line by taking only the first and last points
  const straightLinePoints = [
    shorelinePoints[0],
    shorelinePoints[shorelinePoints.length - 1],
  ];
  // Calculate the bounding box of the shoreline points
  const bbox = turf.bbox(turf.multiPoint(shorelinePoints));
  const bboxCenter = turf.center(turf.bboxPolygon(bbox));

  // Create a line from the center of the bounding box to the first and last points of the shoreline
  const shorelineLine = turf.lineString(straightLinePoints);

  // Create a transect from the surf spot to the center of the shoreline bounding box
  const transectStart = turf.point([lon, lat]);
  // Find the point on the shorelineLine that makes a 90 degree angle with the transectStart
  const transectEnd = turf.nearestPointOnLine(
    shorelineLine,
    transectStart
  );

  const transect = turf.lineString([
    transectStart.geometry.coordinates,
    transectEnd.geometry.coordinates,
  ]);

  return transect;
}

// Delay function to space out API calls
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Example usage
const surfSpotsWithTransects = { ...surfSpots };

(async () => {
  for (const country in surfSpots) {
    for (const spot of surfSpots[country]) {
      if (spot.lat && spot.lng) {
        const transect = await createTransect(spot.lat, spot.lng);
        if (!transect) {
          continue;
        }
        spot.transect = transect;

        // Calculate the bearing of the transect in degrees
        const transectStart = transect.geometry.coordinates[0];
        const transectEnd = transect.geometry.coordinates[1];
        let bearing = turf.bearing(
          turf.point(transectStart),
          turf.point(transectEnd)
        );

        // Adjust bearing to ensure north is 0 and south is 180
        if (bearing < 0) {
          bearing += 360;
        }
        spot.transectBearing = bearing;
        await delay(500); // Delay of 100 milliseconds between API calls
      } else {
        console.error('Invalid coordinates for spot:', spot.town);
      }
    }
  }

  fs.writeFileSync(
    'surfSpotsWithTransects.json',
    JSON.stringify(surfSpotsWithTransects, null, 2)
  );
})();
