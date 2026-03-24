# -*- coding: utf-8 -*-
import os
import sys

# Set encoding
reload = None
try:
    reload = sys.reload
except:
    pass

# Find PDF files
base_dir = r"D:\worksapces\zixun_pro\data"

print("=== Searching for PDF files ===\n")

for root, dirs, files in os.walk(base_dir):
    for f in files:
        if f.endswith('.pdf'):
            full_path = os.path.join(root, f)
            print(f"Found PDF: {full_path}")
            print(f"Size: {os.path.getsize(full_path)} bytes\n")

# Try to read the specific PDF
print("\n=== Trying to extract PDF content ===\n")

try:
    import pdfplumber

    # List all files in 物流枢纽 directory
    wuliu_dir = r"D:\worksapces\zixun_pro\data"
    for item in os.listdir(wuliu_dir):
        print(f"Item: {item}")
        item_path = os.path.join(wuliu_dir, item)
        if os.path.isdir(item_path):
            try:
                for subitem in os.listdir(item_path):
                    print(f"  -> {subitem}")
                    if subitem.endswith('.pdf'):
                        subitem_path = os.path.join(item_path, subitem)
                        print(f"     Trying to open: {subitem_path}")
                        try:
                            with pdfplumber.open(subitem_path) as pdf:
                                print(f"     SUCCESS! Pages: {len(pdf.pages)}")
                                for i, page in enumerate(pdf.pages):
                                    text = page.extract_text()
                                    if text:
                                        print(f"\n--- Page {i+1} ---")
                                        print(text[:3000])
                        except Exception as e:
                            print(f"     Failed: {e}")
            except Exception as e:
                print(f"  Cannot list dir: {e}")

except ImportError as e:
    print(f"pdfplumber not available: {e}")
except Exception as e:
    print(f"Error: {e}")
