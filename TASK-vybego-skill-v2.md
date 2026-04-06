# TASK: Upgrade VybeGo skill to API-driven task execution

## Context

VybeGo is a Claude Code skill. When Angel runs `/vybego` in any project directory, Code should:

1. Read CLAUDE.md for project context
2. Call VybePM API to get pending tasks assigned to `claude-code` for this project
3. Pick up the highest priority task (atomic)
4. Execute the task (write code, run tests, etc.)
5. Report completion back to VybePM with notes

This replaces the old pattern of reading local TASK-*.md files.

## Skill Location

The VybeGo skill should be installed at:
```
~/.claude/skills/vybego/SKILL.md
```

This is a global Code skill (not project-specific) so it works in any 1000Problems project.

## SKILL.md Content

```markdown
---
name: vybego
description: Autonomous task executor — pulls tasks from VybePM, executes them, reports completion
---

# VybeGo — Autonomous Task Executor

## Trigger

User runs `/vybego` in any project directory.

## Environment

Requires `VYBEPM_API_KEY` in environment or `.env.local`.
VybePM base URL: `https://vybepm-v2.vercel.app`

## Execution Flow

### Step 1: Identify project

Read CLAUDE.md in the current directory. Look for "VybePM Integration" section to find the project slug. If not found, infer from the directory name.

Fallback mapping:
- ytcombinator → ytcombinator
- VybePM-v2 → VybePM
- Vybe → Vybe
- GitMCP → GitMCP
- KitchenInventory → KitchenInventory
- voiceq-api → voiceq-api
- RubberJoints-iOS → RubberJoints-iOS
- 1000Problems → 1000Problems
- Animation → Animation
- AnimationStudio → AnimationStudio
- popiPlayAssets → popiPlayAssets

### Step 2: Get next task

```bash
curl -s "https://vybepm-v2.vercel.app/api/executor/next?project=${PROJECT_SLUG}" \
  -H "X-API-Key: ${VYBEPM_API_KEY}" \
  -H "X-Executor: claude-code"
```

If 204 (no tasks): print "No pending tasks for {project}" and exit.
If 200: parse the task JSON.

### Step 3: Pick up task

```bash
curl -s -X PATCH "https://vybepm-v2.vercel.app/api/executor/tasks/${TASK_ID}/pickup" \
  -H "X-API-Key: ${VYBEPM_API_KEY}" \
  -H "X-Executor: claude-code"
```

If 409: task was already picked up. Go back to Step 2.

### Step 4: Execute

Print the task details:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VybeGo Task #{id} — {project}
Priority: {priority} | Type: {task_type}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{title}

{description}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Execute the task using CLAUDE.md as context. This is normal Code work — write code, create files, run tests, fix errors.

### Step 5: Report completion

After the work is done:

```bash
curl -s -X PATCH "https://vybepm-v2.vercel.app/api/executor/tasks/${TASK_ID}/complete" \
  -H "X-API-Key: ${VYBEPM_API_KEY}" \
  -H "X-Executor: claude-code" \
  -H "Content-Type: application/json" \
  -d '{"notes": "Summary of what was done..."}'
```

The notes should summarize:
- What files were created/modified
- What tests were run
- Any issues encountered

### Step 6: Check for more tasks

After completing a task, go back to Step 2. Keep executing until no more pending tasks.

## Error Handling

- If VybePM is unreachable: fall back to reading local TASK-*.md files
- If API key is missing: print error and exit
- If task execution fails: do NOT report completion. Leave task as in_progress. Print the error so Angel can investigate.

## Do NOT

- Do NOT commit or push — Angel handles git
- Do NOT modify files outside the current project directory
- Do NOT pick up tasks assigned to `angel` or `cowork`
- Do NOT skip the pickup step (prevents race conditions)
```

## Installation

Create the skill file at `~/.claude/skills/vybego/SKILL.md` with the content above.

## Dependencies

This skill requires the Executor API to be deployed first (see TASK-executor-api-and-seed.md).
