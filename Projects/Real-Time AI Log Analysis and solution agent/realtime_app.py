import os
import re
import json
import time 
import hashlib 
import pandas as pd 
from dotenv import load_dotenv
from tqdm import tqdm 
import threading 
import queue 
import signal

# LangChain components for RAG (Direct Imports needed in this file)
from langchain_community.document_loaders import PyPDFLoader, TextLoader, UnstructuredFileLoader, UnstructuredMarkdownLoader 
from langchain.text_splitter import RecursiveCharacterTextSplitter 
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain_community.vectorstores import FAISS 
from langchain.prompts import PromptTemplate

# Import modularized functionalities
import config 
import log_processor 
import rag_builder 
import llm_service 
import stream_simulator 
import worker_manager 

# --- 1. Global Configuration (ALL GLOBALS DEFINED AT THE TOP) ---
load_dotenv() 

# All global path and LLM config variables are now imported from config.py
# Removed local definitions to ensure consistency.

# --- CONTROL FLAGS (from config.py) ---
REGENERATE_ALL_FROM_RAW_LOGS = config.REGENERATE_ALL_FROM_RAW_LOGS 
REBUILD_FAISS_INDEX = config.REBUILD_FAISS_INDEX 

# --- 2. Global AI Component Instances & Shared State ---
llm_instance = None 
embedding_model_instance = None
retriever_instance = None
offset_map = {} 
problem_queue = queue.Queue() 
stop_event = threading.Event() 
parsed_line_counter = [0] 
unique_templates_map = {} 

# --- 3. Helper Functions (These are now imported from log_processor.py if needed elsewhere in realtime_app.py) ---
# --- 4. Core AI Component Initialization ---
def initialize_ai_components():
    """Initializes LLM, Embedding Model, and RAG/Offset Map globally."""
    global llm_instance, embedding_model_instance, retriever_instance, offset_map, parsed_line_counter, unique_templates_map

    print("\n--- Initializing AI Components (One-time Setup) ---")

    # Create output directories (now using paths from config.py)
    os.makedirs(os.path.dirname(config.OUTPUT_TEMPLATES_CSV), exist_ok=True)
    os.makedirs(os.path.dirname(config.OUTPUT_PARSED_JSONL), exist_ok=True)
    os.makedirs(os.path.dirname(config.OUTPUT_SOLUTIONS_JSONL), exist_ok=True) 
    os.makedirs(config.SOLUTION_DOCS_DIR, exist_ok=True) 
    os.makedirs(config.FAISS_INDEX_PATH, exist_ok=True) 

    # 1. Initialize LLM
    llm_instance = ChatGoogleGenerativeAI(
        model=config.LLM_MODEL, 
        temperature=config.LLM_TEMPERATURE, 
        max_output_tokens=config.LLM_MAX_OUTPUT_TOKENS, 
        google_api_key=os.getenv("GOOGLE_API_KEY")
    )
    print("Gemini LLM initialized.")

    # 2. Initialize Embedding Model
    embedding_model_instance = GoogleGenerativeAIEmbeddings(
        model="models/embedding-001", 
        google_api_key=os.getenv("GOOGLE_API_KEY")
    )
    print("Gemini Embedding model initialized.")

    # 3. Load or initialize the global offset_map
    if not config.REGENERATE_ALL_FROM_RAW_LOGS: 
        if os.path.exists(config.OFFSET_INDEX_FILE): 
            try:
                offset_df = pd.read_csv(config.OFFSET_INDEX_FILE) 
                for index, row in tqdm(offset_df.iterrows(), total=len(offset_df), desc="Loading offset map"):
                    offset_map[(str(row['source_file']), int(row['line_id_in_file_header']))] = int(row['byte_offset'])
                print(f"Loaded byte-offset index with {len(offset_map)} entries for live usage.")
                
                if offset_map:
                    max_line_id = 0
                    for (src_file, line_id), byte_offset in offset_map.items():
                        if line_id > max_line_id:
                            max_line_id = line_id
                    parsed_line_counter[0] = max_line_id 
                    print(f"Initialized parsed_line_counter to {parsed_line_counter[0]} based on existing offset index.")
                
            except Exception as e:
                print(f"Error loading offset index CSV: {e}. Starting with empty offset map.")
                offset_map = {} 
        else:
            print("Byte-offset index CSV not found. Starting with empty offset map for live generation during stream.")
            offset_map = {}
    else: 
        print("REGENERATE_ALL_FROM_RAW_LOGS is True. Offset map will be built during stream simulation.")
        offset_map = {}


    # 4. Build/Load RAG Knowledge Base (with FAISS Persistence)
    retriever_instance = rag_builder.build_or_load_rag_knowledge_base(embedding_model_instance) 
    
    print("\n--- AI Components Setup Complete ---")

