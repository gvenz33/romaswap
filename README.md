# RomaSwap Cursor Knowledge Base

**Project name:** RomaSwap (not RomoSwap; confirm branding before changing).  
**Status:** Requirements and planning only. No production trading approved.  
**Last curated:** 2026-10-28.

## Installing in Cursor
1. Unzip this package.
2. Copy its **contents**, including the hidden `.cursor` directory, into the ROOT of your existing RomaSwap repository. If starting fresh, open the extracted folder in Cursor via File > Open Folder.
3. Do not replace existing code, configuration, or rules without first reviewing conflicts.
4. Open Cursor Agent in **Plan** mode and paste the prompt from `CURSOR_START_PROMPT.md`.
5. Have Cursor read `AGENTS.md` and all files in `docs/`, inspect the existing repository, and create a phased implementation plan **before coding**.
6. Commit the documents and rules in Git; never commit `.env` secrets or wallet recovery phrases.

## Structure
- `AGENTS.md`: core persistent agent guidance.
- `.cursor/rules/`: focused Cursor project rules.
- `docs/`: source-of-truth requirements, architecture, fees, risks, acceptance tests, roadmap.
- `assets/romaswap-logo-reference.png`: brand concept, not production-ready vector logo.
- `assets/RomaSwap_Technical_Requirements_and_Roadmap.docx`: earlier planning specification; newer `docs/` control on conflicts.

**Important:** Previous chat discussion is not an automatically synchronized database. These files capture the agreed requirements. Update these files when decisions change.
