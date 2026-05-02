# ParkTrack KW - Intelligent Parking Management System

## 🅿️ Project Overview

**ParkTrack KW** is a modern, real-time parking management app designed for the Kitchener-Waterloo region. It helps users find available parking, track parking sessions, set timers, receive notifications, and manage their parking history—all in one intuitive application.

The app features interactive mapping, live geolocation tracking, intelligent parking zone detection, and session management with automated warnings. Perfect for urban drivers who want to avoid parking tickets and manage their parking efficiently.

---

## ✨ Key Features

### 🗺️ **Interactive Parking Map**
- Real-time map visualization using MapLibre GL
- OpenStreetMap base layer with parking zone overlays
- Color-coded parking zones:
  - **🟢 Green**: Free parking
  - **🟡 Yellow**: Paid parking
  - **🔴 Red**: No parking zones
  - **🟣 Purple**: Permit-only parking
- Click zones to view detailed information and start timers

### 📍 **Live Location Tracking**
- Real-time GPS tracking with heading arrow indicator
- Current location marker with directional indicator
- Automatic map centering on your location
- High-accuracy geolocation support

### 🔍 **Smart Destination Search**
- Search for streets, landmarks, and addresses
- Distance-based result sorting (nearest first)
- Quick navigation to search destination
- Location-aware search within Kitchener-Waterloo region

### ⏱️ **Intelligent Parking Timer**
- Automatic time limit detection based on zone type
- Default 3-hour limit for free parking (KW regulation)
- Custom timer duration for flexibility
- Real-time countdown display
- Hours:Minutes:Seconds format

### 🚨 **Smart Notifications & Warnings**
- **10-minute warning**: Alert when parking time is running out
- **Expiration alert**: Notification when time expires
- **Overtime tracking**: Shows how long you've exceeded the limit
- **Hazard indicator**: Yellow triangle for paid/ticketed zones
- Browser notifications + in-app notifications

### 🚗 **Find My Car**
- Marks parked car location on map
- Shows direct route from current location to car
- Walking directions integration (Google Maps)
- Driving directions integration (Google Maps)
- Real-time distance display to parked vehicle

### 📊 **Parking History**
- Complete log of all parking sessions
- Start/end times and actual duration
- Zone information and rates
- Historical data persistence (localStorage)

### 📋 **Ticket Tracking**
- Log parking violations and tickets
- Store ticket details and dates
- Reference history for future parking decisions

---

## 🛠️ Technology Stack

### **Frontend Framework**
- **React 19** - Modern UI library with hooks and concurrent features
- **React Scripts 5** - Create React App build tooling

### **Mapping & Location**
- **MapLibre GL 5.18** - Open-source map rendering engine
- **OpenStreetMap** - Free, open-source map tiles
- **Browser Geolocation API** - Native GPS tracking

### **APIs & Services**
- **LocationIQ** - Geocoding and destination search API
- **ArcGIS REST API** - Parking zone data and geometry
- **Google Maps** - Directions integration

### **UI Components & Icons**
- **Lucide React 0.575** - Beautiful, consistent icon library
- **CSS-in-JS** - Custom styling with React inline styles

### **Data Management**
- **Axios** - HTTP client for API requests
- **LocalStorage** - Client-side data persistence for history/sessions

### **Development Tools**
- **React Testing Library** - Component testing
- **Webpack** - Module bundling (via React Scripts)

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 14+ and npm/yarn
- **Modern browser** with GPS and notification support
- **LocationIQ API key** (free tier available at https://locationiq.com)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/parktrack-kw.git
   cd parktrack-kw
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` and add your LocationIQ API key:
   ```
   REACT_APP_LOCATIONIQ_API_KEY=your_api_key_here
   ```

4. **Start the development server**
   ```bash
   npm start
   ```
   The app will open at `http://localhost:3000`

---

## 📖 How to Use

### **Finding Parking**

1. **Open the app** → You'll see the interactive parking map centered on your location
2. **View parking zones** → Different colors indicate parking type (green=free, yellow=paid, etc.)
3. **Click a zone** → See detailed information: time limits, rates, rules, and source
4. **Click "Start Timer"** → Begin a parking session automatically set to the zone's time limit

### **Starting a Parking Session**

1. **Method 1 - Direct from zone**: Click a parking zone → Click "Start Timer"
2. **Method 2 - Custom duration**: Click "Custom Timer" to set any duration in minutes
3. The timer will:
   - Display countdown in HH:MM:SS format
   - Show remaining time in the side panel
   - Turn yellow when ≤10 minutes remain
   - Switch to overtime display when time expires

### **Receiving Alerts**

The app will automatically notify you when:
- **10 minutes remain** → A popup appears with a dismissible alert
- **Time expires** → Another alert informs you overtime is active
- Browser notifications will also appear (requires permission)

### **Finding Your Car**

1. **Click "Find my car"** in the active session panel
2. A **blue dashed line** will draw from your location to the parked car
3. **Click "Walking directions"** or **"Driving directions"** to open Google Maps
4. **Click "Hide My Car Route"** to return to normal map view

### **Searching for a Destination**

1. **Use the search bar** at the top of the map
2. Enter a street name, landmark, or address
3. **Results sorted by distance** to your current location
4. **Click a result** to:
   - See it highlighted on the map
   - View nearby parking zones
   - Start a parking session nearby

### **Reviewing History**

1. **Click the "History" tab** at the top
2. View all previous parking sessions in reverse chronological order
3. See start time, duration, zone name, and rates
4. Reference past parking to plan future trips

### **Logging Tickets**

1. **Click the "Tickets" tab** at the top
2. **Click "Add Ticket"** to log a violation
3. Enter ticket details: date, amount, location
4. Access your ticket history for reference

---

## 📝 Features Roadmap

### Coming Soon 🔜
- [ ] Real-time parking availability prediction
- [ ] Integration with municipal parking sensors
- [ ] Multiple parking zone support (Toronto, Vancouver, etc.)
- [ ] Mobile app (React Native)
- [ ] SMS notifications
- [ ] Multiple vehicle tracking
- [ ] Parking cost calculator
- [ ] Integration with popular navigation apps (Waze, Apple Maps)

---

## Acknowledgments

- **MapLibre GL** - Open-source map rendering
- **OpenStreetMap** - Free map data
- **LocationIQ** - Geocoding service
- **ArcGIS** - Parking zone data
- **Lucide React** - Icon library

---

**Built with ❤️ for urban drivers. Happy parking! 🚗**
