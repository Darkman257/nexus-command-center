import sys
import re

def extract_text(pdf_path):
    try:
        import pypdf
        reader = pypdf.PdfReader(pdf_path)
        text = ""
        for page in reader.pages:
            text += page.extract_text() or ""
        return text
    except ImportError:
        try:
            import PyPDF2
            reader = PyPDF2.PdfReader(pdf_path)
            text = ""
            for page in reader.pages:
                text += page.extract_text() or ""
            return text
        except ImportError:
            # Fallback: scan binary for printable streams/strings
            try:
                with open(pdf_path, 'rb') as f:
                    content = f.read()
                
                # Try to extract elements inside parentheses (common Tj text format in PDFs)
                streams = re.findall(b'BT\s*(.*?)\s*ET', content, re.DOTALL)
                text_parts = []
                for stream in streams:
                    strings = re.findall(b'\((.*?)\)', stream)
                    for s in strings:
                        try:
                            text_parts.append(s.decode('utf-8', errors='ignore'))
                        except Exception:
                            pass
                
                if text_parts:
                    return "\n".join(text_parts)
                
                # Raw fallback: regex match readable words
                words = re.findall(r'[a-zA-Z0-9\u0600-\u06FF\s\-:\.,]{3,}', content.decode('utf-8', errors='ignore'))
                return " ".join(words)[:8000]
            except Exception as e:
                return f"Error reading PDF file: {str(e)}"

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python parse_pdf.py <pdf_path>")
        sys.exit(1)
    
    pdf_file = sys.argv[1]
    extracted = extract_text(pdf_file)
    print(extracted)
