import json
import os

# Import configurations from config.py
import config
from langchain.prompts import PromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_google_genai import GoogleGenerativeAIEmbeddings


# --- LLM Prompt Template ---
# Defined globally here so it can be reused.
PROMPT_TEMPLATE_LLM = PromptTemplate(
    template="""
You are an expert HDFS (Hadoop Distributed File System) Site Reliability Engineer (SRE) and incident responder.
Your task is to concisely analyze a given problematic HDFS log entry, understand the specific underlying problem, and generate a brief, actionable incident response plan.

Here is the problematic HDFS log entry for analysis:
{log_entry_full}

Here is the sequence of preceding log events that led up to this problem:
{sequence_of_events_json}

Here is relevant troubleshooting and solution context from our knowledge base:
{context}

Based on the HDFS log entry, the sequence of events, and the provided context, please perform the following:

**LLM Analysis Feedback (Self-Evaluation):**
* **Confidence Level (High/Medium/Low):** How confident are you in this analysis based on the provided information?
* **Context Sufficiency (Sufficient/Partially Sufficient/Insufficient):** Is the provided `log_entry_full`, `sequence_of_events_json`, and `context` enough for a definitive root cause and solution?
* **Needed Additional Info (If Insufficient):** Explain what specific additional log entries (e.g., timestamps, components, error messages), metrics, or external context would improve accuracy.

1.  **Problem Summary:** Provide a concise, clear summary of what specifically went wrong, referencing insights from the sequence if possible.
2.  **Severity Assessment:** Assign a severity level (Critical, High, Medium, Low) based on the log's impact.
3.  **Impact Assessment (Brief):** Briefly describe the potential impact on HDFS services or users (e.g., data durability, performance, availability).
4.  **Root Cause Hypothesis:** Suggest the most probable root cause(s). **Explain the flow or chain of events that likely led to this problem, explicitly referencing specific events or patterns from the provided sequence.** Be specific about the modules or components involved in the causal chain.
5.  **Affected Components:** List the HDFS components or services that are most likely affected.
6.  **Actionable Response Plan (Brief & Role-Specific):**
    * For each action, provide:
        * `step_description`: A concise description of the action.
        * `responsible_team`: Specify WHICH TEAM (DevOps/SRE, Developer, Security).
        * `responsible_module_or_component`: Specify WHICH MODULE/COMPONENT should perform the action (e.g., DataNode Storage, NameNode IPC Layer, HDFS Client Library).
        * `specific_effect_on_problem`: What this action will specifically do and how it directly addresses the error or root cause.
        * `expected_outcome_or_status`: What specific result to look for if the action is successful (e.g., "logs show 'service started'", "metric returns to baseline").
        * `type`: Classify as 'DIAGNOSTIC_ONLY' or 'POTENTIALLY_MODIFIES_STATE'.
    * **Prioritize the top 3-5 most impactful actions per role.**

7.  **Known Workarounds/Temporary Mitigations (If Applicable):**
    * Provide a brief list of any quick, temporary fixes that could alleviate the immediate problem while a permanent solution is being investigated. If none, state "None identified".

Format your entire response as a single JSON object with the following keys:
"llm_analysis_feedback": {{
    "confidence_level": "...",
    "context_sufficiency": "...",
    "needed_additional_info": "..."
}},
"summary": "...",
"severity": "...",
"impact_assessment": "...",
"root_cause_hypothesis": "...",
"affected_components": ["...", "..."],
"response_plan": {{
    "devops_sre_actions": [
        {{"step_description": "...", "responsible_team": "...", "responsible_module_or_component": "...", "specific_effect_on_problem": "...", "expected_outcome_or_status": "...", "type": "..."}},
        {{"step_description": "...", "responsible_team": "...", "responsible_module_or_component": "...", "specific_effect_on_problem": "...", "expected_outcome_or_status": "...", "type": "..."}}
    ],
    "developer_actions": [
        {{"step_description": "...", "responsible_team": "...", "responsible_module_or_component": "...", "specific_effect_on_problem": "...", "expected_outcome_or_status": "...", "type": "..."}},
        {{"step_description": "...", "responsible_team": "...", "responsible_module_or_component": "...", "specific_effect_on_problem": "...", "expected_outcome_or_status": "...", "type": "..."}}
    ],
    "security_actions": [
        {{"step_description": "...", "responsible_team": "...", "responsible_module_or_component": "...", "specific_effect_on_problem": "...", "expected_outcome_or_status": "...", "type": "..."}},
        {{"step_description": "...", "responsible_team": "...", "responsible_module_or_component": "...", "specific_effect_on_problem": "...", "expected_outcome_or_status": "...", "type": "..."}}
    ]
}},
"temporary_mitigations": ["...", "..."]
}}
"""
, # Don't forget the comma after the template string if adding more args
    input_variables=["log_entry_full", "sequence_of_events_json", "context"] # <--- ADD THIS LINE
)

