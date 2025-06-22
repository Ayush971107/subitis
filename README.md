# Signal AI: Copilot for First Responders

## Inspiration  
In high-stakes emergency response, every second and every detail matters. Dispatchers and hotline counselors juggle complex scenarios, stressful callers, and rapidly changing information—with no room for error. We built Signal.ai to empower first responders with AI-driven insights and real-time context, reducing cognitive load and improving outcomes for people in crisis.

---

## What it does  
- **Live Case Summary**  
  Continuously extracts and displays key facts—caller location, incident type, risk indicators, and timestamps—so responders see a concise, up-to-date overview of each call.  
- **Adaptive Guidance & Recommendations**  
  Uses NLP on the live transcript to surface tailored suggestions on communication style, de-escalation techniques, and protocol-driven prompts—updated in real time.  
- **Emergency Facilities Map**  
  Plots nearby hospitals, crisis centers, and support services relative to the caller’s location for rapid resource coordination.

---

## How we built it  
1. **Caller Speech → Transcription**  
   - Twilio Programmable Voice captures audio and streams via WebSockets  
   - Speech-to-Text transforms incoming audio into timestamped text chunks labeled by role (caller or dispatcher)  
2. **Chunk Processing & Memory Update**  
   - `process_chunk_fast(transcript_chunk, role)` writes each chunk into Letta’s in-memory “full_conversation” block  
3. **Context Retrieval**  
   - Fetch cached **call_history** summary from Letta  
   - Read the last ~1,000 characters of the raw transcript for recency  
4. **RAG Lookup**  
   - Embed the new chunk and query Pinecone vector store that is built on substantial medical, mental health, suicidal hotline, and crisis situation data
   - Retrieve top-K relevant SOP/guideline passages for this scenario  
5. **Prompt Composition**  
   - System prompt + memory_summary + retrieved guidelines + full conversation + last message + previous advice  
6. **Advice Generation**  
   - Invoke Groq LLM with the composed prompt for high throughput and low latency to facilitate urgent situations
   - Receive structured JSON: updated summary, 1–2 bullet advice items, caller age estimate, criticality score  
7. **Async Memory Write**  
   - Fire-and-forget update of “call_history” in Letta  
   - Cache `prev_advice` to prevent duplicate recommendations  
8. **UI Update & Monitoring**  
   - Dashboard renders live updates about caller’s progress with summaries including age, criticality, and and event history and offers next steps for the first responder immediately via WebSocket 
   - Log per-step timing stats for performance monitoring  

---

## Challenges we ran into  
- **Latency vs. Accuracy**  
  Pipelining transcription, embedding, retrieval, and LLM inference — all under 1.2 s — required careful batching and caching strategies.  
- **Third-Party Orchestration**  
  Coordinating Twilio, Pinecone, Letta GROQ, and Groq LLM into a cohesive, low-latency workflow with robust retry/fallback logic.  
- **UX for High-Pressure Scenarios**  
  Ensuring critical guidance is surfaced clearly and without distraction demanded iterative user testing with real dispatchers.

---

## Accomplishments we’re proud of  
- **92% Extraction Accuracy**  
  Live demo maintained high accuracy even with noisy audio.  
- **<1.3 s Response Time**  
  From audio capture to recommendation display—achieved 90th-percentile performance. 

---

## What we learned  
- **Fine-Tuned Prompts Matter**  
  Small prompt & training-data tweaks drastically improved the relevance of our AI guidance.  
- **UX Saves Lives**  
  Clear visual hierarchy, minimal clicks, and real-time feedback are critical in high-pressure contexts.  
- **Collaborative Workflows**  
  Embedding question prompts alongside case facts boosts responder confidence and consistency.

---

## What’s next for Signal.ai  
- **Multilingual Support**  
  Transcription & guidance in Spanish, Mandarin, and other major languages.  
- **Predictive Analytics**  
  Call-volume forecasting and dynamic resource allocation to proactively manage dispatcher workloads.  
- **Mobile Companion App**  
  A lightweight field-responder interface for live updates on the go.  
- **CAD Integration**  
  Partner with public-safety software vendors to embed Signal.ai directly into existing Computer-Aided Dispatch systems.
