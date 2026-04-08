import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

import { db } from '../config/firebase.js';
import admin from 'firebase-admin';

async function test() {
  try {
    console.log("DB status:", !!db);
    const newEvent = {
      title: "Test",
      description: "Test",
      organizerId: "fake123",
      category: "Tech",
      location: new admin.firestore.GeoPoint(parseFloat("28.6139"), parseFloat("77.2090")),
      geohash: "ttnfv",
      addressString: "New Delhi",
      date: admin.firestore.Timestamp.fromDate(new Date("2026-05-01T10:00:00Z")),
      price: 0,
      totalCapacity: 100,
      ticketsSold: 0,
      status: 'published'
    };

    const eventRef = await db.collection('events').add(newEvent);
    console.log("Success! ID:", eventRef.id);
  } catch (err) {
    console.error("Firestore Error:", err);
  }
}
test();
