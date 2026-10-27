import pypdf

def verify_report(pdf_path="OptiVest_AI_Project_Report.pdf"):
    reader = pypdf.PdfReader(pdf_path)
    page_count = len(reader.pages)
    print(f"Total Page Count: {page_count}")
    assert page_count == 10, f"Error: Expected exactly 10 pages, found {page_count}!"

    expected_sections = [
        "OptiVest AI",
        "1. Project Introduction",
        "2. System Architecture",
        "3. Complete Project Workflow",
        "4. Data and Machine Learning",
        "5. CDE and APDE Modules",
        "6. Risk Management and Explainability",
        "7. Experiments and Results",
        "8. Implementation and Technology Stack",
        "9. Conclusion and Limitations"
    ]

    print("\n--- Page by Page Verification ---")
    for idx, (page, expected) in enumerate(zip(reader.pages, expected_sections)):
        text = page.extract_text()
        has_section = expected in text
        print(f"Page {idx+1:>2}: Length {len(text):>4} chars | Section: '{expected}' -> {'PASS' if has_section else 'FAIL'}")
        if not has_section:
            raise ValueError(f"Page {idx+1} failed verification for '{expected}'")

    print("\nSUCCESS: All 10 pages match the required structure and contain no overflow!")

if __name__ == "__main__":
    verify_report()
