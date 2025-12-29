import fs from 'fs';
import path from 'path';

export interface PromptConfig {
  documentNumber: number;
  documentName: string;
  description: string;
  model: string;
  maxTokens: number;
  temperature: number;
  targetLength?: {
    pages?: number | string;
    words?: number;
  };
  [key: string]: any; // Allow additional config properties
}

export interface LoadedPrompt {
  systemPrompt: string;
  userPromptTemplate?: string;
  config: PromptConfig;
  additionalFiles?: { [key: string]: string }; // For files like diy-template-enforcement.md
}

/**
 * Load prompt configuration and system prompt for a document type
 * @param documentType - The document type (e.g., 'doc1-comprehensive-analysis', 'doc5-legal-brief')
 * @returns Loaded prompt with system prompt, config, and any additional files
 */
export function loadPrompt(documentType: string): LoadedPrompt {
  const promptsPath = path.join(process.cwd(), 'knowledge-base1', 'prompts', documentType);
  
  // Load config.json
  const configPath = path.join(promptsPath, 'config.json');
  if (!fs.existsSync(configPath)) {
    throw new Error(`Prompt config not found: ${configPath}`);
  }
  
  const config: PromptConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  
  // Load system-prompt.md
  const systemPromptPath = path.join(promptsPath, 'system-prompt.md');
  if (!fs.existsSync(systemPromptPath)) {
    throw new Error(`System prompt not found: ${systemPromptPath}`);
  }
  
  const systemPrompt = fs.readFileSync(systemPromptPath, 'utf-8');
  
  // Load any additional files (like diy-template-enforcement.md)
  const additionalFiles: { [key: string]: string } = {};
  const files = fs.readdirSync(promptsPath);
  
  for (const file of files) {
    if (file !== 'config.json' && file !== 'system-prompt.md' && file.endsWith('.md')) {
      const filePath = path.join(promptsPath, file);
      additionalFiles[file] = fs.readFileSync(filePath, 'utf-8');
    }
  }
  
  // Try to load user-prompt-template.md if it exists
  let userPromptTemplate: string | undefined;
  const userPromptPath = path.join(promptsPath, 'user-prompt-template.md');
  if (fs.existsSync(userPromptPath)) {
    userPromptTemplate = fs.readFileSync(userPromptPath, 'utf-8');
  }
  
  return {
    systemPrompt,
    userPromptTemplate,
    config,
    additionalFiles: Object.keys(additionalFiles).length > 0 ? additionalFiles : undefined,
  };
}

/**
 * Get the document type identifier from document number
 * @param docNumber - Document number (1-9)
 * @returns Document type string (e.g., 'doc1-comprehensive-analysis')
 */
export function getDocumentType(docNumber: number): string {
  const documentTypes: { [key: number]: string } = {
    1: 'doc1-comprehensive-analysis',
    2: 'doc2-publication-analysis',
    3: 'doc3-url-reference',
    4: 'doc4-evidence-gap-analysis',
    5: 'doc5-legal-brief',
    6: 'doc6-uscis-cover-letter',
    7: 'doc7-visa-checklist',
    8: 'doc8-uscis-officer-scoring',
    9: 'doc9-uscis-officer-rating',
  };
  
  return documentTypes[docNumber] || `doc${docNumber}`;
}

/**
 * Interpolate variables in a prompt template
 * @param template - Template string with ${variable} placeholders
 * @param variables - Object with variable values
 * @returns Interpolated string
 */
export function interpolatePrompt(template: string, variables: { [key: string]: any }): string {
  let result = template;
  
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\$\\{${key}\\}`, 'g');
    result = result.replace(regex, String(value));
  }
  
  return result;
}

