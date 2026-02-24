import os
import json
from typing import TypedDict, List, Dict, Any
from dotenv import load_dotenv
from openai import OpenAI
from langgraph.graph import StateGraph, END

# Load environment variables
load_dotenv()

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# ==========================================
# 1. State Definition (ContractState)
# ==========================================
class ContractState(TypedDict):
    """
    Shared state for the Contract Lifecycle Management (CLM) LangGraph.
    Data flows sequentially through agents and accumulates in this state.
    """
    contract_id: str
    raw_document: str             # The raw text extracted from the PDF
    extracted_clauses: Dict[str, Any] # Structured dictionary of key clauses
    contract_value: str           # Financial value or consideration found
    end_date: str                 # Termination or expiry date
    compliance_issues: List[str]  # List of legal/compliance violations found
    risk_flags: List[str]         # Specific risk warnings
    risk_score: float             # Calculated risk score (0-100)

# ==========================================
# 2. Agent 01: Ingestion Agent
# ==========================================
def ingestion_agent(state: ContractState) -> ContractState:
    """
    AGENT 01: Parses the raw document to extract key metadata and clauses.
    Returns: contract_value, end_date, and populated extracted_clauses.
    """
    print(f"[Agent 01: Ingestion] Processing contract: {state.get('contract_id', 'Unknown')}")
    
    prompt = f"""
    You are an expert Legal Document Parser.
    Extract the following from the provided contract text:
    1. 'contract_value': The total financial consideration or value. If none, say "Not Specified".
    2. 'end_date': The termination date or duration. If none, say "Not Specified".
    3. 'extracted_clauses': A dictionary where keys are clause names (e.g., 'Indemnity', 'Liability', 'Termination') and values are the exact text or a summary.
    
    Return pure JSON with keys: 'contract_value', 'end_date', 'extracted_clauses'.
    
    CONTRACT TEXT:
    {state.get('raw_document', '')[:10000]} # Truncated for safety
    """

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": "You are a precise JSON legal extraction engine."},
            {"role": "user", "content": prompt}
        ]
    )

    try:
        result = json.loads(response.choices[0].message.content)
        return {
            "contract_value": result.get("contract_value", "Unknown"),
            "end_date": result.get("end_date", "Unknown"),
            "extracted_clauses": result.get("extracted_clauses", {})
        }
    except Exception as e:
        print(f"Ingestion Agent Error: {e}")
        return {"contract_value": "Error", "end_date": "Error", "extracted_clauses": {}}

# ==========================================
# 3. Agent 02: Compliance Agent
# ==========================================
def compliance_agent(state: ContractState) -> ContractState:
    """
    AGENT 02: Audits the extracted clauses for legal compliance.
    Returns: A list of compliance_issues.
    """
    print("[Agent 02: Compliance] Auditing clauses for compliance violations...")
    
    clauses = state.get('extracted_clauses', {})
    
    prompt = f"""
    You are a Senior Legal Compliance Auditor.
    Review the following extracted clauses and identify any that are illegal, heavily biased, commercially unreasonable, or violate standard B2B compliance.
    
    Return pure JSON with a single key 'compliance_issues' containing a list of strings detailing the issues. If none, return an empty list.
    
    CLAUSES:
    {json.dumps(clauses)}
    """

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": "You are a legal compliance JSON generator."},
            {"role": "user", "content": prompt}
        ]
    )

    try:
        result = json.loads(response.choices[0].message.content)
        return {"compliance_issues": result.get("compliance_issues", [])}
    except Exception as e:
        print(f"Compliance Agent Error: {e}")
        return {"compliance_issues": ["Error during compliance check."]}

# ==========================================
# 4. Agent 03: Risk Agent
# ==========================================
def risk_agent(state: ContractState) -> ContractState:
    """
    AGENT 03: Evaluates compliance issues to assign a risk score and flags.
    Returns: risk_score (0-100 float) and risk_flags (list of strings).
    """
    print("[Agent 03: Risk] Calculating overall contract risk score...")
    
    issues = state.get('compliance_issues', [])
    value = state.get('contract_value', 'Unknown')
    
    prompt = f"""
    You are a Chief Risk Officer AI.
    Evaluate the following compliance issues and the contract value to determine the risk.
    Calculate a 'risk_score' as a float from 0.0 (perfectly safe) to 100.0 (extreme risk).
    Generate a list of 'risk_flags' summarizing the critical dangers.
    
    Return pure JSON with keys: 'risk_score' (float) and 'risk_flags' (list of strings).
    
    CONTRACT VALUE: {value}
    COMPLIANCE ISSUES:
    {json.dumps(issues)}
    """

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": "You are a risk assessment JSON generator."},
            {"role": "user", "content": prompt}
        ]
    )

    try:
        result = json.loads(response.choices[0].message.content)
        return {
            "risk_score": float(result.get("risk_score", 0.0)),
            "risk_flags": result.get("risk_flags", [])
        }
    except Exception as e:
        print(f"Risk Agent Error: {e}")
        return {"risk_score": 100.0, "risk_flags": ["Error calculating risk."]}

# ==========================================
# 5. Graph Orchestration
# ==========================================
# Initialize the StateGraph with our ContractState
workflow = StateGraph(ContractState)

# Add the agent nodes to the graph
workflow.add_node("ingestion", ingestion_agent)
workflow.add_node("compliance", compliance_agent)
workflow.add_node("risk", risk_agent)

# Define the sequential execution flow
workflow.set_entry_point("ingestion")
workflow.add_edge("ingestion", "compliance")
workflow.add_edge("compliance", "risk")
workflow.add_edge("risk", END)

# Compile the graph into an executable application
clm_graph = workflow.compile()

print("LangGraph CLM Multi-Agent Orchestration initialized successfully.")
