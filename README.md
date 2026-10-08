# TODO BOARD

A calm Kanban board for today’s work, built with **React** and **Vite**.

---

## Philosophy

**TODO BOARD** stays focused and private:

* **Tab session:** Tasks are saved in `sessionStorage` so a refresh keeps your board, and closing the tab clears it.
* **Privacy:** No accounts, no server, no tracking.
* **Day sprint:** Plan lightly, finish what matters, start clean tomorrow.

---

## Features

- Kanban columns: Backlog, In Process, Blocked, Finished
- Ticket numbers (TD-1, TD-2, …) on every task
- Create tasks with priority (P0–P3), optional parent, notes, effort (hours), and linked tasks
- Drag tasks between columns, or use the Move control on each card
- Parent/child rules: parents cannot finish until children are finished; blocking a child blocks ancestors
- Circular parent relationships are rejected
- Light, dark, and system theme (session only)
- Dismissable how-to guide (restore from the menu)

---

## Local development

### Prerequisites

[Node.js](https://nodejs.org) installed.

### Setup

1. Clone the repository and enter the project directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173/`.
4. Lint (optional):
   ```bash
   npm run lint
   ```
5. Tests:
   ```bash
   npm test
   ```

---

## Deployment

The app is a static Vite build with no backend. Deploy the `dist/` folder to any static host.

## License

This project is open-source and free to use under the [MIT License](LICENSE).
