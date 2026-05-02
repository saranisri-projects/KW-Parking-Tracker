// src/services/parkingAPI.js
import axios from 'axios';

// ========================================
// CITY OF WATERLOO API
// ========================================

const WATERLOO_API_BASE = 'https://services1.arcgis.com/qAo1OsXi67t7XgmS/arcgis/rest/services';

export const fetchWaterlooParking = async () => {
  try {
    console.log('Fetching Waterloo parking data...');
    
    // On-street parking endpoint
    const response = await axios.get(
      `${WATERLOO_API_BASE}/Parking_On_Street/FeatureServer/0/query`,
      {
        params: {
          where: '1=1',              // Get all records
          outFields: '*',             // Get all fields
          outSR: 4326,               // WGS84 coordinate system
          f: 'json'                  // JSON format
        }
      }
    );

    console.log(`Found ${response.data.features.length} Waterloo zones`);

    // Transform the data to our app format
    const zones = response.data.features.map((feature, index) => {
      const attrs = feature.attributes;
      const geom = feature.geometry;
      
      return {
        id: `waterloo-${attrs.OBJECTID || index}`,
        name: buildStreetName(attrs),
        type: determineZoneType(attrs),
        timeLimit: parseTimeLimit(attrs.TIME_LIMIT || attrs.MAX_STAY),
        lat: geom.y,
        lng: geom.x,
        rate: parseFloat(attrs.RATE || 0),
        area: 'Waterloo',
        source: 'City of Waterloo',
        lastUpdated: new Date().toISOString()
      };
    });

    return zones.filter(zone => zone.lat && zone.lng); // Remove invalid coordinates
    
  } catch (error) {
    console.error('Error fetching Waterloo data:', error);
    return [];
  }
};

// ========================================
// CITY OF KITCHENER API (uses same system as Waterloo)
// ========================================

export const fetchKitchenerParking = async () => {
  try {
    console.log('Fetching Kitchener parking data...');
    
    // Kitchener uses the Waterloo portal
    const response = await axios.get(
      `${WATERLOO_API_BASE}/KitchenerGIS_Parking/FeatureServer/0/query`,
      {
        params: {
          where: '1=1',
          outFields: '*',
          outSR: 4326,
          f: 'json'
        }
      }
    );

    const zones = response.data.features.map((feature, index) => {
      const attrs = feature.attributes;
      const geom = feature.geometry;
      
      return {
        id: `kitchener-${attrs.OBJECTID || index}`,
        name: buildStreetName(attrs),
        type: determineZoneType(attrs),
        timeLimit: parseTimeLimit(attrs.TIME_LIMIT || attrs.MAX_STAY),
        lat: geom.y,
        lng: geom.x,
        rate: parseFloat(attrs.RATE || 0),
        area: 'Kitchener',
        source: 'City of Kitchener',
        lastUpdated: new Date().toISOString()
      };
    });

    return zones.filter(zone => zone.lat && zone.lng);
    
  } catch (error) {
    console.error('Error fetching Kitchener data:', error);
    return [];
  }
};

// ========================================
// CITY OF TORONTO API
// ========================================

const TORONTO_API_BASE = 'https://ckan0.cf.opendata.inter.prod-toronto.ca/api/3/action';

export const fetchTorontoParking = async () => {
  try {
    console.log('Fetching Toronto parking data...');
    
    // First, search for parking datasets
    const searchResponse = await axios.get(
      `${TORONTO_API_BASE}/package_search`,
      {
        params: {
          q: 'parking',
          rows: 10
        }
      }
    );

    // Find the on-street parking dataset
    const parkingDataset = searchResponse.data.result.results.find(
      dataset => dataset.title.toLowerCase().includes('on-street parking')
    );

    if (!parkingDataset || !parkingDataset.resources.length) {
      console.log('Toronto parking dataset not found');
      return [];
    }

    // Get the actual data
    const resourceUrl = parkingDataset.resources[0].url;
    const dataResponse = await axios.get(resourceUrl);

    // Transform Toronto data (format varies by dataset)
    const zones = transformTorontoData(dataResponse.data);
    
    return zones;
    
  } catch (error) {
    console.error('Error fetching Toronto data:', error);
    return [];
  }
};

// ========================================
// HELPER FUNCTIONS
// ========================================

