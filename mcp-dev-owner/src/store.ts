/**
 * Persistent JSON file-based storage for the MCP server.
 * Stores backlog items, sprints, architecture decisions, and roadmap.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';

// ─── Types ───────────────────────────────────────────────────────────

export type Priority = 'critical' | 'high' | 'medium' | 'low';
export type ItemType = 'feature' | 'bug' | 'tech-debt' | 'improvement' | 'research';
export type ItemStatus = 'backlog' | 'planned' | 'in-progress' | 'review' | 'done' | 'cancelled';
export type SprintStatus = 'planning' | 'active' | 'completed';

export interface BacklogItem {
  id: string;
  title: string;
  description: string;
  type: ItemType;
  priority: Priority;
  status: ItemStatus;
  storyPoints?: number;
  acceptanceCriteria?: string[];
  tags?: string[];
  sprintId?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  notes?: string;
}

export interface Sprint {
  id: string;
  name: string;
  goal: string;
  status: SprintStatus;
  startDate?: string;
  endDate?: string;
  items: string[]; // BacklogItem IDs
  retrospective?: string;
  createdAt: string;
}

export interface ArchitectureDecision {
  id: string;
  title: string;
  status: 'proposed' | 'accepted' | 'deprecated' | 'superseded';
  context: string;
  decision: string;
  consequences: string;
  alternatives?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RoadmapMilestone {
  id: string;
  name: string;
  description: string;
  targetDate?: string;
  status: 'upcoming' | 'in-progress' | 'completed';
  features: string[]; // BacklogItem IDs
  createdAt: string;
}

export interface ImplementationPlan {
  id: string;
  storyId: string;
  title: string;
  approach: string;
  steps: { description: string; files: string[]; done: boolean }[];
  risks?: string;
  testStrategy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DevNote {
  id: string;
  category: 'tech-debt' | 'performance' | 'security' | 'dependency' | 'refactor' | 'testing' | 'devops';
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  affectedFiles?: string[];
  resolution?: string;
  status: 'open' | 'in-progress' | 'resolved';
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export interface CodeReview {
  id: string;
  title: string;
  branch?: string;
  filesChanged: string[];
  summary: string;
  findings: { type: 'bug' | 'security' | 'performance' | 'style' | 'suggestion'; severity: 'critical' | 'high' | 'medium' | 'low'; file: string; description: string }[];
  status: 'pending' | 'approved' | 'changes-requested';
  createdAt: string;
}

export interface ProjectData {
  projectName: string;
  version: string;
  backlog: BacklogItem[];
  sprints: Sprint[];
  decisions: ArchitectureDecision[];
  roadmap: RoadmapMilestone[];
  plans: ImplementationPlan[];
  devNotes: DevNote[];
  codeReviews: CodeReview[];
  nextId: number;
}

// ─── Store ───────────────────────────────────────────────────────────

const DEFAULT_DATA: ProjectData = {
  projectName: 'BackerHub',
  version: '1.0.0',
  backlog: [],
  sprints: [],
  decisions: [],
  roadmap: [],
  plans: [],
  devNotes: [],
  codeReviews: [],
  nextId: 1,
};

let dataPath: string;
let data: ProjectData;

export function initStore(projectRoot: string): void {
  dataPath = join(projectRoot, 'mcp-dev-owner', 'data', 'project.json');
  const dir = dirname(dataPath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  if (existsSync(dataPath)) {
    try {
      data = JSON.parse(readFileSync(dataPath, 'utf-8'));
    } catch {
      data = { ...DEFAULT_DATA };
    }
  } else {
    data = { ...DEFAULT_DATA };
    save();
  }
}

function save(): void {
  writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

function genId(prefix: string): string {
  const id = `${prefix}-${String(data.nextId).padStart(4, '0')}`;
  data.nextId++;
  save();
  return id;
}

function now(): string {
  return new Date().toISOString();
}

// ─── Backlog Operations ──────────────────────────────────────────────

export function createItem(params: {
  title: string;
  description: string;
  type: ItemType;
  priority: Priority;
  storyPoints?: number;
  acceptanceCriteria?: string[];
  tags?: string[];
}): BacklogItem {
  const item: BacklogItem = {
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

export function updateItem(id: string, updates: Partial<Omit<BacklogItem, 'id' | 'createdAt'>>): BacklogItem | null {
  const item = data.backlog.find((i) => i.id === id);
  if (!item) return null;
  Object.assign(item, updates, { updatedAt: now() });
  if (updates.status === 'done' && !item.completedAt) {
    item.completedAt = now();
  }
  save();
  return item;
}

export function getItem(id: string): BacklogItem | null {
  return data.backlog.find((i) => i.id === id) || null;
}

export function listItems(filters?: {
  status?: ItemStatus;
  type?: ItemType;
  priority?: Priority;
  sprintId?: string;
  tag?: string;
}): BacklogItem[] {
  let items = [...data.backlog];
  if (filters?.status) items = items.filter((i) => i.status === filters.status);
  if (filters?.type) items = items.filter((i) => i.type === filters.type);
  if (filters?.priority) items = items.filter((i) => i.priority === filters.priority);
  if (filters?.sprintId) items = items.filter((i) => i.sprintId === filters.sprintId);
  if (filters?.tag) items = items.filter((i) => i.tags?.includes(filters.tag!));
  return items;
}

export function deleteItem(id: string): boolean {
  const idx = data.backlog.findIndex((i) => i.id === id);
  if (idx === -1) return false;
  data.backlog.splice(idx, 1);
  // Also remove from sprints
  for (const sprint of data.sprints) {
    sprint.items = sprint.items.filter((sid) => sid !== id);
  }
  save();
  return true;
}

// ─── Sprint Operations ───────────────────────────────────────────────

export function createSprint(params: {
  name: string;
  goal: string;
  startDate?: string;
  endDate?: string;
}): Sprint {
  const sprint: Sprint = {
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

export function addToSprint(sprintId: string, itemId: string): boolean {
  const sprint = data.sprints.find((s) => s.id === sprintId);
  const item = data.backlog.find((i) => i.id === itemId);
  if (!sprint || !item) return false;
  if (!sprint.items.includes(itemId)) {
    sprint.items.push(itemId);
    item.sprintId = sprintId;
    item.status = 'planned';
    item.updatedAt = now();
    save();
  }
  return true;
}

export function updateSprint(id: string, updates: Partial<Omit<Sprint, 'id' | 'createdAt'>>): Sprint | null {
  const sprint = data.sprints.find((s) => s.id === id);
  if (!sprint) return null;
  Object.assign(sprint, updates);
  save();
  return sprint;
}

export function getSprint(id: string): Sprint | null {
  return data.sprints.find((s) => s.id === id) || null;
}

export function listSprints(): Sprint[] {
  return [...data.sprints];
}

export function getSprintBoard(sprintId: string): Record<ItemStatus, BacklogItem[]> {
  const board: Record<ItemStatus, BacklogItem[]> = {
    'backlog': [], 'planned': [], 'in-progress': [], 'review': [], 'done': [], 'cancelled': [],
  };
  const items = data.backlog.filter((i) => i.sprintId === sprintId);
  for (const item of items) {
    board[item.status].push(item);
  }
  return board;
}

// ─── Architecture Decisions ──────────────────────────────────────────

export function createDecision(params: {
  title: string;
  context: string;
  decision: string;
  consequences: string;
  alternatives?: string;
}): ArchitectureDecision {
  const adr: ArchitectureDecision = {
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

export function updateDecision(id: string, updates: Partial<Omit<ArchitectureDecision, 'id' | 'createdAt'>>): ArchitectureDecision | null {
  const adr = data.decisions.find((d) => d.id === id);
  if (!adr) return null;
  Object.assign(adr, updates, { updatedAt: now() });
  save();
  return adr;
}

export function listDecisions(): ArchitectureDecision[] {
  return [...data.decisions];
}

// ─── Roadmap ─────────────────────────────────────────────────────────

export function createMilestone(params: {
  name: string;
  description: string;
  targetDate?: string;
  featureIds?: string[];
}): RoadmapMilestone {
  const milestone: RoadmapMilestone = {
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

export function updateMilestone(id: string, updates: Partial<Omit<RoadmapMilestone, 'id' | 'createdAt'>>): RoadmapMilestone | null {
  const ms = data.roadmap.find((m) => m.id === id);
  if (!ms) return null;
  Object.assign(ms, updates);
  save();
  return ms;
}

export function listMilestones(): RoadmapMilestone[] {
  return [...data.roadmap];
}

// ─── Implementation Plans ────────────────────────────────────────────

export function createPlan(params: {
  storyId: string;
  title: string;
  approach: string;
  steps: { description: string; files: string[] }[];
  risks?: string;
  testStrategy?: string;
}): ImplementationPlan {
  const plan: ImplementationPlan = {
    id: genId('PLAN'),
    storyId: params.storyId,
    title: params.title,
    approach: params.approach,
    steps: params.steps.map((s) => ({ ...s, done: false })),
    risks: params.risks,
    testStrategy: params.testStrategy,
    createdAt: now(),
    updatedAt: now(),
  };
  data.plans.push(plan);
  save();
  return plan;
}

export function updatePlanStep(planId: string, stepIndex: number, done: boolean): ImplementationPlan | null {
  const plan = data.plans.find((p) => p.id === planId);
  if (!plan || stepIndex < 0 || stepIndex >= plan.steps.length) return null;
  plan.steps[stepIndex].done = done;
  plan.updatedAt = now();
  save();
  return plan;
}

export function getPlan(id: string): ImplementationPlan | null {
  return data.plans.find((p) => p.id === id) || null;
}

export function listPlans(storyId?: string): ImplementationPlan[] {
  if (storyId) return data.plans.filter((p) => p.storyId === storyId);
  return [...data.plans];
}

// ─── Dev Notes (Tech Debt, Security, Performance) ────────────────────

export function createDevNote(params: {
  category: DevNote['category'];
  title: string;
  description: string;
  severity: DevNote['severity'];
  affectedFiles?: string[];
}): DevNote {
  const note: DevNote = {
    id: genId('DEV'),
    category: params.category,
    title: params.title,
    description: params.description,
    severity: params.severity,
    affectedFiles: params.affectedFiles,
    status: 'open',
    createdAt: now(),
    updatedAt: now(),
  };
  data.devNotes.push(note);
  save();
  return note;
}

export function updateDevNote(id: string, updates: Partial<Omit<DevNote, 'id' | 'createdAt'>>): DevNote | null {
  const note = data.devNotes.find((n) => n.id === id);
  if (!note) return null;
  Object.assign(note, updates, { updatedAt: now() });
  if (updates.status === 'resolved' && !note.resolvedAt) {
    note.resolvedAt = now();
  }
  save();
  return note;
}

export function listDevNotes(filters?: {
  category?: DevNote['category'];
  severity?: DevNote['severity'];
  status?: DevNote['status'];
}): DevNote[] {
  let notes = [...data.devNotes];
  if (filters?.category) notes = notes.filter((n) => n.category === filters.category);
  if (filters?.severity) notes = notes.filter((n) => n.severity === filters.severity);
  if (filters?.status) notes = notes.filter((n) => n.status === filters.status);
  return notes;
}

// ─── Code Reviews ────────────────────────────────────────────────────

export function createCodeReview(params: {
  title: string;
  branch?: string;
  filesChanged: string[];
  summary: string;
  findings: CodeReview['findings'];
}): CodeReview {
  const review: CodeReview = {
    id: genId('CR'),
    title: params.title,
    branch: params.branch,
    filesChanged: params.filesChanged,
    summary: params.summary,
    findings: params.findings,
    status: 'pending',
    createdAt: now(),
  };
  data.codeReviews.push(review);
  save();
  return review;
}

export function updateCodeReview(id: string, status: CodeReview['status']): CodeReview | null {
  const review = data.codeReviews.find((r) => r.id === id);
  if (!review) return null;
  review.status = status;
  save();
  return review;
}

export function listCodeReviews(): CodeReview[] {
  return [...data.codeReviews];
}

// ─── Analytics ───────────────────────────────────────────────────────

export function getProjectStats(): {
  total: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
  velocity: number;
  completedThisWeek: number;
} {
  const total = data.backlog.length;
  const byStatus: Record<string, number> = {};
  const byType: Record<string, number> = {};
  const byPriority: Record<string, number> = {};

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

export function getData(): ProjectData {
  return data;
}
