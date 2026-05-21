# 🛍️ ShopLux – Premium E-Commerce Store & Dashboard

ShopLux is a modern, high-performance, single-page application (SPA) e-commerce store complete with a robust admin dashboard, user authentication, interactive product catalog, shopping cart, order processing, and analytics dashboard.

Built using **Vanilla JS**, **HTML5**, **CSS3 (Glassmorphism & CSS Variables)**, and a **Node.js/Express** backend backed by **SQLite** (`better-sqlite3`).

---

## 🌟 Key Features

### 🛒 Customer Experience
*   **Dynamic Product Catalog:** View, search, and filter premium products by category.
*   **Fully-Functional Shopping Cart:** Add, remove, and adjust quantities of items with real-time total updates.
*   **Interactive Review System:** Rate products and leave textual reviews.
*   **Order Checkout & History:** Securely place orders with custom shipping details and view order tracking/status.
*   **Secure Authentication:** Responsive Login & Register forms with persistent user sessions via JSON Web Tokens (JWT).

### 📊 Admin Dashboard
*   **Analytics Overview:** Real-time metrics showing total sales, order volume, total active users, and average order value.
*   **Sales Charts & Recent Activities:** Visual tracking of orders and operations.
*   **Product Management:** Add, edit, and delete products (complete with image uploads via Multer).
*   **Order Operations:** View all store orders and update their shipping status (`pending`, `shipped`, `delivered`, `cancelled`).

---

## 🛠️ Technology Stack

*   **Frontend:** HTML5 (Semantic Structure), CSS3 (Modern Glassmorphism, CSS Variables, Responsive Grid/Flexbox), Vanilla JS (Modular State Management & Async Fetch API)
*   **Backend Server:** Node.js, Express.js
*   **Database:** SQLite (`better-sqlite3` database engine)
*   **Authentication:** JWT (JSON Web Tokens) & Password Hashing (`bcryptjs`)
*   **File Uploads:** Multipart Form Data handling (`multer`)

---

## 🚀 Getting Started

### 📋 Prerequisites
Make sure you have the following installed on your machine:
*   [Node.js](https://nodejs.org/) (Version 16.x or higher recommended)
*   `npm` (Node Package Manager)

### ⚙️ Installation & Setup

1.  **Clone the Repository** and navigate to the project directory:
    ```bash
    cd "e commerce"
    ```

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

3.  **Seed the Database**:
    Initialize the SQLite database (`data/ecommerce.db`) and seed it with mock products, categories, users, and orders:
    ```bash
    npm run seed
    ```

4.  **Start the Server**:
    Start the development server (runs via `nodemon` for auto-reloading during development):
    ```bash
    npm run dev
    ```
    
    *For production environments, run:*
    ```bash
    npm start
    ```

5.  **Access the Application**:
    Open your browser and navigate to:
    👉 **[http://localhost:5000](http://localhost:5000)**

---

## 🔑 Test Accounts & Credentials

To easily explore customer and administrator features, you can log in with the following pre-seeded accounts:

### 👤 Customer Account
*   **Email:** `john@example.com`
*   **Password:** `user123`

### 🛡️ Admin Account (Accesses Dashboard)
*   **Email:** `admin@shop.com`
*   **Password:** `admin123`

---

## 🛣️ API Routes & Endpoints

All API endpoints are prefixed with `/api`.

### 🔐 Authentication (`/api/auth`)
*   `POST /register` – Register a new customer
*   `POST /login` – Log in a user and return a JWT + profile data
*   `GET /me` – Retrieve current authenticated user profile (requires token)

### 📦 Products (`/api/products`)
*   `GET /` – Fetch all products (supports search, category, and sorting filters)
*   `GET /categories` – Fetch all product categories
*   `GET /:id` – Fetch a single product by ID
*   `POST /` – [Admin Only] Create a new product (handles image upload)
*   `PUT /:id` – [Admin Only] Update product details
*   `DELETE /:id` – [Admin Only] Delete a product

### 🛒 Cart (`/api/cart`)
*   `GET /` – Retrieve user's cart items
*   `POST /` – Add product to cart or update its quantity
*   `PUT /:id` – Update cart item quantity
*   `DELETE /:id` – Remove item from cart
*   `DELETE /` – Clear cart

### 📋 Orders (`/api/orders`)
*   `GET /` – Fetch orders (returns all for Admins; returns user-specific orders for Customers)
*   `POST /` – Place a new order (clears cart and deducts stock)
*   `PUT /:id/status` – [Admin Only] Update status of an order (`shipped`, `delivered`, etc.)

### 📊 Dashboard Metrics (`/api/dashboard`)
*   `GET /summary` – [Admin Only] Fetch overall metrics (sales, users, stock)
*   `GET /sales-chart` – [Admin Only] Fetch sales data grouped by date/period

---

## 📁 Project Structure

```text
├── data/              # SQLite database storage (ecommerce.db)
├── uploads/           # Product image uploads
├── public/            # Frontend static assets
│   ├── css/           # CSS files (styling & themes)
│   ├── js/            # Client-side JavaScript (app logic, routing, auth)
│   └── index.html     # Application HTML shell
├── server/            # Node.js backend
│   ├── middleware/    # Auth and admin validation middlewares
│   ├── routes/        # Express API endpoints
│   ├── database.js    # SQLite Database connection & table setup
│   ├── index.js       # Main server entrypoint
│   └── seed.js        # Seed script for initial store data
├── package.json       # Project configuration and packages
└── requirements.txt   # File listing package requirements
```
