import fs from 'fs';
import path from 'path';
import { VisaType } from '../types';

export interface KnowledgeBaseFile {
  name: string;
  path: string;
  content: string;
  priority: number;
}

// Define the optimal reading order for each visa type using knowledge-base1 structure
// Files are organized in knowledge-base1/knowledge-base/{visaType}/ and knowledge-base1/knowledge-base/shared/
const VISA_TYPE_FILES: Record<VisaType, { folder: string; files: string[] }> = {
  'O-1A': {
    folder: 'O-1A',
    files: [
      'professional-evaluation-RAG.md', // From shared - contains O-1A section
      'O-1A-knowledge-base.md',
      'O-1A-visa-complete-guide.md',
      'O-1A-evaluation-RAG.md',
      'DIY-O1A-RAG.md',
    ],
  },
  'O-1B': {
    folder: 'O-1B',
    files: [
      'professional-evaluation-RAG.md', // From shared - contains O-1B section
      'O-1B-knowledge-base.md',
      'DIY-O1B-RAG.md',
    ],
  },
  'P-1A': {
    folder: 'P-1A',
    files: [
      'professional-evaluation-RAG.md', // From shared - contains P-1A section
      'P-1A-knowledge-base.md',
      'P-1A-itinerary-document.md',
      'DIY-P1A-RAG.md',
    ],
  },
  'EB-1A': {
    folder: 'EB-1A',
    files: [
      'professional-evaluation-RAG.md', // From shared - contains EB-1A section
      'EB-1A-knowledge-base.md',
      'EB1A-petition-brief.md',
      'EB1A-dive-analysis-example.md', // GOLD STANDARD
    ],
  },
  'EB-2 NIW': {
    folder: 'shared', // EB-2 NIW uses shared files
    files: [
      'professional-evaluation-RAG.md',
      'uscis-regulations.md',
    ],
  },
};

// Shared files that should be included for all visa types
const SHARED_FILES = [
  'master-mega-prompt.md',
  'policy-memos-visas.md',
  'uscis-regulations.md',
  'uscis-officer-perspective.md',
  'rfe-response-guide.md',
  'red-flag-identification.md',
  'weakness-mitigation.md',
  'expert-letter-strategy.md',
  'contradiction-handling.md',
  'source-independence-verification.md',
];

export async function getKnowledgeBaseFiles(visaType: VisaType): Promise<KnowledgeBaseFile[]> {
  const knowledgeBasePath = path.join(process.cwd(), 'knowledge-base1', 'knowledge-base');
  const visaConfig = VISA_TYPE_FILES[visaType];
  const files: KnowledgeBaseFile[] = [];
  let priority = 1;

  // Load visa-specific files
  if (visaConfig) {
    const visaFolder = path.join(knowledgeBasePath, visaConfig.folder);
    
    for (const fileName of visaConfig.files) {
      // Check if file is in shared folder (like professional-evaluation-RAG.md)
      let filePath = path.join(visaFolder, fileName);
      if (!fs.existsSync(filePath) && fileName === 'professional-evaluation-RAG.md') {
        // Try shared folder
        filePath = path.join(knowledgeBasePath, 'shared', fileName);
      }

      try {
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf-8');
          files.push({
            name: `${visaConfig.folder}/${fileName}`,
            path: filePath,
            content,
            priority: priority++,
          });
        } else {
          console.warn(`Knowledge base file not found: ${filePath}`);
        }
      } catch (error) {
        console.error(`Error reading knowledge base file ${filePath}:`, error);
      }
    }
  }

  // Load shared files
  const sharedFolder = path.join(knowledgeBasePath, 'shared');
  for (const fileName of SHARED_FILES) {
    const filePath = path.join(sharedFolder, fileName);
    try {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        files.push({
          name: `shared/${fileName}`,
          path: filePath,
          content,
          priority: priority++,
        });
      } else {
        console.warn(`Shared knowledge base file not found: ${filePath}`);
      }
    } catch (error) {
      console.error(`Error reading shared knowledge base file ${filePath}:`, error);
    }
  }

  return files;
}

export function extractRelevantSections(content: string, visaType: VisaType): string {
  // Extract specific sections based on visa type
  const sectionMarkers: Record<VisaType, string[]> = {
    'O-1A': ['SECTION 3: O-1A', 'O-1A CRITERIA', 'SECTION 6: PUBLICATION', 'SECTION 8: LEGAL BRIEF'],
    'O-1B': ['SECTION 4: O-1B', 'O-1B CRITERIA', 'SECTION 6: PUBLICATION', 'SECTION 8: LEGAL BRIEF'],
    'P-1A': ['SECTION 5: P-1A', 'P-1A CRITERIA', 'SECTION 6: PUBLICATION', 'SECTION 8: LEGAL BRIEF'],
    'EB-1A': ['SECTION 2: EB-1A', 'EB-1A CRITERIA', 'SECTION 6: PUBLICATION', 'SECTION 8: LEGAL BRIEF', 'KAZARIAN'],
    'EB-2 NIW': ['NATIONAL INTEREST', 'NIW', 'SECTION 6: PUBLICATION', 'SECTION 8: LEGAL BRIEF'],
  };

  const markers = sectionMarkers[visaType];
  const sections: string[] = [];

  for (const marker of markers) {
    const markerIndex = content.toUpperCase().indexOf(marker.toUpperCase());
    if (markerIndex !== -1) {
      // Extract a reasonable chunk around this marker
      const start = Math.max(0, markerIndex - 500);
      const end = Math.min(content.length, markerIndex + 5000);
      sections.push(content.substring(start, end));
    }
  }

  return sections.length > 0 ? sections.join('\n\n---\n\n') : content;
}

export function buildKnowledgeBaseContext(files: KnowledgeBaseFile[], visaType: VisaType): string {
  let context = `# VISA PETITION KNOWLEDGE BASE - ${visaType}\n\n`;
  context += `This knowledge base contains comprehensive information for generating ${visaType} visa petition documents.\n\n`;
  context += `Files loaded (in priority order):\n`;

  files.forEach((file, index) => {
    context += `${index + 1}. ${file.name}\n`;
  });

  context += `\n---\n\n`;

  files.forEach((file, index) => {
    context += `## FILE ${index + 1}: ${file.name}\n\n`;

    // Extract relevant sections to reduce token usage
    const relevantContent = extractRelevantSections(file.content, visaType);
    context += relevantContent;

    context += `\n\n---\n\n`;
  });

  return context;
}
