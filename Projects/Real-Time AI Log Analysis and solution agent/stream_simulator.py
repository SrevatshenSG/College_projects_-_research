import os
import re
import json
import time
import hashlib
from tqdm import tqdm
import queue
import threading
import pandas as pd

# Import configurations and helper functions from other modules
import config
import log_processor

# --- Global State for Multi-line Log Assembly (local to this module's scope for simulation) ---
_current_multi_line_log_buffer = []
_last_parsed_multi_line_header_info = None

# Declare module-level globals for _parsed_line_counter_local
# It's good practice to initialize them here if they are truly module-level state
# and then their values can be modified in the function via `global`.
_parsed_line_counter_local = 0


# --- Main Log Stream Processing & Live Indexing Function ---
def simulate_raw_log_stream(
    problem_queue_instance: queue.Queue,
    stop_event: threading.Event,
    global_offset_map: dict,
    global_unique_templates_map: dict, # This is the unique_templates_map to update
    global_parsed_line_counter_list: list
):
    """
    Simulates a real-time log stream processing.
    Reads logs from raw files, processes them, updates parsed JSONL and offset index,
    and pushes problematic entries to a queue.
    """
    # Access local state variables that persist across function calls in the loop
    global _current_multi_line_log_buffer, _last_parsed_multi_line_header_info
    global _parsed_line_counter_local # Access local counter for initialization logic

    # Reset buffer state for this simulation run
    _current_multi_line_log_buffer = []
    _last_parsed_multi_line_header_info = None

    print("\n--- Simulating Real-time Log Stream ---")

    # --- Initial Setup for Regeneration or Appending ---
    # This part clears/initializes files and counters based on config.REGENERATE_ALL_FROM_RAW_LOGS
    if config.REGENERATE_ALL_FROM_RAW_LOGS:
        print(f"Clearing existing {config.OUTPUT_PARSED_JSONL}")
        if os.path.exists(config.OUTPUT_PARSED_JSONL):
            os.remove(config.OUTPUT_PARSED_JSONL)
        print(f"Clearing existing {config.OFFSET_INDEX_FILE}")
        if os.path.exists(config.OFFSET_INDEX_FILE):
            os.remove(config.OFFSET_INDEX_FILE)
        print(f"Clearing existing {config.OUTPUT_TEMPLATES_CSV}")
        if os.path.exists(config.OUTPUT_TEMPLATES_CSV):
            os.remove(config.OUTPUT_TEMPLATES_CSV) # Clear existing template CSV for fresh start

        _parsed_line_counter_local = 0 # Reset local counter for this simulation run
        global_unique_templates_map.clear() # Clear the shared global templates map
        global_offset_map.clear() # Clear the shared global offset map (from realtime_app.py)

    else: # If not regenerating, try to initialize local counter and maps from existing files
        _parsed_line_counter_local = 0 # Default to 0, will update from global_offset_map if it loads

        # If offset_index exists, populate the global_offset_map and update local counter
        if os.path.exists(config.OFFSET_INDEX_FILE):
            try:
                offset_df = pd.read_csv(config.OFFSET_INDEX_FILE)
                for index, row in offset_df.iterrows():
                    global_offset_map[(str(row['source_file']), int(row['line_id_in_file_header']))] = int(row['byte_offset'])

                if global_offset_map:
                    max_line_id_in_offset_map = 0
                    for (src_file, line_id), byte_offset in global_offset_map.items():
                        if line_id > max_line_id_in_offset_map:
                            max_line_id_in_offset_map = line_id
                    _parsed_line_counter_local = max_line_id_in_offset_map
                    print(f"Initialized local parsed_line_counter to {_parsed_line_counter_local} based on existing offset index.")
            except Exception as e:
                print(f"Error loading existing offset index CSV in stream_simulator: {e}. Starting with empty offset map.")
                global_offset_map.clear()
                _parsed_line_counter_local = 0
        else:
            print("Byte-offset index CSV not found for appending. Starting from scratch in stream_simulator.")
            global_offset_map.clear()

        # If template CSV exists, populate the global_unique_templates_map
        # It's okay to clear global_unique_templates_map here if you want only new templates
        # to be added during the current stream. If you want to *preserve* existing
        # templates and *add* new ones, you would remove the .clear() here.
        # Given the context of a "stream simulation" that then saves the *final* templates,
        # it makes sense to start with loaded ones and add to them.
        # So, I'll keep the .clear() here, as it was in your original code's intent.
        global_unique_templates_map.clear() # Always clear for fresh stream template discovery (or load below)
        if os.path.exists(config.OUTPUT_TEMPLATES_CSV):
            try:
                templates_df = pd.read_csv(config.OUTPUT_TEMPLATES_CSV)
                for index, row in templates_df.iterrows():
                    global_unique_templates_map[str(row['EventTemplate'])] = row.to_dict() # Populate from CSV
                print(f"Loaded {len(global_unique_templates_map)} templates from existing CSV.")
            except Exception as e:
                print(f"Error loading existing templates CSV in stream_simulator: {e}. Starting with empty templates map.")
                global_unique_templates_map.clear()

    # --- Verify Raw Logs Directory ---
    if not os.path.exists(config.RAW_LOGS_DIR):
        print(f"ERROR: Raw logs directory NOT FOUND at {config.RAW_LOGS_DIR}. Cannot simulate stream.")
        return

    # Prepare list of all raw log files to process
    all_raw_log_files = [os.path.join(config.RAW_LOGS_DIR, f) for f in os.listdir(config.RAW_LOGS_DIR) if os.path.isfile(os.path.join(config.RAW_LOGS_DIR, f)) and (f.endswith('.log') or f.endswith('.txt'))]
    all_raw_log_files.sort()

    if not all_raw_log_files:
        print(f"ERROR: No raw log files found in {config.RAW_LOGS_DIR}. Cannot simulate stream.")
        return

    # Open the output JSONL and offset index files for appending
    # This try-except block now correctly wraps the entire processing logic within the function.
    try:
        with open(config.OUTPUT_PARSED_JSONL, 'a', encoding='utf-8') as f_parsed_jsonl, \
             open(config.OFFSET_INDEX_FILE, 'a', encoding='utf-8') as f_offset_index:

            total_raw_lines_processed = 0

            # This is the main stream loop iterating through raw log files
            for log_file_path in tqdm(all_raw_log_files, desc="Streaming from raw log files"):
                print(f"Processing raw log file: {os.path.basename(log_file_path)}")

                with open(log_file_path, 'r', encoding='utf-8', errors='ignore') as f_raw:
                    for i, raw_line in enumerate(f_raw):
                        if stop_event.is_set():
                            print("\nStream simulation stopped by external event.")
                            break # Break from the inner loop (current file)

                        total_raw_lines_processed += 1

                        time.sleep(config.STREAM_DELAY_SECONDS)

                        # --- Process a single raw log line ---
                        header_info = log_processor.parse_log_line_hybrid_single(raw_line)

                        if header_info:
                            if _current_multi_line_log_buffer and _last_parsed_multi_line_header_info:
                                full_original_message = "".join(_current_multi_line_log_buffer).strip()
                                content_to_normalize = _last_parsed_multi_line_header_info['content_raw']
                                normalized_template_key = log_processor.normalize_log_content(content_to_normalize)

                                # Discover unique template
                                if normalized_template_key not in global_unique_templates_map: # Use global map
                                    event_id_hash = hashlib.md5(normalized_template_key.encode('utf-8')).hexdigest()[:8].upper()
                                    global_unique_templates_map[normalized_template_key] = { # Use global map
                                        'EventId': f'HDFS_{event_id_hash}',
                                        'EventTemplate': normalized_template_key,
                                        'Description': 'Auto-generated template (Needs human review)',
                                        'SampleOriginalMessage': full_original_message,
                                        'SampleLevel': _last_parsed_multi_line_header_info['level'],
                                        'SampleComponent': _last_parsed_multi_line_header_info['component'],
                                    }

                                final_parsed_entry = {
                                    "line_id_in_file_header": _last_parsed_multi_line_header_info['line_id_in_file_header'],
                                    "source_file": _last_parsed_multi_line_header_info['source_file'],
                                    "original_log_full": full_original_message,
                                    "timestamp": _last_parsed_multi_line_header_info['timestamp'],
                                    "level": _last_parsed_multi_line_header_info['level'],
                                    "component": _last_parsed_multi_line_header_info['component'],
                                    "event_id": global_unique_templates_map[normalized_template_key]['EventId'],
                                    "event_template": global_unique_templates_map[normalized_template_key]['EventTemplate'],
                                    "parameters": ""
                                }

                                current_byte_offset = f_parsed_jsonl.tell()
                                json_line_str = json.dumps(final_parsed_entry) + '\n'
                                f_parsed_jsonl.write(json_line_str)

                                offset_index_entry = {
                                    'source_file': final_parsed_entry['source_file'],
                                    'line_id_in_file_header': final_parsed_entry['line_id_in_file_header'],
                                    'byte_offset': current_byte_offset
                                }
                                f_offset_index.write(json.dumps(offset_index_entry) + '\n')

                                global_offset_map[(offset_index_entry['source_file'], offset_index_entry['line_id_in_file_header'])] = offset_index_entry['byte_offset']
                                global_parsed_line_counter_list[0] += 1

                                if _last_parsed_multi_line_header_info['level'].strip().upper() in config.PROBLEMATIC_LEVELS_TO_ANALYZE:
                                    problem_queue_instance.put({
                                        'raw_log_entry_string': full_original_message,
                                        'parsed_entry_metadata': {
                                            'source_file': final_parsed_entry['source_file'],
                                            'line_id_in_file_header': final_parsed_entry['line_id_in_file_header'],
                                            'original_log_full': final_parsed_entry['original_log_full'],
                                            'timestamp': final_parsed_entry['timestamp'],
                                            'level': final_parsed_entry['level'],
                                            'component': final_parsed_entry['component'],
                                            'event_id': final_parsed_entry['event_id'],
                                            'event_template': final_parsed_entry['event_template'],
                                        }
                                    })

                            # Start new logical log entry buffer with the current line (header)
                            _current_multi_line_log_buffer = [raw_line]
                            _last_parsed_multi_line_header_info = header_info
                            _last_parsed_multi_line_header_info['line_id_in_file_header'] = i + 1
                            _last_parsed_multi_line_header_info['source_file'] = os.path.basename(log_file_path)

                        else: # This line is a continuation of the previous log entry
                            _current_multi_line_log_buffer.append(raw_line)
                            if not _last_parsed_multi_line_header_info and raw_line.strip():
                                _current_multi_line_log_buffer = []

                # This check ensures we break the outer loop if the stop_event was set
                if stop_event.is_set():
                    print("\nStream simulation stopped by external event.")
                    break # Break from the outer loop (file iteration)

            # --- FINAL FLUSH after all files are processed ---
            # This block needs to be inside the outermost try-with-open for f_parsed_jsonl and f_offset_index
            if _current_multi_line_log_buffer and _last_parsed_multi_line_header_info:
                full_original_message = "".join(_current_multi_line_log_buffer).strip()
                content_to_normalize = _last_parsed_multi_line_header_info['content_raw']
                normalized_template_key = log_processor.normalize_log_content(content_to_normalize)

                if normalized_template_key not in global_unique_templates_map:
                    event_id_hash = hashlib.md5(normalized_template_key.encode('utf-8')).hexdigest()[:8].upper()
                    global_unique_templates_map[normalized_template_key] = {
                        'EventId': f'HDFS_{event_id_hash}',
                        'EventTemplate': normalized_template_key,
                        'Description': 'Auto-generated template (Needs human review)',
                        'SampleOriginalMessage': full_original_message,
                        'SampleLevel': _last_parsed_multi_line_header_info['level'],
                        'SampleComponent': _last_parsed_multi_line_header_info['component'],
                    }
                final_parsed_entry = {
                    "line_id_in_file_header": _last_parsed_multi_line_header_info['line_id_in_file_header'],
                    "source_file": _last_parsed_multi_line_header_info['source_file'],
                    "original_log_full": full_original_message,
                    "timestamp": _last_parsed_multi_line_header_info['timestamp'],
                    "level": _last_parsed_multi_line_header_info['level'],
                    "component": _last_parsed_multi_line_header_info['component'],
                    "event_id": global_unique_templates_map[normalized_template_key]['EventId'],
                    "event_template": normalized_template_key,
                    "parameters": ""
                }
                json_line = json.dumps(final_parsed_entry) + '\n'
                f_parsed_jsonl.write(json_line)

                offset_index_entry = {
                    'source_file': final_parsed_entry['source_file'],
                    'line_id_in_file_header': final_parsed_entry['line_id_in_file_header'],
                    'byte_offset': f_parsed_jsonl.tell() - len(json_line.encode('utf-8'))
                }
                f_offset_index.write(json.dumps(offset_index_entry) + '\n')
                global_offset_map[(offset_index_entry['source_file'], offset_index_entry['line_id_in_file_header'])] = offset_index_entry['byte_offset']
                global_parsed_line_counter_list[0] += 1

        print(f"\n--- Raw Log Stream Simulation Complete ---")
        print(f"Total raw lines processed: {total_raw_lines_processed}")
        print(f"Total logical log entries parsed and indexed: {global_parsed_line_counter_list[0]}")

    except Exception as e:
        # This except block needs to be at the same indentation level as the 'try' it belongs to.
        print(f"An error occurred during streaming or parsing: {e}")