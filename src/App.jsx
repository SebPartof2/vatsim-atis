


import React, { useEffect, useState } from 'react';
import './App.css';
import { fetchVatSpyMapping } from './vatspyApi';


function getAtisType(callsign) {
  if (/_[AD]_ATIS$/.test(callsign)) {
    if (/_A_ATIS$/.test(callsign)) return 'Arrival ATIS';
    if (/_D_ATIS$/.test(callsign)) return 'Departure ATIS';
  }
  return 'ATIS';
}

function App() {
  const [atisData, setAtisData] = useState([]);
  const [icaoToName, setIcaoToName] = useState({});
  const [controllers, setControllers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const controllersUrl = window.location.hostname === 'localhost' ?
      'http://localhost:5179/proxy/controllers' :
      '/controllers';
    Promise.all([
      fetch('https://data.vatsim.net/v3/afv-atis-data.json').then((res) => res.json()),
      fetchVatSpyMapping(),
      fetch(controllersUrl).then((res) => res.json())
    ])
      .then(([atisRaw, icaoMap, controllersRaw]) => {
        if (!isMounted) return;
        const stations = Array.isArray(atisRaw) ? atisRaw : (atisRaw.atis_stations || []);
        setAtisData(stations);
        setIcaoToName(icaoMap);
        setControllers(Array.isArray(controllersRaw) ? controllersRaw : (controllersRaw.controllers || []));
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError('Failed to fetch ATIS or airport data');
        setLoading(false);
      });
    return () => { isMounted = false; };
  }, []);

  return (
    <div style={{display: 'flex', flexDirection: 'row'}}>
      {/* Sidebar for controllers */}
      <div style={{width: '340px', background: '#f4f6fb', borderRight: '1px solid #e0e0e0', minHeight: '100vh', padding: '24px 12px 12px 12px'}}>
        <h2 style={{marginTop: 0, marginBottom: '18px', color: '#2c3e50', fontSize: '1.25rem'}}>Online Controllers</h2>
        {loading ? (
          <p>Loading controllers...</p>
        ) : (
          <div>
            {controllers.length === 0 ? <p>No controllers online.</p> : null}
            {controllers.map(ctrl => (
              <div key={ctrl.callsign + ctrl.cid} style={{background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', marginBottom: '12px', padding: '12px 10px'}}>
                <div style={{fontWeight: 'bold', fontSize: '1.05rem', color: '#34495e'}}>{ctrl.realName || 'Unknown Name'}</div>
                <div style={{marginBottom: '4px'}}>
                  <span style={{fontFamily: 'monospace', color: '#1976d2'}}>{ctrl.callsign}</span>
                  <span style={{marginLeft: '10px', color: '#bdbdbd'}}>Facility: {ctrl.facilityID ?? 'N/A'}</span>
                </div>
                <div style={{fontSize: '0.95rem', color: '#616161'}}>
                  <span>Online: {ctrl.timeOnline ? Math.floor(ctrl.timeOnline / 60) + 'm' : 'N/A'}</span>
                  <span style={{marginLeft: '10px'}}>Radio: {ctrl.radioName || 'N/A'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Main ATIS cards */}
      <div style={{flex: 1}}>
        <div style={{height: '32px', background: '#f4f6fb'}}></div>
        <h1 style={{textAlign: 'center', color: '#2c3e50', margin: '0 0 32px 0'}}>VATSIM ATIS</h1>
        {loading ? (
          <p style={{textAlign: 'center'}}>Loading ATIS data...</p>
        ) : error ? (
          <p className="error" style={{textAlign: 'center'}}>{error}</p>
        ) : (
          <div className="atis-cards" style={{maxWidth: '900px', margin: '0 auto', padding: '0 12px'}}>
            {atisData.map((station) => {
              let icaoRaw = station.icao;
              if (!icaoRaw || icaoRaw.length < 4) {
                if (station.callsign && station.callsign.length >= 4) {
                  icaoRaw = station.callsign.substring(0, 4);
                }
              }
              const normalizedIcao = (icaoRaw || '').toUpperCase().trim();
              let airportName = icaoToName[normalizedIcao];
              if (!airportName) {
                airportName = `Unknown Airport (${normalizedIcao || 'N/A'})`;
              }
              const atisType = getAtisType(station.callsign || '');
              return (
                <div key={normalizedIcao + station.callsign} className="atis-card-image-style">
                  <div className="atis-image-meta-row">
                    <span className="atis-image-callsign">{station.callsign || ''}</span>
                    <span className="atis-image-frequency">{station.frequency || ''}</span>
                  </div>
                  <div style={{padding: '0 24px', marginTop: '8px', marginBottom: '4px'}}>
                    <span style={{fontWeight: 'bold', fontSize: '1.1rem'}}>{airportName}</span>
                    <span style={{marginLeft: '12px', color: '#bdbdbd', fontSize: '1rem'}}>{atisType}</span>
                  </div>
                  <div className="atis-image-row">
                    <div className="atis-image-letter-box">
                      {station.atis_code || '?'}
                    </div>
                    <div className="atis-image-text-box">
                      <pre className="atis-image-text">{station.text_atis || 'No ATIS available.'}</pre>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
