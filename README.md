# SQE_PROJECT

Food Item API: CRUD REST API built with Node.js, Express, and MongoDB. Tested with Postman for Software Quality Engineering (SQE).

## Features
- **Create**: Add new food item (`POST /api/foods`)
- **Read All**: Retrieve all food items with optional category and maxPrice filters (`GET /api/foods`)
- **Read One**: Retrieve specific food item by ID (`GET /api/foods/:id`)
- **Update**: Modify existing food item (`PUT /api/foods/:id`)
- **Delete**: Remove a food item (`DELETE /api/foods/:id`)

## Setup & Run
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the server:
   ```bash
   node server.js
   ```
3. API Base URL: `http://localhost:3000/api/foods`

## Testing
Postman collection is included in `FoodItem_API.postman_collection.json`. Import it into Postman to run automated integration tests.
