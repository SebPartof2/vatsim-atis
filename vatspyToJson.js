console.log('Starting VATSpy.dat to JSON conversion...');
// Robust VATSpy.dat to airports.json converter
// Usage: node vatspyToJson.js <input.dat> <output.json>
import fs from 'fs';

function convertVatSpyDatToJson(datPath, jsonPath) {
  let airports = [];
  try {
    const datText = fs.readFileSync(datPath, 'utf8');
    const lines = datText.split(/\r?\n/);
    let inAirportsSection = false;
    let parsedCount = 0;
    for (const line of lines) {
      if (line.trim() === '[Airports]') {
        inAirportsSection = true;
        console.log('Found [Airports] section');
        continue;
      }
      if (inAirportsSection && line.trim().startsWith('[')) break;
      if (!inAirportsSection) continue;
      if (!line || line.startsWith(';')) continue;
      const match = line.match(/^([A-Z0-9\-]{4,})\|(.*)$/);
      if (match) {
        const icao = match[1].trim();
        const rest = match[2];
        const parts = rest.split('|');
        // Find latitude field (first field that parses as a float)
        let latIdx = -1;
        for (let j = 0; j < parts.length; ++j) {
          if (!isNaN(parseFloat(parts[j]))) {
            latIdx = j;
            break;
          }
        }
        let name = '';
        if (latIdx > 0) {
          name = parts.slice(0, latIdx).join('|').replace(/\s+/g, ' ').trim();
        } else {
          name = parts[0] ? parts[0].replace(/\s+/g, ' ').trim() : '';
        }
        if (icao && name) {
          // Only add if ICAO not already present
          if (!airports.some(a => a.icao === icao)) {
            airports.push({ icao, name });
            parsedCount++;
            if (parsedCount <= 5) {
              console.log(`Parsed airport: ICAO=${icao}, Name=${name}`);
            }
          } else {
            console.log(`Duplicate ICAO skipped: ${icao}`);
          }
        }
      }
    }
    console.log(`Total airports parsed: ${parsedCount}`);
  } catch (err) {
    console.error('Error reading or parsing VATSpy.dat:', err);
    airports = [];
  }
  // Always write a valid JSON array
  try {
    fs.writeFileSync(jsonPath, JSON.stringify(airports, null, 2));
    console.log(`Wrote ${airports.length} airports to ${jsonPath}`);
    if (airports.length > 0) {
      console.log('Sample output:', airports.slice(0, 3));
    }
  } catch (err) {
    console.error('Error writing airports.json:', err);
  }
}

if (process.argv.length >= 4) {
  const [,, datPath, jsonPath] = process.argv;
  convertVatSpyDatToJson(datPath, jsonPath);
} else {
  console.error('Usage: node vatspyToJson.js <input.dat> <output.json>');
  process.exit(1);
}
