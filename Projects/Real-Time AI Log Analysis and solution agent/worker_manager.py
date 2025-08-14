import queue
import threading
import json
import os
from tqdm import tqdm

# Import components from other modules
import config
import llm_service
import log_processor
import output_formatter # Ensure output_formatter.py exists in the same directory or is importable

# --- LLM Analysis Worker (Concurrent Thread) ---
def llm_analysis_worker_thread(
    llm_instance_arg,
    retriever_instance_arg,
    problem_queue_arg: queue.Queue,
    offset_map_arg: dict,
    parsed_jsonl_path_arg: str,
    stop_event_arg: threading.Event,
    ui_update_queue_instance: queue.Queue # This parameter is crucial for UI communication
):
    """
    Worker thread that continuously pulls problematic entries from the queue
    and generates LLM solutions, saving them to a file and printing structured output.
    """
    print("\n--- LLM Analysis Worker Started ---")
    solutions_generated_count = 0

    # It's generally better to import specific functions rather than the whole module inside a function
    # but for simplicity and maintaining the original structure, keeping it here.
    from llm_service import analyze_and_generate_solution

    os.makedirs(os.path.dirname(config.OUTPUT_SOLUTIONS_JSONL), exist_ok=True)

    try:
        with open(config.OUTPUT_SOLUTIONS_JSONL, 'a', encoding='utf-8') as solutions_file:
            while not stop_event_arg.is_set() or not problem_queue_arg.empty():
                try:
                    problem_context = problem_queue_arg.get(timeout=1)

                    parsed_entry_metadata = problem_context['parsed_entry_metadata']
                    # raw_log_entry_string = problem_context['raw_log_entry_string'] # This variable is not used after assignment

                    print(f"[Worker] Analyzing problem #{solutions_generated_count + 1} (ID: {parsed_entry_metadata.get('event_id', 'N/A')}, Level: {parsed_entry_metadata.get('level', 'N/A')})...")

                    # --- Perform LLM Analysis for this Problem ---
                    generated_solution = analyze_and_generate_solution(
                        parsed_entry_metadata=parsed_entry_metadata,
                        llm_instance=llm_instance_arg,
                        retriever_instance=retriever_instance_arg,
                        offset_map=offset_map_arg,
                        parsed_jsonl_path=parsed_jsonl_path_arg
                    )

                    if generated_solution and not generated_solution.get('error'):
                        solutions_generated_count += 1

                        llm_feedback = generated_solution.get('llm_analysis_feedback', {})
                        seq_status = llm_feedback.get('sequence_retrieval_status', 'N/A')
                        seq_count = llm_feedback.get('sequence_retrieved_count', 'N/A')
                        rag_count = llm_feedback.get('rag_chunks_retrieved_count', 'N/A')

                        # This diagnostic header is written to the file
                        diagnostic_header = (
                            f"--- Analyzing Entry (ID: {parsed_entry_metadata.get('event_id', 'N/A')}, Level: {parsed_entry_metadata.get('level', 'N/A')}) ---\n"
                            f"Event Template: {parsed_entry_metadata.get('event_template', 'N/A')}\n"
                            f"Original Full Log Snippet:\n{parsed_entry_metadata.get('original_log_full', '')[:500]}...\n"
                            f"Sequence analysis result: {seq_status} ({seq_count} entries retrieved)\n"
                            f"Retrieving relevant context from knowledge base...\n"
                            f"Retrieved {rag_count} document chunks.\n"
                            f"Sending final prompt to Gemini LLM for solution generation...\n\n"
                        )
                        solutions_file.write(diagnostic_header)

                        # Use the formatter from output_formatter for the file content
                        formatted_solution_text = output_formatter.format_solution_for_display(generated_solution)
                        solutions_file.write(formatted_solution_text + '\n')
                        solutions_file.write("---\n")
                        solutions_file.flush() # Ensure data is written to disk immediately

                        # Only print the concise status to the terminal
                        print(f"[Worker] Solution saved #{solutions_generated_count} (ID: {generated_solution.get('event_id', 'N/A')}) - Level: {generated_solution.get('severity', 'N/A')})")

                        # --- Send solution to UI update queue for Streamlit display ---
                        # Send the full JSON object to the UI for flexible rendering
                        ui_update_queue_instance.put({
                            'type': 'solution_generated',
                            'data': generated_solution
                        })

                    elif generated_solution and generated_solution.get('error'):
                        print(f"ERROR: Worker skipped invalid solution for {parsed_entry_metadata.get('event_id', 'N/A')}: {generated_solution.get('error')[:50]}...")
                        # Signal UI about this error
                        ui_update_queue_instance.put({
                            'type': 'error_message',
                            'message': f"Solution ERROR for {parsed_entry_metadata.get('event_id', 'N/A')}: {generated_solution.get('error')}"
                        })

                    problem_queue_arg.task_done()
                except queue.Empty:
                    # No items in queue, continue waiting or check stop event
                    continue
                except Exception as e:
                    # Catching broad exceptions for robustness in the worker thread
                    print(f"ERROR in LLM analysis worker (processing item): {e}")
                    ui_update_queue_instance.put({'type': 'error_message', 'message': f"Worker processing error: {str(e)}"})
                    # Ensure task is marked as done even on error to prevent deadlock
                    problem_queue_arg.task_done()
    finally:
        print(f"\n--- LLM Analysis Worker Stopped. Total solutions generated: {solutions_generated_count} ---")
        # Signal the UI that the worker has stopped and the final count
        ui_update_queue_instance.put({'type': 'worker_stopped', 'count': solutions_generated_count})