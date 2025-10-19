// Loads airports.json and builds ICAO-to-name mapping
export function loadIcaoToName() {
  // Use correct path for Vite/React static assets
  return fetch('/assets/airports.json')
    .then(response => response.json())
    .then(airports => {
      const icaoToName = {};
      for (const entry of airports) {
        if (entry.icao && entry.name) {
          icaoToName[entry.icao.trim().toUpperCase()] = entry.name.trim();
        }
      }
      return icaoToName;
    });
}
