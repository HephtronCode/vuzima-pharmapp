# Kemia: MVP Technical Documentation

- Version: 1.0
- Status: Baseline for Development
- Stack: PERN (PostgreSQL, Express.js, React, Node.js), Docker, Shadcn UI/Tailwind CSS,
	GitHub Actions

## 1. Introduction

### 1.1 Purpose

This document provides a detailed technical specification for the Minimum Viable Product (MVP)
of Kemia, an intelligent pharmacy operations system. It is intended for the engineering team to
use as the primary blueprint for development.

### 1.2 MVP Goal

The core objective of the MVP is to deliver a functional, single-pane-of-glass solution that allows
a pharmacy to manage its core inventory. The MVP will enable users to authenticate, perform
full CRUD operations on their drug inventory, and view the total real-time value of their stock on
a basic dashboard. All development will occur within a containerized Docker environment and
be validated by an automated CI pipeline on GitHub.

## 2. System Architecture

The Kemia platform is architected as a containerized, multi-service application managed by
Docker Compose for local development. This ensures environment consistency and prepares
the application for scalable cloud deployment.

### 2.1 Service Components (docker-compose.yml)

- db service: The persistence layer, running an official PostgreSQL image. Data is stored in a
	named Docker volume to ensure it survives container restarts.
- cache service: The in-memory data store, running an official Redis image. Used for caching
	frequently accessed, non-critical data like dashboard summaries.
- api service: The backend application, running a Node.js/Express.js server. It contains all the
	business logic, communicates with the db and cache services, and exposes a RESTful API.
- client service: The frontend web application, built with React (Vite) and styled with Shadcn
	UI/Tailwind CSS. For local development, it runs on Vite's dev server.

## 3. Database Schema (PostgreSQL)

The following tables define the core data model for the MVP. All table names are lowercase and
plural. `created_at` and `updated_at` timestamps are managed automatically by the ORM or
database.

### 3.1 Table: users

Stores user account information and roles.

| Column Name   | Data Type    | Constraints                | Description                         |
| ---           | ---          | ---                        | ---                                 |
| id            | SERIAL       | PRIMARY KEY                | Unique identifier for the user.     |
| email         | VARCHAR(255) | UNIQUE, NOT NULL           | User's unique login email.          |
| password_hash | VARCHAR(255) | NOT NULL                   | Hashed user password (for security).|
| role          | ENUM         | NOT NULL, DEFAULT 'staff'  | RBAC role ('admin', 'staff').       |
| created_at    | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW()    | Account creation timestamp.         |

### 3.2 Table: drugs

The master list of all drug products a pharmacy stocks.

| Column Name   | Data Type     | Constraints                          | Description               |
| ---           | ---           | ---                                  | ---                       |
| id            | SERIAL        | PRIMARY KEY                          | Unique identifier.        |
| brand_name    | VARCHAR(255)  | NOT NULL                             | Commercial name.          |
| generic_name  | VARCHAR(255)  | NOT NULL                             | Active ingredient name.   |
| supplier_id   | INTEGER       | FOREIGN KEY (references suppliers.id)| Primary supplier link.    |
| cost_price    | NUMERIC(10,2) | NOT NULL, DEFAULT 0.00               | Purchase price.           |
| selling_price | NUMERIC(10,2) | NOT NULL, DEFAULT 0.00               | Selling price.            |

### 3.3 Table: inventory_items

Tracks a specific batch of a drug, allowing for expiry and batch management.

| Column Name       | Data Type    | Constraints                        | Description                     |
| ---               | ---          | ---                                | ---                             |
| id                | SERIAL       | PRIMARY KEY                        | Unique identifier for the batch.|
| drug_id           | INTEGER      | NOT NULL, FOREIGN KEY (drugs.id)   | Drug this batch belongs to.     |
| batch_number      | VARCHAR(100) |                                    | Manufacturer's batch number.    |
| expiry_date       | DATE         | NOT NULL                           | Expiration date for the batch.  |
| quantity_on_hand  | INTEGER      | NOT NULL, DEFAULT 0                | Current physical stock.         |

### 3.4 Table: stock_movements

An immutable ledger tracking every change in inventory, crucial for auditing.

