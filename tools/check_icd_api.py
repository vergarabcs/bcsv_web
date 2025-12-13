#!/usr/bin/env python3
"""Quick probe to verify NLM ICD-10-CM API responses.
Run: python tools/check_icd_api.py
"""

import sys
import urllib.parse
import requests

API_URL = "https://clinicaltables.nlm.nih.gov/api/icd10cm/v3/search"
SAMPLE_TERMS = [
    "Colon Cancer",
]


def query(term: str, max_list: int = 3):
    params = {
        # API shape: sf = fields to search, df = display fields, terms = search string
        "sf": "code,name",   # search both code and name fields
        "df": "code,name",   # display code and name
        "terms": term,
        "maxList": max_list,
    }
    url = f"{API_URL}?{urllib.parse.urlencode(params)}"
    resp = requests.get(url, timeout=5.0)
    resp.raise_for_status()
    data = resp.json()
    # API output shape: [totalCount, [codes...], extraFieldsHash|null, [[code,name],...]]
    # data[0] = total count
    # data[1] = array of codes
    # data[2] = extra fields hash (null if ef not specified)
    # data[3] = array of display strings (from df parameter)
    results = data[3] if len(data) >= 4 else []
    top = results[0] if results else None
    return top, results


def lookup_code(code: str) -> str | None:
    """Look up the standard name for an ICD-10-CM code.
    
    Args:
        code: The ICD-10-CM code (e.g., "C18.9")
        
    Returns:
        The standard name for the code, or None if not found.
    """
    params = {
        "sf": "code",        # search only the code field for exact match
        "df": "code,name",   # display code and name
        "terms": code,
        "maxList": 1,
    }
    url = f"{API_URL}?{urllib.parse.urlencode(params)}"
    resp = requests.get(url, timeout=5.0)
    resp.raise_for_status()
    data = resp.json()
    results = data[3] if len(data) >= 4 else []
    if results and results[0][0] == code:
        return results[0][1]  # return the name
    return None


def main() -> int:
    # Demo: lookup by diagnosis term
    for term in SAMPLE_TERMS:
        try:
            top, results = query(term)
        except Exception as exc:  # keep simple for probe
            print(f"ERROR for '{term}': {exc}", file=sys.stderr)
            continue
        print(f"Term: {term}")
        if not results:
            print("  No results\n")
            continue
        code, name = top
        print(f"  Top: {code} - {name}")
        print("  All:")
        for code, name in results:
            print(f"    {code} - {name}")
        print()
    
    # Demo: lookup by ICD-10 code
    sample_codes = ["C18.9", "I25.10", "A90"]
    print("--- Code Lookup ---")
    for code in sample_codes:
        try:
            name = lookup_code(code)
        except Exception as exc:
            print(f"ERROR for code '{code}': {exc}", file=sys.stderr)
            continue
        if name:
            print(f"  {code} -> {name}")
        else:
            print(f"  {code} -> NOT FOUND")
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
