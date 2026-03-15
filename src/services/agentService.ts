import { GoogleGenAI, Type } from "@google/genai";

export interface AgentResponse {
  analysis: string;
  agentTeam: {
    name: string;
    role: string;
    contribution: string;
  }[];
  tasks: {
    title: string;
    description: string;
    assignedTo: string;
    tools: string[];
    status: 'pending' | 'in-progress' | 'completed';
    priority: 'low' | 'medium' | 'high';
  }[];
  tools: string[];
  status: string;
  overallProgress: number;
}

async function withRetry<T>(fn: () => Promise<T>, options: { retries?: number, delay?: number, shouldRetry?: (error: any) => boolean } = {}): Promise<T> {
  const { retries = 3, delay = 1000, shouldRetry } = options;
  try {
    return await fn();
  } catch (error: any) {
    const isRateLimit = error.message?.includes("429") || error.status === "RESOURCE_EXHAUSTED";
    const isCustomRetry = shouldRetry ? shouldRetry(error) : false;

    if (retries > 0 && (isRateLimit || isCustomRetry)) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(fn, { retries: retries - 1, delay: delay * 2, shouldRetry });
    }
    throw error;
  }
}

export async function runWorkflow(projectDescription: string, datasets: any): Promise<AgentResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "undefined") {
    throw new Error("Gemini API key is not configured. Please set GEMINI_API_KEY in the Secrets panel.");
  }
  const ai = new GoogleGenAI({ apiKey });
  const model = "gemini-3-flash-preview";

  const executeWorkflow = async () => {
    const systemInstruction = `
      You are a Multi-Agent Orchestrator for Intelligent Project Management. 
      Your goal is to perform a full project lifecycle analysis and execution plan.
      
      CRITICAL CONSTRAINTS:
      1. DECOMPOSITION: You MUST break the project into at least 3-7 specific, actionable sub-tasks. Returning 0 tasks is a FAILURE.
      2. ASSIGNMENT: Every task MUST be assigned to a REAL employee found via the 'searchEmployees' tool. Do NOT hallucinate names.
      3. TOOLS: Every task MUST have appropriate tools assigned from the 'searchTools' results.
      4. ANALYSIS: Provide a deep, strategic analysis of the project, including risks and objectives.
      
      PHASE 1: REQUIREMENT ANALYSIS (Alex - Project Manager)
      - Analyze the project request deeply. Identify hidden complexities, risks, and core objectives.
      
      PHASE 2: TASK DECOMPOSITION (Sam - Technical Architect)
      - Break the project into 3-7 specific, actionable sub-tasks.
      - Use 'searchTools' and 'searchHistory' to gather context.
      
      PHASE 3: RESOURCE MATCHING & ASSIGNMENT (Jordan - Resource Specialist)
      - Use 'searchEmployees' to find candidates.
      - Match employees to tasks based on skills and current workload.
      
      You MUST call the search tools before providing the final JSON response.
      Output the result in strict JSON format matching the schema.
    `;

    const searchEmployees = (query: string) => {
      const q = query.toLowerCase();
      return datasets.employees.filter((e: any) => 
        e.name.toLowerCase().includes(q) || 
        e.role.toLowerCase().includes(q) || 
        e.skills.toLowerCase().includes(q)
      ).slice(0, 30);
    };

    const searchTools = (query: string) => {
      const q = query.toLowerCase();
      return datasets.tools.filter((t: any) => 
        t.tool_name.toLowerCase().includes(q) || 
        t.tool_type.toLowerCase().includes(q) || 
        t.purpose.toLowerCase().includes(q)
      ).slice(0, 20);
    };

    const searchHistory = (query: string) => {
      const q = query.toLowerCase();
      return datasets.history.filter((h: any) => 
        h.project_name.toLowerCase().includes(q) || 
        (h.tools_used && h.tools_used.toLowerCase().includes(q))
      ).slice(0, 10);
    };

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        analysis: { type: Type.STRING },
        agentTeam: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              role: { type: Type.STRING },
              contribution: { type: Type.STRING }
            },
            required: ["name", "role", "contribution"]
          }
        },
        tasks: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              assignedTo: { type: Type.STRING },
              tools: { type: Type.ARRAY, items: { type: Type.STRING } },
              status: { type: Type.STRING, enum: ["pending", "in-progress", "completed"] },
              priority: { type: Type.STRING, enum: ["low", "medium", "high"] }
            },
            required: ["title", "description", "assignedTo", "tools", "status", "priority"]
          }
        },
        tools: { type: Type.ARRAY, items: { type: Type.STRING } },
        status: { type: Type.STRING },
        overallProgress: { type: Type.NUMBER }
      },
      required: ["analysis", "agentTeam", "tasks", "tools", "status", "overallProgress"]
    };

    let response = await ai.models.generateContent({
      model,
      contents: `Project Request: ${projectDescription}`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        tools: [{
          functionDeclarations: [
            {
              name: "searchEmployees",
              description: "Search for employees by name, role, or skills.",
              parameters: {
                type: Type.OBJECT,
                properties: { query: { type: Type.STRING } },
                required: ["query"]
              }
            },
            {
              name: "searchTools",
              description: "Search for technical tools.",
              parameters: {
                type: Type.OBJECT,
                properties: { query: { type: Type.STRING } },
                required: ["query"]
              }
            },
            {
              name: "searchHistory",
              description: "Search for similar past projects.",
              parameters: {
                type: Type.OBJECT,
                properties: { query: { type: Type.STRING } },
                required: ["query"]
              }
            }
          ]
        }],
        responseSchema
      }
    });

    if (response.functionCalls) {
      const functionResponses = response.functionCalls.map(call => {
        let result;
        if (call.name === "searchEmployees") result = searchEmployees((call.args as any).query);
        else if (call.name === "searchTools") result = searchTools((call.args as any).query);
        else if (call.name === "searchHistory") result = searchHistory((call.args as any).query);
        return { id: call.id, name: call.name, response: { result } };
      });

      response = await ai.models.generateContent({
        model,
        contents: [
          { role: "user", parts: [{ text: `Project Request: ${projectDescription}` }] },
          { role: "model", parts: response.candidates[0].content.parts },
          { role: "user", parts: functionResponses.map(r => ({ functionResponse: r })) }
        ],
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema
        }
      });
    }

    const data = JSON.parse(response.text || "{}");
    if (!data.tasks || data.tasks.length === 0) {
      throw new Error("INCOMPLETE_WORKFLOW: No tasks generated.");
    }
    return data;
  };

  const result = await withRetry(executeWorkflow, {
    shouldRetry: (err) => err.message?.includes("INCOMPLETE_WORKFLOW")
  });

  return {
    analysis: result.analysis || "No analysis provided.",
    agentTeam: result.agentTeam || [],
    tasks: (result.tasks || []).map((t: any) => ({
      title: t.title || "Untitled Task",
      description: t.description || "No description",
      assignedTo: t.assignedTo || "Unassigned",
      tools: t.tools || [],
      status: t.status || "pending",
      priority: t.priority || "medium"
    })),
    tools: result.tools || [],
    status: result.status || "Completed",
    overallProgress: result.overallProgress || 0
  };
}

