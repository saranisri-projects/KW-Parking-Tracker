import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Clock, History, FileText, Plus, X, Bell, Play, DollarSign, AlertTriangle } from 'lucide-react';
import { fetchAllParkingData, getCachedZones, setCachedZones } from './services/parkingAPI';
import ParkingMapAdvanced from './components/ParkingMapAdvanced';


// Key features:
// 1. Interactive map with parking zones (using mock data - can be replaced with real API)
// 2. Timer system with notifications
// 3. Parking history tracking
// 4. Ticket logging
// 5. Persistent storage

const ParkingTrackerApp = () => {
  const [activeTab, setActiveTab] = useState('map');
  const [currentLocation, setCurrentLocation] = useState(null);
  const [parkingSession, setParkingSession] = useState(null);
  const [findCarMode, setFindCarMode] = useState(false);
  const [timer, setTimer] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [parkingHistory, setParkingHistory] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [showAddTicket, setShowAddTicket] = useState(false);
  const [showManualTimer, setShowManualTimer] = useState(false);
  const [manualMinutes, setManualMinutes] = useState(120);
  const [selectedZone, setSelectedZone] = useState(null);
  const [showWarningPopup, setShowWarningPopup] = useState(false);
  const [warningPopupMessage, setWarningPopupMessage] = useState('');
  const [warningPopupDismissed, setWarningPopupDismissed] = useState(false);
  const timerIntervalRef = useRef(null);

  const [parkingZones, setParkingZones] = useState([]);
  const [loadingZones, setLoadingZones] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLocation, setSearchLocation] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [locationError, setLocationError] = useState('');

  const requestLocationAccess = () => {
    setLocationError('');
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        updateCurrentLocation,
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            setLocationError('Location permission denied. Allow location access in your browser settings and refresh.');
          } else {
            setLocationError('Unable to access location. Try again or use a different browser.');
          }
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setLocationError('Geolocation not supported by this browser.');
    }
  };

  // Fallback zones if APIs fail
  const getFallbackZones = () => {
    return [
      { id: 1, name: 'King St W - Downtown Kitchener', type: 'paid', timeLimit: 120, lat: 43.4516, lng: -80.4925, rate: 2.50 },
      { id: 2, name: 'Victoria St - Uptown Waterloo', type: 'paid', timeLimit: 180, lat: 43.4643, lng: -80.5204, rate: 2.00 },
      { id: 3, name: 'Duke St - Downtown Kitchener', type: 'free', timeLimit: 60, lat: 43.4501, lng: -80.4897 },
      { id: 4, name: 'Caroline St - Waterloo', type: 'free', timeLimit: 120, lat: 43.4647, lng: -80.5164 },
      { id: 5, name: 'Weber St - No Parking Zone', type: 'no-parking', lat: 43.4489, lng: -80.4947 },
      { id: 6, name: 'University Ave - Waterloo', type: 'permit', timeLimit: null, lat: 43.4723, lng: -80.5449 },
    ];
  };

  // Load parking zones from API
  useEffect(() => {
    const loadParkingZones = async () => {
      setLoadingZones(true);
      
      // Try to use cached data first
      const cachedZones = getCachedZones();
      
      if (cachedZones && cachedZones.length > 0) {
        console.log('Using cached parking zones');
        setParkingZones(cachedZones);
        setLoadingZones(false);
        return;
      }
      
      // If no cache, fetch from APIs
      console.log('No cache found, fetching from APIs...');
      const zones = await fetchAllParkingData();
      
      if (zones.length > 0) {
        setParkingZones(zones);
        setCachedZones(zones); // Cache for next time
      } else {
        // If API fails, use fallback data
        console.log('API fetch failed, using fallback data');
        setParkingZones(getFallbackZones());
      }
      
      setLoadingZones(false);
    };
    
    loadParkingZones();
  }, []);

  // Refresh parking data manually
  const refreshParkingData = async () => {
    setLoadingZones(true);
    const zones = await fetchAllParkingData();
    if (zones.length > 0) {
      setParkingZones(zones);
      setCachedZones(zones);
    }
    setLoadingZones(false);
  };

  // Load saved data on mount
  /* eslint-disable react-hooks/exhaustive-deps */
  const updateCurrentLocation = (position) => {
    setCurrentLocation({
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      heading: position.coords.heading,
      speed: position.coords.speed,
      accuracy: position.coords.accuracy
    });
  };

  useEffect(() => {
    const savedHistory = localStorage.getItem('parkingHistory');
    const savedTickets = localStorage.getItem('parkingTickets');
    const savedSession = localStorage.getItem('currentSession');
    
    if (savedHistory) setParkingHistory(JSON.parse(savedHistory));
    if (savedTickets) setTickets(JSON.parse(savedTickets));
    if (savedSession) {
      const session = JSON.parse(savedSession);
      setParkingSession(session);
      startTimer(session);
    }

    let watchId = null;
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        updateCurrentLocation,
        (error) => {
          console.error('Error watching location:', error.code, error.message);
          if (error.code === error.PERMISSION_DENIED) {
            setLocationError('Location permission denied. Please allow location access in your browser.');
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            setLocationError('Location unavailable. Try again in an area with better GPS coverage.');
          } else if (error.code === error.TIMEOUT) {
            setLocationError('Location request timed out. Try refreshing the page.');
          } else {
            setLocationError('Unable to get location. Using fallback coordinates.');
          }

          setCurrentLocation({ lat: 43.4516, lng: -80.4925 });
        },
        {
          enableHighAccuracy: true,
          maximumAge: 5000,
          timeout: 10000
        }
      );
    } else {
      setLocationError('Geolocation is not supported by this browser.');
      setCurrentLocation({ lat: 43.4516, lng: -80.4925 });
    }

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (watchId !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []);
  /* eslint-enable react-hooks/exhaustive-deps */

  const startTimer = (session) => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    let activeSession = { ...session };

    const updateTimer = () => {
      const now = new Date();
      const end = new Date(activeSession.endTime);
      const remaining = Math.floor((end - now) / 1000);

      setTimer(remaining);

      if (remaining <= 600 && remaining > 0 && !activeSession.warningShown && !warningPopupDismissed) {
        activeSession = { ...activeSession, warningShown: true };
        setParkingSession(activeSession);
        localStorage.setItem('currentSession', JSON.stringify(activeSession));
        setWarningPopupMessage('10 minutes remaining on your parking timer!');
        setShowWarningPopup(true);
        sendNotification('Parking Reminder', '10 minutes remaining on your parking timer!');
      }

      if (remaining <= 0 && !activeSession.expiredNotified) {
        activeSession = { ...activeSession, expiredNotified: true };
        setParkingSession(activeSession);
        localStorage.setItem('currentSession', JSON.stringify(activeSession));
        setWarningPopupMessage('Your parking time has expired. Overtime is now active.');
        setShowWarningPopup(true);
        sendNotification('Parking Time Expired!', 'Your parking time has ended. Please move your vehicle.');
      }
    };

    updateTimer();
    timerIntervalRef.current = setInterval(updateTimer, 1000);
  };

  const sendNotification = (title, body) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '🅿️' });
    }
    setNotifications(prev => [...prev, { id: Date.now(), title, body, time: new Date() }]);
  };

  const handleDismissWarningPopup = () => {
    setShowWarningPopup(false);
    setWarningPopupDismissed(true);
  };

  const startParkingSession = (zone, customMinutes = null) => {
    let duration = customMinutes || zone.timeLimit;
    if (!duration) {
      duration = 180;
    }

    const endTime = new Date(Date.now() + duration * 60000);
    
    const session = {
      id: Date.now(),
      zone: zone.name,
      zoneId: zone.id,
      type: zone.type,
      lat: zone.lat,
      lng: zone.lng,
      startTime: new Date().toISOString(),
      endTime: endTime.toISOString(),
      duration: duration,
      rate: zone.rate || 0,
      warningShown: false,
      expiredNotified: false
    };

    setParkingSession(session);
    setFindCarMode(false);
    setWarningPopupDismissed(false);
    localStorage.setItem('currentSession', JSON.stringify(session));
    startTimer(session);
    setShowManualTimer(false);
  };

  const endParkingSession = () => {
    if (!parkingSession) return;

    const endedSession = {
      ...parkingSession,
      actualEndTime: new Date().toISOString()
    };
    setFindCarMode(false);

    const newHistory = [...parkingHistory, endedSession];
    setParkingHistory(newHistory);
    localStorage.setItem('parkingHistory', JSON.stringify(newHistory));
    localStorage.removeItem('currentSession');
    
    setParkingSession(null);
    setTimer(null);
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
  };

  const addTicket = (ticketData) => {
    const newTicket = {
      id: Date.now(),
      ...ticketData,
      date: new Date().toISOString()
    };
    const newTickets = [...tickets, newTicket];
    setTickets(newTickets);
    localStorage.setItem('parkingTickets', JSON.stringify(newTickets));
    setShowAddTicket(false);
  };

  const formatTime = (seconds) => {
    if (seconds === null) return '--:--:--';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getZoneRules = (zone) => {
    if (!zone) return 'No details available for this area.';

    switch (zone.type) {
      case 'free':
        return 'Free parking. Check the posted signs for any hourly limits or permit restrictions.';
      case 'paid':
        return 'Paid parking zone. Pay at the meter or via app and observe any posted time limits.';
      case 'permit':
        return 'Permit-only parking. Do not park unless you have the required permit.';
      case 'no-parking':
        return 'No parking permitted. This area is reserved for emergency access or loading.';
      default:
        return 'Follow posted parking signs and local city regulations.';
    }
  };

  const calculateDistanceKm = (lat1, lng1, lat2, lng2) => {
    const toRad = (value) => (value * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return 6371 * c;
  };

  const handleSearchSubmit = async (event) => {
    event.preventDefault();
    const trimmedQuery = searchQuery.trim();

    if (!trimmedQuery) {
      setSearchError('Enter a destination or street name to search.');
      setSearchResults([]);
      return;
    }

    const apiKey = process.env.REACT_APP_LOCATIONIQ_API_KEY;
    if (!apiKey) {
      setSearchError('LocationIQ API key is missing. Add REACT_APP_LOCATIONIQ_API_KEY to .env.');
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    setSearchError('');
    setSearchResults([]);

    try {
      const viewboxParams = currentLocation
        ? `&viewbox=${currentLocation.lng - 0.2},${currentLocation.lat - 0.2},${currentLocation.lng + 0.2},${currentLocation.lat + 0.2}&bounded=1`
        : '';

      const response = await fetch(
        `https://us1.locationiq.com/v1/search.php?key=${encodeURIComponent(apiKey)}&q=${encodeURIComponent(trimmedQuery)}&format=json&limit=10${viewboxParams}`
      );
      const results = await response.json();

      if (!Array.isArray(results) || results.length === 0) {
        setSearchError('No results found. Try a nearby street name or landmark.');
        setSearchResults([]);
        return;
      }

      const resultsWithDistance = results.map((result) => {
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);
        const distance = currentLocation
          ? calculateDistanceKm(currentLocation.lat, currentLocation.lng, lat, lng)
          : null;

        return {
          id: result.place_id || result.osm_id || result.display_name,
          label: result.display_name,
          lat,
          lng,
          type: result.type,
          distance
        };
      });

      if (currentLocation) {
        resultsWithDistance.sort((a, b) => (a.distance || 0) - (b.distance || 0));
      }

      setSearchResults(resultsWithDistance);
    } catch (error) {
      console.error('Search error:', error);
      setSearchError('Unable to search destination. Check your network and API key.');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearchSelect = (result) => {
    setSearchLocation({ lat: result.lat, lng: result.lng, label: result.label });
    setSearchQuery(result.label);
    setSearchResults([]);
    setSelectedZone(null);
  };

  const formatDistance = (distanceKm) => {
    if (distanceKm == null) return 'Unknown distance';
    if (distanceKm < 1) {
      return `${Math.round(distanceKm * 1000)} m`;
    }
    return `${distanceKm.toFixed(1)} km`;
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

  return (
    <div className="app-container">
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Outfit:wght@300;400;600;700&display=swap');

        body {
          font-family: 'Outfit', sans-serif;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          color: #e2e8f0;
          overflow-x: hidden;
        }

        .app-container {
          min-height: 100vh;
          max-width: 1400px;
          margin: 0 auto;
          padding: 20px;
        }

        .header {
          text-align: center;
          margin-bottom: 30px;
          padding: 30px 20px;
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          border-radius: 24px;
          box-shadow: 0 20px 60px rgba(59, 130, 246, 0.3);
          position: relative;
          overflow: hidden;
        }

        .header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
          opacity: 0.1;
        }

        .header h1 {
          font-family: 'Space Mono', monospace;
          font-size: 3rem;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 10px;
          text-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          letter-spacing: -1px;
          position: relative;
          z-index: 1;
        }

        .header p {
          font-size: 1.1rem;
          color: rgba(255, 255, 255, 0.9);
          position: relative;
          z-index: 1;
        }

        .timer-display {
          background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
          border-radius: 20px;
          padding: 30px;
          margin-bottom: 30px;
          border: 2px solid #475569;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
        }

        .timer-main {
          text-align: center;
          margin-bottom: 20px;
        }

        .timer-digits {
          font-family: 'Space Mono', monospace;
          font-size: 4rem;
          font-weight: 700;
          color: ${timer && timer <= 600 ? '#ef4444' : '#10b981'};
          text-shadow: 0 0 30px ${timer && timer <= 600 ? 'rgba(239, 68, 68, 0.5)' : 'rgba(16, 185, 129, 0.5)'};
          letter-spacing: 4px;
        }

        .timer-label {
          font-size: 0.9rem;
          color: #94a3b8;
          margin-top: 10px;
          text-transform: uppercase;
          letter-spacing: 2px;
        }

        .session-info {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin-top: 20px;
        }

        .info-card {
          background: rgba(51, 65, 85, 0.5);
          padding: 15px;
          border-radius: 12px;
          border: 1px solid #475569;
        }

        .info-card h4 {
          font-size: 0.8rem;
          color: #94a3b8;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .info-card p {
          font-size: 1.2rem;
          color: #e2e8f0;
          font-weight: 600;
        }

        .btn-group {
          display: flex;
          gap: 15px;
          margin-top: 20px;
        }

        .btn {
          flex: 1;
          padding: 14px 24px;
          border: none;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.3s ease;
          font-family: 'Outfit', sans-serif;
        }

        .btn-primary {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(59, 130, 246, 0.5);
        }

        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .btn-danger {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
        }

        .btn-danger:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(239, 68, 68, 0.5);
        }

        .btn-secondary {
          background: rgba(51, 65, 85, 0.8);
          color: #e2e8f0;
          border: 1px solid #475569;
        }

        .btn-secondary:hover {
          background: rgba(51, 65, 85, 1);
          transform: translateY(-2px);
        }

        .btn-secondary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .tabs {
          display: flex;
          gap: 10px;
          margin-bottom: 25px;
          background: rgba(30, 41, 59, 0.6);
          padding: 8px;
          border-radius: 16px;
          border: 1px solid #334155;
        }

        .tab {
          flex: 1;
          padding: 12px 20px;
          border: none;
          background: transparent;
          color: #94a3b8;
          cursor: pointer;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 600;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-family: 'Outfit', sans-serif;
        }

        .tab.active {
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
        }

        .tab:hover:not(.active) {
          background: rgba(59, 130, 246, 0.1);
          color: #e2e8f0;
        }

        .map-container {
          background: rgba(30, 41, 59, 0.6);
          border-radius: 20px;
          padding: 25px;
          border: 2px solid #334155;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
          min-height: 500px;
        }

        .map-grid {
          display: grid;
          gap: 15px;
          margin-top: 20px;
        }

        .zone-card {
          background: rgba(51, 65, 85, 0.6);
          padding: 20px;
          border-radius: 16px;
          border: 2px solid #475569;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .zone-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 6px;
          height: 100%;
          background: var(--zone-color);
        }

        .zone-card:hover {
          border-color: var(--zone-color);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
        }

        .zone-card.selected {
          border-color: var(--zone-color);
          box-shadow: 0 8px 24px var(--zone-glow);
        }

        .zone-header {
          display: flex;
          justify-content: space-between;
          align-items: start;
          margin-bottom: 12px;
        }

        .zone-name {
          font-size: 1.1rem;
          font-weight: 600;
          color: #e2e8f0;
          margin-bottom: 5px;
        }

        .zone-badge {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          background: var(--zone-color);
          color: white;
        }

        .zone-details {
          display: flex;
          gap: 20px;
          margin-top: 12px;
          color: #94a3b8;
          font-size: 0.9rem;
        }

        .zone-detail {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .history-list {
          display: grid;
          gap: 15px;
        }

        .history-item {
          background: rgba(51, 65, 85, 0.6);
          padding: 20px;
          border-radius: 16px;
          border: 1px solid #475569;
        }

        .history-header {
          display: flex;
          justify-content: space-between;
          align-items: start;
          margin-bottom: 12px;
        }

        .history-title {
          font-weight: 600;
          color: #e2e8f0;
          font-size: 1.1rem;
        }

        .history-date {
          color: #94a3b8;
          font-size: 0.9rem;
        }

        .history-details {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 12px;
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #475569;
        }

        .history-detail-item {
          font-size: 0.85rem;
          color: #94a3b8;
        }

        .history-detail-item strong {
          display: block;
          color: #e2e8f0;
          margin-top: 4px;
          font-size: 1rem;
        }

        .ticket-card {
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%);
          padding: 20px;
          border-radius: 16px;
          border: 2px solid #ef4444;
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
        }

        .ticket-header {
          display: flex;
          justify-content: space-between;
          align-items: start;
          margin-bottom: 15px;
        }

        .ticket-amount {
          font-size: 2rem;
          font-weight: 700;
          color: #ef4444;
        }

        .modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
          backdrop-filter: blur(4px);
        }

        .modal-content {
          background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
          padding: 30px;
          border-radius: 24px;
          max-width: 500px;
          width: 100%;
          border: 2px solid #475569;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 25px;
        }

        .modal-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #e2e8f0;
        }

        .close-btn {
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          padding: 8px;
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .close-btn:hover {
          background: rgba(148, 163, 184, 0.1);
          color: #e2e8f0;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-label {
          display: block;
          margin-bottom: 8px;
          color: #94a3b8;
          font-size: 0.9rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .form-input,
        .form-select,
        .form-textarea {
          width: 100%;
          padding: 12px 16px;
          background: rgba(51, 65, 85, 0.6);
          border: 1px solid #475569;
          border-radius: 12px;
          color: #e2e8f0;
          font-size: 1rem;
          font-family: 'Outfit', sans-serif;
          transition: all 0.3s ease;
        }

        .form-input:focus,
        .form-select:focus,
        .form-textarea:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .form-textarea {
          resize: vertical;
          min-height: 100px;
        }

        .slider-container {
          margin-top: 15px;
        }

        .slider {
          width: 100%;
          height: 8px;
          border-radius: 4px;
          background: rgba(51, 65, 85, 0.6);
          outline: none;
          -webkit-appearance: none;
        }

        .slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
        }

        .slider::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
        }

        .slider-value {
          text-align: center;
          margin-top: 10px;
          font-size: 1.5rem;
          font-weight: 700;
          color: #3b82f6;
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: #64748b;
        }

        .empty-state-icon {
          margin-bottom: 20px;
          opacity: 0.3;
        }

        .empty-state h3 {
          font-size: 1.3rem;
          margin-bottom: 10px;
          color: #94a3b8;
        }

        .empty-state p {
          font-size: 1rem;
          color: #64748b;
        }

        @media (max-width: 768px) {
          .header h1 {
            font-size: 2rem;
          }

          .timer-digits {
            font-size: 2.5rem;
          }

          .btn-group {
            flex-direction: column;
          }

          .session-info {
            grid-template-columns: 1fr;
          }

          .tabs {
            flex-wrap: wrap;
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }

        .pulse {
          animation: pulse 2s ease-in-out infinite;
        }
      `}</style>

      {/* Header */}
      <div className="header">
        <h1>🅿️ ParkTrack KW</h1>
        <p>Smart parking management for Kitchener-Waterloo & GTA</p>
      </div>

      {/* Active Timer Display */}
      {parkingSession && (
        <div className="timer-display">
          <div className="timer-main">
            <div className={`timer-digits ${timer <= 600 ? 'pulse' : ''}`}>
              {formatTime(timer)}
            </div>
            <div className="timer-label">Time Remaining</div>
          </div>
          
          <div className="session-info">
            <div className="info-card">
              <h4>Location</h4>
              <p>{parkingSession.zone}</p>
            </div>
            <div className="info-card">
              <h4>Type</h4>
              <p style={{ color: getZoneColor(parkingSession.type) }}>
                {parkingSession.type.toUpperCase()}
              </p>
            </div>
            <div className="info-card">
              <h4>Duration</h4>
              <p>{formatDuration(parkingSession.duration)}</p>
            </div>
            {parkingSession.rate > 0 && (
              <div className="info-card">
                <h4>Rate</h4>
                <p>${parkingSession.rate}/hr</p>
              </div>
            )}
          </div>

          <div className="btn-group">
            <button className="btn btn-danger" onClick={endParkingSession}>
              <X size={20} />
              End Session
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loadingZones && (
        <div style={{
          background: 'rgba(30, 41, 59, 0.6)',
          borderRadius: '20px',
          padding: '40px',
          textAlign: 'center',
          marginBottom: '30px'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '15px' }}>🅿️</div>
          <h3 style={{ marginBottom: '10px' }}>Loading parking zones...</h3>
          <p style={{ color: '#94a3b8' }}>Fetching data from city APIs</p>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'map' ? 'active' : ''}`}
          onClick={() => setActiveTab('map')}
        >
          <MapPin size={20} />
          Parking Zones
        </button>
        <button
          className={`tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <History size={20} />
          History ({parkingHistory.length})
        </button>
        <button
          className={`tab ${activeTab === 'tickets' ? 'active' : ''}`}
          onClick={() => setActiveTab('tickets')}
        >
          <FileText size={20} />
          Tickets ({tickets.length})
        </button>
      </div>

      {/* Map/Zones Tab */}
      {activeTab === 'map' && (
        <div className="map-container">
          {showWarningPopup && (
            <div style={{
              position: 'fixed',
              bottom: '30px',
              right: '30px',
              zIndex: 2000,
              width: '320px',
              background: 'rgba(15, 23, 42, 0.96)',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              borderRadius: '18px',
              padding: '18px',
              boxShadow: '0 18px 50px rgba(15, 23, 42, 0.4)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Bell size={18} color="#facc15" />
                  <div style={{ fontWeight: '700', color: '#f8fafc' }}>Parking Alert</div>
                </div>
                <button
                  onClick={handleDismissWarningPopup}
                  style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '18px' }}
                >
                  ×
                </button>
              </div>
              <p style={{ marginTop: '12px', color: '#cbd5e1', lineHeight: 1.6 }}>{warningPopupMessage}</p>
            </div>
          )}
          {locationError && (
            <div style={{
              marginBottom: '18px',
              borderRadius: '16px',
              padding: '14px 18px',
              background: 'rgba(220, 38, 38, 0.14)',
              border: '1px solid rgba(248, 113, 113, 0.3)',
              color: '#fee2e2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px'
            }}>
              <div>
                <strong>Location warning:</strong> {locationError}
              </div>
              <button
                className="btn btn-secondary"
                type="button"
                onClick={requestLocationAccess}
                style={{ whiteSpace: 'nowrap' }}
              >
                Retry location
              </button>
            </div>
          )}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            gap: '18px',
            marginBottom: '20px'
          }}>
            <div style={{ minWidth: '280px', flex: '1 1 420px' }}>
              <h2 style={{ marginBottom: '10px', fontSize: '1.5rem', fontWeight: '700' }}>
                Parking Map
              </h2>
              <p style={{ color: '#cbd5e1', maxWidth: '700px' }}>
                Search for a destination, inspect nearby parking zones, and start a timer for the allowed duration.
              </p>
            </div>

            <form
              onSubmit={handleSearchSubmit}
              style={{ display: 'flex', flex: '1 1 280px', minWidth: '280px', gap: '10px', alignItems: 'center' }}
            >
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search destination"
                className="form-input"
                style={{ flex: 1, minWidth: '0' }}
              />
              <button type="submit" className="btn btn-primary" style={{ whiteSpace: 'nowrap' }} disabled={searchLoading}>
                {searchLoading ? 'Searching...' : 'Search'}
              </button>
            </form>
          </div>

          {searchError && (
            <div style={{
              padding: '14px 18px',
              background: 'rgba(239, 68, 68, 0.12)',
              borderRadius: '16px',
              color: '#fee2e2',
              marginBottom: '16px'
            }}>
              {searchError}
            </div>
          )}

          {searchResults.length > 0 && (
            <div style={{
              marginBottom: '20px',
              display: 'grid',
              gap: '10px'
            }}>
              {searchResults.map((result) => (
                <button
                  key={result.id}
                  type="button"
                  onClick={() => handleSearchSelect(result)}
                  style={{
                    textAlign: 'left',
                    borderRadius: '14px',
                    border: '1px solid rgba(148, 163, 184, 0.35)',
                    background: '#0f172a',
                    color: '#e2e8f0',
                    padding: '14px 16px',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: '4px' }}>{result.label}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
                    <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>{result.type}</span>
                    {result.distance != null && (
                      <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>{result.distance.toFixed(1)} km</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
            <div style={{ flex: '1 1 680px', minWidth: '320px' }}>
              <ParkingMapAdvanced
                parkingZones={parkingZones}
                currentLocation={currentLocation}
                parkingSession={parkingSession}
                findCarMode={findCarMode}
                onZoneSelect={setSelectedZone}
                selectedZone={selectedZone}
                onStartSession={startParkingSession}
                searchLocation={searchLocation}
              />
            </div>

            <aside style={{ flex: '0 0 360px', minWidth: '300px' }}>
              <div style={{
                padding: '20px',
                background: 'rgba(51, 65, 85, 0.7)',
                borderRadius: '20px',
                border: '1px solid rgba(148, 163, 184, 0.15)',
                minHeight: '240px'
              }}>
                {parkingSession ? (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '15px' }}>
                      <h3 style={{ margin: 0 }}>Active Parking Session</h3>
                      {(parkingSession.type === 'paid' || parkingSession.type === 'no-parking') && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b', fontWeight: '700' }}>
                          <AlertTriangle size={18} />
                          Ticketed Zone
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'grid', gap: '10px' }}>
                      <div style={{ padding: '14px', borderRadius: '18px', background: 'rgba(30, 41, 59, 0.85)', border: '1px solid rgba(148, 163, 184, 0.15)' }}>
                        <div style={{ fontSize: '2rem', fontWeight: '700', color: timer <= 600 ? '#f59e0b' : '#10b981' }}>
                          {timer >= 0 ? formatTime(timer) : `Overtime ${formatTime(Math.abs(timer))}`}
                        </div>
                        <div style={{ fontSize: '0.95rem', color: '#94a3b8' }}>
                          {timer >= 0 ? 'Time remaining' : 'Overtime active'}
                        </div>
                      </div>
                      <div style={{ color: '#94a3b8' }}>Street</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: '700' }}>{parkingSession.zone}</div>
                      {currentLocation && parkingSession.lat && parkingSession.lng && (
                        <div style={{ color: '#cbd5e1' }}>
                          Distance: {formatDistance(calculateDistanceKm(currentLocation.lat, currentLocation.lng, parkingSession.lat, parkingSession.lng))}
                        </div>
                      )}
                      {locationError && (
                        <div style={{ color: '#fca5a5', fontSize: '0.95rem' }}>
                          {locationError}
                        </div>
                      )}
                      <div style={{ color: '#cbd5e1' }}>
                        Ends at {new Date(parkingSession.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div style={{ color: '#cbd5e1' }}>{timer >= 0 ? `Remaining time: ${formatTime(timer)}` : `Overtime: ${formatTime(Math.abs(timer))}`}</div>
                      <button className="btn btn-secondary" onClick={endParkingSession}>
                        End Session
                      </button>
                      {currentLocation && (
                        <button
                          className={findCarMode ? 'btn btn-danger' : 'btn btn-primary'}
                          onClick={() => setFindCarMode((prev) => !prev)}
                        >
                          {findCarMode ? 'Hide My Car Route' : 'Find my car'}
                        </button>
                      )}
                      {findCarMode && currentLocation && parkingSession && (
                        <div style={{ display: 'grid', gap: '10px', marginTop: '12px' }}>
                          <button
                            className="btn btn-primary"
                            onClick={() => {
                              const origin = `${currentLocation.lat},${currentLocation.lng}`;
                              const destination = `${parkingSession.lat},${parkingSession.lng}`;
                              window.open(`https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=walking`, '_blank');
                            }}
                          >
                            Walking directions
                          </button>
                          <button
                            className="btn btn-primary"
                            onClick={() => {
                              const origin = `${currentLocation.lat},${currentLocation.lng}`;
                              const destination = `${parkingSession.lat},${parkingSession.lng}`;
                              window.open(`https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`, '_blank');
                            }}
                          >
                            Driving directions
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                ) : selectedZone ? (
                  <>
                    <h3 style={{ marginBottom: '15px' }}>{selectedZone.name}</h3>
                    <div style={{ display: 'grid', gap: '12px' }}>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', color: '#94a3b8' }}>
                        <Clock size={18} />
                        {selectedZone.timeLimit ? `${formatDuration(selectedZone.timeLimit)} limit` : 'No posted limit'}
                      </div>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', color: '#94a3b8' }}>
                        <DollarSign size={18} />
                        {selectedZone.rate ? `$${selectedZone.rate}/hour` : 'Free or permit-only parking'}
                      </div>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', color: '#94a3b8' }}>
                        <MapPin size={18} />
                        {selectedZone.area || 'Local area'}
                      </div>
                      <div style={{ color: '#e2e8f0', lineHeight: 1.7 }}>{getZoneRules(selectedZone)}</div>
                      <div style={{ color: '#94a3b8' }}>Source: {selectedZone.source || 'City / municipal data'}</div>
                      {selectedZone.lastUpdated && (
                        <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Updated: {new Date(selectedZone.lastUpdated).toLocaleDateString()}</div>
                      )}
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                {selectedZone.type !== 'no-parking' && (
                        <button className="btn btn-primary" onClick={() => startParkingSession(selectedZone)}>
                          Start {formatDuration(selectedZone.timeLimit || 180)} Timer
                        </button>
                      )}
                      <button className="btn btn-secondary" onClick={() => setShowManualTimer(true)}>
                        Custom Timer
                      </button>
                    </div>
                    </div>
                  </>
                ) : searchLocation ? (
                  <>
                    <h3 style={{ marginBottom: '15px' }}>Search Destination</h3>
                    <p style={{ color: '#cbd5e1', lineHeight: 1.6 }}>{searchLocation.label}</p>
                    <button className="btn btn-secondary" onClick={() => setSearchLocation(null)}>
                      Clear Search
                    </button>
                  </>
                ) : (
                  <>
                    <h3 style={{ marginBottom: '15px' }}>Explore Parking</h3>
                    <p style={{ color: '#cbd5e1', lineHeight: 1.6 }}>
                      Tap a colored parking zone to see details and start a parking timer. Use the search box to zoom into a destination.
                    </p>
                    <button className="btn btn-primary" onClick={refreshParkingData}>
                      Refresh Parking Data
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px', color: '#94a3b8' }}>
                      <Bell size={16} />
                      Notifications: {notifications.length}
                    </div>
                  </>
                )}
              </div>
            </aside>
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="map-container">
          <h2 style={{ marginBottom: '20px', fontSize: '1.5rem', fontWeight: '700' }}>
            Parking History
          </h2>
          
          {parkingHistory.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <History size={64} />
              </div>
              <h3>No parking history yet</h3>
              <p>Your parking sessions will appear here</p>
            </div>
          ) : (
            <div className="history-list">
              {[...parkingHistory].reverse().map(session => {
                const start = new Date(session.startTime);
                const end = new Date(session.actualEndTime || session.endTime);
                const durationMs = end - start;
                const actualMinutes = Math.floor(durationMs / 60000);
                
                return (
                  <div key={session.id} className="history-item">
                    <div className="history-header">
                      <div className="history-title">{session.zone}</div>
                      <div className="history-date">
                        {start.toLocaleDateString()} at {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    
                    <div className="history-details">
                      <div className="history-detail-item">
                        Type
                        <strong style={{ color: getZoneColor(session.type) }}>
                          {session.type.toUpperCase()}
                        </strong>
                      </div>
                      <div className="history-detail-item">
                        Planned Duration
                        <strong>{formatDuration(session.duration)}</strong>
                      </div>
                      <div className="history-detail-item">
                        Actual Duration
                        <strong>{formatDuration(actualMinutes)}</strong>
                      </div>
                      {session.rate > 0 && (
                        <div className="history-detail-item">
                          Estimated Cost
                          <strong>${((actualMinutes / 60) * session.rate).toFixed(2)}</strong>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tickets Tab */}
      {activeTab === 'tickets' && (
        <div className="map-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>
              Parking Tickets
            </h2>
            <button className="btn btn-primary" onClick={() => setShowAddTicket(true)}>
              <Plus size={20} />
              Add Ticket
            </button>
          </div>
          
          {tickets.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <FileText size={64} />
              </div>
              <h3>No tickets logged</h3>
              <p>Keep track of parking tickets here</p>
            </div>
          ) : (
            <div className="history-list">
              {[...tickets].reverse().map(ticket => (
                <div key={ticket.id} className="ticket-card">
                  <div className="ticket-header">
                    <div>
                      <div style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: '5px' }}>
                        {new Date(ticket.date).toLocaleDateString()}
                      </div>
                      <div style={{ fontSize: '1.2rem', fontWeight: '600', color: '#e2e8f0' }}>
                        {ticket.location}
                      </div>
                    </div>
                    <div className="ticket-amount">${ticket.amount}</div>
                  </div>
                  
                  <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(239, 68, 68, 0.3)' }}>
                    <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '5px' }}>
                      Violation
                    </div>
                    <div style={{ color: '#e2e8f0' }}>
                      {ticket.violation}
                    </div>
                    {ticket.notes && (
                      <>
                        <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '10px', marginBottom: '5px' }}>
                          Notes
                        </div>
                        <div style={{ color: '#e2e8f0', fontSize: '0.95rem' }}>
                          {ticket.notes}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Manual Timer Modal */}
      {showManualTimer && (
        <div className="modal" onClick={() => setShowManualTimer(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Set Custom Timer</h3>
              <button className="close-btn" onClick={() => setShowManualTimer(false)}>
                <X size={24} />
              </button>
            </div>
            
            <div className="form-group">
              <label className="form-label">Duration (minutes)</label>
              <div className="slider-container">
                <input
                  type="range"
                  min="5"
                  max="480"
                  step="5"
                  value={manualMinutes}
                  onChange={(e) => setManualMinutes(parseInt(e.target.value))}
                  className="slider"
                />
                <div className="slider-value">{formatDuration(manualMinutes)}</div>
              </div>
            </div>

            <div className="btn-group">
              <button
                className="btn btn-primary"
                onClick={() => {
                  if (selectedZone) {
                    startParkingSession(selectedZone, manualMinutes);
                  }
                }}
              >
                <Play size={20} />
                Start Timer
              </button>
              <button className="btn btn-secondary" onClick={() => setShowManualTimer(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Ticket Modal */}
      {showAddTicket && (
        <div className="modal" onClick={() => setShowAddTicket(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Add Parking Ticket</h3>
              <button className="close-btn" onClick={() => setShowAddTicket(false)}>
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              addTicket({
                location: formData.get('location'),
                violation: formData.get('violation'),
                amount: parseFloat(formData.get('amount')),
                notes: formData.get('notes')
              });
            }}>
              <div className="form-group">
                <label className="form-label">Location</label>
                <input
                  type="text"
                  name="location"
                  className="form-input"
                  placeholder="e.g., King St W, Kitchener"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Violation Type</label>
                <input
                  type="text"
                  name="violation"
                  className="form-input"
                  placeholder="e.g., Overtime parking"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Amount ($)</label>
                <input
                  type="number"
                  name="amount"
                  className="form-input"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Notes (optional)</label>
                <textarea
                  name="notes"
                  className="form-textarea"
                  placeholder="Additional details..."
                />
              </div>

              <div className="btn-group">
                <button type="submit" className="btn btn-primary">
                  <Plus size={20} />
                  Add Ticket
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddTicket(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParkingTrackerApp;