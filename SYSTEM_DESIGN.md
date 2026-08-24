# System Architecture & Technical Design

## Tech Stack
- **Frontend / Mobile App:** React Native with Expo (TypeScript)
- **Backend API:** Node.js with Express (TypeScript)
- **Database:** PostgreSQL (with an ORM like Prisma or Sequelize)
- **Authentication:** JWT-based auth (or Firebase Auth if preferred later)
- **Push Notifications:** Expo Push Notifications service
- **File Storage:** AWS S3 (or similar) for document and image uploads (RC, invoices, etc.)

## Project Structure
We will adopt a two-tier repository structure:
- `/mobile` - React Native (Expo) codebase
- `/backend` - Node.js Express API codebase

## Core Entities & Database Schema (Draft)

1. **User**
   - id, name, email, password_hash, role (Owner, Fleet Manager, Driver, Admin), created_at

2. **Vehicle**
   - id, user_id (Owner/Fleet), make, model, year, license_plate, current_odometer, created_at

3. **FuelRecord**
   - id, vehicle_id, date, liters, cost, odometer_reading, average_kmpl, cost_per_km, created_at

4. **ServiceRecord**
   - id, vehicle_id, date, odometer, service_type, service_center, cost, notes, created_at

5. **Document**
   - id, vehicle_id, doc_type (RC, PUC, Insurance, Invoice), file_url, expiry_date, created_at

6. **Reminder / Alert**
   - id, vehicle_id, type (Service, PUC, Insurance, Part Replacement), due_date, due_km, status, created_at

## Next Steps for Initialization
1. Initialize the **Node.js/Express** backend with TypeScript and Prisma.
2. Initialize the **Expo React Native** app.
3. Establish the database connection and run the initial migrations.
