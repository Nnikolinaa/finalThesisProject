Final Thesis Project: Supercar Rental System

🚀 Project Overview

This repository contains the complete implementation of a modern, technology-driven supercar rental system. Developed as a Bachelor Diploma Thesis project, its primary goal is to streamline operational processes for high-value vehicle rentals, enhance security, and significantly improve customer satisfaction within the luxury and supercar sector.

The system addresses the unique challenges of luxury car rentals, such as specialized maintenance,  security requirements, and high client expectations for exclusivity and personalized service. It replaces conventional, generic rental systems with a robust, digital solution designed for efficiency, transparency, and an unparalleled user experience.

✨ Key Features

Centralized Management: A robust backend API and database for efficient storage and management of vehicle fleet information, registered users, and reservations.

Intelligent Planning: Integration with external data sources (e.g., OpenStreetMap Nominatim API for reverse geocoding, potential weather data) to optimize rental planning and provide location-aware services.

Intuitive User Interface: An elegant, responsive, and user-friendly frontend application tailored to reflect the premium nature of the service and provide a seamless booking experience.

Enhanced Security: Implemented security protocols to protect high-value assets and sensitive client data.

Process Automation: Automation of key rental processes to reduce operational costs and increase business transparency.

🛠 Technologies Used

This project leverages a modern tech stack to ensure high performance, scalability, and maintainability.

Backend

Runtime Environment: Bun

Chosen for: Exceptional speed, all-in-one tooling (bundler, transpiler, package manager), native support for web standards, and Node.js API compatibility.

Programming Language: TypeScript

Chosen for: Type safety, static error checking, and improved code quality.

ORM (Object-Relational Mapper): TypeORM

Chosen for: Type-safety with TypeScript, reduction of boilerplate SQL, easy management of database relationships, and powerful database migration tools.

Database: MySQL

Chosen for: Robustness, reliability, and wide industry adoption.

API Architecture: RESTful API

Based on: Standard HTTP methods (GET, POST, PUT, DELETE) for resource manipulation.

Frontend
Framework: Vue.js 3

Chosen for: Reactivity, component-based architecture, and a gentle learning curve for efficient development of dynamic user interfaces.

Development & Bundling Tool: Vite

Chosen for: Extremely fast server startup, Hot Module Replacement (HMR) for rapid development, and efficient production builds with Rollup.

Mapping Library: Leaflet.js

Chosen for: Lightweight, open-source, and mobile-friendly interactive map visualization.

Geocoding/Reverse Geocoding: OpenStreetMap Nominatim API

Used for: Converting geographic coordinates into human-readable location names for map display and logging.

Styling & UI: Bootstrap 5

HTTP Client: Axios

Authentication: jwt-decode (for JWT token decoding on the client-side)

📂 Project Structure
The project is organized into two main directories:

backend/: Contains all the code for the Node.js (Bun) API, database interactions (TypeORM), and business logic.

frontend/: Contains the Vue.js web application, including components, views, and static assets.

⚙️ Setup and Installation
To get the project up and running on your local machine, follow these steps:

Prerequisites
Node.js (LTS version recommended for development, though Bun is used for runtime, Node.js npm/yarn might be needed for initial dependency installation)

Bun (install instructions: curl -fsSL https://bun.sh/install | bash or npm install -g bun)

MySQL Server (or access to a MySQL database)

Git

1. Clone the Repository
git clone [https://github.com/Nnikolinaa/finalThesisProject.git](https://github.com/Nnikolinaa/finalThesisProject.git)
cd finalThesisProject

2. Backend Setup
Navigate into the backend directory:

cd backend

Create a .env file by copying the example and filling in your database credentials and other sensitive information:

cp .env.example .env

Open the newly created .env file and replace the placeholder values with your actual configuration:

# .env (example content)
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USERNAME=your_mysql_user
DATABASE_PASSWORD=your_mysql_password
DATABASE_NAME=supercar_rental_db
JWT_SECRET=your_strong_jwt_secret_key_here # MAKE THIS A LONG, RANDOM STRING
PORT=3000

Install backend dependencies using Bun:

bun install

Run database migrations to set up your database schema:

# You'll need to check your TypeORM setup for the exact migration command.
# It's often something like:
bun run typeorm migration:run
# Or if you have a custom script in package.json:
bun run migrate

*(Note: You might need to adjust the typeorm command based on your package.json scripts or TypeORM configuration.)

Start the backend API server:

bun run dev

The backend server should now be running, typically on http://localhost:3000.

3. Frontend Setup
Open a new terminal window/tab and navigate back to the root of the project, then into the frontend directory:

cd ..
cd frontend

Install frontend dependencies:

npm install # or 'yarn install' if you use yarn

Start the frontend development server:

npm run dev # or 'yarn dev'

The frontend application should now be running, typically on http://localhost:5173.

🚀 Usage
Once both the backend and frontend servers are running:

Open your web browser and navigate to the address where the frontend is running (e.g., http://localhost:5173).

You should be able to register a new user, browse available supercars, view details, and proceed with the booking process.

Explore the various features like centralized vehicle management, location display, and reservation handling.
