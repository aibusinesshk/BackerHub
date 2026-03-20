#!/usr/bin/env node
/**
 * BackerHub Developer & Product Owner MCP Server
 *
 * Provides tools for:
 *  - Product Owner: backlog management, user stories, prioritization, roadmap
 *  - Developer: architecture decisions, tech debt tracking, sprint boards
 *  - Project: sprint management, velocity tracking, project analytics
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { resolve } from 'node:path';
import {
  initStore,
  createItem, updateItem, getItem, listItems, deleteItem,
  createSprint, addToSprint, updateSprint, getSprint, listSprints, getSprintBoard,
  createDecision, updateDecision, listDecisions,
  createMilestone, updateMilestone, listMilestones,
  getProjectStats, getData,
  type ItemType, type Priority, type ItemStatus, type SprintStatus,
} from './store.js';

// ─── Initialize ──────────────────────────────────────────────────────

const PROJECT_ROOT = resolve(process.env.PROJECT_ROOT || process.cwd());
initStore(PROJECT_ROOT);

const server = new McpServer({
  name: 'backerhub-dev-owner',
  version: '1.0.0',
});

// ─── Helpers ─────────────────────────────────────────────────────────

function fmt(obj: unknown): string {
  return JSON.stringify(obj, null, 2);
}

// ─── PRODUCT OWNER TOOLS ─────────────────────────────────────────────

server.tool(
  'create_story',
  'Create a new user story / feature / bug / task in the backlog. Use this when planning new work.',
  {
    title: z.string().describe('Short title (e.g. "Add wallet connect support")'),
    description: z.string().describe('Detailed description of the work. Include user story format "As a X, I want Y, so that Z" for features.'),
    type: z.enum(['feature', 'bug', 'tech-debt', 'improvement', 'research']).describe('Type of work item'),
    priority: z.enum(['critical', 'high', 'medium', 'low']).describe('Priority level'),
    storyPoints: z.number().optional().describe('Estimated effort (1=tiny, 2=small, 3=medium, 5=large, 8=huge, 13=epic)'),
    acceptanceCriteria: z.array(z.string()).optional().describe('List of acceptance criteria that define "done"'),
    tags: z.array(z.string()).optional().describe('Tags for categorization (e.g. ["payments", "frontend", "api"])'),
  },
  async (params) => {
    const item = createItem(params);
    return { content: [{ type: 'text', text: `Created ${item.type} ${item.id}: "${item.title}"\n\n${fmt(item)}` }] };
  }
);

server.tool(
  'update_story',
  'Update an existing backlog item (change status, priority, description, etc.)',
  {
    id: z.string().describe('Item ID (e.g. FEAT-0001, BUG-0003)'),
    status: z.enum(['backlog', 'planned', 'in-progress', 'review', 'done', 'cancelled']).optional(),
    priority: z.enum(['critical', 'high', 'medium', 'low']).optional(),
    title: z.string().optional(),
    description: z.string().optional(),
    storyPoints: z.number().optional(),
    notes: z.string().optional().describe('Add implementation notes or comments'),
    tags: z.array(z.string()).optional(),
  },
  async (params) => {
    const { id, ...updates } = params;
    const item = updateItem(id, updates);
    if (!item) return { content: [{ type: 'text', text: `Item ${id} not found.` }] };
    return { content: [{ type: 'text', text: `Updated ${item.id}: status=${item.status}, priority=${item.priority}\n\n${fmt(item)}` }] };
  }
);

server.tool(
  'get_story',
  'Get full details of a specific backlog item',
  { id: z.string().describe('Item ID') },
  async ({ id }) => {
    const item = getItem(id);
    if (!item) return { content: [{ type: 'text', text: `Item ${id} not found.` }] };
    return { content: [{ type: 'text', text: fmt(item) }] };
  }
);

server.tool(
  'list_backlog',
  'List and filter backlog items. Use to review what needs to be done, find bugs, check priorities.',
  {
    status: z.enum(['backlog', 'planned', 'in-progress', 'review', 'done', 'cancelled']).optional(),
    type: z.enum(['feature', 'bug', 'tech-debt', 'improvement', 'research']).optional(),
    priority: z.enum(['critical', 'high', 'medium', 'low']).optional(),
    sprintId: z.string().optional(),
    tag: z.string().optional(),
  },
  async (filters) => {
    const hasFilters = Object.values(filters).some(v => v !== undefined);
    const items = listItems(hasFilters ? filters : undefined);
    if (items.length === 0) {
      return { content: [{ type: 'text', text: 'No items found matching filters.' }] };
    }

    const summary = items.map((i) =>
      `[${i.id}] ${i.priority.toUpperCase().padEnd(8)} ${i.status.padEnd(12)} ${i.type.padEnd(12)} ${i.title}${i.storyPoints ? ` (${i.storyPoints}pts)` : ''}`
    ).join('\n');

    return {
      content: [{
        type: 'text',
        text: `Found ${items.length} items:\n\n${summary}`,
      }],
    };
  }
);

server.tool(
  'delete_story',
  'Delete a backlog item permanently',
  { id: z.string().describe('Item ID to delete') },
  async ({ id }) => {
    const ok = deleteItem(id);
    return { content: [{ type: 'text', text: ok ? `Deleted ${id}` : `Item ${id} not found.` }] };
  }
);

server.tool(
  'prioritize',
  'Bulk-set priorities for multiple items at once. Use for backlog grooming.',
  {
    items: z.array(z.object({
      id: z.string(),
      priority: z.enum(['critical', 'high', 'medium', 'low']),
      storyPoints: z.number().optional(),
    })).describe('Array of items with new priorities'),
  },
  async ({ items }) => {
    const results: string[] = [];
    for (const { id, priority, storyPoints } of items) {
      const updated = updateItem(id, { priority, storyPoints });
      results.push(updated ? `${id}: → ${priority}${storyPoints ? ` (${storyPoints}pts)` : ''}` : `${id}: NOT FOUND`);
    }
    return { content: [{ type: 'text', text: `Prioritized ${items.length} items:\n${results.join('\n')}` }] };
  }
);

// ─── SPRINT TOOLS ────────────────────────────────────────────────────

server.tool(
  'create_sprint',
  'Create a new sprint for organizing work into time-boxed iterations.',
  {
    name: z.string().describe('Sprint name (e.g. "Sprint 5 - Payments")'),
    goal: z.string().describe('Sprint goal - what should be achieved by the end'),
    startDate: z.string().optional().describe('Start date (YYYY-MM-DD)'),
    endDate: z.string().optional().describe('End date (YYYY-MM-DD)'),
  },
  async (params) => {
    const sprint = createSprint(params);
    return { content: [{ type: 'text', text: `Created sprint ${sprint.id}: "${sprint.name}"\nGoal: ${sprint.goal}\n\n${fmt(sprint)}` }] };
  }
);

server.tool(
  'add_to_sprint',
  'Add a backlog item to a sprint',
  {
    sprintId: z.string().describe('Sprint ID (e.g. SPR-0001)'),
    itemId: z.string().describe('Backlog item ID to add'),
  },
  async ({ sprintId, itemId }) => {
    const ok = addToSprint(sprintId, itemId);
    return { content: [{ type: 'text', text: ok ? `Added ${itemId} to sprint ${sprintId}` : 'Sprint or item not found.' }] };
  }
);

server.tool(
  'sprint_board',
  'View the sprint board showing items grouped by status (like a Kanban board). Great for standups.',
  {
    sprintId: z.string().describe('Sprint ID'),
  },
  async ({ sprintId }) => {
    const sprint = getSprint(sprintId);
    if (!sprint) return { content: [{ type: 'text', text: `Sprint ${sprintId} not found.` }] };

    const board = getSprintBoard(sprintId);
    const columns = ['planned', 'in-progress', 'review', 'done'] as const;
    let output = `# Sprint: ${sprint.name}\nGoal: ${sprint.goal}\nStatus: ${sprint.status}\n`;

    if (sprint.startDate) output += `Period: ${sprint.startDate} → ${sprint.endDate || '?'}\n`;
    output += '\n';

    for (const col of columns) {
      const items = board[col];
      output += `## ${col.toUpperCase()} (${items.length})\n`;
      if (items.length === 0) {
        output += '  (empty)\n';
      } else {
        for (const item of items) {
          output += `  [${item.id}] ${item.priority.toUpperCase()} - ${item.title}${item.storyPoints ? ` (${item.storyPoints}pts)` : ''}\n`;
        }
      }
      output += '\n';
    }

    const totalPoints = sprint.items
      .map((id) => getItem(id))
      .filter(Boolean)
      .reduce((sum, i) => sum + (i!.storyPoints || 0), 0);
    const donePoints = board.done.reduce((sum, i) => sum + (i.storyPoints || 0), 0);

    output += `---\nProgress: ${donePoints}/${totalPoints} story points (${totalPoints ? Math.round(donePoints / totalPoints * 100) : 0}%)`;

    return { content: [{ type: 'text', text: output }] };
  }
);

server.tool(
  'update_sprint',
  'Update sprint status or details (start it, complete it, add retrospective)',
  {
    id: z.string().describe('Sprint ID'),
    status: z.enum(['planning', 'active', 'completed']).optional(),
    goal: z.string().optional(),
    retrospective: z.string().optional().describe('Sprint retrospective notes (what went well, what to improve)'),
  },
  async (params) => {
    const { id, ...updates } = params;
    const sprint = updateSprint(id, updates);
    if (!sprint) return { content: [{ type: 'text', text: `Sprint ${id} not found.` }] };
    return { content: [{ type: 'text', text: `Updated sprint ${sprint.id}: status=${sprint.status}\n\n${fmt(sprint)}` }] };
  }
);

server.tool(
  'list_sprints',
  'List all sprints',
  {},
  async () => {
    const sprints = listSprints();
    if (sprints.length === 0) return { content: [{ type: 'text', text: 'No sprints yet. Use create_sprint to start one.' }] };

    const summary = sprints.map((s) =>
      `[${s.id}] ${s.status.padEnd(10)} ${s.name} (${s.items.length} items) - ${s.goal}`
    ).join('\n');
    return { content: [{ type: 'text', text: `${sprints.length} sprints:\n\n${summary}` }] };
  }
);

// ─── ARCHITECTURE DECISION TOOLS ─────────────────────────────────────

server.tool(
  'create_adr',
  'Record an Architecture Decision Record (ADR). Use when making significant technical decisions.',
  {
    title: z.string().describe('Decision title (e.g. "Use NOWPayments for crypto processing")'),
    context: z.string().describe('Why is this decision needed? What is the problem/situation?'),
    decision: z.string().describe('What was decided and why'),
    consequences: z.string().describe('What are the positive and negative consequences?'),
    alternatives: z.string().optional().describe('What alternatives were considered and why they were rejected?'),
  },
  async (params) => {
    const adr = createDecision(params);
    return { content: [{ type: 'text', text: `Created ADR ${adr.id}: "${adr.title}"\n\n${fmt(adr)}` }] };
  }
);

server.tool(
  'update_adr',
  'Update an architecture decision (accept, deprecate, supersede)',
  {
    id: z.string().describe('ADR ID'),
    status: z.enum(['proposed', 'accepted', 'deprecated', 'superseded']).optional(),
    decision: z.string().optional(),
    consequences: z.string().optional(),
  },
  async (params) => {
    const { id, ...updates } = params;
    const adr = updateDecision(id, updates);
    if (!adr) return { content: [{ type: 'text', text: `ADR ${id} not found.` }] };
    return { content: [{ type: 'text', text: `Updated ADR ${adr.id}: status=${adr.status}\n\n${fmt(adr)}` }] };
  }
);

server.tool(
  'list_adrs',
  'List all architecture decisions',
  {},
  async () => {
    const decisions = listDecisions();
    if (decisions.length === 0) return { content: [{ type: 'text', text: 'No ADRs yet.' }] };

    const summary = decisions.map((d) =>
      `[${d.id}] ${d.status.padEnd(12)} ${d.title}\n  Decision: ${d.decision.substring(0, 100)}...`
    ).join('\n\n');
    return { content: [{ type: 'text', text: `${decisions.length} Architecture Decisions:\n\n${summary}` }] };
  }
);

// ─── ROADMAP TOOLS ───────────────────────────────────────────────────

server.tool(
  'create_milestone',
  'Create a roadmap milestone to organize features into high-level release goals.',
  {
    name: z.string().describe('Milestone name (e.g. "v1.1 - Automated Payments")'),
    description: z.string().describe('What this milestone achieves'),
    targetDate: z.string().optional().describe('Target completion date (YYYY-MM-DD)'),
    featureIds: z.array(z.string()).optional().describe('Backlog item IDs to include'),
  },
  async (params) => {
    const ms = createMilestone(params);
    return { content: [{ type: 'text', text: `Created milestone ${ms.id}: "${ms.name}"\n\n${fmt(ms)}` }] };
  }
);

server.tool(
  'update_milestone',
  'Update a roadmap milestone',
  {
    id: z.string().describe('Milestone ID'),
    status: z.enum(['upcoming', 'in-progress', 'completed']).optional(),
    features: z.array(z.string()).optional().describe('Updated list of feature IDs'),
    targetDate: z.string().optional(),
  },
  async (params) => {
    const { id, ...updates } = params;
    const ms = updateMilestone(id, updates);
    if (!ms) return { content: [{ type: 'text', text: `Milestone ${id} not found.` }] };
    return { content: [{ type: 'text', text: `Updated milestone ${ms.id}\n\n${fmt(ms)}` }] };
  }
);

server.tool(
  'roadmap',
  'View the full product roadmap with all milestones and their progress.',
  {},
  async () => {
    const milestones = listMilestones();
    if (milestones.length === 0) {
      return { content: [{ type: 'text', text: 'No milestones yet. Use create_milestone to define your roadmap.' }] };
    }

    let output = '# BackerHub Product Roadmap\n\n';
    for (const ms of milestones) {
      const statusIcon = ms.status === 'completed' ? '[DONE]' : ms.status === 'in-progress' ? '[ACTIVE]' : '[UPCOMING]';
      output += `## ${statusIcon} ${ms.name}\n`;
      output += `${ms.description}\n`;
      if (ms.targetDate) output += `Target: ${ms.targetDate}\n`;

      if (ms.features.length > 0) {
        output += 'Features:\n';
        for (const fid of ms.features) {
          const item = getItem(fid);
          if (item) {
            const check = item.status === 'done' ? '[x]' : '[ ]';
            output += `  ${check} ${item.id} - ${item.title} (${item.status})\n`;
          } else {
            output += `  [ ] ${fid} (not found)\n`;
          }
        }
      }
      output += '\n';
    }

    return { content: [{ type: 'text', text: output }] };
  }
);

// ─── PROJECT ANALYTICS ───────────────────────────────────────────────

server.tool(
  'project_stats',
  'Get project analytics: velocity, item counts by status/type/priority, completion rate.',
  {},
  async () => {
    const stats = getProjectStats();
    const data = getData();

    let output = `# BackerHub Project Stats\n\n`;
    output += `Total items: ${stats.total}\n`;
    output += `Completed this week: ${stats.completedThisWeek}\n`;
    output += `Weekly velocity: ${stats.velocity} story points\n\n`;

    output += `## By Status\n`;
    for (const [status, count] of Object.entries(stats.byStatus)) {
      output += `  ${status}: ${count}\n`;
    }

    output += `\n## By Type\n`;
    for (const [type, count] of Object.entries(stats.byType)) {
      output += `  ${type}: ${count}\n`;
    }

    output += `\n## By Priority\n`;
    for (const [priority, count] of Object.entries(stats.byPriority)) {
      output += `  ${priority}: ${count}\n`;
    }

    output += `\n## Sprints: ${data.sprints.length}`;
    output += `\n## ADRs: ${data.decisions.length}`;
    output += `\n## Milestones: ${data.roadmap.length}`;

    return { content: [{ type: 'text', text: output }] };
  }
);

server.tool(
  'standup',
  'Generate a daily standup summary: what was done recently, what is in progress, and what is blocked.',
  {},
  async () => {
    const allItems = listItems();
    const inProgress = allItems.filter((i) => i.status === 'in-progress');
    const inReview = allItems.filter((i) => i.status === 'review');

    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const recentlyDone = allItems.filter((i) => i.completedAt && i.completedAt >= yesterday);

    const critical = allItems.filter((i) => i.priority === 'critical' && i.status !== 'done' && i.status !== 'cancelled');

    let output = '# Daily Standup\n\n';

    output += `## Done (last 24h) - ${recentlyDone.length}\n`;
    if (recentlyDone.length === 0) output += '  (nothing completed recently)\n';
    for (const i of recentlyDone) output += `  [${i.id}] ${i.title}\n`;

    output += `\n## In Progress - ${inProgress.length}\n`;
    if (inProgress.length === 0) output += '  (nothing in progress)\n';
    for (const i of inProgress) output += `  [${i.id}] ${i.priority.toUpperCase()} - ${i.title}\n`;

    output += `\n## In Review - ${inReview.length}\n`;
    if (inReview.length === 0) output += '  (nothing in review)\n';
    for (const i of inReview) output += `  [${i.id}] ${i.title}\n`;

    if (critical.length > 0) {
      output += `\n## CRITICAL Items - ${critical.length}\n`;
      for (const i of critical) output += `  [${i.id}] ${i.status} - ${i.title}\n`;
    }

    // Active sprint summary
    const activeSprint = listSprints().find((s) => s.status === 'active');
    if (activeSprint) {
      const board = getSprintBoard(activeSprint.id);
      const done = board.done.length;
      const total = activeSprint.items.length;
      output += `\n## Active Sprint: ${activeSprint.name}\n`;
      output += `  Progress: ${done}/${total} items (${total ? Math.round(done / total * 100) : 0}%)\n`;
      output += `  Goal: ${activeSprint.goal}\n`;
    }

    return { content: [{ type: 'text', text: output }] };
  }
);

// ─── RESOURCES ───────────────────────────────────────────────────────

server.resource(
  'backlog',
  'project://backlog',
  async (uri) => ({
    contents: [{
      uri: uri.href,
      mimeType: 'application/json',
      text: fmt(listItems()),
    }],
  })
);

server.resource(
  'roadmap',
  'project://roadmap',
  async (uri) => ({
    contents: [{
      uri: uri.href,
      mimeType: 'application/json',
      text: fmt(listMilestones()),
    }],
  })
);

server.resource(
  'decisions',
  'project://decisions',
  async (uri) => ({
    contents: [{
      uri: uri.href,
      mimeType: 'application/json',
      text: fmt(listDecisions()),
    }],
  })
);

// ─── Start Server ────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('BackerHub Dev & Product Owner MCP server running on stdio');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
