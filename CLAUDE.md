# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

A collection of Claude Code skills. See README.md for details.

## Token Budget

SKILL.md files are injected verbatim into user prompts. Every token in a skill costs tokens on every invocation. When writing or editing skills:

- Be ruthlessly concise. Cut filler, redundancy, and obvious instructions.
- Prefer terse imperative sentences over explanatory prose.
- If a rule can be expressed in one line, don't use three.
- Never repeat information already in the YAML frontmatter description.

## Key Convention

All interview-style skills must use the `AskUserQuestion` tool for every question — never plain text. Each call needs: `question`, `header` (≤12 chars), and `options` (2–4 choices, recommended option marked with "(Recommended)" suffix).
