# 🚀 Vyntro - Professional Team Collaboration Guide
*Version 1.0.0 — Established by Vanjara Bipin (Team Leader)*

---

This guide outlines the standard operating procedures for the Vyntro development team to ensure smooth collaboration and high-quality code.

---

## 👥 Meet the Team

| Member | Focus Area |
| :--- | :--- |
| **Vanjara Bipin** | Team Leader, Database Architect |
| **Brijesh Rabari** | Frontend Developer, UI/UX Specialist |
| **Rathod Devendrasinh** | Backend Developer (Auth & Products) |
| **Harshil Patel** | Backend Developer (Operations & Ledger) |

---

## 🌿 Git Branching Strategy

We follow a professional branch-per-feature strategy. **Never push directly to `main`.**

- **Rathod:** `feature/backend-auth-products`
- **Harshil:** `feature/backend-delivery-transfers`
- **Brijesh:** `feature/frontend-ui`
- **Bipin:** `feature/db-schema-setup`

---

## 📋 Daily Workflow

1.  **Sync:** Always run `git pull origin main` before starting your work.
2.  **Develop:** Work on your dedicated branch and folder.
3.  **Commit:** Stage your changes with `git add .` and commit with a clear message.
4.  **Push:** Push your branch: `git push origin <your-branch-name>`.
5.  **Merge:** Open a **Pull Request (PR)** on GitHub. Bipin (Leader) will review and merge into `main`.

---

## 📂 Project Structure Ownership

- `/frontend` → **Brijesh Rabari**
- `/backend` (Auth/Products) → **Rathod Devendrasinh**
- `/backend` (Operations/Ledger) → **Harshil Patel**
- `/database` → **Vanjara Bipin**

---

## ⚠️ Golden Rules

1.  **Pull before Push:** Avoid merge conflicts by staying synced.
2.  **Frequent Commits:** Commit 2-3 times daily to show steady progress.
3.  **Meaningful Messages:** Write messages that explain *why* a change was made.
4.  **Ownership:** Respect fellow developers' folders; coordinate if cross-component changes are needed.
