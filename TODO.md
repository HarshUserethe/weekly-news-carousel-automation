# TODO - Groq migration for summarize.js

- [x] Replace OpenAI usage in `src/summarize.js` with Groq (`groq-sdk`).
- [x] Update environment variable usage to `GROQ_API_KEY` and model selection via `config.groqModel` (fallback to `llama3-8b-8192`).

- [x] Preserve existing JSON output contract (headline/summary/category + truncation safety).
- [x] Ensure error handling/log messages are updated from OpenAI -> Groq.

- [x] Run a quick `node src/summarize.js` smoke test (requires env keys).


