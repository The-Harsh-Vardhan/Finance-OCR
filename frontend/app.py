import streamlit as st
import requests
import os
import json
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from PIL import Image

# Page Configuration
st.set_page_config(
    page_title="GramIQ AI Ledger Digitization",
    page_icon="🌾",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for Modern UI
st.markdown("""
<style>
    .main-title {
        font-size: 2.2rem;
        font-weight: 700;
        color: #1E3A8A;
        margin-bottom: 0px;
    }
    .sub-title {
        font-size: 1.0rem;
        color: #4B5563;
        margin-bottom: 20px;
    }
    .metric-card {
        background-color: #F8FAFC;
        border: 1px solid #E2E8F0;
        border-radius: 10px;
        padding: 16px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .badge-high {
        background-color: #DEF7EC;
        color: #03543F;
        padding: 4px 8px;
        border-radius: 6px;
        font-weight: 600;
        font-size: 0.85rem;
    }
    .badge-medium {
        background-color: #FEF08A;
        color: #713F12;
        padding: 4px 8px;
        border-radius: 6px;
        font-weight: 600;
        font-size: 0.85rem;
    }
    .badge-low {
        background-color: #FDE8E8;
        color: #9B1C1C;
        padding: 4px 8px;
        border-radius: 6px;
        font-weight: 600;
        font-size: 0.85rem;
    }
</style>
""", unsafe_allow_html=True)

# Configuration Constants
API_BASE_URL = os.getenv("API_BASE_URL", "http://127.0.0.1:8000/api/v1")
SAMPLE_IMAGES_DIR = os.path.join(os.path.dirname(__file__), "sample_images")

# Helper API functions
def check_api_health():
    try:
        r = requests.get("http://127.0.0.1:8000/", timeout=2)
        return r.status_code == 200
    except Exception:
        return False

def upload_and_process_image(file_bytes, filename, crop_hint="General"):
    files = {"file": (filename, file_bytes, "image/png")}
    up_res = requests.post(f"{API_BASE_URL}/notebooks/upload", files=files)
    if up_res.status_code != 201:
        st.error(f"Upload failed: {up_res.text}")
        return None
    notebook = up_res.json()
    notebook_id = notebook["id"]

    # Process notebook
    proc_res = requests.post(
        f"{API_BASE_URL}/notebooks/process/{notebook_id}",
        json={"crop_hint": crop_hint}
    )
    if proc_res.status_code == 200:
        return proc_res.json()
    else:
        st.error(f"Processing failed: {proc_res.text}")
        return None

def fetch_notebooks():
    try:
        r = requests.get(f"{API_BASE_URL}/notebooks")
        return r.json() if r.status_code == 200 else []
    except Exception:
        return []

def fetch_transactions(notebook_id):
    try:
        r = requests.get(f"{API_BASE_URL}/notebooks/{notebook_id}/transactions")
        return r.json() if r.status_code == 200 else []
    except Exception:
        return []

def fetch_intermediate_data(notebook_id):
    try:
        r = requests.get(f"{API_BASE_URL}/notebooks/{notebook_id}/intermediate-data")
        return r.json() if r.status_code == 200 else None
    except Exception:
        return None

def verify_transactions(notebook_id, transactions_list):
    try:
        payload = {"notebook_id": notebook_id, "transactions": transactions_list}
        r = requests.post(f"{API_BASE_URL}/transactions/verify", json=payload)
        return r.status_code == 200
    except Exception:
        return False

def fetch_analytics():
    try:
        r = requests.get(f"{API_BASE_URL}/analytics/summary")
        return r.json() if r.status_code == 200 else None
    except Exception:
        return None

# Sidebar - Brand & Server Status
st.sidebar.image("https://img.icons8.com/color/96/tractor.png", width=64)
st.sidebar.markdown("### **GramIQ AI Ledger**")
st.sidebar.markdown("Digitizing Handwritten Bahi-Khata Notebooks into Structured Financial Intelligence")

is_online = check_api_health()
if is_online:
    st.sidebar.success("🟢 REST API: Connected (127.0.0.1:8000)")
else:
    st.sidebar.warning("⚠️ REST API Offline. Please start FastAPI server (`uvicorn main:app`).")

st.sidebar.divider()
st.sidebar.markdown("#### **Pipeline Workflow**")
st.sidebar.markdown("1. **Step 1: OCR Extraction** (Verbatim text)")
st.sidebar.markdown("2. **Step 2: English Translation** (Before & After)")
st.sidebar.markdown("3. **Step 3: Categorization & Structuring**")

# Main Header
col_header, col_stats = st.columns([3, 2])
with col_header:
    st.markdown('<div class="main-title">🌾 GramIQ AI Ledger Digitization</div>', unsafe_allow_html=True)
    st.markdown('<div class="sub-title">Multi-stage document intelligence platform with intermediate data archiving</div>', unsafe_allow_html=True)

# Fetch quick analytics for top right summary cards
analytics_data = fetch_analytics()
if analytics_data:
    with col_stats:
        c1, c2, c3 = st.columns(3)
        c1.metric("Notebooks", analytics_data["total_notebooks"])
        c2.metric("Total Expenses", f"₹{analytics_data['total_expenses']:,.0f}")
        c3.metric("Net P&L", f"₹{analytics_data['net_profit_loss']:,.0f}")

# Main App Navigation Tabs
tab_scan, tab_review, tab_analytics, tab_kb = st.tabs([
    "📸 1. Scan & Digitise Bahi-Khata",
    "✍️ 2. Farmer Review & Intermediate Data Audit",
    "📊 3. Farm Ledger & Analytics Dashboard",
    "🌾 4. Farm Knowledge Base Explorer"
])

# ----------------------------------------------------
# TAB 1: SCAN & DIGITISE
# ----------------------------------------------------
with tab_scan:
    st.markdown("### **Upload or Select Handwritten Notebook Page**")

    col_upload_opt, col_preview = st.columns([1, 1])

    with col_upload_opt:
        source_option = st.radio(
            "Select Image Source:",
            ["Choose from Sample Bahi-Khata Ledgers", "Upload Custom Image"],
            horizontal=True
        )

        selected_image_bytes = None
        selected_filename = "notebook.png"

        if source_option == "Choose from Sample Bahi-Khata Ledgers":
            sample_choices = {
                "Hindi Cotton Farm Ledger (कपास बही-खाता)": "bahi_khata_cotton_hindi.png",
                "Marathi Soybean Expense Ledger (सोयाबीन शेतकरी नोंद)": "bahi_khata_soybean_marathi.png",
                "English Sugarcane Farm Notebook": "bahi_khata_sugarcane_english.png"
            }
            sample_name = st.selectbox("Select Sample Ledger:", list(sample_choices.keys()))
            selected_filename = sample_choices[sample_name]
            sample_path = os.path.join(SAMPLE_IMAGES_DIR, selected_filename)

            if os.path.exists(sample_path):
                with open(sample_path, "rb") as f:
                    selected_image_bytes = f.read()
        else:
            uploaded_file = st.file_uploader("Choose notebook image file (JPG, PNG)...", type=["jpg", "jpeg", "png"])
            if uploaded_file:
                selected_image_bytes = uploaded_file.getvalue()
                selected_filename = uploaded_file.name

        btn_process = st.button("⚡ Run AI Digitization Pipeline (OCR → Translate → Categorize)", type="primary", use_container_width=True)

    with col_preview:
        if selected_image_bytes:
            st.image(selected_image_bytes, caption=f"Input Image: {selected_filename}", use_column_width=True)

    if btn_process and selected_image_bytes:
        with st.spinner("Executing 3-Step Pipeline: 1. OCR Extraction ➔ 2. English Translation ➔ 3. Categorization..."):
            res = upload_and_process_image(selected_image_bytes, selected_filename, crop_hint=None)
            if res:
                st.success(f"✅ Digitization Complete! Extracted {res['total_extracted']} transactions.")

                # Display 3-Step Execution Stepper
                st.markdown("#### **Pipeline Execution Breakdown**")
                s1, s2, s3, s4 = st.columns(4)
                s1.info("Step 1: Gemini OCR\nVerbatim Text Transcribed")
                s2.info("Step 2: English Translation\nIndic → English Conversion")
                s3.info("Step 3: Categorization\nFarm KB & Domain Mapping")
                s4.success(f"Validation & Score\nReview Required: {res['review_required']}")

                # Table of extracted results
                st.markdown("#### **Extracted Financial Transactions (OCR ➔ Translation ➔ Category)**")
                df_tx = pd.DataFrame(res["transactions"])
                cols_order = ["transaction_date", "ocr_text", "description_en", "category", "subcategory", "amount", "type", "confidence_level"]
                df_display = df_tx[[c for c in cols_order if c in df_tx.columns]]
                st.dataframe(df_display, use_container_width=True)
                st.info("💡 Switch to **Tab 2: Farmer Review & Intermediate Data Audit** to inspect complete raw OCR, translation logs, and quality metrics.")

# ----------------------------------------------------
# TAB 2: FARMER REVIEW & INTERMEDIATE DATA AUDIT
# ----------------------------------------------------
with tab_review:
    st.markdown("### **Review Transactions & Audit Intermediate Pipeline Data**")

    notebooks_list = fetch_notebooks()
    if not notebooks_list:
        st.info("No uploaded notebooks found. Please scan/upload a notebook page in Tab 1 first.")
    else:
        nb_options = {f"{nb['original_filename']} ({nb['status']}) - ID: {nb['id'][:8]}": nb['id'] for nb in notebooks_list}
        selected_label = st.selectbox("Select Notebook to Inspect:", list(nb_options.keys()))
        selected_nb_id = nb_options[selected_label]

        transactions = fetch_transactions(selected_nb_id)
        inter_data = fetch_intermediate_data(selected_nb_id)

        if transactions:
            df_edit = pd.DataFrame(transactions)

            c_high = len([t for t in transactions if t.get("confidence_level") == "High"])
            c_med = len([t for t in transactions if t.get("confidence_level") == "Medium"])
            c_low = len([t for t in transactions if t.get("confidence_level") == "Low"])

            col_badges = st.columns(3)
            col_badges[0].markdown(f'<span class="badge-high">High Confidence: {c_high} (Auto-Approved)</span>', unsafe_allow_html=True)
            col_badges[1].markdown(f'<span class="badge-medium">Medium Confidence: {c_med}</span>', unsafe_allow_html=True)
            col_badges[2].markdown(f'<span class="badge-low">Low Confidence: {c_low} (Needs Review)</span>', unsafe_allow_html=True)

            st.markdown("#### **Interactive Transaction Review Grid**")
            st.caption("Inspect verbatim OCR text (Step 1), English translation (Step 2), and Category mapping (Step 3). Edit any field before confirming.")

            edited_df = st.data_editor(
                df_edit,
                column_config={
                    "verified": st.column_config.CheckboxColumn("Verified?", default=True),
                    "ocr_text": st.column_config.TextColumn("Step 1: Raw OCR Text"),
                    "description_en": st.column_config.TextColumn("Step 2: English Translation"),
                    "confidence_level": st.column_config.TextColumn("Confidence", disabled=True),
                    "confidence": st.column_config.ProgressColumn("Confidence Score", min_value=0.0, max_value=1.0),
                    "type": st.column_config.SelectboxColumn("Type", options=["Expense", "Income"]),
                    "category": st.column_config.SelectboxColumn(
                        "Step 3: Category",
                        options=["Fertilizer", "Pesticide", "Labour", "Machinery", "Sales", "Seeds", "Irrigation", "Transport", "Miscellaneous"]
                    )
                },
                disabled=["id", "notebook_id", "created_at"],
                use_container_width=True,
                num_rows="dynamic"
            )

            if st.button("✅ Save & Confirm Verification", type="primary"):
                if verify_transactions(selected_nb_id, edited_df.to_dict(orient="records")):
                    st.success("🎉 Transactions verified and saved to database successfully!")
                    st.rerun()
                else:
                    st.error("Failed to save verification. Please check backend connection.")

        # Expandable Intermediate Data Audit Panel
        if inter_data:
            with st.expander("🔍 **Inspect All Stored Intermediate Pipeline Data & Image Artifacts**", expanded=True):
                st.markdown("#### **1. Stored Image Artifacts & Quality Metrics**")
                m1, m2 = st.columns(2)
                with m1:
                    st.markdown(f"**Original Upload Image Path**: `{inter_data['original_image_path']}`")
                    st.markdown(f"**Enhanced Image Path**: `{inter_data['enhanced_image_path']}`")
                with m2:
                    st.json(inter_data.get("quality_metrics", {}))

                st.divider()

                st.markdown("#### **2. Step 1: Raw OCR Text Transcripts (Before Translation)**")
                st.dataframe(pd.DataFrame(inter_data.get("step1_raw_ocr", [])), use_container_width=True)

                st.divider()

                st.markdown("#### **3. Step 2: Translations (Before vs After)**")
                st.dataframe(pd.DataFrame(inter_data.get("step2_translations", [])), use_container_width=True)

                st.divider()

                st.markdown("#### **4. Step 3 & Final Output JSON**")
                st.json(inter_data.get("step3_final_output", []))

# ----------------------------------------------------
# TAB 3: ANALYTICS DASHBOARD
# ----------------------------------------------------
with tab_analytics:
    st.markdown("### **Farm Ledger Financial Analytics**")

    analytics_summary = fetch_analytics()
    if analytics_summary and analytics_summary["total_transactions"] > 0:
        k1, k2, k3, k4 = st.columns(4)
        k1.metric("Total Income", f"₹{analytics_summary['total_income']:,.2f}")
        k2.metric("Total Expenses", f"₹{analytics_summary['total_expenses']:,.2f}")
        k3.metric("Net Profit / Loss", f"₹{analytics_summary['net_profit_loss']:,.2f}")
        k4.metric("Verified Transactions", f"{analytics_summary['verified_transactions']} / {analytics_summary['total_transactions']}")

        col_c1, col_c2 = st.columns(2)

        if analytics_summary["category_breakdown"]:
            df_cat = pd.DataFrame(analytics_summary["category_breakdown"])
            with col_c1:
                st.markdown("#### **Cost of Cultivation by Category**")
                fig_donut = px.pie(
                    df_cat,
                    values="total_amount",
                    names="category",
                    hole=0.4,
                    color_discrete_sequence=px.colors.qualitative.Set3
                )
                fig_donut.update_layout(margin=dict(t=30, b=0, l=0, r=0))
                st.plotly_chart(fig_donut, use_container_width=True)

        if analytics_summary["crop_breakdown"]:
            df_crop = pd.DataFrame(analytics_summary["crop_breakdown"])
            with col_c2:
                st.markdown("#### **Crop-wise Income vs Expense Comparison**")
                fig_bar = go.Figure(data=[
                    go.Bar(name='Total Expense', x=df_crop['crop'], y=df_crop['total_expense'], marker_color='#EF4444'),
                    go.Bar(name='Total Income', x=df_crop['crop'], y=df_crop['total_income'], marker_color='#10B981')
                ])
                fig_bar.update_layout(barmode='group', margin=dict(t=30, b=0, l=0, r=0))
                st.plotly_chart(fig_bar, use_container_width=True)

    else:
        st.info("No transaction data available yet. Digitise notebook pages in Tab 1 to see analytics!")

# ----------------------------------------------------
# TAB 4: FARM KNOWLEDGE BASE EXPLORER
# ----------------------------------------------------
with tab_kb:
    st.markdown("### **Indic Farm Knowledge Base Dictionary**")
    st.caption("Domain dictionary mapping regional Hindi/Marathi local terms to standard agricultural categories.")

    q = st.text_input("Search Agri Product or Labour Term (e.g. 'मजुरी', 'DAP', 'बियाणे', 'खाद'):", "")
    kb_res = requests.get(f"{API_BASE_URL}/knowledge-base/search", params={"query": q}).json()

    if kb_res.get("results"):
        df_kb = pd.DataFrame(kb_res["results"])
        st.dataframe(df_kb, use_container_width=True)
    else:
        st.info("No knowledge base records found matching query.")
