# 🛒 E-commerce Backend API

This is a backend service for an eCommerce application built with **Node.js**, **Express.js**, and **MongoDB**. The backend handles products, categories, and cart functionalities.

---

## 🚀 Deployment

This backend is deployed on **Render**.

**🔗 Base URL:**  
`https://ecom-backend-268t.onrender.com`

---

## 📦 Available APIs

### 1. Get All Categories

**GET** `/api/v1/product/all-categories`  
Returns all available product categories.

---

### 2. Get Products by Category

**GET** `/api/v1/product/products?category=fruits`  
Query products by specific category (e.g., `fruits`, `vegetables`, etc).

---

### 3. Create New Product (Admin)

**POST** `/api/v1/admin/product/new`  
Add a new product (admin-only route). Requires appropriate authorization if implemented.

---

### 4. Add to Cart

**POST** `/api/v1/product/add-to-cart`  
Adds a product to the user's cart.

---

## 🛠️ Installation

Clone the repository and install dependencies:

```bash
git clone <your-repo-url>
cd <project-folder>
npm install
```
