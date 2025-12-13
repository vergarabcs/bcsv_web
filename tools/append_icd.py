#!/usr/bin/env python3
"""Append ICD-10-CM codes or standard names to a TSV using the NLM Clinical Tables API.

Usage (search by diagnosis text):
    python tools/append_icd.py --input tools/sample_input.tsv --output tools/output_with_icd.tsv \
        --min-score 0.35 --max-results 5

Usage (lookup standard name by ICD-10 code):
    python tools/append_icd.py --input tools/sample_input_lastcol_coded.tsv --output tools/output.tsv \
        --mode lookup --code-column "ICD-10"

Setup:
    python -m venv .venv
    .venv/bin/pip install -r tools/requirements.txt

Notes:
- Uses the public, keyless NLM ICD-10-CM search API: https://clinicaltables.nlm.nih.gov/api/icd10cm/v3/search
- If no acceptable match is found (below score threshold), leaves ICD fields blank but preserves the row.
"""

import argparse
import csv
import sys
import time
import urllib.parse
from typing import Dict, Optional, Tuple

import requests
from rapidfuzz import fuzz

API_URL = "https://clinicaltables.nlm.nih.gov/api/icd10cm/v3/search"


def normalize_text(text: str) -> str:
    return text.strip().lower()


def query_nlm(term: str, max_results: int = 5, timeout: float = 5.0) -> Optional[Tuple[str, str]]:
    """Search NLM API by diagnosis text."""
    params = {
        "sf": "code,name",
        "terms": term,
        "maxList": max_results,
        "df": "code,name",
    }
    url = f"{API_URL}?{urllib.parse.urlencode(params)}"
    resp = requests.get(url, timeout=timeout)
    resp.raise_for_status()
    data = resp.json()
    # API output: [totalCount, [codes...], extraFieldsHash|null, [[code,name],...]]
    if not data or len(data) < 4:
        return None
    results = data[3]  # display fields are at index 3
    if not results:
        return None
    code, name = results[0][0], results[0][1]
    return code, name


def lookup_code(code: str, timeout: float = 5.0) -> Optional[str]:
    """Look up the standard name for an ICD-10-CM code."""
    if not code or not code.strip():
        return None
    
    code = code.strip()
    params = {
        "sf": "code",        # search only the code field
        "df": "code,name",   # display code and name
        "terms": code,
        "maxList": 1,
    }
    url = f"{API_URL}?{urllib.parse.urlencode(params)}"
    resp = requests.get(url, timeout=timeout)
    resp.raise_for_status()
    data = resp.json()
    # API output: [totalCount, [codes...], extraFieldsHash|null, [[code,name],...]]
    if not data or len(data) < 4:
        return None
    results = data[3]
    if results and results[0][0].upper() == code.upper():
        return results[0][1]  # return the name
    return None


def pick_best(term: str, max_results: int, timeout: float) -> Tuple[Optional[str], Optional[str], float]:
    try:
        hit = query_nlm(term, max_results=max_results, timeout=timeout)
    except requests.RequestException as exc:
        print(f"WARN: request failed for '{term}': {exc}", file=sys.stderr)
        return None, None, 0.0
    if not hit:
        return None, None, 0.0
    code, name = hit
    score = fuzz.token_sort_ratio(term, name.lower()) / 100.0
    return code, name, score


def run(args: argparse.Namespace) -> int:
    with open(args.input, newline="", encoding="utf-8") as infile:
        reader = csv.DictReader(infile, delimiter="\t")
        fieldnames = reader.fieldnames
        if not fieldnames:
            print("ERROR: Input TSV missing header", file=sys.stderr)
            return 1
        if args.diagnosis_column:
            diag_col = args.diagnosis_column
            if diag_col not in fieldnames:
                print(f"ERROR: diagnosis column '{diag_col}' not found in header", file=sys.stderr)
                return 1
        else:
            diag_col = fieldnames[-1]

        out_fields = fieldnames + ["ICD10_Code", "ICD10_Description", "Match_Score"]
        cache: Dict[str, Tuple[Optional[str], Optional[str], float]] = {}

        rows_out = []
        for row in reader:
            raw_diag = row.get(diag_col, "")
            norm_diag = normalize_text(raw_diag)
            if not norm_diag:
                cache_value = (None, None, 0.0)
            elif norm_diag in cache:
                cache_value = cache[norm_diag]
            else:
                cache_value = pick_best(norm_diag, args.max_results, args.timeout)
                cache[norm_diag] = cache_value
                if args.sleep > 0:
                    time.sleep(args.sleep)

            code, desc, score = cache_value
            if score < args.min_score:
                code, desc = None, None
            out_row = {**row, "ICD10_Code": code or "", "ICD10_Description": desc or "", "Match_Score": f"{score:.2f}"}
            rows_out.append(out_row)

    with open(args.output, "w", newline="", encoding="utf-8") as outfile:
        writer = csv.DictWriter(outfile, fieldnames=out_fields, delimiter="\t")
        writer.writeheader()
        writer.writerows(rows_out)

    matched = sum(1 for r in rows_out if r["ICD10_Code"])
    total = len(rows_out)
    print(f"Done. {matched}/{total} rows matched at min_score >= {args.min_score}.")
    return 0


def parse_args(argv: Optional[list] = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Append ICD-10-CM codes to a TSV using NLM Clinical Tables API")
    parser.add_argument("--input", required=True, help="Path to input TSV")
    parser.add_argument("--output", required=True, help="Path to output TSV")
    parser.add_argument("--diagnosis-column", help="Header name for diagnosis text (defaults to last column)")
    parser.add_argument("--max-results", type=int, default=5, help="Max results to request from NLM")
    parser.add_argument("--min-score", type=float, default=0.35, help="Minimum similarity score (0-1) to keep a match")
    parser.add_argument("--timeout", type=float, default=5.0, help="Request timeout in seconds")
    parser.add_argument("--sleep", type=float, default=0.0, help="Sleep seconds between API calls (for rate limiting)")
    return parser.parse_args(argv)


if __name__ == "__main__":
    sys.exit(run(parse_args()))
