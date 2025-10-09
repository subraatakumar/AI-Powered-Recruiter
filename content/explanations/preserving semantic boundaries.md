Short answer: preserving semantic boundaries means you try to split a document at natural section breaks (e.g., "Work Experience", "Skills", each job entry) rather than at an arbitrary fixed byte/word limit. That keeps related sentences and bullets together so embeddings capture coherent ideas, improving retrieval recall and reducing fragmented, misleading results.

Why it matters
- Resumes and job descriptions are structured: headings, bullets, dates, company names, and role descriptions form natural semantic units.
- If you cut in the middle of a job bullet or between a job title and its responsibilities, each chunk becomes weaker (less informative) and may score lower in similarity search.
- The LLM then sees fragments rather than whole facts, which increases the chance of missed matches or hallucinations when synthesizing results.

How to preserve semantic boundaries — practical approach
1. Detect structure first
   - Look for explicit headings: words like "Work Experience", "Experience", "Professional Experience", "Skills", "Education", "Projects".
   - Detect job-entry patterns: lines with a date range (e.g., "2019–2022"), a company name + title line followed by bullets or paragraphs.
   - Recognize bullets and lists (leading "-", "•", numbered lists).
   - Use the PDF/text parser’s layout info if available (line breaks, font sizes).

2. Split on section boundaries before chunking
   - Create sections (Skills, Experience, Education, Projects, Summary).
   - Chunk inside each section rather than the whole document flow. This keeps a skills block intact and avoids intermixing unrelated sections.

3. Prefer sentence-aware splits inside sections
   - Use a sentence tokenizer to avoid cutting mid-sentence.
   - Aggregate sentences until you reach your target chunk size, then stop — don’t cut inside a sentence.

4. Apply overlap (sliding window) within long sections
   - If a section is long (e.g., long work history), use a sliding window across sentences so an item that spans the boundary remains intact in at least one chunk.

5. Attach metadata for each chunk
   - Section name, start/end offsets, job title, company, dates, page number, and chunk id. This helps downstream merging/deduping and citation.

6. Merge small fragments
   - If a detected chunk would be very small (e.g., a one‑line bullet), merge it with adjacent chunks from the same section rather than storing tiny isolated vectors.

Heuristics and examples for resumes
- Skills block: keep it whole (or split only if huge). A skills list is dense with keywords — cutting it loses co-occurrence information.
- Job entry: include title, company, dates, and bullets in the same chunk. If a single role has many bullets, chunk by bullets but keep the header with the first chunk for context.
- Education and certifications: small; keep as single chunks with title + institution + dates.
- Projects: include project name + short description together.

Simple algorithm outline
1. Parse PDF → plain text preserving line breaks.
2. Normalize whitespace and unify bullet markers.
3. Identify section headers via regex and common header tokens.
4. For each section:
   a. Split into sentences.
   b. Build chunks by appending sentences until chunk_token_limit is reached.
   c. If last sentence would overflow, either stop chunk and start new one (with overlap) or include it if it keeps a semantic unit intact (policy).
5. If a chunk is smaller than min_size, merge with neighbor in same section.
6. Save chunk + metadata.

Node.js-style example (word-based fallback)
```javascript
// Very simple section-aware chunker (word-based)
// Use a real tokenizer for production (tiktoken/hf tokenizers)
function detectSections(text) {
  const headers = /(Work Experience|Professional Experience|Experience|Skills|Education|Projects|Certifications|Summary)/i;
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const sections = [];
  let current = { name: 'body', lines: [] };
  for (const line of lines) {
    if (headers.test(line)) {
      if (current.lines.length) sections.push(current);
      current = { name: line, lines: [] };
    } else {
      current.lines.push(line);
    }
  }
  if (current.lines.length) sections.push(current);
  return sections;
}

function chunkSection(sectionText, chunkSize = 250, overlap = 50) {
  const words = sectionText.split(/\s+/);
  const step = Math.max(1, chunkSize - overlap);
  const chunks = [];
  for (let i = 0; i < words.length; i += step) {
    const slice = words.slice(i, i + chunkSize).join(' ');
    if (!slice) break;
    chunks.push(slice);
  }
  return chunks;
}

function sectionAwareChunker(fullText) {
  const sections = detectSections(fullText);
  const allChunks = [];
  for (const sec of sections) {
    const secText = sec.lines.join(' ');
    // prefer not to split very short sections
    if (secText.split(/\s+/).length < 120) {
      allChunks.push({ section: sec.name, text: secText });
    } else {
      const chunks = chunkSection(secText, 250, 50);
      for (let i = 0; i < chunks.length; i++) {
        allChunks.push({ section: sec.name, index: i, text: chunks[i] });
      }
    }
  }
  return allChunks;
}
```
Notes:
- This is a heuristic; use tokenizers and sentence splitters in production.
- Use layout-aware PDF parsers (that preserve headings and font size) to improve header detection.

Production tips
- Use token-based chunking to match your embedding/LLM tokenizer.
- Use sentence boundary detection (e.g., "sbd" in Node, spaCy/Punkt in Python).
- Prefer structured parsers for resumes (some libraries attempt to extract fields like company, title, dates). Use that to seed metadata.
- Test on a variety of resume formats (one-column, two-column, varied fonts) and tune header detection regexes.
- Evaluate retrieval quality: run queries that should match specific role/context and verify that preserved sections score higher than naive fixed splits.

Tradeoffs
- More complex preprocessing saves you downstream trouble (better recall, fewer hallucinations), but it adds pipeline complexity and parsing edge cases.
- If you cannot reliably detect structure, use conservative chunking + overlap and store offsets; later you can rerun a more advanced parser when scaling.

Quick validation idea
- Run a small A/B test: index a sample corpus twice (naive fixed chunks vs. section-aware chunks). Run a set of real recruiter queries and compare recall/precision and LLM answer quality (presence of correct citations, fewer contradictions).

Next Search Topics:
- Provide a token-aware Node.js implementation using a tokenizer (tiktoken or HF tokenizers),
- Or produce a stricter regex set and heuristics specifically tuned for resumes (common headings, date patterns, bullet markers). Which would you prefer?
