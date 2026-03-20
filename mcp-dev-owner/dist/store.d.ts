/**
 * Persistent JSON file-based storage for the MCP server.
 * Stores backlog items, sprints, architecture decisions, and roadmap.
 */
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
    items: string[];
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
    features: string[];
    createdAt: string;
}
export interface ProjectData {
    projectName: string;
    version: string;
    backlog: BacklogItem[];
    sprints: Sprint[];
    decisions: ArchitectureDecision[];
    roadmap: RoadmapMilestone[];
    nextId: number;
}
export declare function initStore(projectRoot: string): void;
export declare function createItem(params: {
    title: string;
    description: string;
    type: ItemType;
    priority: Priority;
    storyPoints?: number;
    acceptanceCriteria?: string[];
    tags?: string[];
}): BacklogItem;
export declare function updateItem(id: string, updates: Partial<Omit<BacklogItem, 'id' | 'createdAt'>>): BacklogItem | null;
export declare function getItem(id: string): BacklogItem | null;
export declare function listItems(filters?: {
    status?: ItemStatus;
    type?: ItemType;
    priority?: Priority;
    sprintId?: string;
    tag?: string;
}): BacklogItem[];
export declare function deleteItem(id: string): boolean;
export declare function createSprint(params: {
    name: string;
    goal: string;
    startDate?: string;
    endDate?: string;
}): Sprint;
export declare function addToSprint(sprintId: string, itemId: string): boolean;
export declare function updateSprint(id: string, updates: Partial<Omit<Sprint, 'id' | 'createdAt'>>): Sprint | null;
export declare function getSprint(id: string): Sprint | null;
export declare function listSprints(): Sprint[];
export declare function getSprintBoard(sprintId: string): Record<ItemStatus, BacklogItem[]>;
export declare function createDecision(params: {
    title: string;
    context: string;
    decision: string;
    consequences: string;
    alternatives?: string;
}): ArchitectureDecision;
export declare function updateDecision(id: string, updates: Partial<Omit<ArchitectureDecision, 'id' | 'createdAt'>>): ArchitectureDecision | null;
export declare function listDecisions(): ArchitectureDecision[];
export declare function createMilestone(params: {
    name: string;
    description: string;
    targetDate?: string;
    featureIds?: string[];
}): RoadmapMilestone;
export declare function updateMilestone(id: string, updates: Partial<Omit<RoadmapMilestone, 'id' | 'createdAt'>>): RoadmapMilestone | null;
export declare function listMilestones(): RoadmapMilestone[];
export declare function getProjectStats(): {
    total: number;
    byStatus: Record<string, number>;
    byType: Record<string, number>;
    byPriority: Record<string, number>;
    velocity: number;
    completedThisWeek: number;
};
export declare function getData(): ProjectData;
