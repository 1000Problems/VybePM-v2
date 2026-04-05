import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

const projects = [
  {
    name: 'ytcombinator',
    display_name: 'YTCombinator',
    description: 'YouTube keyword research dashboard',
    tech_stack: ['Next.js', 'TypeScript', 'Neon'],
    github_repo: '1000Problems/ytcombinator',
    color: '#58a6ff',
  },
  {
    name: 'KitchenInventory',
    display_name: 'KitchenInventory',
    description: 'AI-powered kitchen inventory with voice input',
    tech_stack: ['Swift', 'SwiftUI', 'SwiftData'],
    github_repo: '1000Problems/KitchenInventory',
    color: '#3fb950',
  },
  {
    name: 'voiceq-api',
    display_name: 'VoiceQ API',
    description: 'Voice-activated task queue API',
    tech_stack: ['Next.js', 'TypeScript', 'Neon'],
    github_repo: '1000Problems/voiceq-api',
    color: '#d29922',
  },
  {
    name: 'GitMCP',
    display_name: 'GitMCP',
    description: 'Local MCP server for native git access',
    tech_stack: ['Node.js', 'TypeScript', 'MCP'],
    github_repo: '1000Problems/GitMCP',
    color: '#f0883e',
  },
  {
    name: 'VybePM',
    display_name: 'VybePM',
    description: 'Task orchestration hub',
    tech_stack: ['Next.js', 'TypeScript', 'Neon'],
    github_repo: '1000Problems/VybePM-v2',
    color: '#a371f7',
  },
  {
    name: 'RubberJoints-iOS',
    display_name: 'RubberJoints iOS',
    description: 'RubberJoints iOS client',
    tech_stack: ['Swift', 'iOS'],
    github_repo: '1000Problems/RubberJoints-iOS',
    color: '#f85149',
  },
  {
    name: 'prompts',
    display_name: 'Prompts',
    description: 'Video generation requests',
    tech_stack: [],
    github_repo: null,
    color: '#e040fb',
  },
];

async function seed() {
  for (const p of projects) {
    await sql`
      INSERT INTO vybepm_projects (name, display_name, description, tech_stack, github_repo, color, sort_order)
      VALUES (${p.name}, ${p.display_name}, ${p.description}, ${p.tech_stack}, ${p.github_repo}, ${p.color}, ${projects.indexOf(p)})
      ON CONFLICT (name) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        description = EXCLUDED.description,
        tech_stack = EXCLUDED.tech_stack,
        github_repo = EXCLUDED.github_repo,
        color = EXCLUDED.color
    `;
    console.log(`Seeded: ${p.name}`);
  }
  console.log('Seed complete');
}

seed().catch((e) => {
  console.error('Seed failed:', e);
  process.exit(1);
});
