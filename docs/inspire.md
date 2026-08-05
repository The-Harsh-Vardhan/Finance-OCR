Viewed inspire.md
Viewed gemini-diagnose.js:300-400

Here are the key architectural inspirations and actionable concepts we can adapt from **Crop Advisory Chain of Thought (CoT) Prompting** ([gemini-diagnose.js](file:///C:/D%20Drive/Projects/Summers%202026/GramIQ%20Internship/Crop%20Disease%20Detection/ml/staging/Zero%20Shot%20Prediction/api/gemini-diagnose.js#L301-L368)) to elevate the **Finance OCR** project:

---

### 1. Out-of-Distribution Abstention & Quality Gate (`is_abstain` / `is_unreadable`)

* **Inspiration from Crop Advisory**: If the image is blurry, dark, non-crop, or visually uninterpretable, the AI sets `"is_abstain": true` with an explicit `"abstain_reason"` rather than returning hallucinated data.
* **Finance OCR Adaptation**:
  * **Image Quality Gate**: When a user uploads a blank page, non-ledger image (e.g. a tractor photo), or an unreadably smudged notebook page, the OCR model should abstain gracefully with:

    ```json
    "is_unreadable": true,
    "abstain_reason": "Page is severely out of focus or does not contain a financial ledger page."
    ```

  * **Prevents Junk Ingestion**: Eliminates fake/hallucinated transactions in the database when non-financial images are uploaded.

---

### 2. Multi-Candidate Digit & Text Ambiguity (`differential_candidates`)

* **Inspiration from Crop Advisory**: Distributes realistic confidence percentages across top 2–3 lookalike diagnoses instead of forcing 95%+ confidence on ambiguous visual evidence.
* **Finance OCR Adaptation**:
  * **Indic Digit & Word Ambiguity**: Handwritten Indic numbers (e.g., 5 vs 6, 7 vs 9 in Devanagari) or local word abbreviations ("खात" vs "खत") can be ambiguous.
  * **Probabilistic Reading Option**: For low-confidence amounts or names, return candidate interpretations so the UI can highlight them for user verification:

    ```json
    "amount": 500,
    "confidence": 0.65,
    "ambiguous": true,
    "candidate_amounts": [500, 600]
    ```

---

### 3. Financial Domain Rules & Anomaly Detection (Inspired by Epidemiological Weather Rules)

* **Inspiration from Crop Advisory**: Uses real-world domain rules (e.g. *Fungal Rust requires >90% humidity; dry weather invalidates rust*) to validate visual findings.
* **Finance OCR Adaptation**:
  * **Agricultural Financial Sanity Rules**:
    1. **Unit & Price Benchmark**: Urea/DAP fertilizer typically costs ₹300–₹1,500/bag. If OCR extracts ₹5,00,000 for 1 bag of fertilizer, flag an anomaly.
    2. **Wage Range Rule**: Daily farm labor wages range ₹200–₹700/day in Indian agriculture.
    3. **Seasonality Rule**: Crop sale income (Cotton/Soybean) predominantly occurs during harvest months (Oct–Feb).
  * Injects an `"anomaly_flags"` array into the transaction output:

    ```json
    "anomaly_flags": ["Line 3: Fertilizer price of ₹45,000/bag is 10x higher than typical market rates."]
    ```

---

### 4. Arithmetic & Ledger Audit Validation (`ledger_health_check`)

* **Inspiration from Crop Advisory**: Uses multi-step reasoning (Step 1 Morphology → Step 2 Candidates → Step 3 Elimination) before producing the final diagnosis.
* **Finance OCR Adaptation**:
  * **Step-by-Step Ledger Audit**:
    * **Step 1 [OCR & Layout]**: Detect rows, columns, and dates.
    * **Step 2 [Line-by-Line Math]**: Sum all extracted expense amounts and income amounts.
    * **Step 3 [Page Math Cross-Check]**: If the handwritten ledger page includes a handwritten total ("एकूण / Total") at the bottom, compare the AI's calculated sum against the handwritten total.
    * **Step 4 [Audit Output]**:

      ```json
      "page_audit": {
        "calculated_total_expense": 14500,
        "written_page_total": 14500,
        "math_verified": true
      }
      ```

---

### 5. Standardized Local Unit Normalization (Inspired by Brand & Dosage Formatting)

* **Inspiration from Crop Advisory**: Normalizes chemical names into active ingredients, exact dosage per Litre/acre, and popular local Indian brand names.
* **Finance OCR Adaptation**:
  * **Local Unit Standardizer**: Automatically maps regional Indic measurement terms used in Indian farming ledgers into standard SI/Agricultural units:
    * `"पोती"` / `"कट्टा"` ➔ `bags`
    * `"एकड"` / `"गुंठा"` ➔ `acres`
    * `"क्विंटल"` / `"क्विंतल"` ➔ `quintal`
    * `"दिवस"` / `"रोज"` ➔ `days` (for labor)

---

### Summary Table: Feature Comparison

| Concept | Crop Advisory CoT | Finance OCR CoT Idea |
| :--- | :--- | :--- |
| **Quality Gate** | Abstain on non-crop/blurry images | Abstain on non-financial/unreadable ledger pages |
| **Ambiguity Handling** | Top 3 candidate diseases with probability | Multi-candidate readings for ambiguous handwritten numbers (e.g. 500 vs 600) |
| **Domain Rules** | Weather & humidity rules for disease validation | Commodity price & wage benchmark rules for sanity checking |
| **Verification** | Visual differential elimination | Handwritten page subtotal vs calculated line item sum cross-check |
| **Localization** | Local Indian brand lookup & dosage per litre | Regional unit mapping (`पोती` ➔ `bags`, `गुंठा` ➔ `acres`) |
