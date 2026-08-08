# BASOUL OS — System Architecture Specification

Version: 1.0  
Status: Approved  
Release baseline: v2.2.0

## Product architecture

BASOUL OS is a decision-first Executive and Architectural Operating System. The platform separates presentation, application orchestration, cognitive reasoning, business rules, data access, and integrations.

## YOSSEUF Cognitive Core (YCC)

The cognitive pipeline is:

1. Perception — accepts drawings, documents, messages, events, and structured data.
2. Understanding — converts inputs into domain entities and relationships.
3. Knowledge — retrieves applicable codes, standards, project context, and company experience.
4. Reasoning — evaluates conflicts, opportunities, risks, and alternatives.
5. Decision — ranks what requires action.
6. Recommendation — produces explainable advice with evidence and confidence.
7. Execution — creates tasks, reports, RFIs, notifications, or review requests.
8. Learning — records outcomes and approved lessons without silently changing authoritative rules.

## Architectural Intelligence

Architectural Intelligence is implemented as replaceable engines rather than a monolith:

- drawing-reader
- drawing-parser
- space-detector
- room-classifier
- dimension-reader
- design-reviewer
- code-checker
- identity-reviewer
- recommendation-engine
- report-generator

## Mandatory architecture rules

- No business or decision logic inside React components.
- Every recommendation must include evidence, confidence, and an explanation.
- AI output is advisory until accepted by an authorized human.
- Code and regulatory rules are versioned and jurisdiction-aware.
- Engines communicate through typed contracts.
- Providers, OCR models, and CAD/BIM parsers remain replaceable.
- All decisions and status changes are auditable.
- Workspace and tenant boundaries are enforced in every data operation.

## Initial implementation boundary

v2.2.0 establishes typed contracts, the cognitive pipeline, the Engineering Confidence Engine, architectural review report generation, persistent data foundations, and governance documentation. It does not claim production-grade geometric recognition or official code compliance certification.
