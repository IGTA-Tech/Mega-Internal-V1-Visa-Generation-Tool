import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';

export interface DOCXDocument {
  name: string;
  content: string;
  pageCount: number;
}

/**
 * Convert markdown content to DOCX
 * Handles formatting, headings, lists, and professional styling
 */
export async function convertMarkdownToDOCX(
  markdown: string,
  filename: string
): Promise<Buffer> {
  const lines = markdown.split('\n');
  const children: Paragraph[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    // Skip empty lines (but add spacing)
    if (!trimmedLine) {
      children.push(
        new Paragraph({
          text: '',
          spacing: { after: 120 },
        })
      );
      continue;
    }

    // Headers
    if (trimmedLine.startsWith('####')) {
      const text = trimmedLine.replace(/^####\s*/, '');
      children.push(
        new Paragraph({
          text: text,
          heading: HeadingLevel.HEADING_4,
          spacing: { before: 240, after: 120 },
        })
      );
    } else if (trimmedLine.startsWith('###')) {
      const text = trimmedLine.replace(/^###\s*/, '');
      children.push(
        new Paragraph({
          text: text,
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 360, after: 180 },
        })
      );
    } else if (trimmedLine.startsWith('##')) {
      const text = trimmedLine.replace(/^##\s*/, '');
      children.push(
        new Paragraph({
          text: text,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 480, after: 240 },
        })
      );
    } else if (trimmedLine.startsWith('#')) {
      const text = trimmedLine.replace(/^#\s*/, '');
      children.push(
        new Paragraph({
          text: text,
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 600, after: 300 },
        })
      );
    }
    // Horizontal rule
    else if (trimmedLine.match(/^[-*_]{3,}$/)) {
      children.push(
        new Paragraph({
          text: '─────────────────────────────────────────────────────────',
          spacing: { before: 240, after: 240 },
        })
      );
    }
    // Bullet points
    else if (trimmedLine.match(/^\s*[-*+]\s/)) {
      const text = trimmedLine.replace(/^\s*[-*+]\s*/, '');
      children.push(
        new Paragraph({
          text: text,
          bullet: {
            level: 0,
          },
          spacing: { before: 120, after: 120 },
        })
      );
    }
    // Numbered lists (convert to bullet for simplicity)
    else if (trimmedLine.match(/^\s*\d+\.\s/)) {
      const text = trimmedLine.replace(/^\s*\d+\.\s*/, '');
      children.push(
        new Paragraph({
          text: text,
          bullet: {
            level: 0,
          },
          spacing: { before: 120, after: 120 },
        })
      );
    }
    // Block quotes
    else if (trimmedLine.startsWith('>')) {
      const text = trimmedLine.replace(/^>\s*/, '');
      children.push(
        new Paragraph({
          text: text,
          indent: { left: 360 },
          spacing: { before: 120, after: 120 },
        })
      );
    }
    // Code blocks (skip for now or render as monospace)
    else if (trimmedLine.startsWith('```')) {
      // Skip code block markers
      continue;
    }
    // Regular paragraph text
    else {
      // Handle inline formatting (bold, italic)
      const textRuns: TextRun[] = [];
      let currentText = trimmedLine;
      
      // Simple bold/italic handling
      const parts = currentText.split(/(\*\*.*?\*\*|\*.*?\*|__.*?__|_.*?_)/);
      
      for (const part of parts) {
        if (part.startsWith('**') && part.endsWith('**')) {
          textRuns.push(
            new TextRun({
              text: part.slice(2, -2),
              bold: true,
            })
          );
        } else if (part.startsWith('*') && part.endsWith('*') && part.length > 1) {
          textRuns.push(
            new TextRun({
              text: part.slice(1, -1),
              italics: true,
            })
          );
        } else if (part.startsWith('__') && part.endsWith('__')) {
          textRuns.push(
            new TextRun({
              text: part.slice(2, -2),
              bold: true,
            })
          );
        } else if (part.startsWith('_') && part.endsWith('_') && part.length > 1) {
          textRuns.push(
            new TextRun({
              text: part.slice(1, -1),
              italics: true,
            })
          );
        } else if (part) {
          textRuns.push(new TextRun(part));
        }
      }

      children.push(
        new Paragraph({
          children: textRuns.length > 0 ? textRuns : [new TextRun(trimmedLine)],
          spacing: { before: 120, after: 120 },
        })
      );
    }
  }

  // Create the document
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              orientation: 'portrait',
              width: 12240, // 8.5 inches in twips (1/20th of a point)
              height: 15840, // 11 inches in twips
            },
            margin: {
              top: 1440, // 1 inch
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children: children,
      },
    ],
  });

  // Generate the DOCX buffer
  const buffer = await Packer.toBuffer(doc);
  return buffer;
}

/**
 * Convert multiple markdown documents to DOCX files
 */
export async function convertDocumentsToDOCX(
  documents: DOCXDocument[]
): Promise<Array<{ name: string; buffer: Buffer; pageCount: number }>> {
  const docxDocuments = [];

  for (const doc of documents) {
    try {
      const docxName = doc.name.replace(/\.(md|pdf)$/i, '.docx');
      const docxBuffer = await convertMarkdownToDOCX(doc.content, docxName);

      docxDocuments.push({
        name: docxName,
        buffer: docxBuffer,
        pageCount: doc.pageCount,
      });
    } catch (error) {
      console.error(`Error converting ${doc.name} to DOCX:`, error);
      // Continue with other documents even if one fails
    }
  }

  return docxDocuments;
}