export async function analyzeFile(fileName: string, fileContent: string): Promise<any> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "undefined") {
    throw new Error("Gemini API key is not configured.");
  }
  const ai = new GoogleGenAI({ apiKey });
  const model = "gemini-3-flash-preview";

  const systemInstruction = `
    You are an expert project analyst. Analyze the provided file content and extract project context and requirements.
    The file could be any technical document: Software Requirements Specification (SRS), source code, API documentation, system logs, or project plans.
    
    GOAL:
    - Identify the core project name and purpose.
    - Extract specific functional and non-functional requirements.
    - Identify key stakeholders and constraints mentioned.
    - Determine the necessary skills to execute the project.
    - Assess the priority based on the language and urgency in the text.
    
    Output the result in JSON format with the following fields:
    - project: The name of the project.
    - description: A comprehensive summary of the project requirements and objectives.
    - requiredSkills: A list of required skills (semicolon separated).
    - priority: One of "low", "medium", "hard".
  `;

  const response = await withRetry(() => ai.models.generateContent({
    model,
    contents: `File Name: ${fileName}\nFile Content: ${fileContent}`,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          project: { type: Type.STRING },
          description: { type: Type.STRING },
          requiredSkills: { type: Type.STRING },
          priority: { type: Type.STRING, enum: ["low", "medium", "hard"] }
        },
        required: ["project", "description", "requiredSkills", "priority"]
      }
    }
  }));

  const data = JSON.parse(response.text || "{}");
  return {
    project: data.project || "Unknown Project",
    description: data.description || "No description available.",
    requiredSkills: data.requiredSkills || "",
    priority: data.priority || "medium"
  };
}

export interface QueryResponse {
  answer: string;
  sourceFiles: string[];
}

export async function queryAllFiles(query: string, files: { name: string, content: string }[]): Promise<QueryResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "undefined") {
    throw new Error("Gemini API key is not configured.");
  }
  const ai = new GoogleGenAI({ apiKey });
  const model = "gemini-3-flash-preview";

  const filesContext = files.map(f => `File: ${f.name}\nContent: ${f.content}`).join("\n\n---\n\n");

  const systemInstruction = `
    You are an intelligent agent that answers questions about a set of uploaded files.
    
    GOAL:
    - Answer the user's query accurately based on the provided files.
    - Provide a generalized, high-level answer without unnecessary details.
    - If the user asks for something specific (e.g., "is there X?"), answer directly (e.g., "Yes, X is present in...") and highlight the source.
    - Identify which specific files contain the information used in your answer.
    
    CONSTRAINTS:
    - Be extremely concise. 
    - Avoid repeating data from the files unless necessary for the answer.
    - Use bullet points only if it helps with generalization.
    - If the information is not present in any file, state that clearly.
    - Return the response in strict JSON format.
  `;

  const response = await withRetry(() => ai.models.generateContent({
    model,
    contents: `Files Context:\n${filesContext}\n\nUser Query: ${query}`,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          answer: { type: Type.STRING, description: "The generalized answer to the query." },
          sourceFiles: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "List of file names that contained the information."
          }
        },
        required: ["answer", "sourceFiles"]
      }
    }
  }));

  try {
    return JSON.parse(response.text || "{}") as QueryResponse;
  } catch (e) {
    return {
      answer: response.text || "I couldn't generate a structured response.",
      sourceFiles: []
    };
  }
}

export async function queryFile(query: string, fileName: string, fileContent: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "undefined") {
    throw new Error("Gemini API key is not configured.");
  }
  const ai = new GoogleGenAI({ apiKey });
  const model = "gemini-3-flash-preview";

  const systemInstruction = `
    You are an intelligent agent that answers questions about a specific file.
    Use the provided file content to answer the user's query accurately.
    
    IMPORTANT: Provide the answer in a generalized way, using clear bullet points. 
    Focus on the most relevant information.
    If the answer is not in the file, state that you don't have enough information.
  `;

  const response = await withRetry(() => ai.models.generateContent({
    model,
    contents: `File Name: ${fileName}\nFile Content: ${fileContent}\n\nUser Query: ${query}`,
    config: {
      systemInstruction
    }
  }));

  return response.text || "I couldn't generate a response.";
}
