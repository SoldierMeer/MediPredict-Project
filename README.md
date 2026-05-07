
---
# 🏥 MediPredict: AI-Driven Healthcare Ecosystem

**MediPredict** is a specialized healthcare platform designed to mitigate medication non-adherence. By leveraging a multi-service architecture, the system bridges the gap between patient adherence and caregiver oversight using real-time synchronization and machine learning inference.

---

## 🏗️ System Architecture

MediPredict utilizes a **Microservices-inspired architecture** to separate concerns between user management and high-computational AI tasks.



1.  **Frontend (React/Vite):** Provides a high-fidelity, responsive UI for patients and caregivers.
2.  **Orchestration Layer (Node.js/Express):** Handles authentication, database operations with **MongoDB Atlas**, and coordinates requests to the AI Engine.
3.  **AI Engine (Python/FastAPI):** A dedicated service for processing medication data to infer health conditions and generate dietary insights.

---

## 🚀 Key Features

### **Active Modules**
* **Dual-Role Access:** Dedicated dashboards for Patients and verified Caregivers.
* **Care Circle Linking:** Secure, validated request-response system to link caregivers to patients using unique IDs.
* **Real-Time Adherence Logs:** Instant synchronization of medication intake records.
* **Automated Reminders:** Global state-managed notification popups based on live database schedules.

### **🔮 Future Roadmap**
* **RxNorm Integration:** A complete pharmaceutical database for standardized medication auto-suggestions.
* **Disease Inference Model:** Advanced logic to determine recovery stages based on drug combinations.
* **Precision Nutrition:** AI-generated diet plans tailored specifically to the patient’s medical profile.
* **Multi-Language Support:** Localized interfaces to improve accessibility for diverse user demographics.

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React.js (Vite), Tailwind CSS, Framer Motion, Lucide Icons |
| **Backend** | Node.js, Express.js, JWT Authentication |
| **AI Service** | Python, FastAPI, Uvicorn |
| **Database** | MongoDB Atlas |
| **Hosting** | Vercel (Frontend/Backend) |

---

## ⚙️ Installation & Setup

### **1. Backend (Node.js)**
```bash
cd medipredict-backend
npm install
npm run dev
```
**Required .env:**
`PORT=5000`, `MONGO_URI`, `JWT_SECRET`, `AI_ENGINE_URL=http://127.0.0.1:8000`

### **2. AI Engine (Python)**
```bash
cd medipredict-ai-service
python -m venv venv
source venv/bin/activate  # Or .\venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn ai_service:app --reload --port 8000
```

### **3. Frontend (React)**
```bash
cd medipredict-frontend
npm install
npm run dev
```
**Required .env:**
`VITE_API_URL=http://127.0.0.1:5000`

---

## 🛡️ API Specification

### **Core Backend (Port 5000)**
* `POST /api/auth/login` - Authenticate users.
* `GET /api/requests/my-patients` - (Caregiver) Fetch linked patients.
* `PATCH /api/requests/:id` - (Patient) Accept/Reject link requests.

### **AI Engine (Port 8000)**
* `POST /predict` - Receives medication JSON and returns disease inference.
* `POST /diet-suggest` - Returns dietary recommendations based on health status.

---

## 📜 License
This project is licensed under the **Apache-2.0 License**.

---

### 👨‍💻 Developer Notes
MediPredict was built with a focus on **Type Safety** and **Server-Side Validation**. The decoupling of the AI Engine allows for independent scaling of the machine learning modules without affecting the core availability of the patient tracking system.

*“Predicting your health, protecting your future.”*