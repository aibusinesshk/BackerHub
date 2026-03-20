/**
 * Persistent JSON file-based storage for the MCP server.
 * Stores backlog items, sprints, architecture decisions, and roadmap.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
// ─── Store ───────────────────────────────────────────────────────────
const DEFAULT_DATA = {
    projectName: 'BackerHub',
    version: '1.0.0',
    backlog: [],
    sprints: [],
    decisions: [],
    roadmap: [],
    nextId: 1,
};
let dataPath;
let data;
export function initStore(projectRoot) {
    dataPath = join(projectRoot, 'mcp-dev-owner', 'data', 'project.json');
    const dir = dirname(dataPath);
    if (!existsSync(dir))
        mkdirSync(dir, { recursive: true });
    if (existsSync(dataPath)) {
        try {
            data = JSON.parse(readFileSync(dataPath, 'utf-8'));
        }
        catch {
            data = { ...DEFAULT_DATA };
        }
    }
    else {
        data = { ...DEFAULT_DATA };
        save();
    }
}
function save() {
    writeFileSync(dataPath, JSON.stringify(data, null, 2));
}
function genId(prefix) {
    const id = `${prefix}-${String(data.nextId).padStart(4, '0')}`;
    data.nextId++;
    save();
    return id;
}
function now() {
    return new Date().toISOString();
}
// ─── Backlog Operations ──────────────────────────────────────────────
export function createItem(params) {
    const item = {
        id: genId(params.type === 'bug' ? 'BUG' : params.type === 'feature' ? 'FEAT' : 'TASK'),
        title: params.title,
        description: params.description,
        type: params.type,
        priority: params.priority,
        status: 'backlog',
        storyPoints: params.storyPoints,
        acceptanceCriteria: params.acceptanceCriteria,
        tags: params.tags,
        createdAt: now(),
        updatedAt: now(),
    };
    data.backlog.push(item);
    save();
    return item;
}
export function updateItem(id, updates) {
    const item = data.backlog.find((i) => i.id === id);
    if (!item)
        return null;
    Object.assign(item, updates, { updatedAt: now() });
    if (updates.status === 'done' && !item.completedAt) {
        item.completedAt = now();
    }
    save();
    return item;
}
export function getItem(id) {
    return data.backlog.find((i) => i.id === id) || null;
}
export function listItems(filters) {
    let items = [...data.backlog];
    if (filters?.status)
        items = items.filter((i) => i.status === filters.status);
    if (filters?.type)
        items = items.filter((i) => i.type === filters.type);
    if (filters?.priority)
        items = items.filter((i) => i.priority === filters.priority);
    if (filters?.sprintId)
        items = items.filter((i) => i.sprintId === filters.sprintId);
    if (filters?.tag)
        items = items.filter((i) => i.tags?.includes(filters.tag));
    return items;
}
export function deleteItem(id) {
    const idx = data.backlog.findIndex((i) => i.id === id);
    if (idx === -1)
        return false;
    data.backlog.splice(idx, 1);
    // Also remove from sprints
    for (const sprint of data.sprints) {
        sprint.items = sprint.items.filter((sid) => sid !== id);
    }
    save();
    return true;
}
// ─── Sprint Operations ───────────────────────────────────────────────
export function createSprint(params) {
    const sprint = {
        id: genId('SPR'),
        name: params.name,
        goal: params.goal,
        status: 'planning',
        startDate: params.startDate,
        endDate: params.endDate,
        items: [],
        createdAt: now(),
    };
    data.sprints.push(sprint);
    save();
    return sprint;
}
export function addToSprint(sprintId, itemId) {
    const sprint = data.sprints.find((s) => s.id === sprintId);
    const item = data.backlog.find((i) => i.id === itemId);
    if (!sprint || !item)
        return false;
    if (!sprint.items.includes(itemId)) {
        sprint.items.push(itemId);
        item.sprintId = sprintId;
        item.status = 'planned';
        item.updatedAt = now();
        save();
    }
    return true;
}
export function updateSprint(id, updates) {
    const sprint = data.sprints.find((s) => s.id === id);
    if (!sprint)
        return null;
    Object.assign(sprint, updates);
    save();
    return sprint;
}
export function getSprint(id) {
    return data.sprints.find((s) => s.id === id) || null;
}
export function listSprints() {
    return [...data.sprints];
}
export function getSprintBoard(sprintId) {
    const board = {
        'backlog': [], 'planned': [], 'in-progress': [], 'review': [], 'done': [], 'cancelled': [],
    };
    const items = data.backlog.filter((i) => i.sprintId === sprintId);
    for (const item of items) {
        board[item.status].push(item);
    }
    return board;
}
// ─── Architecture Decisions ──────────────────────────────────────────
export function createDecision(params) {
    const adr = {
        id: genId('ADR'),
        title: params.title,
        status: 'proposed',
        context: params.context,
        decision: params.decision,
        consequences: params.consequences,
        alternatives: params.alternatives,
        createdAt: now(),
        updatedAt: now(),
    };
    data.decisions.push(adr);
    save();
    return adr;
}
export function updateDecision(id, updates) {
    const adr = data.decisions.find((d) => d.id === id);
    if (!adr)
        return null;
    Object.assign(adr, updates, { updatedAt: now() });
    save();
    return adr;
}
export function listDecisions() {
    return [...data.decisions];
}
// ─── Roadmap ─────────────────────────────────────────────────────────
export function createMilestone(params) {
    const milestone = {
        id: genId('MS'),
        name: params.name,
        description: params.description,
        targetDate: params.targetDate,
        status: 'upcoming',
        features: params.featureIds || [],
        createdAt: now(),
    };
    data.roadmap.push(milestone);
    save();
    return milestone;
}
export function updateMilestone(id, updates) {
    const ms = data.roadmap.find((m) => m.id === id);
    if (!ms)
        return null;
    Object.assign(ms, updates);
    save();
    return ms;
}
export function listMilestones() {
    return [...data.roadmap];
}
// ─── Analytics ───────────────────────────────────────────────────────
export function getProjectStats() {
    const total = data.backlog.length;
    const byStatus = {};
    const byType = {};
    const byPriority = {};
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    let completedThisWeek = 0;
    let velocityPoints = 0;
    for (const item of data.backlog) {
        byStatus[item.status] = (byStatus[item.status] || 0) + 1;
        byType[item.type] = (byType[item.type] || 0) + 1;
        byPriority[item.priority] = (byPriority[item.priority] || 0) + 1;
        if (item.completedAt && item.completedAt >= weekAgo) {
            completedThisWeek++;
            velocityPoints += item.storyPoints || 1;
        }
    }
    return { total, byStatus, byType, byPriority, velocity: velocityPoints, completedThisWeek };
}
export function getData() {
    return data;
}