function buildStreetName(attributes) {
  // Construct a readable street name from API data
  const street = attributes.STREET_NAME || attributes.ST_NAME || 'Unknown Street';
  const fromStreet = attributes.FROM_STREET || attributes.FROM_ST;
  const toStreet = attributes.TO_STREET || attributes.TO_ST;
  
  if (fromStreet && toStreet) {
    return `${street} (${fromStreet} to ${toStreet})`;
  } else if (fromStreet) {
    return `${street} at ${fromStreet}`;
  }
  
  return street;
}

function determineZoneType(attributes) {
  // Determine parking type from attributes
  
  // Check for no parking
  if (attributes.NO_PARKING || attributes.CATEGORY === 'NO PARKING') {
    return 'no-parking';
  }
  
  // Check for permit only
  if (attributes.PERMIT_ONLY || attributes.PERMIT_REQ || attributes.CATEGORY === 'PERMIT') {
    return 'permit';
  }
  
  // Check if paid
  const rate = parseFloat(attributes.RATE || 0);
  if (rate > 0) {
    return 'paid';
  }
  
  // Check for pay and display
  if (attributes.PAY_DISPLAY || attributes.METER_TYPE) {
    return 'paid';
  }
  
  // Default to free
  return 'free';
}

function parseTimeLimit(timeLimitStr) {
  if (!timeLimitStr) return null;
  
  // Convert string like "2 HR", "30 MIN", "2 HOURS" to minutes
  const str = String(timeLimitStr).toUpperCase();
  
  // Check for hours
  if (str.includes('HR') || str.includes('HOUR')) {
    const hours = parseInt(str);
    return hours * 60;
  }
  
  // Check for minutes
  if (str.includes('MIN')) {
    return parseInt(str);
  }
  
  // Try to parse as number (assume minutes)
  const num = parseInt(str);
  if (!isNaN(num)) {
    return num;
  }
  
  return null;
}

function transformTorontoData(data) {
  // Toronto data format varies - this handles common formats
  const zones = [];
  
  if (Array.isArray(data)) {
    data.forEach((item, index) => {
      zones.push({
        id: `toronto-${index}`,
        name: item.location || item.street_name || 'Toronto Street',
        type: item.parking_type === 'Paid' ? 'paid' : 'free',
        timeLimit: parseTimeLimit(item.time_limit),
        lat: parseFloat(item.latitude || item.lat),
        lng: parseFloat(item.longitude || item.lng || item.lon),
        rate: parseFloat(item.rate || 0),
        area: 'Toronto',
        source: 'City of Toronto'
      });
    });
  }
  
  return zones.filter(zone => zone.lat && zone.lng);
}

// ========================================
// MAIN FUNCTION - Fetch All Data
// ========================================

export const fetchAllParkingData = async () => {
  console.log('Fetching all parking data from APIs...');
  
  try {
    // Fetch from all sources in parallel
    const [waterlooZones, kitchenerZones, torontoZones] = await Promise.all([
      fetchWaterlooParking(),
      fetchKitchenerParking(),
      fetchTorontoParking()
    ]);
    
    // Combine all zones
    const allZones = [
      ...waterlooZones,
      ...kitchenerZones,
      ...torontoZones
    ];
    
    // Assign sequential IDs
    const zonesWithIds = allZones.map((zone, index) => ({
      ...zone,
      id: index + 1
    }));
    
    console.log(`Total zones loaded: ${zonesWithIds.length}`);
    console.log(`- Waterloo: ${waterlooZones.length}`);
    console.log(`- Kitchener: ${kitchenerZones.length}`);
    console.log(`- Toronto: ${torontoZones.length}`);
    
    return zonesWithIds;
    
  } catch (error) {
    console.error('Error fetching parking data:', error);
    return [];
  }
};

// ========================================
// CACHE FUNCTIONS (optional but recommended)
// ========================================

const CACHE_KEY = 'parking_zones_cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export const getCachedZones = () => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    
    const { zones, timestamp } = JSON.parse(cached);
    const age = Date.now() - timestamp;
    
    if (age > CACHE_DURATION) {
      // Cache expired
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    
    console.log(`Using cached data (${Math.round(age / 1000 / 60)} minutes old)`);
    return zones;
    
  } catch (error) {
    console.error('Error reading cache:', error);
    return null;
  }
};

export const setCachedZones = (zones) => {
  try {
    const cacheData = {
      zones,
      timestamp: Date.now()
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    console.log('Parking zones cached successfully');
  } catch (error) {
    console.error('Error writing cache:', error);
  }
};