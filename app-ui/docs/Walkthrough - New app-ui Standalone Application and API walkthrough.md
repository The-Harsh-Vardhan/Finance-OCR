# Walkthrough: New "app-ui" Standalone Application & API

Created a new standalone application directory at [app-ui](file:///C:/D%20Drive/Projects/Summers%202026/GramIQ%20Internship/Finance%20OCR/app-ui) that follows the user interface from the prompt screenshot and implements the backend OCR scanning API returning responses formatted according to the target JSON schema.

## Summary of Completed Work

1. **Created Standalone App (`app-ui`)**:
   - Built a complete Vite + React 19 + TypeScript + Express application in `C:\D Drive\Projects\Summers 2026\GramIQ Internship\Finance OCR\app-ui`.
   - Leaves existing APIs, databases, and code strictly untouched.

2. **Implemented API Response Contract (`POST /api/scan`)**:
   - `server.js` serves the OCR API endpoint returning the requested JSON format:
     ```json
     {
       "success": true,
       "message": "Receipt scanned successfully",
       "data": {
         "scan_id": "SCAN_982734",
         "summary": {
           "total_entries": 5,
           "expense_count": 3,
           "income_count": 2,
           "total_expense": 3200,
           "total_income": 5600
         },
         "selected_crop": {
           "user_crop_id": 101,
           "crop_name": "Maize",
           "season": "Kharif",
           "year": 2026,
           "image_url": "https://cdn.gramiq.ai/crops/maize.png"
         },
         "expenses": [
           {
             "expense_category_id": 1,
             "expense_category_name": "Fertilizer",
             "expense_category_image": "https://cdn.gramiq.ai/icons/fertilizer.png",
             "amount": 2200,
             "date": "2026-06-15",
             "note": "Urea 1 bag from Krishi Kendra",
             "user_crop_id": 101
           },
           {
             "expense_category_id": 2,
             "expense_category_name": "Labour",
             "expense_category_image": "https://cdn.gramiq.ai/icons/labour.png",
             "amount": 1000,
             "date": "2026-06-15",
             "note": "",
             "user_crop_id": 101
           },
           {
             "expense_category_id": 3,
             "expense_category_name": "Irrigation",
             "expense_category_image": "https://cdn.gramiq.ai/icons/irrigation.png",
             "amount": 0,
             "date": "2026-06-15",
             "note": "",
             "user_crop_id": 101
           }
         ],
         "income": [
           {
             "income_category_id": 11,
             "income_category_name": "Sale of Crop",
             "income_category_image": "https://cdn.gramiq.ai/icons/sale_crop.png",
             "amount": 5000,
             "date": "2026-06-15",
             "note": "Maize sold at Akola Mandi",
             "user_crop_id": 101
           },
           {
             "income_category_id": 12,
             "income_category_name": "Government Subsidy",
             "income_category_image": "https://cdn.gramiq.ai/icons/subsidy.png",
             "amount": 600,
             "date": "2026-06-15",
             "note": "",
             "user_crop_id": 101
           }
         ]
       }
     }
     ```

3. **Recreated Full 7-Screen UI Flow**:
   - **Screen 1 (Farm Profit Dashboard)**: Top dark purple header, crop pills selector ("All Crops", "Tomato", "Rice", "Cotton", "Wheat", "Mustard"), Donut chart with breakdown (Cost of Cultivation, Income, Net Profit), interactive Expenses & Income lists with category icons and add/edit buttons, Per Crop breakdown, and floating camera action button.
   - **Screen 2 (Add Photo Modal)**: Bottom sheet modal with "Take photo" and "Upload from gallery", sample receipt quick selector, and best reading guidelines.
   - **Screen 3 (Scan Finance Page)**: Receipt canvas with animated blue bounding box overlays over detected financial lines and "Read page" AI trigger button.
   - **Screen 4 (Reading Progress)**: Animated loading state ("GramIQ is reading your hisaab...").
   - **Screen 5 (Check What We Found)**: Editable entry cards with category dropdowns, amount inputs, date pickers, season badges, note inputs, crop switcher, and "Confirm & add X entries".
   - **Screen 6 (Success Confirmation)**: "5 entries added" checkmark confirmation showing expenses & income added metrics.
   - **Raw JSON Inspector Modal**: Interactive toggle in top right header to directly inspect the raw API JSON output.

## Verification Results

- **Production Build**: `npm run build` executed successfully without errors (`built in 4.22s`).
- **API Test**: Tested `POST http://localhost:3001/api/scan` via `Invoke-RestMethod` and confirmed 100% schema match.

## How to Run `app-ui`

From the terminal:
```bash
cd "C:\D Drive\Projects\Summers 2026\GramIQ Internship\Finance OCR\app-ui"
npm run server   # Starts backend API on http://localhost:3001
npm run dev      # Starts Vite UI on http://localhost:3000
```
