# GTHack12

# 🩺 BetterDoctor — Smarter Visits, Stronger Care

BetterDoctor makes healthcare effortless—for both **patients** and **doctors**.

It evolves with every interaction, learning from **conversations**, **uploaded reports**, and **treatment decisions** to deliver **personalized, context-aware medical assistance.**

---

## 💡 Inspiration

Medical conversations are messy.

Patients forget symptoms. Doctors don’t have time to read long intake forms. Insurance rules make prescribing harder than diagnosing.

We asked:

> **What if AI could *learn the doctor–patient relationship* and make care more efficient for both sides?**

BetterDoctor is our answer — an AI-powered platform that **remembers, adapts, and supports care decisions without replacing human judgment.**

---

## ⚙️ What It Does

### ✅ For Patients

- **Adaptive Intake Form → Smart Chatbot:** Starts as a simple form, evolves into an AI that asks follow-up questions to narrow down symptoms.
- **Upload & Remember Reports:** Patients can upload lab results, prescriptions, or scans — OCR extracts structured insights for future visits.
- **Insurance-Aware Medication Suggestions:** When treatment is recommended, we automatically **check prescription coverage** by scraping **insurance brochures** and suggest **cheaper or approved alternatives.**

### 🩻 For Doctors

- **Summarized Patient Snapshot:** AI compiles a clean summary of all patient responses and uploads before the appointment.
- **Doctor Feedback Loop:** Doctors can add **their own notes and reasoning**, teaching the AI how *they* think.
- **Searchable Appointment Memory:** Upload visit recordings — using **TwelveLabs inference**, doctors and patients can **search past conversations like Google.**

---

## 🛠️ Tech Stack

| Category | Technologies |
|----------|-------------|
| Frontend | React, TailwindCSS |
| Backend | Firebase, AWS WebSocket |
| AI / NLP | Gemini LLM, ElevenLabs (voice), TwelveLabs (video inference) |
| OCR | Google Cloud Vision AI |
| Web Scraping | BeautifulSoup (insurance brochure crawler) |
| Storage & Infra | Firebase Storage + Cloud Functions |

---

## 🚧 Challenges We Ran Into

- Crafting a **natural-sounding evolving questionnaire** that feels human.
- Normalizing **insurance PDF formats** into structured coverage comparisons.
- Building a **searchable video memory system** with accurate timestamps.
- Ensuring **patient privacy and trust** while using AI.

---

## 🏆 Accomplishments We're Proud Of

- A **self-learning intake system** that improves with every visit.
- The **first AI assistant that doctors can *teach back*** to adapt to their expertise.
- Fully **searchable appointment history** using video inference.
- **Cost-saving prescription logic** that empowers patients with financial clarity.

---

## 📚 What We Learned

- **AI shouldn’t replace doctors — it should *remember for them and make their life easier.***
- Patients value **clarity and follow-through** more than flashy dashboards.
- Healthcare UX must be **calm, conversational, and respectful.**

---

## 🚀 What’s Next for BetterDoctor

- 👨‍👩‍👧 **Caregiver Access & Shared Timelines** for family involvement.
- 🌎 **Voice Chat Mode & Video Playback Search** for accessibility.

---

> BetterDoctor is building **the memory layer for healthcare** — so no instruction, question, or treatment gets lost ever again.

---

