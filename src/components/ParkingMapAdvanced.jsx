import React, { useState, useEffect, useRef } from 'react';
import { Clock, DollarSign, AlertCircle } from 'lucide-react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const ParkingMap = ({
  parkingZones,
  currentLocation,
  parkingSession,
  findCarMode,
  onZoneSelect,
  selectedZone,
  onStartSession,
  searchLocation
}) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const userMarkerRef = useRef(null);
  const searchMarkerRef = useRef(null);
  const carMarkerRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);

  const defaultCenter = currentLocation || { lat: 43.4516, lng: -80.4925 };
  const defaultZoom = 14;

  const normalizeGeometry = (geometry) => {
    if (!geometry || !geometry.type) return null;

    if (geometry.type === 'Point' && Array.isArray(geometry.coordinates)) {
      const [lng, lat] = geometry.coordinates;
      return {
        type: 'LineString',
        coordinates: [
          [lng - 0.00015, lat],
          [lng + 0.00015, lat]
        ]
      };
    }

    if (geometry.type === 'MultiPoint' && Array.isArray(geometry.coordinates) && geometry.coordinates[0]) {
      const [lng, lat] = geometry.coordinates[0];
      return {
        type: 'LineString',
        coordinates: [
          [lng - 0.00015, lat],
          [lng + 0.00015, lat]
        ]
      };
    }

    return geometry;
  };

  const getZoneColor = (type) => {
    switch (type) {
      case 'free': return '#10b981';
      case 'paid': return '#f59e0b';
      case 'no-parking': return '#ef4444';
      case 'permit': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  const formatDuration = (minutes) => {
    if (!minutes) return 'No limit';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const addUserLocationMarker = () => {
    if (!map.current || !currentLocation) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
    }

    const el = document.createElement('div');
    el.style.width = '32px';
    el.style.height = '32px';
    el.style.background = 'rgba(59, 130, 246, 0.95)';
    el.style.border = '3px solid white';
    el.style.borderRadius = '50%';
    el.style.display = 'flex';
    el.style.alignItems = 'center';
    el.style.justifyContent = 'center';
    el.style.boxShadow = '0 0 18px rgba(59, 130, 246, 0.7)';
    el.style.transform = `rotate(${currentLocation.heading || 0}deg)`;
    el.style.transformOrigin = 'center center';

    const arrow = document.createElement('div');
    arrow.style.width = '0';
    arrow.style.height = '0';
    arrow.style.borderLeft = '7px solid transparent';
    arrow.style.borderRight = '7px solid transparent';
    arrow.style.borderBottom = '14px solid white';
    arrow.style.marginTop = '-2px';
    el.appendChild(arrow);

    userMarkerRef.current = new maplibregl.Marker({ element: el })
      .setLngLat([currentLocation.lng, currentLocation.lat])
      .addTo(map.current);
  };

  const addSearchLocationMarker = () => {
    if (!map.current) return;

    if (searchMarkerRef.current) {
      searchMarkerRef.current.remove();
      searchMarkerRef.current = null;
    }

    if (!searchLocation) return;

    const el = document.createElement('div');
    el.style.width = '22px';
    el.style.height = '22px';
    el.style.background = '#f59e0b';
    el.style.border = '3px solid white';
    el.style.borderRadius = '50%';
    el.style.boxShadow = '0 0 18px rgba(245, 158, 11, 0.8)';

    searchMarkerRef.current = new maplibregl.Marker({ element: el })
      .setLngLat([searchLocation.lng, searchLocation.lat])
      .addTo(map.current);

    map.current.flyTo({ center: [searchLocation.lng, searchLocation.lat], zoom: 15, duration: 1300 });
  };

  const addCarMarker = () => {
    if (!map.current || !parkingSession) return;

    if (carMarkerRef.current) {
      carMarkerRef.current.remove();
      carMarkerRef.current = null;
    }

    const el = document.createElement('div');
    el.style.width = '30px';
    el.style.height = '30px';
    el.style.background = '#1d4ed8';
    el.style.border = '3px solid white';
    el.style.borderRadius = '50%';
    el.style.display = 'flex';
    el.style.alignItems = 'center';
    el.style.justifyContent = 'center';
    el.style.fontSize = '16px';
    el.style.color = 'white';
    el.textContent = '🚗';

    carMarkerRef.current = new maplibregl.Marker({ element: el, anchor: 'bottom' })
      .setLngLat([parkingSession.lng, parkingSession.lat])
      .addTo(map.current);
  };

  const updateCarRoute = () => {
    if (!map.current || !mapReady) return;
    const source = map.current.getSource('parked-route-source');
    if (!source) return;

    if (parkingSession && currentLocation && findCarMode) {
      source.setData({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: [
                [parkingSession.lng, parkingSession.lat],
                [currentLocation.lng, currentLocation.lat]
              ]
            },
            properties: {}
          }
        ]
      });

      try {
        const bounds = new maplibregl.LngLatBounds(
          [parkingSession.lng, parkingSession.lat],
          [parkingSession.lng, parkingSession.lat]
        );
        bounds.extend([currentLocation.lng, currentLocation.lat]);
        map.current.fitBounds(bounds, { padding: 80, duration: 1200 });
      } catch (e) {
        // ignore fit bounds issues
      }
    } else {
      source.setData({ type: 'FeatureCollection', features: [] });
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const baseMapStyle = {
      version: 8,
      sources: {
        osm: {
          type: 'raster',
          tiles: [
            'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
            'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
            'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
          ],
          tileSize: 256,
          attribution: '© OpenStreetMap contributors'
        }
      },
      layers: [
        {
          id: 'osm-tiles',
          type: 'raster',
          source: 'osm'
        }
      ]
    };

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: baseMapStyle,
      center: [defaultCenter.lng, defaultCenter.lat],
      zoom: defaultZoom
    });

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    map.current.on('load', () => {
      if (!map.current.getSource('parking-zones-source')) {
        try {
          map.current.addSource('parking-zones-source', {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: []
            }
          });
        } catch (error) {
          console.error('Error adding parking-zones-source:', error);
        }

        try {
          map.current.addLayer({
            id: 'parking-zones-fill',
            type: 'fill',
            source: 'parking-zones-source',
            paint: {
              'fill-color': [
                'match',
                ['get', 'type'],
                'free', '#10b981',
                'paid', '#f59e0b',
                'no-parking', '#ef4444',
                'permit', '#8b5cf6',
                '#6b7280'
              ],
              'fill-opacity': [
                'match',
                ['get', 'type'],
                'no-parking', 0.4,
                0.22
              ],
              'fill-outline-color': '#ffffff',
              'fill-antialias': true
            }
          });
        } catch (error) {
          console.error('Error adding parking-zones-fill layer:', error);
        }

        try {
          map.current.addLayer({
            id: 'parking-zones-line',
            type: 'line',
            source: 'parking-zones-source',
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': [
                'match',
                ['get', 'type'],
                'free', '#10b981',
                'paid', '#f59e0b',
                'no-parking', '#ef4444',
                'permit', '#8b5cf6',
                '#6b7280'
              ],
              'line-width': [
                'interpolate',
                ['linear'],
                ['zoom'],
                12, 3,
                16, 6
              ],
              'line-opacity': 0.9
            }
          });
        } catch (error) {
          console.error('Error adding parking-zones-line layer:', error);
        }

        map.current.addSource('parked-route-source', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: []
          }
        });

        map.current.addLayer({
          id: 'parked-route-line',
          type: 'line',
          source: 'parked-route-source',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#2563eb',
            'line-width': 4,
            'line-opacity': 0.9,
            'line-dasharray': [2, 2]
          }
        });

        const handleZoneClick = (e) => {
          const feature = e.features && e.features[0];
          if (!feature || !feature.properties) return;

          const zone = {
            id: feature.properties.id,
            name: feature.properties.name,
            type: feature.properties.type,
            timeLimit: feature.properties.timeLimit ? Number(feature.properties.timeLimit) : null,
            rate: feature.properties.rate ? Number(feature.properties.rate) : 0,
            area: feature.properties.area,
            source: feature.properties.source,
            lastUpdated: feature.properties.lastUpdated,
            lat: Number(feature.properties.lat),
            lng: Number(feature.properties.lng)
          };

          setSelectedMarker(zone);
          onZoneSelect(zone);
        };

        map.current.on('click', 'parking-zones-fill', handleZoneClick);
        map.current.on('click', 'parking-zones-line', handleZoneClick);

        map.current.on('mouseenter', 'parking-zones-fill', () => {
          map.current.getCanvas().style.cursor = 'pointer';
        });
        map.current.on('mouseenter', 'parking-zones-line', () => {
          map.current.getCanvas().style.cursor = 'pointer';
        });

        map.current.on('mouseleave', 'parking-zones-fill', () => {
          map.current.getCanvas().style.cursor = '';
        });
        map.current.on('mouseleave', 'parking-zones-line', () => {
          map.current.getCanvas().style.cursor = '';
        });
      }

      if (currentLocation) {
        addUserLocationMarker();
      }

      setMapReady(true);
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);
  /* eslint-enable react-hooks/exhaustive-deps */

  useEffect(() => {
    if (!map.current || !mapReady) {
      return;
    }
    
    const source = map.current.getSource('parking-zones-source');
    if (!source) {
      console.warn('[Map] Parking zones source not found');
      return;
    }

    console.log('[Map] Updating map with', parkingZones.length, 'zones');

    const features = parkingZones.map((zone) => {
      const delta = 0.0012;
      const rawGeometry = zone.geometry || {
        type: 'LineString',
        coordinates: [
          [zone.lng - delta, zone.lat],
          [zone.lng + delta, zone.lat]
        ]
      };
      const geometry = normalizeGeometry(rawGeometry) || {
        type: 'LineString',
        coordinates: [
          [zone.lng - delta, zone.lat],
          [zone.lng + delta, zone.lat]
        ]
      };

      return {
        type: 'Feature',
        geometry,
        properties: {
          id: zone.id,
          name: zone.name,
          type: zone.type,
          timeLimit: zone.timeLimit,
          rate: zone.rate,
          area: zone.area,
          source: zone.source,
          lastUpdated: zone.lastUpdated,
          lat: zone.lat,
          lng: zone.lng
        }
      };
    });

    console.log('[Map] Setting map data with', features.length, 'features');
    
    try {
      source.setData({ type: 'FeatureCollection', features });
      console.log('[Map] Successfully set map data');
    } catch (error) {
      console.error('[Map] Error setting map data:', error);
    }
  }, [parkingZones, mapReady]);

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    if (!map.current || !mapReady || !currentLocation) return;
    addUserLocationMarker();
  }, [currentLocation, mapReady]);

  useEffect(() => {
    if (!map.current || !mapReady) return;
    if (parkingSession) {
      addCarMarker();
    } else if (carMarkerRef.current) {
      carMarkerRef.current.remove();
      carMarkerRef.current = null;
    }
    updateCarRoute();
  }, [parkingSession, currentLocation, findCarMode, mapReady]);
  /* eslint-enable react-hooks/exhaustive-deps */

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    if (!map.current || !mapReady) return;
    if (searchMarkerRef.current) {
      searchMarkerRef.current.remove();
      searchMarkerRef.current = null;
    }

    if (searchLocation) {
      addSearchLocationMarker();
    }
  }, [searchLocation, mapReady]);
  /* eslint-enable react-hooks/exhaustive-deps */

  useEffect(() => {
    if (selectedZone) {
      setSelectedMarker(selectedZone);
      if (map.current && mapReady) {
        map.current.flyTo({ center: [selectedZone.lng, selectedZone.lat], zoom: 15, duration: 1200 });
      }
    }
  }, [selectedZone, mapReady]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '600px' }}>
      <div
        ref={mapContainer}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '20px',
          overflow: 'hidden'
        }}
      />

      {selectedMarker && (
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          background: '#1e293b',
          color: '#e2e8f0',
          padding: '15px',
          borderRadius: '12px',
          minWidth: '300px',
          maxWidth: '90%',
          boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
          border: '1px solid #334155'
        }}>
          <button
            onClick={() => { setSelectedMarker(null); onZoneSelect(null); }}
            style={{
              position: 'absolute',
              top: '5px',
              right: '5px',
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              fontSize: '18px',
              cursor: 'pointer',
              padding: '5px 10px'
            }}
          >
            ×
          </button>

          <h3 style={{
            margin: '0 0 10px 0',
            fontSize: '1.1rem',
            fontWeight: '600',
            color: '#e2e8f0',
            paddingRight: '20px'
          }}>
            {selectedMarker.name}
          </h3>

          <div style={{
            display: 'inline-block',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '0.75rem',
            fontWeight: '600',
            textTransform: 'uppercase',
            background: getZoneColor(selectedMarker.type),
            color: 'white',
            marginBottom: '12px'
          }}>
            {selectedMarker.type}
          </div>

          <div style={{ fontSize: '0.9rem', color: '#94a3b8', marginTop: '12px' }}>
            {selectedMarker.timeLimit && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Clock size={16} />
                <span>Time Limit: {formatDuration(selectedMarker.timeLimit)}</span>
              </div>
            )}

            {selectedMarker.rate > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <DollarSign size={16} />
                <span>Rate: ${selectedMarker.rate}/hour</span>
              </div>
            )}

            {selectedMarker.type === 'no-parking' && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginTop: '12px',
                padding: '8px',
                background: 'rgba(239, 68, 68, 0.1)',
                borderRadius: '8px',
                color: '#ef4444'
              }}>
                <AlertCircle size={16} />
                <span>No Parking Zone</span>
              </div>
            )}
          </div>

          {selectedMarker.type !== 'no-parking' && onStartSession && (
            <button
              onClick={() => onStartSession(selectedMarker)}
              style={{
                marginTop: '12px',
                width: '100%',
                padding: '10px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Start Parking Timer
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ParkingMap;
