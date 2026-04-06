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
    description: 'YouTube keyword research and analytics dashboard',
    tech_stack: ['Next.js', 'TypeScript', 'Neon'],
    github_repo: '1000Problems/ytcombinator',
    deploy_url: 'https://ytcombinator.vercel.app',
    color: '#58a6ff',
  },
  {
    name: 'VybePM',
    display_name: 'VybePM',
    description: 'Task orchestration hub for 1000Problems',
    tech_stack: ['Next.js', 'TypeScript', 'Neon'],
    github_repo: '1000Problems/VybePM-v2',
    deploy_url: 'https://vybepm-v2.vercel.app',
    color: '#a371f7',
  },
  {
    name: 'Vybe',
    display_name: 'Vybe',
    description: 'iOS voice-to-task client — speak tasks into VybePM',
    tech_stack: ['Swift', 'SwiftUI', 'iOS 17'],
    github_repo: '1000Problems/Vybe',
    deploy_url: null,
    color: '#d2a8ff',
  },
  {
    name: 'GitMCP',
    display_name: 'GitMCP',
    description: 'Local MCP server for git + filesystem access',
    tech_stack: ['Node.js', 'TypeScript', 'MCP SDK'],
    github_repo: '1000Problems/GitMCP',
    deploy_url: null,
    color: '#f0883e',
  },
  {
    name: 'KitchenInventory',
    display_name: 'KitchenInventory',
    description: 'AI-powered kitchen inventory with voice input',
    tech_stack: ['Swift', 'SwiftUI', 'SwiftData'],
    github_repo: '1000Problems/KitchenInventory',
    deploy_url: null,
    color: '#3fb950',
  },
  {
    name: 'voiceq-api',
    display_name: 'VoiceQ API',
    description: 'Voice-activated task queue API',
    tech_stack: ['Next.js', 'TypeScript', 'Neon'],
    github_repo: '1000Problems/voiceq-api',
    deploy_url: 'https://voiceq-api.vercel.app',
    color: '#d29922',
  },
  {
    name: 'RubberJoints-iOS',
    display_name: 'RubberJoints iOS',
    description: 'iOS workout tracking client with AI coaching',
    tech_stack: ['Swift', 'SwiftUI', 'SwiftData'],
    github_repo: '1000Problems/RubberJoints-iOS',
    deploy_url: null,
    color: '#f85149',
  },
  {
    name: '1000Problems',
    display_name: '1000Problems Homepage',
    description: 'Portfolio homepage — project directory and landing page',
    tech_stack: ['Next.js', 'TypeScript', 'Vercel'],
    github_repo: 'esotopic/1000Problems',
    deploy_url: 'https://1000problems.com',
    color: '#e6edf3',
  },
  {
    name: 'Animation',
    display_name: 'Animation',
    description: 'PopiPlay creative assets — character art, voice recordings, video prototypes',
    tech_stack: ['HTML Canvas', 'CSS', 'Chatterbox TTS'],
    github_repo: null,
    deploy_url: null,
    color: '#ff7eb3',
  },
  {
    name: 'AnimationStudio',
    display_name: 'AnimationStudio',
    description: 'macOS video production app + asset pipeline for PopiPlay YouTube channel',
    tech_stack: ['Swift', 'SwiftUI', 'macOS', 'AVFoundation', 'Python'],
    github_repo: '1000Problems/AnimationStudio',
    deploy_url: null,
    color: '#ff9580',
  },
  {
    name: 'prompts',
    display_name: 'Prompts',
    description: 'Video generation requests and creative briefs',
    tech_stack: [],
    github_repo: null,
    deploy_url: null,
    color: '#e040fb',
  },
];

async function seed() {
  for (const p of projects) {
    await sql`
      INSERT INTO vybepm_projects (name, display_name, description, tech_stack, github_repo, deploy_url, color, sort_order)
      VALUES (${p.name}, ${p.display_name}, ${p.description}, ${p.tech_stack}, ${p.github_repo}, ${p.deploy_url}, ${p.color}, ${projects.indexOf(p)})
      ON CONFLICT (name) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        description = EXCLUDED.description,
        tech_stack = EXCLUDED.tech_stack,
        github_repo = EXCLUDED.github_repo,
        deploy_url = EXCLUDED.deploy_url,
        color = EXCLUDED.color,
        sort_order = EXCLUDED.sort_order
    `;
    console.log(`Seeded: ${p.name}`);
  }

  // Deactivate removed projects
  const activeNames = projects.map(p => p.name);
  await sql`UPDATE vybepm_projects SET is_active = false WHERE name NOT IN (${activeNames}) AND is_active = true`;

  console.log(`\nSeed complete — ${projects.length} projects`);
}

seed().catch((e) => {
  console.error('Seed failed:', e);
  process.exit(1);
});
