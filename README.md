# FuelTrack - 2-Photo Automatic Fuel Tracking MVP

A mobile-first application designed to streamline vehicle fuel and mileage tracking. Instead of manually filling 10+ form fields at the pump, drivers simply capture **2 photos**:

1. **Photo 1: Fuel Meter** &rarr; Extracts volume (L), total sale (₹), and calculates rate (₹/L).
2. **Photo 2: Vehicle Dashboard** &rarr; Extracts current odometer reading (km).

The app automatically fetches GPS coordinates, resolves the nearest fuel station, checks OCR confidence scores, computes trip distance and fuel mileage (km/L), and provides anti-fraud photo evidence.

---

## 🚀 Key Features

* **2-Photo Wizard Flow**:
  * Step 1: Fuel Meter Capture (Scanner with reticles and laser beam).
  * Step 2: Vehicle Odometer Capture.
  * AI / OCR extraction with step-by-step progress checkmarks.
* **Automatic Geocoding**: Detects location and fuel bunk (e.g. *Indian Oil - XYZ Bunk, Kelambakkam, Chennai*).
* **Confidence Scoring & Inline Corrections**: Highlight low-confidence fields with one-tap inline editing without restarting the flow.
* **Anti-Fraud Proof Archive**: Each saved entry stores dual photos alongside tamper-resistant timestamps and coordinates.
* **Fuel Analytics**: Recharts graphs showing monthly expenses, fuel consumption trends, and mileage efficiency curves.
* **Cross-Platform**: Built with React, TypeScript, Tailwind CSS, and Capacitor for Web, Android, and iOS.
* **Automated APK Build**: GitHub Actions workflow generates Android `.apk` artifacts on push.

---

## 🛠 Tech Stack

* **Frontend**: React 19, Vite 8, TypeScript
* **Styling**: Tailwind CSS v4, Lucide Icons
* **State & Persistence**: Zustand with `localStorage`
* **Charts**: Recharts
* **Native Runtime**: Capacitor (@capacitor/core, @capacitor/camera, @capacitor/geolocation, @capacitor/android)
* **CI/CD**: GitHub Actions (Android debug APK generation)

---

## 💻 Getting Started Locally

### 1. Install Dependencies
```bash
npm install --legacy-peer-deps
```

### 2. Start Local Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Production Build
```bash
npm run build
```

---

## 📱 Mobile & Android APK Build

### Native Capacitor Commands:
```bash
# Build web bundle
npm run build

# Sync assets to Android
npx cap sync android

# Open in Android Studio
npx cap open android
```

### Automated GitHub Actions APK Build:
Whenever you push to `main`, the `.github/workflows/build-apk.yml` workflow automatically builds the Android APK and uploads it to GitHub Actions Artifacts under **`FuelTrack-Debug-APK`**.

---

## 📄 License
MIT
