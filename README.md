# 🏛️ Chief Minister Samruddha Panchayat Raj Abhiyan (MSPRA) Portal
### *Unified Performance Rankings Dashboard & GP-BDO Comparative Verification Audit System*

---

## 📖 Campaign Overview & Context
Under the **Chief Minister Samruddha Panchayat Raj Abhiyan (MSPRA)**, Gram Panchayats (GPs) across Maharashtra submitted detailed assessments regarding local development, governance, public service delivery, and village-level initiatives. 

These self-reported submissions were verified through extensive field inspections conducted by **Block Development Officers (BDOs)** and Taluka-Level Verification Committees. This portal serves as the official analytical platform to evaluate, rank, audit, and verify these outcomes.

### 📊 Campaign Coverage Stats
* **Districts Coverage**: **34 / 36 Districts** (Mumbai City & Mumbai Suburban are excluded due to lack of rural local bodies).
* **Talukas Coverage**: **345 / 358 Talukas** (13 purely urban Talukas are excluded).
* **Participating Gram Panchayats**: **5,815** out of **27,959** total GPs in Maharashtra.

---

## 🚀 Key Modules & Capabilities

### 📊 1. Performance Ranking Dashboard
Calculates and models block-level performance and shortlist rankings dynamically based on the verified evaluation scores:
* **State, District, and Taluka Rankings**: Compiles relative performance scores of participating Gram Panchayats at all administrative tiers.
* **Selection Planning & Modeling**: Dynamically models and shortlists a configurable number of top performers per Taluka/District (e.g., Top 3, Top 5) for abhiyan reward planning.
* **Score Threshold Parameters**: Filters blocks dynamically based on passing score configurations (e.g., excluding GPs below 80 marks).
* **Top 10 Gram Panchayats**: A dedicated board showcasing the highest-scoring Gram Panchayats in Maharashtra.
* **Best Performer Cards**: Highlights the top two performing Gram Panchayats from each district with gold (`🥇 1st`) and silver (`🥈 2nd`) merit badges.
* **Low-Performing & Comparative Analysis**: Identifies areas needing support and lists Talukas with the highest average scores.

### 🔍 2. GP & BDO Code Search Portal
Facilitates reviews, dispute resolutions, and re-evaluations when complaints or objections are raised regarding inspector assessments:
* **Comparison of Claims vs. Audits**: Side-by-side comparative views of marks claimed by the Gram Panchayat (Self-Assessment) vs. marks awarded by the Block Development Officer (BDO Verified).
* **Detailed Question-wise Analysis**: For every question in the evaluation, users can drill down to inspect:
  * Marks claimed by the GP.
  * Marks awarded by the BDO.
  * Marks deducted during field verification.
  * Reasons for score deductions.
* **Resolution Support**: Allows administrative officers to review assessments digitally when a physical re-inspection is not feasible, enhancing transparency and accountability.

---

## 📋 Portal Information Summary

### Performance Ranking Dashboard
Provides performance rankings of Gram Panchayats participating in the Chief Minister Samruddha Panchayat Raj Abhiyan.

* **Key Features**:
  * State, District, and Taluka-level rankings.
  * Top 10 Gram Panchayats in Maharashtra.
  * Top 2 Gram Panchayats from each district.
  * Statewide ranking of all participating Gram Panchayats.
  * Identification of low-performing Gram Panchayats.
  * Taluka-wise average performance analysis.
  * Support for score-based selection criteria and award selection.
* **Campaign Coverage**:
  * 34 Districts
  * 345 Talukas
  * 5,815 Participating Gram Panchayats

### GP & BDO Code Search Portal
Helps analyze and verify assessment records of Gram Panchayats without requiring immediate physical field visits.

* **Key Features**:
  * Comparison of Gram Panchayat self-assessment and BDO verification scores.
  * Question-wise score analysis.
  * Detailed Gram Panchayat-wise assessment records.
  * Support for complaint review and re-evaluation.
  * Transparent and data-driven verification process.

---

## 🎨 Technology & Architecture
* **Frontend**: HTML5, Vanilla CSS3 (glassmorphism layouts themed with official state colors: Navy Blue `#002a54` and Saffron Orange `#f58220`), and ES6+ JavaScript.
* **Visuals & Charts**: Lucide Icons, ApexCharts.
* **Core Engine**: 100% client-side Excel parsing (`SheetsJS`), running math calculations on thousands of rows in milliseconds with **zero database dependencies** (runs fully offline).

---

## 💻 Getting Started Locally

1. Clone this repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
   cd YOUR_REPOSITORY
   ```
2. Start a local HTTP server:
   ```bash
   python3 -m http.server 8000
   ```
3. Open your browser and navigate to:
   [http://localhost:8000/](http://localhost:8000/)
