# 🚀 Vyntro - Professional Team Collaboration Guide

This guide outlines the standard operating procedures for the Vyntro development team to ensure smooth collaboration and high-quality code.

---

## 👥 Meet the Team

| Member | Focus Area | GitHub / Contact |
| :--- | :--- | :--- |
| **Vanjara Bipin** | Team Leader, Database Architect | [@BIPINRVANJARA](https://github.com/BIPINRVANJARA) |
| **Brijesh Rabari** | Frontend Lead, UI/UX | [@Brijesh090](https://github.com/Brijesh090) |
| **Rathod Devendrasinh** | Backend (Auth & Products) | [@Rathoddevendrasinh](https://github.com/Rathoddevendrasinh) |
| **Harshil Patel** | Backend (Ops & Ledger) | [@Harshilpatel54](https://github.com/Harshilpatel54) |

---

## 📧 Team Directory

- **Vanjara Bipin**: vanjarabipin32@gmail.com
- **Brijesh Rabari**: brijeshrabari65@gmail.com
- **Rathod Devendrasinh**: vanjarabipin724@gmail.com
- **Harshil Patel**: harshil2009k@gmail.com

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
