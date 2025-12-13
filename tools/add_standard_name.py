#!/usr/bin/env python3
"""
Add ICD-10 standard names to a TSV that already has ICD-10 codes.

Reads a TSV with an ICD-10 code column and appends a new column with the
official standard name from the NLM Clinical Tables API.

Usage:
    python tools/add_standard_name.py input.tsv output.tsv
    python tools/add_standard_name.py input.tsv output.tsv --code-col "ICD-10"

Example:
    python tools/add_standard_name.py tools/sample_input_lastcol_coded.tsv tools/output_with_names.tsv
"""

import argparse
import csv
import sys
import time
import urllib.parse
from pathlib import Path

import requests

API_URL = "https://clinicaltables.nlm.nih.gov/api/icd10cm/v3/search"
RATE_LIMIT_DELAY = 0.05  # seconds between API calls


def lookup_code(code: str, timeout: float = 5.0) -> str | None:
    """Look up the standard name for an ICD-10-CM code.
    
    Args:
        code: The ICD-10-CM code (e.g., "C18.9")
        timeout: Request timeout in seconds
        
    Returns:
        The standard name for the code, or None if not found.
    """
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
    
    try:
        resp = requests.get(url, timeout=timeout)
        resp.raise_for_status()
        data = resp.json()
        # API output: [totalCount, [codes...], extraFieldsHash|null, [[code,name],...]]
        results = data[3] if len(data) >= 4 else []
        if results and results[0][0].upper() == code.upper():
            return results[0][1]  # return the name
    except requests.RequestException as e:
        print(f"  Warning: API error for code '{code}': {e}", file=sys.stderr)
    except (IndexError, KeyError, TypeError) as e:
        print(f"  Warning: Parse error for code '{code}': {e}", file=sys.stderr)
    
    return None


def process_tsv(input_path: Path, output_path: Path, code_col: str = "ICD-10") -> int:
    """Process a TSV file, adding standard names for ICD-10 codes.
    
    Args:
        input_path: Path to input TSV file
        output_path: Path to output TSV file
        code_col: Name of the column containing ICD-10 codes
        
    Returns:
        Number of rows processed
    """
    # Read input file
    with open(input_path, "r", encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f, delimiter="\t")
        if not reader.fieldnames:
            print("Error: Empty or invalid TSV file", file=sys.stderr)
            return 0
        
        if code_col not in reader.fieldnames:
            print(f"Error: Column '{code_col}' not found in TSV.", file=sys.stderr)
            print(f"Available columns: {', '.join(reader.fieldnames)}", file=sys.stderr)
            return 0
        
        rows = list(reader)
        fieldnames = list(reader.fieldnames)
    
    # Build output fieldnames
    output_fieldnames = fieldnames + ["Standard Name"]
    
    # Cache to avoid duplicate API calls
    code_cache: dict[str, str | None] = {}
    
    # Process each row
    total = len(rows)
    for i, row in enumerate(rows, 1):
        code = row.get(code_col, "").strip()
        
        if code in code_cache:
            standard_name = code_cache[code]
        else:
            print(f"  [{i}/{total}] Looking up: {code}", end="", flush=True)
            standard_name = lookup_code(code)
            code_cache[code] = standard_name
            print(f" -> {standard_name or 'NOT FOUND'}")
            time.sleep(RATE_LIMIT_DELAY)  # rate limiting
        
        row["Standard Name"] = standard_name or ""
    
    # Write output file
    with open(output_path, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=output_fieldnames, delimiter="\t")
        writer.writeheader()
        writer.writerows(rows)
    
    found = sum(1 for name in code_cache.values() if name)
    print(f"\nDone! Processed {total} rows.")
    print(f"Unique codes looked up: {len(code_cache)} ({found} found, {len(code_cache) - found} not found)")
    print(f"Output written to: {output_path}")
    
    return total


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Add ICD-10 standard names to a TSV that already has ICD-10 codes."
    )
    parser.add_argument("input", type=Path, help="Input TSV file path")
    parser.add_argument("output", type=Path, help="Output TSV file path")
    parser.add_argument(
        "--code-col",
        default="ICD-10",
        help="Name of the column containing ICD-10 codes (default: ICD-10)"
    )
    
    args = parser.parse_args()
    
    if not args.input.exists():
        print(f"Error: Input file not found: {args.input}", file=sys.stderr)
        return 1
    
    print(f"Processing: {args.input}")
    print(f"Code column: {args.code_col}")
    print()
    
    count = process_tsv(args.input, args.output, args.code_col)
    return 0 if count > 0 else 1


if __name__ == "__main__":
    sys.exit(main())
