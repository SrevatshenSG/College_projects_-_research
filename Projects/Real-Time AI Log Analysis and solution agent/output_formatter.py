# output_formatter.py

def format_solution_for_display(solution: dict) -> str:
    """
    Formats the LLM-generated incident response plan (JSON) into a human-readable string.
    """
    formatted_output = []

    # Basic Info
    formatted_output.append(f"--- INCIDENT RESPONSE PLAN ---")
    formatted_output.append(f"Incident Summary: {solution.get('summary', 'N/A')}")
    formatted_output.append(f"Severity: {solution.get('severity', 'N/A')}")
    formatted_output.append(f"Impact Assessment: {solution.get('impact_assessment', 'N/A')}")
    formatted_output.append(f"Affected Components: {', '.join(solution.get('affected_components', ['N/A']))}")
    formatted_output.append("-" * 40)

    # Root Cause Hypothesis
    formatted_output.append("Root Cause Hypothesis:")
    formatted_output.append(f"  {solution.get('root_cause_hypothesis', 'N/A')}")
    formatted_output.append("-" * 40)

    # Response Plan
    response_plan = solution.get('response_plan', {})
    if response_plan:
        formatted_output.append("Response Plan:")
        for team, actions in response_plan.items():
            formatted_output.append(f"\n  {team.replace('_', ' ').title()} ")
            if actions:
                for i, action in enumerate(actions):
                    formatted_output.append(f"    {i+1}. {action.get('step_description', 'N/A')}")
                    formatted_output.append(f"       - Responsible Team: {action.get('responsible_team', 'N/A')}")
                    formatted_output.append(f"       - Component: {action.get('responsible_module_or_component', 'N/A')}")
                    formatted_output.append(f"       - Effect on Problem: {action.get('specific_effect_on_problem', 'N/A')}")
                    formatted_output.append(f"       - Expected Outcome: {action.get('expected_outcome_or_status', 'N/A')}")
                    formatted_output.append(f"       - Type: {action.get('type', 'N/A')}")
            else:
                formatted_output.append("    No actions specified.")
    else:
        formatted_output.append("No response plan provided.")
    formatted_output.append("-" * 40)

    # Temporary Mitigations
    temp_mitigations = solution.get('temporary_mitigations', [])
    formatted_output.append("Temporary Mitigations:")
    if temp_mitigations:
        for i, mitigation in enumerate(temp_mitigations):
            formatted_output.append(f"  {i+1}. {mitigation}")
    else:
        formatted_output.append("  None specified.")
    formatted_output.append("-" * 40)

    # LLM Analysis Feedback
    feedback = solution.get('llm_analysis_feedback', {})
    formatted_output.append("LLM Analysis Feedback:")
    formatted_output.append(f"  Confidence Level: {feedback.get('confidence_level', 'N/A')}")
    formatted_output.append(f"  Context Sufficiency: {feedback.get('context_sufficiency', 'N/A')}")
    formatted_output.append(f"  Needed Additional Info: {feedback.get('needed_additional_info', 'N/A')}")
    formatted_output.append(f"  Sequence Retrieval Status: {feedback.get('sequence_retrieval_status', 'N/A')} ({feedback.get('sequence_retrieved_count', 'N/A')} entries)")
    formatted_output.append(f"  RAG Chunks Retrieved: {feedback.get('rag_chunks_retrieved_count', 'N/A')}")
    formatted_output.append("-" * 40)

    return "\n".join(formatted_output)