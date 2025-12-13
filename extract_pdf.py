import pypdf
import os

def extract_text_from_pdf(file_path):
    try:
        reader = pypdf.PdfReader(file_path)
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        return text
    except Exception as e:
        return f"Error reading {file_path}: {str(e)}"

files = [
    r"d:\CloutCash.in\AISE\sysml-models_TRaining.pdf",
    r"d:\CloutCash.in\AISE\SYSML2.0.pdf"
]

output_file = r"d:\CloutCash.in\AISE\pdf_content.txt"

with open(output_file, "w", encoding="utf-8") as f:
    for file_path in files:
        f.write(f"--- START OF {os.path.basename(file_path)} ---\n")
        if os.path.exists(file_path):
            content = extract_text_from_pdf(file_path)
            f.write(content)
            f.write(f"\n--- END OF {os.path.basename(file_path)} ---\n\n")
        else:
            f.write(f"File not found: {file_path}\n")

print(f"Text extracted to {output_file}")
