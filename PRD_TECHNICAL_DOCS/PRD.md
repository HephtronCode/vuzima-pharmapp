# Product Requirements Document (PRD): Kemia

- Version: 1.0
- Status: In Review
- Authors: Gabriel Agana & Babatunde Abubakar
- Last Updated: 22/02/2025

## 1. Overview & Strategic Vision

### 1.1 The Problem: The High Cost of Manual Pharmacy Management Across Africa

Africa's community and hospital pharmacies operate under constant pressure. They are critical
healthcare providers yet rely on archaic processes for their most crucial function: inventory
management. This leads to predictable, costly, and dangerous failures such as:

- Stock-outs of fast-moving, essential drugs lead to lost revenue and erode patient trust.
- Unknowing dispensation of expired drugs poses a significant public health risk.
- Lack of data-driven insights into consumption patterns, reorder points, and real stock value
  creates immense financial waste and operational inefficiency.
- If the owner of a retail pharmacy is overseas and wants to manage the business from abroad,
  they should be able to quickly check their sales and financials on their phone easily, like a
  dashboard summary.

### 1.2 The Solution: Vuzima - The Intelligent Pharmacy OS

Kemia is a cloud-based, offline-first Pharmacy Operations System designed for the unique
infrastructure challenges of the African market. It provides a simple, intuitive, and powerful
platform that empowers pharmacies to track inventory, automate key supply chain calculations,
and receive intelligent alerts to prevent costly errors.

#### 1.2.1 Brand Brief: Why "Vuzima"?

The name Vuzima is a portmanteau (blend) of the Bantu root "-zima" and the modern tech
prefix "V".

- The Core: Derived from Uzima (Swahili/Kinyarwanda/Kirundi), meaning Life, Vitality, and
  Fullness.
- The Meaning: It signals that our startup isn't just about "not being sick" - it's about living a
  full, vibrant life.
- The Pan-African Edge: While we are starting in Ghana, using a Bantu-root word gives us an
  easy bridge to East and Central African markets later. It sounds indigenous but travels well.
- The Logic: The "V" prefix is often associated with Vitality, Virtual, and Velocity. In tech
  branding, "V" names often feel like Silicon Valley-style startups (think Vroom or Vimeo).

### 1.3 Strategic Vision (Crawl, Walk, Run)

Our vision extends beyond a simple inventory tool. We are building the foundational platform
for a comprehensive Meditech ecosystem in Africa.

- Crawl (Current Focus): Perfect the pharmacy inventory and stock management module
  (Vuzima).
- Walk (Phase 2): Expand into a full Hospital Management System (HMS), integrating Kemia with
  modules for patient records, billing, and appointments.
- Run (Phase 3): Launch interconnected solutions for laboratory management (LIMS) and
  specialist clinics, creating a unified healthcare software suite.

## 2. Target Audience & Personas

- Primary (MVP Focus):
  - Community Pharmacies: Owner-operated or small chains (1-5 branches).
  - Hospital Pharmacies: Small to mid-sized hospitals requiring precise inventory control.
- Secondary (Post-MVP):
  - Wholesale Drug Distributors: Requiring robust inventory and sales management.
  - Governmental Health Agencies: For tracking drug distribution and availability.

## 3. Core Features (MVP)

### 3.1 Inventory Command Center

- Drug Onboarding: Add drug profiles with granular detail: Brand Name, Generic Name, Batch
  Number, Expiry Date, Supplier, Cost Price, Selling Price.
- Real-Time Tracking: A centralized view of Quantity in Stock.
- Movement Ledger: A detailed, immutable log of all stock movements (sales, inter-branch
  transfers, supplier returns, expired stock write-offs).

### 3.2 Expiry Management Engine (Critical)

- Tiered Alert System: Automatic, configurable alerts are triggered at critical expiry windows:
  90 days, 30 days, and 7 days out.
- Multi-Channel Notifications: In-app push notifications, email summaries, and SMS
  notifications for critical alerts.

### 3.3 Predictive Reordering & Stock-Out Prevention

