# Corvex

Single-user project management tool for client work, designed MCP-first: each project can expose a scoped MCP endpoint so coding agents read project context and manage tasks autonomously.

## Language

**Customer**:
A client (person or company) who commissions projects.
_Avoid_: Client, contact, account

**Project**:
A unit of client work; owns everything related to it.
_Avoid_: Job, engagement

**Task**:
An actionable item inside a project; the entity MCP agents create and update.
_Avoid_: Todo, ticket, issue

**Milestone**:
A named, dated checkpoint of a project that is either done or not.
_Avoid_: Deadline (a project has one deadline; milestones are the named intermediate dates)

**Payment**:
Money received against a project's budget.
_Avoid_: Invoice, transaction

**Budget**:
The agreed total price of a project. Outstanding = budget − sum of payments.
_Avoid_: Price, quote

**Note**:
A markdown reference document attached to a project.
_Avoid_: Doc, wiki

**Secret**:
An encrypted client credential (SSH, API key, CMS login) attached to a project; its value is only ever revealed in the web UI.
_Avoid_: Key, credential note

**MCP Token**:
A project-scoped bearer credential that lets an MCP client act on exactly one project.
_Avoid_: API key, personal token

## Relationships

- A **Customer** has zero or more **Projects**; a **Project** has at most one **Customer** (internal projects have none)
- A **Project** owns its **Tasks**, **Milestones**, **Payments**, **Notes**, **Secrets**, and **MCP Tokens**; deleting a project deletes them
- An **MCP Token** grants access to exactly one **Project** — never across projects
- **Project** status: Lead → Active ⇄ On Hold → Completed; Cancelled from anywhere
- **Task** status: Todo → In Progress → Done; Cancelled from anywhere

## Example dialogue

> **Dev:** "The agent finished the deploy — can it mark the 'Go-live' **Milestone** done through its **MCP Token**?"
> **Domain expert:** "No — MCP writes are limited to **Tasks** and adding **Notes**. Milestones, status, and money change in the UI only."
> **Dev:** "And if it needs the staging DB password stored as a **Secret**?"
> **Domain expert:** "It can see that the secret *exists* by name, but the value is revealed only by a human in the UI."

## Flagged ambiguities

- "keys" was used to mean both reference notes and credentials — resolved: credentials are **Secrets** (encrypted); prose lives in **Notes**.
- "deadline dates" (plural) suggested multiple deadlines per project — resolved: one project deadline; intermediate dates are **Milestones**; task-level dates are Task due dates.
- "customer contact" could have been fields on a project — resolved: **Customer** is its own entity so repeat clients link to many projects.
