#!/usr/bin/env node
/**
 * BackerHub Developer & Product Owner MCP Server
 *
 * Developer-centric tools that actually interact with the codebase:
 *  - Code analysis: scan for patterns, find unused exports, check bundle size
 *  - Dependencies: audit, check outdated, analyze tree
 *  - Testing: run tests, coverage, lint
 *  - Build & Deploy: build project, check env config, verify deployability
 *  - Git: branch info, recent changes, changelog generation
 *  - Architecture: codebase stats, API route inventory, DB schema overview
 *  - Project tracking: backlog, sprints, ADRs (lightweight)
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { resolve } from 'node:path';
import { execSync } from 'node:child_process';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { initStore, createItem, updateItem, listItems, createDecision, createPlan, updatePlanStep, listPlans, createDevNote, updateDevNote, listDevNotes, createCodeReview, getProjectStats, getData, } from './store.js';
// ─── Initialize ──────────────────────────────────────────────────────
const PROJECT_ROOT = resolve(process.env.PROJECT_ROOT || process.cwd());
initStore(PROJECT_ROOT);
const server = new McpServer({
    name: 'backerhub-dev-owner',
    version: '2.0.0',
});
function fmt(obj) {
    return JSON.stringify(obj, null, 2);
}
function exec(cmd, opts) {
    try {
        return execSync(cmd, {
            cwd: opts?.cwd || PROJECT_ROOT,
            timeout: opts?.timeout || 30_000,
            encoding: 'utf-8',
            stdio: ['pipe', 'pipe', 'pipe'],
        }).trim();
    }
    catch (e) {
        return e.stdout?.trim() || e.stderr?.trim() || e.message;
    }
}
// ═══════════════════════════════════════════════════════════════════════
// DEVELOPER TOOLS - Code Analysis & Codebase
// ═══════════════════════════════════════════════════════════════════════
server.tool('codebase_overview', 'Get a high-level overview of the BackerHub codebase: file counts, directory structure, tech stack, lines of code.', {}, async () => {
    const pkgPath = resolve(PROJECT_ROOT, 'package.json');
    const pkg = existsSync(pkgPath) ? JSON.parse(readFileSync(pkgPath, 'utf-8')) : {};
    const deps = Object.keys(pkg.dependencies || {});
    const devDeps = Object.keys(pkg.devDependencies || {});
    // Count files by extension
    const fileCountCmd = `find src -type f | sed 's/.*\\.//' | sort | uniq -c | sort -rn | head -15`;
    const fileCounts = exec(fileCountCmd);
    // Lines of code
    const locCmd = `find src -name '*.ts' -o -name '*.tsx' | xargs wc -l 2>/dev/null | tail -1`;
    const loc = exec(locCmd);
    // Directory structure (top 2 levels of src)
    const treeCmd = `find src -maxdepth 2 -type d | sort`;
    const tree = exec(treeCmd);
    // API routes
    const apiCmd = `find src/app/api -name 'route.ts' 2>/dev/null | sort`;
    const apiRoutes = exec(apiCmd);
    // Components
    const compCmd = `find src/components -name '*.tsx' 2>/dev/null | wc -l`;
    const compCount = exec(compCmd);
    let output = `# BackerHub Codebase Overview\n\n`;
    output += `## Tech Stack\n`;
    output += `- Framework: Next.js (App Router)\n`;
    output += `- Language: TypeScript\n`;
    output += `- Dependencies: ${deps.length} production, ${devDeps.length} dev\n`;
    output += `- Components: ${compCount} .tsx files\n`;
    output += `- Total LoC: ${loc}\n\n`;
    output += `## Key Dependencies\n`;
    const keyDeps = deps.filter(d => !d.startsWith('@types')).slice(0, 20);
    output += keyDeps.map(d => `  - ${d}: ${pkg.dependencies[d]}`).join('\n') + '\n\n';
    output += `## File Types\n${fileCounts}\n\n`;
    output += `## Directory Structure\n${tree}\n\n`;
    output += `## API Routes (${apiRoutes.split('\n').filter(Boolean).length})\n${apiRoutes}\n`;
    return { content: [{ type: 'text', text: output }] };
});
server.tool('find_code', 'Search the codebase for a pattern using ripgrep. Find usages, definitions, imports, etc.', {
    pattern: z.string().describe('Regex pattern to search for'),
    fileGlob: z.string().optional().describe('File glob filter (e.g. "*.tsx", "*.ts", "route.ts")'),
    directory: z.string().optional().describe('Directory to search in (relative to project root, default: "src")'),
    contextLines: z.number().optional().describe('Number of context lines around each match (default: 2)'),
}, async ({ pattern, fileGlob, directory, contextLines }) => {
    const dir = directory || 'src';
    const ctx = contextLines ?? 2;
    let cmd = `rg --line-number --color=never -C ${ctx}`;
    if (fileGlob)
        cmd += ` -g '${fileGlob}'`;
    cmd += ` '${pattern.replace(/'/g, "\\'")}' ${dir}`;
    const result = exec(cmd, { timeout: 15_000 });
    if (!result)
        return { content: [{ type: 'text', text: `No matches found for "${pattern}"` }] };
    return { content: [{ type: 'text', text: result.substring(0, 8000) }] };
});
server.tool('list_api_routes', 'List all API routes with their HTTP methods and a brief description of what each does.', {}, async () => {
    const apiDir = resolve(PROJECT_ROOT, 'src/app/api');
    if (!existsSync(apiDir))
        return { content: [{ type: 'text', text: 'No API routes found.' }] };
    const routeFiles = exec(`find src/app/api -name 'route.ts' | sort`).split('\n').filter(Boolean);
    const routes = [];
    for (const file of routeFiles) {
        const fullPath = resolve(PROJECT_ROOT, file);
        const content = readFileSync(fullPath, 'utf-8');
        const methods = [];
        if (content.includes('export async function GET'))
            methods.push('GET');
        if (content.includes('export async function POST'))
            methods.push('POST');
        if (content.includes('export async function PUT'))
            methods.push('PUT');
        if (content.includes('export async function DELETE'))
            methods.push('DELETE');
        if (content.includes('export async function PATCH'))
            methods.push('PATCH');
        // Extract the route path from the file path
        const routePath = file
            .replace('src/app/api', '/api')
            .replace('/route.ts', '')
            .replace(/\[(\w+)\]/g, ':$1');
        routes.push(`${methods.join(',').padEnd(12)} ${routePath}`);
    }
    return { content: [{ type: 'text', text: `# API Routes (${routes.length})\n\n${routes.join('\n')}` }] };
});
server.tool('db_schema', 'Show the database schema from Supabase migrations — tables, columns, functions, indexes.', {
    migration: z.string().optional().describe('Specific migration file to read (e.g. "001"). If omitted, shows all.'),
}, async ({ migration }) => {
    const migDir = resolve(PROJECT_ROOT, 'supabase/migrations');
    if (!existsSync(migDir))
        return { content: [{ type: 'text', text: 'No migrations directory found.' }] };
    const files = readdirSync(migDir).filter(f => f.endsWith('.sql')).sort();
    if (migration) {
        const match = files.find(f => f.includes(migration));
        if (!match)
            return { content: [{ type: 'text', text: `Migration "${migration}" not found. Available: ${files.join(', ')}` }] };
        const content = readFileSync(resolve(migDir, match), 'utf-8');
        return { content: [{ type: 'text', text: `# ${match}\n\n\`\`\`sql\n${content}\n\`\`\`` }] };
    }
    // Show summary of all migrations
    let output = `# Database Migrations (${files.length})\n\n`;
    for (const file of files) {
        const content = readFileSync(resolve(migDir, file), 'utf-8');
        const tables = [...content.matchAll(/CREATE TABLE[^(]*?(\w+)\s*\(/gi)].map(m => m[1]);
        const alters = [...content.matchAll(/ALTER TABLE\s+(\w+)/gi)].map(m => m[1]);
        const functions = [...content.matchAll(/CREATE.*?FUNCTION\s+[\w.]*?(\w+)\s*\(/gi)].map(m => m[1]);
        output += `## ${file}\n`;
        if (tables.length)
            output += `  Tables: ${tables.join(', ')}\n`;
        if (alters.length)
            output += `  Alters: ${[...new Set(alters)].join(', ')}\n`;
        if (functions.length)
            output += `  Functions: ${functions.join(', ')}\n`;
        output += '\n';
    }
    return { content: [{ type: 'text', text: output }] };
});
server.tool('component_tree', 'Map out the component hierarchy and imports for a given component or page.', {
    path: z.string().describe('File path relative to project root (e.g. "src/app/[locale]/(app)/marketplace/page.tsx")'),
}, async ({ path }) => {
    const fullPath = resolve(PROJECT_ROOT, path);
    if (!existsSync(fullPath))
        return { content: [{ type: 'text', text: `File not found: ${path}` }] };
    const content = readFileSync(fullPath, 'utf-8');
    const imports = [...content.matchAll(/import\s+(?:{[^}]+}|\w+)?\s*(?:,\s*{[^}]+})?\s*from\s+['"]([^'"]+)['"]/g)];
    const localImports = imports.filter(m => m[1].startsWith('.') || m[1].startsWith('@/'));
    const externalImports = imports.filter(m => !m[1].startsWith('.') && !m[1].startsWith('@/'));
    // Find components used in JSX
    const jsxComponents = [...new Set([...content.matchAll(/<([A-Z]\w+)/g)].map(m => m[1]))];
    // Find hooks used
    const hooks = [...new Set([...content.matchAll(/\buse[A-Z]\w+/g)].map(m => m[0]))];
    let output = `# ${path}\n\n`;
    output += `## Local Imports (${localImports.length})\n`;
    for (const m of localImports)
        output += `  ${m[1]}\n`;
    output += `\n## External Imports (${externalImports.length})\n`;
    for (const m of externalImports)
        output += `  ${m[1]}\n`;
    output += `\n## Components Used (${jsxComponents.length})\n`;
    output += `  ${jsxComponents.join(', ')}\n`;
    output += `\n## Hooks Used (${hooks.length})\n`;
    output += `  ${hooks.join(', ')}\n`;
    return { content: [{ type: 'text', text: output }] };
});
// ═══════════════════════════════════════════════════════════════════════
// DEVELOPER TOOLS - Dependencies & Build
// ═══════════════════════════════════════════════════════════════════════
server.tool('check_deps', 'Check for outdated, vulnerable, or unused dependencies.', {
    check: z.enum(['outdated', 'audit', 'duplicates']).describe('What to check'),
}, async ({ check }) => {
    let result;
    switch (check) {
        case 'outdated':
            result = exec('npm outdated --json 2>/dev/null || true', { timeout: 60_000 });
            try {
                const parsed = JSON.parse(result);
                const entries = Object.entries(parsed).map(([name, info]) => `${name}: ${info.current} → ${info.wanted} (latest: ${info.latest})`);
                result = entries.length ? entries.join('\n') : 'All dependencies are up to date.';
            }
            catch { /* raw output is fine */ }
            break;
        case 'audit':
            result = exec('npm audit --json 2>/dev/null | head -100 || echo "Audit completed"', { timeout: 60_000 });
            break;
        case 'duplicates':
            result = exec('npm ls --all 2>/dev/null | grep "deduped" | sort -u | head -30 || echo "No duplicates"');
            break;
    }
    return { content: [{ type: 'text', text: `# Dependency Check: ${check}\n\n${result}` }] };
});
server.tool('run_build', 'Run the Next.js build and report any errors. Use to verify code compiles.', {
    typeCheckOnly: z.boolean().optional().describe('If true, only run TypeScript type checking (faster). Default: false.'),
}, async ({ typeCheckOnly }) => {
    const cmd = typeCheckOnly ? 'npx tsc --noEmit 2>&1' : 'npm run build 2>&1';
    const result = exec(cmd, { timeout: 120_000 });
    const hasErrors = result.includes('error TS') || result.includes('Error:') || result.includes('Failed');
    const status = hasErrors ? 'FAILED' : 'SUCCESS';
    return { content: [{ type: 'text', text: `# Build: ${status}\n\n${result.substring(0, 6000)}` }] };
});
server.tool('run_lint', 'Run ESLint on the project and report issues.', {
    fix: z.boolean().optional().describe('Auto-fix fixable issues. Default: false.'),
    path: z.string().optional().describe('Specific file/directory to lint (default: entire src/)'),
}, async ({ fix, path }) => {
    const target = path || 'src/';
    const fixFlag = fix ? ' --fix' : '';
    const result = exec(`npx eslint ${target}${fixFlag} 2>&1`, { timeout: 60_000 });
    return { content: [{ type: 'text', text: `# Lint Results\n\n${result || 'No issues found.'}` }] };
});
server.tool('bundle_analysis', 'Analyze the Next.js build output for bundle size and page sizes.', {}, async () => {
    // Check if .next exists
    const nextDir = resolve(PROJECT_ROOT, '.next');
    if (!existsSync(nextDir)) {
        return { content: [{ type: 'text', text: 'No .next build directory found. Run `run_build` first.' }] };
    }
    const result = exec(`find .next -name '*.js' -type f | xargs du -sh | sort -rh | head -20`);
    const pageResult = exec(`find .next/server/app -name '*.html' -o -name '*.rsc' 2>/dev/null | head -20`);
    let output = `# Bundle Analysis\n\n## Largest JS Bundles\n${result}\n`;
    if (pageResult)
        output += `\n## Server Pages\n${pageResult}\n`;
    return { content: [{ type: 'text', text: output }] };
});
server.tool('check_env', 'Check which environment variables are configured vs. required. Detect missing config.', {}, async () => {
    // Read .env.local
    const envPath = resolve(PROJECT_ROOT, '.env.local');
    const envExamplePath = resolve(PROJECT_ROOT, '.env.example');
    const envVars = {};
    if (existsSync(envPath)) {
        readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
            const match = line.match(/^([A-Z_]+)=(.*)/);
            if (match)
                envVars[match[1]] = match[2] ? 'SET' : 'EMPTY';
        });
    }
    const exampleVars = [];
    if (existsSync(envExamplePath)) {
        readFileSync(envExamplePath, 'utf-8').split('\n').forEach(line => {
            const match = line.match(/^([A-Z_]+)=/);
            if (match)
                exampleVars.push(match[1]);
        });
    }
    // Scan code for env var references
    const usedInCode = exec(`rg 'process\\.env\\.(\\w+)' src/ -o --no-filename 2>/dev/null | sort -u`);
    const usedVars = usedInCode.split('\n')
        .filter(Boolean)
        .map(l => l.replace('process.env.', ''));
    let output = '# Environment Variables\n\n';
    output += '## Currently Set (.env.local)\n';
    for (const [key, status] of Object.entries(envVars)) {
        output += `  ${status === 'SET' ? '[OK]' : '[!!]'} ${key}\n`;
    }
    output += '\n## Required (.env.example)\n';
    for (const key of exampleVars) {
        const status = envVars[key] === 'SET' ? 'configured' : 'MISSING';
        output += `  ${status === 'configured' ? '[OK]' : '[!!]'} ${key} — ${status}\n`;
    }
    output += '\n## Referenced in Code\n';
    for (const v of usedVars) {
        const status = envVars[v] ? 'configured' : 'NOT SET';
        output += `  ${envVars[v] ? '[OK]' : '[!!]'} ${v} — ${status}\n`;
    }
    return { content: [{ type: 'text', text: output }] };
});
// ═══════════════════════════════════════════════════════════════════════
// DEVELOPER TOOLS - Git & Version Control
// ═══════════════════════════════════════════════════════════════════════
server.tool('git_status', 'Show current git status: branch, uncommitted changes, recent commits.', {}, async () => {
    const branch = exec('git branch --show-current');
    const status = exec('git status --short');
    const log = exec('git log --oneline -15');
    const remoteStatus = exec('git status -sb | head -1');
    let output = `# Git Status\n\n`;
    output += `Branch: ${branch}\n`;
    output += `Remote: ${remoteStatus}\n\n`;
    output += `## Uncommitted Changes\n${status || '(clean)'}\n\n`;
    output += `## Recent Commits\n${log}\n`;
    return { content: [{ type: 'text', text: output }] };
});
server.tool('git_diff', 'Show git diff for staged, unstaged, or between branches.', {
    target: z.enum(['staged', 'unstaged', 'branch']).describe('What to diff'),
    branch: z.string().optional().describe('Branch to compare against (for "branch" target, default: main)'),
    file: z.string().optional().describe('Specific file to diff'),
}, async ({ target, branch, file }) => {
    let cmd;
    switch (target) {
        case 'staged':
            cmd = 'git diff --cached --stat';
            break;
        case 'unstaged':
            cmd = 'git diff --stat';
            break;
        case 'branch':
            cmd = `git diff ${branch || 'main'}...HEAD --stat`;
            break;
    }
    if (file)
        cmd = cmd.replace('--stat', '') + ` -- ${file}`;
    const result = exec(cmd);
    return { content: [{ type: 'text', text: `# Git Diff (${target})\n\n${result || '(no changes)'}` }] };
});
server.tool('generate_changelog', 'Generate a changelog from git commits between two refs.', {
    from: z.string().optional().describe('Starting ref (default: last tag or first commit)'),
    to: z.string().optional().describe('Ending ref (default: HEAD)'),
}, async ({ from, to }) => {
    const fromRef = from || exec('git describe --tags --abbrev=0 2>/dev/null') || exec('git rev-list --max-parents=0 HEAD');
    const toRef = to || 'HEAD';
    const log = exec(`git log ${fromRef}..${toRef} --oneline --no-merges`);
    if (!log)
        return { content: [{ type: 'text', text: 'No commits found in range.' }] };
    const lines = log.split('\n').filter(Boolean);
    const features = [];
    const fixes = [];
    const other = [];
    for (const line of lines) {
        const msg = line.substring(line.indexOf(' ') + 1);
        if (/^(feat|add|implement|create|build|integrate)/i.test(msg))
            features.push(msg);
        else if (/^(fix|bug|patch|resolve|correct)/i.test(msg))
            fixes.push(msg);
        else
            other.push(msg);
    }
    let output = `# Changelog (${fromRef}..${toRef})\n\n`;
    if (features.length) {
        output += `## Features\n${features.map(f => `- ${f}`).join('\n')}\n\n`;
    }
    if (fixes.length) {
        output += `## Bug Fixes\n${fixes.map(f => `- ${f}`).join('\n')}\n\n`;
    }
    if (other.length) {
        output += `## Other Changes\n${other.map(f => `- ${f}`).join('\n')}\n\n`;
    }
    return { content: [{ type: 'text', text: output }] };
});
// ═══════════════════════════════════════════════════════════════════════
// DEVELOPER TOOLS - Implementation & Code Quality
// ═══════════════════════════════════════════════════════════════════════
server.tool('create_impl_plan', 'Create a detailed implementation plan for a feature — files to change, steps, risks, test strategy.', {
    storyId: z.string().optional().describe('Link to a backlog story ID'),
    title: z.string().describe('What is being implemented'),
    approach: z.string().describe('Technical approach and architecture'),
    steps: z.array(z.object({
        description: z.string(),
        files: z.array(z.string()).describe('Files to create or modify'),
    })).describe('Ordered implementation steps'),
    risks: z.string().optional().describe('Known risks or gotchas'),
    testStrategy: z.string().optional().describe('How to test this implementation'),
}, async (params) => {
    const plan = createPlan({ ...params, storyId: params.storyId || 'none' });
    return { content: [{ type: 'text', text: `Created plan ${plan.id}: "${plan.title}"\n\n${fmt(plan)}` }] };
});
server.tool('update_plan_step', 'Mark an implementation plan step as done.', {
    planId: z.string(),
    stepIndex: z.number().describe('0-based step index'),
    done: z.boolean(),
}, async ({ planId, stepIndex, done }) => {
    const plan = updatePlanStep(planId, stepIndex, done);
    if (!plan)
        return { content: [{ type: 'text', text: 'Plan or step not found.' }] };
    const progress = plan.steps.filter(s => s.done).length;
    return { content: [{ type: 'text', text: `Step ${stepIndex} marked ${done ? 'done' : 'not done'}. Progress: ${progress}/${plan.steps.length}` }] };
});
server.tool('list_plans', 'List all implementation plans.', { storyId: z.string().optional() }, async ({ storyId }) => {
    const plans = listPlans(storyId);
    if (!plans.length)
        return { content: [{ type: 'text', text: 'No implementation plans yet.' }] };
    const summary = plans.map(p => {
        const done = p.steps.filter(s => s.done).length;
        return `[${p.id}] ${p.title} (${done}/${p.steps.length} steps done)`;
    }).join('\n');
    return { content: [{ type: 'text', text: summary }] };
});
server.tool('track_issue', 'Track a dev issue: tech debt, security concern, performance problem, dependency risk, etc.', {
    category: z.enum(['tech-debt', 'performance', 'security', 'dependency', 'refactor', 'testing', 'devops']),
    title: z.string(),
    description: z.string(),
    severity: z.enum(['critical', 'high', 'medium', 'low']),
    affectedFiles: z.array(z.string()).optional(),
}, async (params) => {
    const note = createDevNote(params);
    return { content: [{ type: 'text', text: `Tracked ${note.category} issue ${note.id}: "${note.title}"\n\n${fmt(note)}` }] };
});
server.tool('resolve_issue', 'Mark a tracked dev issue as resolved with a resolution note.', {
    id: z.string(),
    resolution: z.string().describe('How was this resolved?'),
}, async ({ id, resolution }) => {
    const note = updateDevNote(id, { status: 'resolved', resolution });
    if (!note)
        return { content: [{ type: 'text', text: `Issue ${id} not found.` }] };
    return { content: [{ type: 'text', text: `Resolved ${note.id}: ${note.title}` }] };
});
server.tool('list_issues', 'List tracked dev issues filtered by category, severity, or status.', {
    category: z.enum(['tech-debt', 'performance', 'security', 'dependency', 'refactor', 'testing', 'devops']).optional(),
    severity: z.enum(['critical', 'high', 'medium', 'low']).optional(),
    status: z.enum(['open', 'in-progress', 'resolved']).optional(),
}, async (filters) => {
    const hasFilters = Object.values(filters).some(v => v !== undefined);
    const notes = listDevNotes(hasFilters ? filters : undefined);
    if (!notes.length)
        return { content: [{ type: 'text', text: 'No issues found.' }] };
    const summary = notes.map(n => `[${n.id}] ${n.severity.toUpperCase().padEnd(8)} ${n.status.padEnd(12)} ${n.category.padEnd(12)} ${n.title}`).join('\n');
    return { content: [{ type: 'text', text: `${notes.length} issues:\n\n${summary}` }] };
});
server.tool('code_review', 'Create a structured code review with findings categorized by type and severity.', {
    title: z.string(),
    branch: z.string().optional(),
    filesChanged: z.array(z.string()),
    summary: z.string(),
    findings: z.array(z.object({
        type: z.enum(['bug', 'security', 'performance', 'style', 'suggestion']),
        severity: z.enum(['critical', 'high', 'medium', 'low']),
        file: z.string(),
        description: z.string(),
    })),
}, async (params) => {
    const review = createCodeReview(params);
    let output = `# Code Review ${review.id}: ${review.title}\n`;
    output += `Files: ${review.filesChanged.length} | Findings: ${review.findings.length}\n\n`;
    for (const f of review.findings) {
        output += `  [${f.severity.toUpperCase()}] ${f.type} in ${f.file}: ${f.description}\n`;
    }
    return { content: [{ type: 'text', text: output }] };
});
// ═══════════════════════════════════════════════════════════════════════
// PRODUCT OWNER TOOLS (kept lightweight)
// ═══════════════════════════════════════════════════════════════════════
server.tool('create_story', 'Create a backlog item (feature, bug, tech-debt, improvement, research).', {
    title: z.string(),
    description: z.string(),
    type: z.enum(['feature', 'bug', 'tech-debt', 'improvement', 'research']),
    priority: z.enum(['critical', 'high', 'medium', 'low']),
    storyPoints: z.number().optional(),
    acceptanceCriteria: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
}, async (params) => {
    const item = createItem(params);
    return { content: [{ type: 'text', text: `Created ${item.id}: "${item.title}"\n\n${fmt(item)}` }] };
});
server.tool('update_story', 'Update a backlog item.', {
    id: z.string(),
    status: z.enum(['backlog', 'planned', 'in-progress', 'review', 'done', 'cancelled']).optional(),
    priority: z.enum(['critical', 'high', 'medium', 'low']).optional(),
    notes: z.string().optional(),
}, async ({ id, ...updates }) => {
    const item = updateItem(id, updates);
    if (!item)
        return { content: [{ type: 'text', text: `${id} not found.` }] };
    return { content: [{ type: 'text', text: `Updated ${item.id}: ${item.status} ${item.priority}` }] };
});
server.tool('list_backlog', 'List backlog items with optional filters.', {
    status: z.enum(['backlog', 'planned', 'in-progress', 'review', 'done', 'cancelled']).optional(),
    type: z.enum(['feature', 'bug', 'tech-debt', 'improvement', 'research']).optional(),
    priority: z.enum(['critical', 'high', 'medium', 'low']).optional(),
}, async (filters) => {
    const hasFilters = Object.values(filters).some(v => v !== undefined);
    const items = listItems(hasFilters ? filters : undefined);
    if (!items.length)
        return { content: [{ type: 'text', text: 'Backlog empty.' }] };
    const summary = items.map(i => `[${i.id}] ${i.priority.toUpperCase().padEnd(8)} ${i.status.padEnd(12)} ${i.title}`).join('\n');
    return { content: [{ type: 'text', text: `${items.length} items:\n${summary}` }] };
});
server.tool('create_adr', 'Record an Architecture Decision Record.', {
    title: z.string(),
    context: z.string(),
    decision: z.string(),
    consequences: z.string(),
    alternatives: z.string().optional(),
}, async (params) => {
    const adr = createDecision(params);
    return { content: [{ type: 'text', text: `ADR ${adr.id}: "${adr.title}"\n\n${fmt(adr)}` }] };
});
server.tool('project_stats', 'Get project analytics overview.', {}, async () => {
    const stats = getProjectStats();
    const d = getData();
    const issues = listDevNotes({ status: 'open' });
    const criticalIssues = issues.filter(i => i.severity === 'critical');
    let output = `# Project Dashboard\n\n`;
    output += `Backlog: ${stats.total} items | Velocity: ${stats.velocity} pts/week\n`;
    output += `Open Issues: ${issues.length} (${criticalIssues.length} critical)\n`;
    output += `ADRs: ${d.decisions.length} | Plans: ${d.plans.length}\n\n`;
    if (stats.total > 0) {
        output += `## By Status\n`;
        for (const [s, c] of Object.entries(stats.byStatus))
            output += `  ${s}: ${c}\n`;
    }
    return { content: [{ type: 'text', text: output }] };
});
// ─── Start Server ────────────────────────────────────────────────────
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('BackerHub Dev & Product Owner MCP v2.0 running on stdio');
}
main().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
});
