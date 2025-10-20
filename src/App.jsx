


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
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const controllersUrl = window.location.hostname === 'localhost' ?
      'http://localhost:5179/proxy/controllers' :
      '/controllers';

    // Check for config file in URL (e.g., /n90)
    const configPath = window.location.pathname.match(/^\/(\w+)/)?.[1];
    const configPromise = configPath ? fetch(`/${configPath}.json`).then(res => res.json()).catch(() => null) : Promise.resolve(null);

    Promise.all([
      fetch('https://data.vatsim.net/v3/afv-atis-data.json').then((res) => res.json()),
      fetchVatSpyMapping(),
      fetch(controllersUrl).then((res) => res.json()),
      configPromise
    ])
      .then(([atisRaw, icaoMap, controllersRaw, configObj]) => {
        if (!isMounted) return;
        setConfig(configObj);
        // ATIS filtering
        let stations = Array.isArray(atisRaw) ? atisRaw : (atisRaw.atis_stations || []);
        let atisFiltered = stations;
        if (configObj?.atis) {
          atisFiltered = stations.filter(station => configObj.atis.includes(station.callsign));
        }
        // Debug output
        if (configObj?.atis) {
          console.log('[DEBUG] Config ATIS filter:', configObj.atis);
          console.log('[DEBUG] All ATIS callsigns:', stations.map(s => s.callsign));
          console.log('[DEBUG] Filtered ATIS callsigns:', atisFiltered.map(s => s.callsign));
        }
        setAtisData(atisFiltered);
        setIcaoToName(icaoMap);
        // Controllers filtering (fixed for flat config keys)
        let ctrls = Array.isArray(controllersRaw) ? controllersRaw : (controllersRaw.controllers || []);
        console.log('[DEBUG] Raw controllers data:', ctrls);
        if (configObj) {
          // Use flat config keys (controllers_artccid, controllers_facility, controllers_callsign)
          const artccArr = Array.isArray(configObj.controllers_artccid) ? configObj.controllers_artccid.map(x => x.toUpperCase()) : [];
          const pfArr = Array.isArray(configObj.controllers_facility) ? configObj.controllers_facility.map(x => x.toUpperCase()) : [];
          const callsignArr = Array.isArray(configObj.controllers_callsign) ? configObj.controllers_callsign.map(x => x.toUpperCase()) : [];
          console.log('[DEBUG] Config controllers_artccid:', artccArr);
          console.log('[DEBUG] Config controllers_facility:', pfArr);
          console.log('[DEBUG] Config controllers_callsign:', callsignArr);
          ctrls = ctrls.filter(ctrl => {
            let callsign = '';
            let artcc = '';
            let primaryFacilityId = '';
            if (ctrl.vatsimData) {
              callsign = ctrl.vatsimData.callsign || '';
              artcc = ctrl.artccId || ctrl.vatsimData.artccId || '';
              primaryFacilityId = ctrl.primaryFacilityId || ctrl.vatsimData.primaryFacilityId || '';
            } else {
              callsign = ctrl.callsign || '';
              const artccMatch = callsign.match(/^(Z[A-Z]{2})_/i);
              artcc = ctrl.artccId || (artccMatch ? artccMatch[1] : '');
              primaryFacilityId = ctrl.primaryFacilityId || ctrl.facility || '';
            }
            callsign = callsign.toUpperCase();
            artcc = artcc.toUpperCase();
            primaryFacilityId = primaryFacilityId.toUpperCase();
            let match = false;
            if (artccArr.length && artccArr.includes(artcc)) match = true;
            else if (pfArr.length && pfArr.includes(primaryFacilityId)) match = true;
            else if (callsignArr.length && callsignArr.includes(callsign)) match = true;
            // Detailed debug output for each controller
            console.log('[DEBUG] Controller:', { callsign, artcc, primaryFacilityId, match });
            return match;
          });
          console.log('[DEBUG] Filtered controllers:', ctrls);
          setControllers(ctrls);
        } else {
          // No config, show all controllers
          setControllers(ctrls);
        }
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError('Failed to fetch ATIS or airport data');
        setLoading(false);
      });
    return () => { isMounted = false; };
  }, []);

  const [configInput, setConfigInput] = useState("");
  const handleConfigSubmit = (e) => {
    e.preventDefault();
    if (configInput.trim()) {
      window.location.href = `/${configInput.trim()}`;
    }
  };

  return (
    <div style={{display: 'flex', flexDirection: 'row'}}>
      {/* Main ATIS cards */}
      <div style={{flex: 1}}>
        <div style={{height: '32px', background: '#f4f6fb', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <form onSubmit={handleConfigSubmit} style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
            <input
              type="text"
              placeholder="Enter config code (e.g. n90, hcf)"
              value={configInput}
              onChange={e => setConfigInput(e.target.value)}
              style={{padding: '4px 8px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '1rem'}}
            />
            <button type="submit" style={{padding: '4px 12px', borderRadius: '4px', border: 'none', background: '#1976d2', color: '#fff', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer'}}>Go</button>
          </form>
        </div>
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
      {/* Sidebar for controllers on the right */}
      <div style={{width: '340px', background: '#f4f6fb', borderLeft: '1px solid #e0e0e0', minHeight: '100vh', padding: '24px 12px 12px 12px'}}>
        <h2 style={{marginTop: 0, marginBottom: '18px', color: '#2c3e50', fontSize: '1.25rem'}}>Online Controllers</h2>
        {loading ? (
          <p>Loading controllers...</p>
        ) : (
          <div>
            {controllers.length === 0 ? <p>No controllers online.</p> : null}
            {controllers.map(ctrl => {
              // Use provided JSON structure
              const vatsim = ctrl.vatsimData || {};
              const position = Array.isArray(ctrl.positions) && ctrl.positions.length > 0 ? ctrl.positions[0] : {};
              // Calculate online time from loginTime
              let onlineMins = 'N/A';
              if (ctrl.loginTime) {
                const loginDate = new Date(ctrl.loginTime);
                onlineMins = Math.floor((Date.now() - loginDate.getTime()) / 60000) + 'm';
              }
              return (
                <div key={(vatsim.callsign || position.defaultCallsign || 'unknown') + vatsim.cid} style={{background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', marginBottom: '12px', padding: '12px 10px'}}>
                  <div style={{fontWeight: 'bold', fontSize: '1.05rem', color: '#34495e'}}>{vatsim.realName || 'Unknown Name'}</div>
                  <div style={{marginBottom: '4px'}}>
                    <span style={{fontFamily: 'monospace', color: '#1976d2'}}>{vatsim.callsign || position.defaultCallsign || 'N/A'}</span>
                    <span style={{marginLeft: '10px', color: '#bdbdbd'}}>Facility: {position.facilityName || ctrl.primaryFacilityId || 'N/A'}</span>
                  </div>
                  <div style={{fontSize: '0.95rem', color: '#616161'}}>
                    <span>Online: {onlineMins}</span>
                    <span style={{marginLeft: '10px'}}>Radio: {position.radioName || 'N/A'}</span>
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
