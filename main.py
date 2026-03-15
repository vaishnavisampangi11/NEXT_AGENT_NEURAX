import pandas as pd
import os
import json
from google import genai
from google.genai import types

# Initialize Gemini Client
# Make sure to set GEMINI_API_KEY in your environment variables
api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key)

def load_datasets():
    """Load CSV datasets into pandas dataframes."""
    employees = pd.read_csv('employees.csv').to_dict(orient='records')
    tools = pd.read_csv('tools.csv').to_dict(orient='records')
    history = pd.read_csv('project_history.csv').to_dict(orient='records')
    return {
        "employees": employees,
        "tools": tools,
        "history": history
    }

def run_autonomous_workflow(project_description):
    """Execute the multi-agent workflow reasoning."""
    datasets = load_datasets()
    
    system_instruction = f"""
    You are an Autonomous Workflow AI Agent for Intelligent Project Management.
    Your goal is to analyze a project request and generate a structured workflow plan.
    
    You have access to the following datasets:
    - Employees: {json.dumps(datasets['employees'])}
    - Tools: {json.dumps(datasets['tools'])}
    - Project History: {json.dumps(datasets['history'])}
    
    Follow these steps:
    1. Analyze the project requirements (skills, complexity, dependencies).
    2. Decompose the project into structured subtasks.
    3. Match employees to tasks based on skills, availability, and workload.
    4. Select appropriate tools for each task.
    5. Provide a final workflow plan.
    
    Output the result in JSON format.
    """

    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=f"Project Request: {project_description}",
        config=types.GenerateContentConfig(
            system_instruction=system_instruction,
            response_mime_type="application/json",
        )
    )

    return json.loads(response.text)

if __name__ == "__main__":
    print("--- Autonomous Workflow AI Agent ---")
    project = input("Enter project description: ")
    if not project:
        project = "Build an AI chatbot for customer support."
    
    print("\nAgents are reasoning... Please wait.\n")
    result = run_autonomous_workflow(project)
    
    print("PROJECT ANALYSIS:")
    print(result.get('analysis', 'N/A'))
    print("\nTASK ASSIGNMENTS:")
    for task in result.get('tasks', []):
        print(f"- {task['title']} -> Assigned to {task['assignedTo']}")
        print(f"  Description: {task['description']}")
        print(f"  Tools: {', '.join(task['tools'])}")
    
    print("\nRECOMMENDED TOOLS:")
    print(", ".join(result.get('tools', [])))
    
    print("\nSTATUS:")
    print(result.get('status', 'N/A'))
