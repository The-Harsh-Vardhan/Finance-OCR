# Implementation Plan: New "app-ui" Page & API for Finance OCR

Build a new standalone web application page in `C:\D Drive\Projects\Summers 2026\GramIQ Internship\Finance OCR\app-ui` that implements the farm finance user interface shown in the screenshot, along with a dedicated OCR scanning API endpoint that returns responses formatted strictly according to the specified JSON schema.

## User Review Required

> [!IMPORTANT]
> - A new standalone application directory will be created at `app-ui` without modifying the existing APIs, backend, or database.
> - The new backend API route (`/api/scan`) inside `app-ui` will use the existing `GEMINI_API_KEY` from `.env` to analyze handwritten/printed receipts using Gemini Vision OCR and output the exact target JSON structure requested.
> - A "View Raw JSON Response" modal/button will be included in the UI so you can inspect the exact JSON payload returned by the API during scanning.

## Proposed Changes

### New Standalone Application Directory: `app-ui`

#### [NEW] [package.json](file:///C:/D%20Drive/Projects/Summers%202026/GramIQ%20Internship/Finance%20OCR/app-ui/package.json)
- React 19 + TypeScript + Vite setup.
- Dependencies: `lucide-react`, `express`, `cors`, `dotenv`.
- Dev scripts for running both the backend API server and Vite frontend seamlessly.

#### [NEW] [server.js](file:///C:/D%20Drive/Projects/Summers%202026/GramIQ%20Internship/Finance%20OCR/app-ui/server.js)
- Express API server running on port 3001 (or proxied via Vite).
- Route `POST /api/scan`:
  - Receives uploaded receipt image (base64 or multipart).
  - Calls Gemini 2.0 Vision API using `GEMINI_API_KEY` (loaded from `../.env`).
  - Processes extracted financial entries (Fertilizer, Labour, Crop Sales, Subsidies, etc.) and formats them into the exact required JSON structure:
    ```json
    {
      "success": true,
      "message": "Receipt scanned successfully",
      "data": {
        "scan_id": "SCAN_...",
        "summary": { "total_entries": 5, "expense_count": 3, "income_count": 2, "total_expense": 3200, "total_income": 5600 },
        "selected_crop": { "user_crop_id": 101, "crop_name": "Maize", "season": "Kharif", "year": 2026, "image_url": "..." },
        "expenses": [ ... ],
        "income": [ ... ]
      }
    }
    ```
  - Includes fallback/demo sample parser to ensure reliable 100% working demo even if image is sample data.

#### [NEW] [index.html](file:///C:/D%20Drive/Projects/Summers%202026/GramIQ%20Internship/Finance%20OCR/app-ui/index.html)
- Main HTML entry point with mobile viewport settings and modern Google Fonts (Inter / Outfit).

#### [NEW] [src/index.css](file:///C:/D%20Drive/Projects/Summers%202026/GramIQ%20Internship/Finance%20OCR/app-ui/src/index.css)
- Comprehensive modern design system matching the dark blue top header, vibrant cards, crop pills, entry list items, bottom sheets, and responsive mobile container.

#### [NEW] [src/types.ts](file:///C:/D%20Drive/Projects/Summers%202026/GramIQ%20Internship/Finance%20OCR/app-ui/src/types.ts)
- TypeScript interfaces matching the target response structure (`ScanResponse`, `ExpenseItem`, `IncomeItem`, `SelectedCrop`, `Summary`).

#### [NEW] [src/App.tsx](file:///C:/D%20Drive/Projects/Summers%202026/GramIQ%20Internship/Finance%20OCR/app-ui/src/App.tsx)
- Full 7-screen interactive application:
  1. **Farm Profit Dashboard**: Crop pills filter, Donut chart, Expenses & Income lists with edit/delete, Per-crop breakdown.
  2. **Add Photo Modal**: Upload from gallery / Take photo / Pick sample receipts with best reading guidelines.
  3. **Scan Finance Page Preview**: Image canvas with animated OCR bounding boxes over detected text lines and "Read page" trigger.
  4. **Scanning Progress Overlay**: "GramIQ is reading your hisaab..." progress steps.
  5. **"Check What We Found" Editor**: Crop switcher, expense & income editable entry lists, add new entry, and "Confirm & add X entries".
  6. **Success Screen**: Green checkmark, summary of added expenses and income, and return to dashboard.
  7. **Raw JSON Inspector Modal**: Easily toggle to see the exact raw API JSON payload.

#### [NEW] [src/data/samples.ts](file:///C:/D%20Drive/Projects/Summers%202026/GramIQ%20Internship/Finance%20OCR/app-ui/src/data/samples.ts)
- High quality sample receipts and default dataset matching the user prompt prompt example (5 entries, ₹3200 expense, ₹5600 income).

## Verification Plan

### Automated Tests
- Run `npm test` or API endpoint health check to verify response payload conforms to JSON schema.

### Manual Verification
- Launch `npm run dev` in `app-ui`.
- Verify the mobile UI matches screens 149 through 155 from the screenshot:
  1. Dashboard view with active crop tabs, donut chart, expense/income lists.
  2. Scan modal pop-up on floating action button click.
  3. Image bounding box detection preview screen.
  4. "GramIQ is reading your hisaab..." scanning state.
  5. Extracted entries editor ("Check what we found") with edit/delete/crop switch.
  6. Success screen showing "5 entries added" and updated dashboard state.
  7. Raw JSON view button displaying the exact response format.
