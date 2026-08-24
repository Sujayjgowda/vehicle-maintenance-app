# Vehicle Maintenance Management Application

A comprehensive full-stack application designed to help vehicle owners and fleet managers track maintenance activities, fuel consumption, service schedules, and overall vehicle health.

## Project Structure

This project uses a monorepo-style setup containing both the mobile application and the backend API:

- `/backend` - The Node.js API (Express, TypeScript, Prisma, PostgreSQL).
- `/mobile` - The React Native mobile app (Expo, TypeScript).

## Backend Overview

The backend has been fully implemented using a clean layered architecture with TypeScript.

### Tech Stack
- **Node.js & Express:** REST API Framework.
- **TypeScript:** For strict typing and reliability.
- **Prisma ORM:** Database schema management and querying.
- **PostgreSQL:** Primary relational database (hosted on Neon).

### API Modules
The API is divided into the following core modules:
- **Authentication (`/api/auth`)**: JWT-based login and registration.
- **Vehicles (`/api/vehicles`)**: Vehicle profile management.
- **Fuel Tracking (`/api/vehicles/:vehicleId/fuel`)**: Log and track fuel fill-ups.
- **Services (`/api/vehicles/:vehicleId/services`)**: Maintain service history and expenses.
- **Documents (`/api/vehicles/:vehicleId/documents`)**: Track RCs, PUCs, Insurance, etc.
- **Reminders (`/api/vehicles/:vehicleId/reminders`)**: Automated maintenance and expiry alerts.
- **Expenses (`/api/vehicles/:vehicleId/expenses`)**: General expense logging and aggregation.
- **Parts & Repairs**: Track unexpected breakdowns and scheduled component replacements.
- **Service Centers (`/api/service-centers`)**: Location-based directory of favorite service centers.

### Starting the Backend
1. Navigate to the backend directory: `cd backend`
2. Install dependencies (if you haven't): `npm install`
3. Make sure the `.env` file contains your `DATABASE_URL` and `JWT_SECRET`.
4. Run the development server: `npm run dev`

*The backend compiles TypeScript on the fly using `ts-node` or `nodemon`.*

## Mobile App Overview

The mobile frontend is initialized using **Expo** and **React Native**.

### Starting the Mobile App
1. Navigate to the mobile directory: `cd mobile`
2. Install dependencies: `npm install`
3. Start the Expo bundler: `npx expo start`
4. Use the Expo Go app on your phone, or run it on an iOS/Android simulator.

## Next Steps

1. **Frontend Integration:** Build the React Native UI components to consume the backend API endpoints.
2. **Dashboard Prototype:** Develop the Vehicle Health Dashboard to display aggregate data (like upcoming reminders, total expenses, and average fuel economy).
3. **File Storage:** Integrate AWS S3 (or similar) into the backend for actual document/image uploads.