# --- 5. Signal Handler for Graceful Shutdown ---
def signal_handler(signum, frame):
    """Handles OS signals (like Ctrl+C) for graceful shutdown."""
    print(f"\n--- Signal {signum} received. Initiating graceful shutdown... ---")
    stop_event.set() 

# --- 6. Main Execution Block ---
if __name__ == "__main__":
    print("--- Starting AI Incident Response Application ---")

    # Register signal handler for Ctrl+C
    signal.signal(signal.SIGINT, signal_handler)

    # 0. Create necessary output directories
    os.makedirs(os.path.dirname(config.OUTPUT_TEMPLATES_CSV), exist_ok=True)
    os.makedirs(os.path.dirname(config.OUTPUT_PARSED_JSONL), exist_ok=True)
    os.makedirs(os.path.dirname(config.OUTPUT_SOLUTIONS_JSONL), exist_ok=True) 
    os.makedirs(config.SOLUTION_DOCS_DIR, exist_ok=True) 
    os.makedirs(config.FAISS_INDEX_PATH, exist_ok=True) 

    # --- NEW FIX: Clear solutions file at startup if regenerating ---
    if config.REGENERATE_ALL_FROM_RAW_LOGS:
        if os.path.exists(config.OUTPUT_SOLUTIONS_JSONL):
            os.remove(config.OUTPUT_SOLUTIONS_JSONL)
            print(f"Cleared existing {config.OUTPUT_SOLUTIONS_JSONL} for a fresh run.")
    
    # 1. Initialize all AI components (LLM, Embedder, RAG, Offset Map) once at startup
    initialize_ai_components()
    
    # 2. Start the LLM Analysis Worker Thread
    llm_worker_thread = threading.Thread(
        target=worker_manager.llm_analysis_worker_thread, 
        args=(llm_instance, retriever_instance, problem_queue, offset_map, config.OUTPUT_PARSED_JSONL, stop_event), 
        daemon=True 
    )
    llm_worker_thread.start()
    
    # 3. Run the Log Stream Simulation in the main thread
    try:
        stream_simulator.simulate_raw_log_stream(
            problem_queue_instance=problem_queue,
            stop_event=stop_event,
            global_offset_map=offset_map,
            global_unique_templates_map=unique_templates_map, 
            global_parsed_line_counter_list=parsed_line_counter 
        )
    except Exception as e:
        print(f"\nERROR: Stream simulation failed: {e}")
        stop_event.set() 

    # Give the worker a chance to finish processing the queue
    print("\n--- Stream simulation finished. Waiting for LLM worker to clear queue... ---")
    problem_queue.join() 
    stop_event.set() 
    llm_worker_thread.join() # Removed timeout for robustness
    
    # Final save of templates (accumulated in unique_templates_map during stream)
    print("\n--- Final Save of Templates ---")
    templates_data_list = []
    for template_key, template_info in unique_templates_map.items(): 
        templates_data_list.append(template_info)

    if templates_data_list:
        templates_df = pd.DataFrame(templates_data_list) 
        templates_df = templates_df[['EventId', 'EventTemplate', 'Description', 'SampleOriginalMessage', 'SampleLevel', 'SampleComponent']]
        templates_df.to_csv(config.OUTPUT_TEMPLATES_CSV, index=False) 
        print(f"Successfully saved {len(templates_df)} unique templates to {config.OUTPUT_TEMPLATES_CSV}")
    else:
        print("No templates were generated during stream. Template CSV not updated.")

    print("\nApplication finished.")