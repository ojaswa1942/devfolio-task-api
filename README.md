# Backend Task <> 2586 Labs

## [API Documentation](https://documenter.getpostman.com/view/4731543/TVKHUvKz)

# Challenge: Help Mary

## 🏁  The **Mission**

Your task is to design a REST API endpoints for a frontend application that satisfies all requirements below.

## ✅  **Product Requirements**

**You must create a service with the following requirements -**

- An authentication mechanism requiring the users to sign in
- An online shop where the users can order cookies
- The order should be automatically assign to the available delivery executives efficiently
- The system should be able to assign the delivery order to any delivery executive who is already on the way to deliver to another customer in the same area
- Users can track the ETA of the order
- Once the delivery executive marks an order as "delivered", the system should then be able to assign new orders to them
- Implement access control to the API endpoints, allowing authorized users to make a request to the APIs
- Mary as a root user shall have access to all the APIs, and the delivery executive will only be able to make a request to the APIs that are used for fetching the orders and marking an order as delivered while the users can only access their own orders
- A dashboard where Mary can view all the orders with only Mary being authorized to use this dashboard
- Mary can create other root users. Root users can view the dashboard.

## ⚙️  **Tech Requirements**

- Node.js/Golang
- MySQL/PostgreSQL
