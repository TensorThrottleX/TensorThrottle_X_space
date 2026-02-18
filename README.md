<p align="left">
  <img src="./public/media/brand/logo.png" alt="Tensor Throttle X Logo" width="42" style="vertical-align: middle; margin-right: 10px;" />
  <strong style="font-size: 26px;">TENSOR THROTTLE X</strong>
</p>

A cognitive sandbox for structured experimentation.  
Not a portfolio. Not a product. Just a system for thinking out loud.

---

# 🧭 What This Is

Tensor Throttle X is a live reasoning space.

It exists to:

- Capture incomplete ideas  
- Test evolving technical structures  
- Document failures and refactors  
- Track how thinking changes over time  

This project prioritizes **process over presentation**.

There are no polished case studies here.  
Only iteration.

---

# 🔁 The Core Loop

At its simplest, the system follows this cycle:

Idea
↓
Draft
↓
Break
↓
Refactor
↓
Log
↓
Repeat


Everything here lives somewhere inside that loop.

---

# 🌊 Data Flow (How Things Move)

Instead of rigid architecture diagrams, here’s the actual flow:

┌───────────────────────┐
│       NOTION CMS      │
└───────────────────────┘
        │
        ▼
┌───────────────────────┐
│  Content Structure    │
├───────────────────────┤
│ • Title               │
│ • Rich Blocks         │
│ • Tags / Type         │
│ • Status              │
│ • Timestamps          │
└───────────────────────┘
        │
        │ API Fetch (Server)
        ▼
┌───────────────────────┐
│       NEXT.JS         │
└───────────────────────┘
        │
        ▼
┌───────────────────────┐
│  Server Processing    │
├───────────────────────┤
│ 1. Fetch via SDK      │
│ 2. Normalize blocks   │
│ 3. Filter (status)    │
│ 4. Map to schema      │
│ 5. Prepare SSR data   │
└───────────────────────┘
        │
        │ Render + Route
        ▼
┌───────────────────────┐
│   Application Areas   │
├───────────────────────┤
│ • Feed                │
│ • System Pages        │
│ • Logs                │
│ • Entry View          │
│ • Tag Filtering       │
└───────────────────────┘
        │
        │ Hydration
        ▼
┌───────────────────────┐
│   Client Runtime      │
├───────────────────────┤
│ • Navigation          │
│ • State Updates       │
│ • Transitions         │
│ • Engagement Events   │
└───────────────────────┘
        │
        │ Persist / Track
        ▼
┌───────────────────────┐
│       SUPABASE        │
├───────────────────────┤
│ • User State          │
│ • Engagement Logs     │
│ • Metrics             │
│ • Session Data        │
└───────────────────────┘


### In plain terms:

- Thoughts live in Notion.
- Next.js pulls and renders them.
- The UI frames them.
- Interaction generates state.
- Supabase stores that state.
- The cycle continues.

---

# 🧱 Internal Structure

Think of the system in three zones:

Atmosphere → sets mood
Structure → frames content
Cognition → actual thinking


Or visually:

Cinematic Background
↓
Glass / Layout Frame
↓
Notes · Code · Experiments · Logs


No heavy abstraction. Just separation of responsibility.

---

# 🧠 Philosophy

### Raw > Polished
Messy drafts reveal architecture.

### Iteration > Completion
Systems are allowed to break.

### Visible Thinking
Abstract ideas should be navigable.

---

# ⚙️ Stack

- **Next.js 16** — routing + rendering  
- **Tailwind CSS 4** — structural styling  
- **Notion API** — raw thought storage  
- **Supabase** — interaction persistence  

Chosen for flexibility and iteration speed.

---

# 🚀 Running Locally

```bash
pnpm install
pnpm dev

🧭 Positioning

This is not:

A portfolio

A startup landing page

A finished product

This is:

A cognitive test space

A structural thinking lab

A system under constant refactor

Built for evolution.
Not presentation.


---

If you want, I can now:

- Make it more minimal (even sharper, almost manifesto style)
- Or make it more experimental (graph-style visual network layout)
- Or tune the tone slightly more technical / slightly more creative

Choose the direction.

