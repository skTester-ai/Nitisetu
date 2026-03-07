const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const logger = require('../config/logger');

/**
 * Extract text content from a PDF file.
 * Returns full text and per-page breakdown.
 */
async function extractText(filePath) {
  const absolutePath = path.resolve(filePath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`PDF file not found: ${absolutePath}`);
  }

  const dataBuffer = fs.readFileSync(absolutePath);

  const data = await pdfParse(dataBuffer);

  logger.info(`PDF extracted: ${data.numpages} pages, ${data.text.length} characters`);

  // pdf-parse doesn't give per-page text directly,
  // so we split by form-feed characters or page break patterns
  const pages = splitIntoPages(data.text, data.numpages);

  return {
    fullText: data.text,
    pages,
    numPages: data.numpages,
    metadata: {
      title: data.info?.Title || path.basename(filePath, '.pdf'),
      author: data.info?.Author || 'Unknown',
    },
  };
}

/**
 * Split full PDF text into approximate page boundaries.
 * Uses form-feed characters if present, otherwise splits evenly.
 */
function splitIntoPages(text, numPages) {
  // Try form-feed split first
  const ffSplit = text.split('\f').filter((p) => p.trim().length > 0);
  if (ffSplit.length >= numPages * 0.5) {
    return ffSplit.map((pageText, i) => ({
      pageNumber: i + 1,
      text: pageText.trim(),
    }));
  }

  // Fallback: split evenly by character count
  const charsPerPage = Math.ceil(text.length / numPages);
  const pages = [];
  for (let i = 0; i < numPages; i++) {
    const start = i * charsPerPage;
    const end = Math.min(start + charsPerPage, text.length);
    const pageText = text.substring(start, end).trim();
    if (pageText.length > 0) {
      pages.push({ pageNumber: i + 1, text: pageText });
    }
  }
  return pages;
}

/**
 * Chunk text with sliding window.
 * chunkSize: characters per chunk (default 1000)
 * overlap: characters overlapping between consecutive chunks (default 200)
 * Tries to break at sentence boundaries to preserve meaning.
 */
function chunkText(text, chunkSize = 1000, overlap = 200) {
  if (!text || text.trim().length === 0) return [];

  const cleanedText = text.replace(/\s+/g, ' ').trim();
  const chunks = [];
  let start = 0;

  while (start < cleanedText.length) {
    let end = Math.min(start + chunkSize, cleanedText.length);

    // Try to break at a sentence boundary (., !, ?, or newline)
    if (end < cleanedText.length) {
      const lastPeriod = cleanedText.lastIndexOf('.', end);
      const lastNewline = cleanedText.lastIndexOf('\n', end);
      const breakPoint = Math.max(lastPeriod, lastNewline);

      if (breakPoint > start + chunkSize * 0.5) {
        end = breakPoint + 1;
      }
    }

    const chunkContent = cleanedText.substring(start, end).trim();
    if (chunkContent.length > 0) {
      chunks.push(chunkContent);
    }

    // Move start forward by (end - overlap), ensuring progress
    start = Math.max(start + 1, end - overlap);
  }

  return chunks;
}

/**
 * Determine which page a chunk belongs to based on character position.
 */
function assignPageNumbers(chunks, pages) {
  const pageOffsets = [];
  let offset = 0;
  for (const page of pages) {
    pageOffsets.push({ pageNumber: page.pageNumber, start: offset, end: offset + page.text.length });
    offset += page.text.length + 1;
  }

  return chunks.map((chunkText, index) => {
    // Find which page contains the start of this chunk's content
    let bestPage = 1;
    for (const po of pageOffsets) {
      if (po.start <= index * 800 && index * 800 < po.end) {
        bestPage = po.pageNumber;
        break;
      }
    }
    return {
      text: chunkText,
      metadata: {
        page: bestPage,
        section: detectSection(chunkText),
        paragraph: 1,
        chunkIndex: index,
      },
    };
  });
}

/**
 * Simple heuristic to detect section headings in chunk text.
 */
function detectSection(text) {
  const sectionPatterns = [
    /eligibility\s*criteria/i,
    /who\s*can\s*apply/i,
    /benefits?\s*(?:amount|details)/i,
    /required\s*documents/i,
    /application\s*process/i,
    /objectives?\s*/i,
    /scope\s*/i,
    /introduction/i,
    /definitions?\s*/i,
  ];

  for (const pattern of sectionPatterns) {
    if (pattern.test(text)) {
      const match = text.match(pattern);
      return match[0].trim();
    }
  }

  return 'General';
}

/**
 * Full PDF processing pipeline.
 * Takes a file path, scheme name, and document metadata.
 * Returns array of chunks with metadata.
 */
async function processPDF(filePath, schemeName, docMetadata = {}) {
  logger.info(`Processing PDF: ${filePath} for scheme: ${schemeName}`);
  const startTime = Date.now();

  // Step 1: Extract text
  const { fullText, pages, numPages } = await extractText(filePath);

  // Step 2: Chunk the text
  const rawChunks = chunkText(fullText);

  // Step 3: Assign page numbers and metadata
  const chunksWithMetadata = assignPageNumbers(rawChunks, pages).map(chunk => ({
    ...chunk,
    metadata: {
      ...chunk.metadata,
      documentPath: docMetadata.filename || path.basename(filePath),
      documentType: docMetadata.type || 'guidelines'
    }
  }));

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  logger.info(
    `PDF processed: ${numPages} pages → ${chunksWithMetadata.length} chunks in ${duration}s`
  );

  return {
    chunks: chunksWithMetadata,
    totalChunks: chunksWithMetadata.length,
    numPages,
    schemeName,
    docMetadata
  };
}

module.exports = {
  extractText,
  chunkText,
  processPDF,
};