| Column Name        | Data Type   | Constraints                                  | Description                          |
| ---                | ---         | ---                                          | ---                                  |
| id                 | SERIAL      | PRIMARY KEY                                  | Unique identifier for the movement. |
| inventory_item_id  | INTEGER     | NOT NULL, FOREIGN KEY (inventory_items.id)   | Specific batch affected.            |
| user_id            | INTEGER     | NOT NULL, FOREIGN KEY (users.id)             | User who performed the action.      |
| movement_type      | ENUM        | NOT NULL ('sale', 'return', 'adjustment')    | Type of stock movement.             |
| quantity_changed   | INTEGER     | NOT NULL                                     | Positive for adds, negative for cuts.|
| timestamp          | TIMESTAMPTZ | NOT NULL, DEFAULT NOW()                      | When the movement occurred.         |

## 4. Backend API - api Service (Node.js/Express.js)

The API is RESTful and uses JSON for all request/response bodies. Authentication is managed
via JSON Web Tokens (JWT).

### 4.1 Authentication (/api/auth)

- POST /login
	- Body:
		```json
		{ "email": "...", "password": "..." }
		```
	- Success: 200 OK. Returns:
		```json
		{ "token": "jwt_token", "user": { "id": "...", "email": "...", "role": "..." } }
		```
	- Error: 401 Unauthorized for invalid credentials.

### 4.2 Drugs (/api/drugs) - Admin Required

- POST /
	- Create a new drug product.
	- Body:
		```json
		{ "brand_name": "...", "generic_name": "...", "supplier_id": "..." }
		```
	- Success: 201 Created. Returns the newly created drug object.
- GET /
	- Retrieve a paginated list of all drug products.
- PUT /:id
	- Update details of a specific drug product.

### 4.3 Inventory (/api/inventory) - Staff/Admin Required

- GET /
	- Retrieve a complete list of `inventory_items` with corresponding drug details.
- POST /movement
	- The core endpoint for tracking changes.
	- Body:
		```json
		{ "inventory_item_id": "...", "user_id": "...", "movement_type": "...", "quantity_changed": 0 }
		```
	- Logic: Updates `inventory_items.quantity_on_hand` and creates a `stock_movements` record
		within a single transaction to ensure atomicity.
	- Success: 200 OK. Returns the updated inventory item.

### 4.4 Dashboard (/api/dashboard) - Admin Required

- GET /summary
	- Retrieves the key metric for the MVP dashboard.
	- Logic: Calculates `SUM(inventory_items.quantity_on_hand * drugs.cost_price)` to get the
		total cost value of stock.
	- Success: 200 OK. Returns:
		```json
		{ "totalStockValue": 12345.67 }
		```

## 5. Frontend Application - client Service (React)

The frontend is a single-page application (SPA) built with React and Vite.

### 5.1 Folder Structure

- /src/components/ui: Houses the Shadcn UI components.
- /src/components/shared: Reusable application components (for example, Navbar, Sidebar).
- /src/pages: Top-level components for each route (for example, LoginPage.jsx, DashboardPage.jsx,
	InventoryPage.jsx).
- /src/lib: Utilities, API service logic.
- /src/hooks: Custom React hooks.

### 5.2 Key User Flows (MVP)

1. Login Flow: LoginPage captures credentials, calls the /api/auth/login endpoint, stores the JWT
	 in local storage or a cookie, and updates the global auth state.
1. Inventory Management Flow: The InventoryPage fetches data from /api/inventory. A modal
	 dialog using Shadcn components is used to add or edit drug information, which calls the
	 relevant API endpoints.

### 5.3 State Management

For the MVP, a simple React Context API is sufficient to manage global application state,
primarily for user authentication status and profile.

## 6. Development & CI/CD Workflow

### 6.1 Local Development Setup

1. Clone the GitHub repository.
1. Ensure Docker Desktop is running.
1. Run `docker-compose up --build` from the root of the project.
1. The React app will be available at http://localhost:5173 (or as configured) and the API will be
	 at http://localhost:3000.

### 6.2 GitHub Actions (ci.yml)

- Trigger: On push to any feature branch or pull request to develop.
- Workflow:
	- Checkout code.
	- Set up Node.js.
	- Cache node_modules for speed.
	- Run `npm install` in both `api` and `client` directories.
	- Run quality checks: `npm run lint` and `npm run test` for the backend API service.
	- This provides an automated quality gate before any new code can be merged into the develop
		branch.