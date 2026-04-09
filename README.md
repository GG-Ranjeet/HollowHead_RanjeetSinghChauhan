# FlickyFest 🎟️

FlickyFest is a hyper-local event discovery and ticketing platform designed for students and event organizers. Whether you're hunting for a high-energy Campus Fest, an intense Tech Hackathon, or a networking workshop, FlickyFest empowers you to discover events within a 10km radius of your location, reserve spots instantly, and store live QR-code tickets.

### Team name ( ID )
Hollow Head ( KPT069 )

### Team members
* Ranjeet Singh Chauhan
* [Aaryan Kumar](https://github.com/AaryanKumar677)
* [Piyush Shukla](https://github.com/PiyushShukla9140)

## 🌟 Key Features

*   **Hyper-Local Discovery:** Utilizes geospatial mapping (`geofire-common`) to display events exclusively within a 10km radius of your physical location or a custom pincode.
*   **Dual-Role Authentication:** Uses Firebase Auth to distinguish between **Attendees** (exploring and booking events) and **Organizers** (creating events and managing dashboards).
*   **Zero-Fraud Booking:** Transactions are rigorously checked on the backend to enforce a "One Ticket Per Attendee" policy, preventing double-bookings.
*   **Live QR Generation:** Successfully generates live QR Tokens via encrypted server transactions using `qrcode.react`, allowing for easy at-the-door scanning setups.
*   **Dynamic Organizer Dashboard:** Track total revenue, tickets sold, and upcoming active event metrics.

## 🏗️ Architecture Stack

This repository uses a decoupled standard client-server paradigm. 

*   **Frontend (`/client`):** React 19, Vite, React Router, Lucide-React, Recharts.
*   **Backend (`/server`):** Node.js, Express, Firebase-Admin, CORS.
*   **Database:** Cloud Firestore (Firebase).
*   **Authentication:** Firebase Authentication (Role Based Access Control).

## 🚀 Getting Started

### Prerequisites
*   Node.js (`v18+` recommended)
*   NPM or Yarn
*   A Firebase Project with Firestore and Authentication enabled.

### Installation & Setup

1. **Clone the repository** (if you haven't already).
2. **Install global dependencies**:
   ```bash
   npm run install:all
   ```
   *This automatically installs dependencies for both the root, client, and server folders!*

3. **Configure Environment Variables**:
   *   Navigate to `/server` and create a `.env` file containing your Firebase Private service credentials.
   *   Navigate to `/client` and create a `.env` file configuring your Firebase SDK variables (`VITE_FIREBASE_API_KEY`, etc.).

4. **Start the Application**:
   Simply run this command from the *root directory*:
   ```bash
   npm run dev
   ```
   *This uses `concurrently` to spin up both the Vite frontend (`localhost:5173`) and the Express Node API (`localhost:5000`) simultaneously.*

## 📸 Platform Workflows

*   **Secure Ticket Modals:** The checkout process is rigorously isolated within a sleek, interactive pop-up. Real-time Firebase endpoints check your user limits before allocating the ticket document and rerouting you to the live QR scanner.
*   **Dynamic Geospatial Feeds:** With Location Services enabled, your home layout instantly calculates proximity maps using pure geolocation queries.

---
*(Platform internally developed as a robust React + Express prototyping ecosystem).*
