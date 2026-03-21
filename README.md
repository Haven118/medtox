# MedTox - PD Toxicology Reports System (Trifinity EMS Integration)

[![Tested](https://img.shields.io/badge/Tested-✅-brightgreen)](http://localhost:3001)

## 🚀 Quick Start
```
# Terminal 1 - Backend API
cd tox-server
npm install
npm start
# Runs on http://localhost:3002

# Terminal 2 - Frontend
cd tox-frontend  
npm install
npm run dev
# Runs on http://localhost:3001
```

Open [http://localhost:3001](http://localhost:3001)

## 📋 EMS User Flow (PD Toxicology Requests)
1. **EMS Login Required** (PD no access):
   - Default: `ems_lab` / `PASS123`
   - [Signup](/signup) for new EMS accounts (EMS role only)

2. **Auto ReportWizard** (/report):
   - Search substance → auto toxTypes/tests/findings
   - PD Case# + Requester (manual)
   - EMS Case# + Analyst (auto)
   - **Generate Forensic PDF** matching LSPD DOCX (analytical table, chart, chain custody)

3. **Example Report**:
   ```
   TRIFINITY EMS MEDTOX LABORATORY REPORT
   EMS Case: EMS-TOX-20241205-1234   PD Case: PD-2024-5678
   
   Substance: Fentanyl
   Tox Type: Urine GC/MS
   PD Requester: Officer Jane Doe
   Tests: Urine GC/MS panel - Opioids...
   Findings: Urine GC/MS analysis of Fentanyl
   Analyst: ems_lab (EMS Lab)  Date: 12/5/2024
   ```

## 🛠 Tech Stack
- **Frontend**: React 18 + Vite + Lucide Icons + html2pdf.js (glassmorphism UI matching medrep)
- **Backend**: Express + in-memory users/auth + CORS
- **Data**: drugs.json (searchable tox DB)
- **API Endpoints**:
  ```
  POST /api/auth/login      (EMS only)
  POST /api/auth/register   (EMS signup)
  GET  /api/auth/me         (token verify)
  GET  /api/tox/search?q=   (drug search)
  ```

## 📱 Screenshots
*(Add production screenshots here)*

```
[Login] → [ReportWizard Auto-fill] → [PDF Download]
```

## 🔒 Security Notes
- EMS-Only: Login blocks PD direct access
- Simple JWT (base64): Production → real JWT + bcrypt + DB
- In-memory users: Persist to file/DB for prod

## 📈 Testing
✅ Login/Signup → Drug search (Fentanyl) → PDF export works perfectly.

**Built for Trifinity EMS/PD toxicology workflow!**
