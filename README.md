# todo-today ☀️

A sleek, zero-persistence, static single-day task tracker built using **React** and **Vite**. 

**todo-today** embraces ephemeral productivity. It is built for developers and creators who want to stay laser-focused on their current daily goals without the baggage of long-term tracking or backlog fatigue.

👉 **Live Demo:** [https://github.io](https://github.io) *(Replace with your actual URL once deployed)*

---

## 🧠 The Philosophy

Unlike traditional productivity apps that store data across sessions, send analytics to the cloud, or let yesterday's uncompleted tasks pile up, **todo-today** operates on a strict single-day rule:

* 🔒 **Zero Persistence:** Everything lives entirely inside your active browser tab's RAM. 
* 🕶️ **Total Privacy:** No databases, no login screens, no tracking cookies, and no `localStorage`.
* 🫧 **Clean Slates:** The moment you close the browser tab or refresh the page, your data is gone forever. You get a completely fresh canvas every morning.

---

## ✨ Features

- **Quick Task Management:** Easily add daily tasks and toggle them as completed with a satisfying line-through effect.
- **Evening Checkout Dashboard:** Live percentage metrics at the bottom track your daily progress (e.g., *Done 3 of 5 items (60%)*).
- **Lightning Fast:** Fast scaffolding with Vite and clean lint checks powered by Oxlint.

---

## 🛠️ Local Development Setup

If you want to clone this project and run it locally on your machine, follow these steps:

### Prerequisites
Make sure you have [Node.js](https://nodejs.org) installed on your computer.

### Installation Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com
   cd todo-today
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   Open your browser and navigate to `http://localhost:5173/` to see the application running live!

4. **Lint your code (Optional):**
   To check for fast, native code quality fixes using Oxlint:
   ```bash
   npx oxlint@latest
   ```

---

## 🌐 Deployment to GitHub Pages

Since the app has no backend server or database, it is designed to be hosted 100% for free on GitHub Pages. The production bundle is minimized into static assets via Vite.

## 📄 License
This project is open-source and free to use under the [MIT License](LICENSE).
