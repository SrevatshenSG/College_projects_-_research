import os
from dotenv import load_dotenv
import re

# Load environment variables from .env file (for API keys)
load_dotenv()

# --- 1. Paths Configuration ---
# All paths are relative to the 'realtime_hdfs_ai_app/' project root.
# Ensure your data folder structure matches this.

# Raw Log Files (Input Stream Source)
RAW_LOGS_DIR = os.path.join("data", "raw_logs", "hdfs_v2", "HDFS_v2", "node_logs") 

# Generated Parsed Log File (Live-updating stream output)
OUTPUT_PARSED_JSONL = os.path.join("data", "parsed_logs", "realtime_parsed_logs.jsonl")

# Byte-Offset Index File (Live-updating index for parsed logs)
OFFSET_INDEX_FILE = os.path.join("data", "parsed_logs", "realtime_offset_index.csv")

# Generated Templates CSV (Output of stream processing)
OUTPUT_TEMPLATES_CSV = os.path.join("data", "templates", "realtime_templates.csv")

#Path for LLM-generated solutions output
OUTPUT_SOLUTIONS_JSONL = os.path.join("data", "solutions", "realtime_llm_solutions.jsonl")

# Solution Documents for RAG Knowledge Base
SOLUTION_DOCS_DIR = os.path.join("data", "solution_docs")

# FAISS Index Persistence Path
FAISS_INDEX_PATH = "faiss_index/" 

# --- 2. LLM Configuration ---
LLM_MODEL = "gemini-2.0-flash"
LLM_TEMPERATURE = 0.0
LLM_MAX_OUTPUT_TOKENS = 4096 # Max tokens for LLM response

# --- 3. Parsing & Problem Detection Configuration ---
# Regex for parsing log line headers (used to extract Date, Time, Level, Component, Content)
HDFS_HEADER_REGEX_PATTERN = r'^(?P<Date>\d{4}-\d{2}-\d{2})\s(?P<Time>\d{2}:\d{2}:\d{2},\d{3})\s(?P<Level>[A-Z]+)\s(?P<Component>[\w\._-]+(?:\[[\w\s\.-]+\])?):?\s+(?P<Content>.*)$'

# Normalization rules for log content (replace variables with placeholders)
# Order is CRUCIAL: More specific rules should come before more general rules.
NORMALIZATION_RULES = [
    (re.compile(r'\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?\b'), '<IP_ADDRESS>'), 
    (re.compile(r'\b(?:blk_|BP-|DS-)[-_a-zA-Z0-9]+\b'), '<HDFS_ID>'), 
    (re.compile(r'\b(?:mesos-master-\d+|nodename \d+@mesos-master-\d+|localhost)\b'), '<HOSTNAME_OR_NODE>'), 
    (re.compile(r'\b([a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12})\b'), '<UUID>'), 
    (re.compile(r'\b(?:/usr/local/hadoop|/opt/hdfs/data|/[a-zA-Z0-9/\._-]+/\.jar)[\w\/\.-]*\b'), '<HADOOP_PATH>'), 
    (re.compile(r'[-_a-zA-Z0-9]+\.jar'), '<JAR_FILE>'), 
    (re.compile(r'\b(?:version|build)\s*=\s*[\w\.\-]+(?:(?:-|:)?\s*[\w\.:-]+)?(?:; compiled by [\w\s\']+\son\s[\d\-T:]+Z)?\b'), '<VERSION_INFO>'), 
    (re.compile(r'java = \d+\.\d+\.\d+_?\d*'), '<JAVA_VERSION>'), 
    (re.compile(r'took\s+\d+ms\s+\(threshold=\d+ms\)'), 'took <NUM>ms (threshold=<NUM>ms)'), 
    (re.compile(r'Scheduled snapshot period at \d+ second\(s\)\.'), 'Scheduled snapshot period at <NUM> second(s).'), 
    (re.compile(r'Balanced bandwith is \d+ bytes/s'), 'Balancing bandwith is <NUM> bytes/s'), 
    (re.compile(r'Number threads for balancing is \d+'), 'Number threads for balancing is <NUM>'), 
    (re.compile(r'registered UNIX signal handlers for \[[\w,\s]+\]'), 'registered UNIX signal handlers for [<SIGNAL_LIST>]'), 
    (re.compile(r'Listening HTTP traffic on /<IP_ADDRESS>:<NUM>'), 'Listening HTTP traffic on <IP_ADDRESS>:<NUM>'), 
    (re.compile(r'IPC server at /<IP_ADDRESS>:<NUM>'), 'IPC server at <IP_ADDRESS>:<NUM>'), 
    (re.compile(r'Jetty bound to port \d+'), 'Jetty bound to port <NUM>'), 
    (re.compile(r'jetty-[\d\.]+'), 'jetty-<VERSION>'), 
    (re.compile(r'block report from <IP_ADDRESS>\. Number of blocks: \d+'), 'block report from <IP_ADDRESS>. Number of blocks: <NUM>'), 
    (re.compile(r'Logging to org\.slf4j\.impl\.Log4jLoggerAdapter\(org\.mortbay\.log\) via org\.mortbay\.log\.Slf4jLog'), 'Logging to <LOGGER_IMPL> via <LOGGER_BRIDGE>'), 
    (re.compile(r'Unable to initialize FileSignerSecretProvider, falling back to use random secrets\.'), 'Unable to initialize FileSignerSecretProvider, falling back to use random secrets.'), 
    (re.compile(r'\d+'), '<NUM>'), 
]

PROBLEMATIC_LEVELS_TO_ANALYZE = ['ERROR', 'WARN', 'FATAL']
NUM_PRECEDING_LOGS_FOR_SEQUENCE = 10 # Number of lines before problematic one to retrieve

# --- 4. Stream Simulation Configuration ---
STREAM_DELAY_SECONDS = 0.001 # 1 millisecond delay per raw log line processed

# NEW: Template Saving Interval
TEMPLATE_SAVE_INTERVAL_LINES = 100000 # Save template CSV every 100,000 parsed log entries
# Set to True to regenerate the entire parsed JSONL and offset index from RAW logs at app startup.
# Set to False if you want to use existing parsed log file and offset index (if they exist).
# Recommended: True for first run, then False for faster subsequent runs.
REGENERATE_ALL_FROM_RAW_LOGS = True 
# Set to True to force rebuilding FAISS index from solution docs, even if it exists
REBUILD_FAISS_INDEX = False