# Documentation

This documentation follows the [Diataxis framework](https://diataxis.fr/), which organizes docs by the reader's *need* rather than by topic.

---

## Four quadrants

| Section | Purpose | Reader's question |
|---|---|---|
| [Tutorials](tutorials/) | Learning — guided walkthroughs | "I'm new. Show me how to get started." |
| [How-to guides](how-to/) | Task — concrete steps for a specific goal | "I know what I want. How do I do it?" |
| [Reference](reference/) | Information — accurate, complete descriptions | "What are the exact values / rules for X?" |
| [Explanation](explanation/) | Understanding — background and context | "Why does it work this way?" |

Plus two additional sections:

| Section | Purpose |
|---|---|
| [Troubleshooting](troubleshooting/) | Diagnosing and fixing known problems |
| [Architecture](architecture/) | System design, data model, integrations |
| [ADRs](adrs/) | Architecture Decision Records — permanent record of major decisions |

---

## Operational guides

| Guide | Description |
|---|---|
| [Local Setup](setup-local.md) | Set up a local development environment |
| [Deployment](deployment.md) | Vercel setup, staging, environment variables |
| [Incident Response](runbooks/incident-response.md) | What to do when production is down |
| [Rollback](runbooks/rollback.md) | How to revert a bad deploy |

---

## Contributing standards

| Guide | Description |
|---|---|
| [Commit Standards](standards/commits.md) | Commit message format |
| [Branching Standards](standards/branching.md) | Branch naming and lifetime |
| [PR Standards](standards/pull-requests.md) | Pull request guidelines |