- Threshold Setting: Users set a minimum stock level (Reorder Level) for each drug.
- Low-Stock Alerts: Automatic alerts trigger when stock falls below this threshold.
- Intelligent Reorder Suggestions: The system suggests an optimal reorder quantity based on
  the Reorder Point (ROP) formula: $ROP = (Average\ Daily\ Usage x Supplier\ Lead\ Time\ in\ Days)
  + Safety\ Stock$. The UI will allow users to input Lead Time and Safety Stock values per drug
  or per supplier.

### 3.4 Automated Consumption Analytics Engine

- The system passively calculates and displays key metrics in the background:
  - Average Weekly Consumption.
  - Average Monthly Consumption (AMC).
  - Months of Stock Remaining (Current Stock / AMC).

### 3.5 Reporting & Analytics Dashboard

- A simple, visually intuitive dashboard providing at-a-glance insights: Total Stock Value,
  Fast/Slow-Moving Drugs, and Value of Stock Expiring Soon.
- Exportable Reports: All reports must be exportable to PDF, Excel, and CSV.

### 3.6 Mobile-First Stock Auditing Module

A seamlessly integrated mobile/tablet module for rapid stock-taking.

- Workflow: Staff logs in, selects a section, views an offline drug list, enters physical counts
  (with optional barcode scanning support), and submits.
- Reconciliation: The system generates a Discrepancy Report for admin approval before
  inventory levels are updated. All entries are timestamped and tied to the user for
  accountability.

### 3.7 Vuzima AI Agent (v1.0 - The Forecaster)

- Objective: To introduce a lightweight, predictive layer that provides proactive insights,
  turning data into foresight.
- Feature 1: Demand Forecasting:
  - The agent analyzes historical consumption data (AMC, daily usage patterns, seasonality)
    to generate a 30-day demand forecast for the top 20% of fast-moving drugs.
  - This forecast will be displayed on the dashboard, for example: "Predicted demand for
    Paracetamol in the next 30 days: 1,350 tablets (a 12% increase from last month)."
- Feature 2: Anomaly Detection:
  - The agent monitors real-time sales data and flags unusual activity.
  - Example Alerts: "Unusual Spike: Sales of Drug X are 300% higher than the daily average.
    This could indicate a community health outbreak or a prescription trend." or "Dead Stock
    Alert: Drug Y has had zero sales in the last 60 days. Consider a promotional discount or
    supplier return."
- Technical Implementation: This will be a lightweight model (for example, using time-series
  analysis like ARIMA or simpler regression models) that runs as a background process daily or
  weekly. It will not require heavy computational resources for the MVP.

## 4. Non-Functional Requirements

### 4.1 Performance & Reliability

- Offline-First Architecture: Core functions (sales logging, stock-taking) must work seamlessly
  offline. Data syncs automatically when a connection is restored. This is a primary
  competitive advantage.
- Lightweight UI/UX: The interface will be clean, intuitive, and minimalist to ensure speed and
  ease of use.
- Efficient Backend:
  - Utilize a scalable SQL database like PostgreSQL.
  - Employ Redis for aggressive caching of frequently accessed data (drug lists, dashboard
    summaries).
  - All long-running tasks (report generation, AI model runs) must be handled by background
    workers.

### 4.2 Security & Compliance

- Role-Based Access Control (RBAC): Distinct roles must be implemented:
  - Admin/Owner: Full access to financial data, user management, and final approval on stock
    updates.
  - Pharmacist/Staff: Access to operational functions (inventory management, sales, stock-
    taking) with restricted access to sensitive financial data.
- Data Encryption: All sensitive data must be encrypted at rest and in transit.
- Audit Logs: Every critical action (stock update, user deletion, price change) must be recorded
  in an immutable audit trail.
- Regulatory Foresight: The system will be designed with future compatibility for national
  health agency reporting standards in mind.

## 5. Future Feature Enhancements (Post-MVP)

- Supplier & Purchase Order Management: A module to manage suppliers and automate the
  purchase order process.
- Point of Sale (POS): A lightweight POS module to directly link sales with inventory
  depletion.
- Prescription Management (e-Rx): A feature to manage patient prescriptions and send
  automated refill reminders.
- Multi-Branch Management: A centralized dashboard for owners of pharmacy chains to view
  the performance and inventory of all their branches in one place.