import os
import re
import json
import hashlib
import pandas as pd # Used for offset_map loading if done here, but primarily in app.py

# Import configurations from config.py
import config # Contains global configurations like HDFS_HEADER_REGEX_PATTERN, NORMALIZATION_RULES, NUM_PRECEDING_LOGS_FOR_SEQUENCE

# --- Global Regex Patterns (from config.py) ---
# These are compiled here for efficiency
HDFS_HEADER_REGEX = re.compile(config.HDFS_HEADER_REGEX_PATTERN)

# Normalization Rules (from config.py)
NORMALIZATION_RULES = config.NORMALIZATION_RULES

# --- Helper Functions for Log Parsing ---

def normalize_log_content(content: str) -> str:
    """Applies normalization rules to the log message content."""
    normalized_content = content
    for regex, placeholder in NORMALIZATION_RULES:
        normalized_content = regex.sub(placeholder, normalized_content)
    # Further cleanup: remove extra spaces created by replacements
    normalized_content = re.sub(r'\s+', ' ', normalized_content).strip()
    return normalized_content

def parse_log_line_hybrid_single(raw_line: str) -> dict | None:
    """
    Parses a single HDFS log line for its header components.
    Returns parsed dictionary or None if header does not match.
    """
    match = HDFS_HEADER_REGEX.match(raw_line)
    if not match:
        return None 
    groups = match.groupdict()
    return {
        "timestamp": f"{groups.get('Date', '')} {groups.get('Time', '')}",
        "level": groups.get('Level', ''),
        "component": groups.get('Component', ''),
        "content_raw": groups.get('Content', '').strip(),
    }

def get_contextual_log_sequence_from_disk(
    all_parsed_jsonl_path: str, # <--- CORRECTED: This parameter is needed here
    target_entry_metadata: dict, # Problematic entry's metadata: {'source_file': ..., 'line_id_in_file_header': ...}
    num_lines_before: int, 
    offset_map: dict # The loaded (source_file, line_id) -> byte_offset map
) -> list:
    """
    Retrieves a sequence of log entries preceding a target problematic entry from the JSONL file on disk.
    Uses the byte-offset map for efficient seeking.
    """
    target_source_file = target_entry_metadata.get('source_file')
    target_line_id = target_entry_metadata.get('line_id_in_file_header')

    if not target_source_file or not isinstance(target_line_id, int):
        # print(f"Error in get_contextual_log_sequence_from_disk: Missing 'source_file' or 'line_id_in_file_header' in target_entry_metadata.") # Avoid print in function loop
        return []

    sequence = []
    
    # Calculate the start line ID for the sequence
    start_line_id_in_file = max(1, target_line_id - num_lines_before)
    
    # Attempt to find the byte offset for the start of the sequence
    # Offset map key is (source_file, line_id_in_file_header)
    start_offset_key = (target_source_file, start_line_id_in_file)
    start_byte_offset = offset_map.get(start_offset_key)

    if start_byte_offset is None:
        # print(f"Warning: Exact start offset for line {start_line_id_in_file} in {target_source_file} not found in offset map. Returning empty sequence.") # Avoid print in function loop
        return [] 

    try:
        with open(all_parsed_jsonl_path, 'r', encoding='utf-8', errors='ignore') as f:
            f.seek(start_byte_offset) 

            lines_read_from_seek = 0
            for line in f:
                if lines_read_from_seek >= num_lines_before + 5: # Read a bit extra to be safe
                    break 
                try:
                    parsed_seq_entry = json.loads(line)
                    if (parsed_seq_entry.get('source_file') == target_source_file and 
                        parsed_seq_entry.get('line_id_in_file_header', 0) < target_line_id):
                        sequence.append(parsed_seq_entry)
                    lines_read_from_seek += 1
                except json.JSONDecodeError:
                    pass 

        sequence.sort(key=lambda x: x.get('line_id_in_file_header', 0))
        sequence = sequence[-num_lines_before:] 

    except Exception as e:
        # print(f"Error retrieving sequence from disk for {target_source_file} line {target_line_id}: {e}") # Avoid print in function loop
        return []

    return sequence