# --- Main LLM Processing Function ---
def analyze_and_generate_solution(
    parsed_entry_metadata: dict,
    llm_instance: ChatGoogleGenerativeAI,
    retriever_instance,
    offset_map: dict,
    parsed_jsonl_path: str
) -> dict:
    """
    Processes a single parsed log entry, retrieves context, invokes LLM, and returns structured solution.
    """

    # It's generally better to import at the top of the file if possible to avoid
    # repeated imports or unexpected behavior, but for circular dependencies,
    # importing locally as you've done is a valid workaround.
    from log_processor import get_contextual_log_sequence_from_disk
    # The 'config' module is already imported at the top, no need to re-import it here.
    # import config # This line is redundant here and can be removed.


    # 1. Retrieve Contextual Sequence (from the 43GB parsed JSONL file on disk)
    log_sequence = get_contextual_log_sequence_from_disk(
        all_parsed_jsonl_path=parsed_jsonl_path,
        target_entry_metadata=parsed_entry_metadata,
        num_lines_before=config.NUM_PRECEDING_LOGS_FOR_SEQUENCE,
        offset_map=offset_map
    )
    sequence_json_str = json.dumps(log_sequence, indent=2)

    # --- NEW: Capture sequence retrieval status and count ---
    sequence_retrieval_status = "Retrieved" if log_sequence else "Not Retrieved"
    sequence_retrieved_count = len(log_sequence)


    # 2. Prepare query for RAG retriever
    retriever_query = f"HDFS troubleshooting for {parsed_entry_metadata.get('level', 'N/A')} log: {parsed_entry_metadata.get('event_template', '')}. Original log snippet: {parsed_entry_metadata.get('original_log_full', '')[:200]}"

    # 3. Retrieve relevant context from knowledge base
    retrieved_docs = retriever_instance.invoke(retriever_query)
    context_text = "\n\n".join([doc.page_content for doc in retrieved_docs])

    # --- NEW: Capture RAG retrieval count ---
    rag_chunks_retrieved_count = len(retrieved_docs)

    if not context_text:
        context_text = "No specific context found in the knowledge base. The LLM will generate a general solution."

    # 4. Prepare the final prompt for the LLM
    final_prompt_for_llm = PROMPT_TEMPLATE_LLM.format(
        log_entry_full=parsed_entry_metadata['original_log_full'],
        sequence_of_events_json=sequence_json_str,
        context=context_text
    )

    # 5. Invoke the LLM directly with the prepared prompt
    try:
        llm_response = llm_instance.invoke(final_prompt_for_llm)
        solution_json_str = llm_response.content.strip()

        if solution_json_str.startswith("```json"):
            solution_json_str = solution_json_str.lstrip("```json").rstrip("```").strip()

        generated_solution = json.loads(solution_json_str)

        # --- NEW: Add retrieval metadata to the generated_solution JSON for worker_manager ---
        # Ensure 'llm_analysis_feedback' exists as it's defined in prompt, but we inject values.
        if 'llm_analysis_feedback' not in generated_solution:
            generated_solution['llm_analysis_feedback'] = {}

        generated_solution['llm_analysis_feedback']['sequence_retrieval_status'] = sequence_retrieval_status
        generated_solution['llm_analysis_feedback']['sequence_retrieved_count'] = sequence_retrieved_count
        generated_solution['llm_analysis_feedback']['rag_chunks_retrieved_count'] = rag_chunks_retrieved_count

        return generated_solution

    except json.JSONDecodeError as e:
        return {"error": "JSON parsing failed", "raw_response_snippet": solution_json_str[:500]}
    except Exception as e:
        return {"error": str(e)}