import os
from PIL import Image, ImageDraw, ImageFont

def create_sample_notebook_images():
    output_dir = os.path.join(os.path.dirname(__file__), "sample_images")
    os.makedirs(output_dir, exist_ok=True)

    # 1. Hindi Cotton Ledger Image
    w, h = 800, 1000
    img1 = Image.new("RGB", (w, h), color=(248, 245, 235))
    draw1 = ImageDraw.Draw(img1)

    # Red vertical margin & blue ledger grid lines
    draw1.line([(120, 0), (120, h)], fill=(220, 80, 80), width=3)
    draw1.line([(620, 0), (620, h)], fill=(220, 80, 80), width=2)
    for y in range(100, h, 60):
        draw1.line([(0, y), (w, y)], fill=(180, 200, 230), width=1)

    # Title
    draw1.text((250, 40), "बही-खाता (कपास फसल २०२६)", fill=(30, 30, 30))
    draw1.text((30, 110), "दिनांक", fill=(100, 30, 30))
    draw1.text((150, 110), "विवरण / खर्च", fill=(100, 30, 30))
    draw1.text((640, 110), "रकम (₹)", fill=(100, 30, 30))

    hindi_entries = [
        ("०५/०६/२०२६", "कपास बी (BT Cotton Seed 4 Packets)", "3,440"),
        ("१४/०६/२०२६", "यूरिया खाद (Urea 2 bags) + DAP (1 bag)", "1,910"),
        ("२८/०६/२०२६", "लागवड मजदुरी (Sowing Labour 4 persons)", "1,400"),
        ("१०/०७/२०२६", "कीटनाशक स्प्रे (Insecticide Spray)", "1,150"),
        ("२०/११/२०२६", "कपास बिक्री (Cotton Sale 8 Quintals)", "56,000"),
    ]

    y_pos = 170
    for dt, desc, amt in hindi_entries:
        draw1.text((20, y_pos), dt, fill=(40, 40, 80))
        draw1.text((140, y_pos), desc, fill=(20, 20, 20))
        draw1.text((640, y_pos), amt, fill=(20, 80, 20))
        y_pos += 60

    img1.save(os.path.join(output_dir, "bahi_khata_cotton_hindi.png"))

    # 2. Marathi Soybean Ledger Image
    img2 = Image.new("RGB", (w, h), color=(252, 249, 240))
    draw2 = ImageDraw.Draw(img2)
    draw2.line([(130, 0), (130, h)], fill=(200, 60, 60), width=3)
    draw2.line([(630, 0), (630, h)], fill=(200, 60, 60), width=2)
    for y in range(100, h, 60):
        draw2.line([(0, y), (w, y)], fill=(170, 195, 225), width=1)

    draw2.text((230, 40), "शेतकरी वही खात्याची नोंद (सोयाबीन)", fill=(30, 30, 30))
    draw2.text((30, 110), "तारीख", fill=(120, 30, 30))
    draw2.text((150, 110), "तपशील / काम", fill=(120, 30, 30))
    draw2.text((650, 110), "रक्कम (₹)", fill=(120, 30, 30))

    marathi_entries = [
        ("१२/०६/२६", "बियाणे खरेदी - सोयाबीन (Mahabeej 335)", "3,400"),
        ("१५/०६/२६", "नांगरटी व रोटाव्हेटर (ट्रॅक्टर भाडे)", "2,500"),
        ("२०/०६/२६", "डीएपी खात (DAP Fertilizer 2 bags)", "2,700"),
        ("०२/०७/२६", "निंदणी व खुरपणी मजुरी (६ मजूर)", "1,800"),
        ("१५/१०/२६", "सोयाबीन विक्री (मंडी व्यापारी १० क्विंटल)", "48,500"),
    ]

    y_pos = 170
    for dt, desc, amt in marathi_entries:
        draw2.text((20, y_pos), dt, fill=(40, 40, 80))
        draw2.text((150, y_pos), desc, fill=(20, 20, 20))
        draw2.text((650, y_pos), amt, fill=(20, 80, 20))
        y_pos += 60

    img2.save(os.path.join(output_dir, "bahi_khata_soybean_marathi.png"))

    # 3. Sugarcane Ledger Image
    img3 = Image.new("RGB", (w, h), color=(245, 245, 245))
    draw3 = ImageDraw.Draw(img3)
    draw3.line([(140, 0), (140, h)], fill=(210, 70, 70), width=3)
    draw3.line([(610, 0), (610, h)], fill=(210, 70, 70), width=2)
    for y in range(100, h, 60):
        draw3.line([(0, y), (w, y)], fill=(185, 205, 230), width=1)

    draw3.text((240, 40), "Sugarcane Farm Expense Ledger 2026", fill=(30, 30, 30))
    draw3.text((30, 110), "Date", fill=(100, 30, 30))
    draw3.text((160, 110), "Transaction Description", fill=(100, 30, 30))
    draw3.text((630, 110), "Amount (Rs)", fill=(100, 30, 30))

    sugarcane_entries = [
        ("10-05-2026", "Sugarcane Seed Sets (8000 Co 0238)", "6,500"),
        ("18-05-2026", "10:26:26 NPK Fertilizer 3 Bags", "4,350"),
        ("01-06-2026", "Drip Irrigation Line Repair & Motor Charges", "1,600"),
        ("25-06-2026", "Spraying Labour & Coragen Insecticide", "2,200"),
    ]

    y_pos = 170
    for dt, desc, amt in sugarcane_entries:
        draw3.text((20, y_pos), dt, fill=(40, 40, 80))
        draw3.text((160, y_pos), desc, fill=(20, 20, 20))
        draw3.text((630, y_pos), amt, fill=(20, 80, 20))
        y_pos += 60

    img3.save(os.path.join(output_dir, "bahi_khata_sugarcane_english.png"))
    print("Sample notebook images created successfully.")

if __name__ == "__main__":
    create_sample_notebook_images()
