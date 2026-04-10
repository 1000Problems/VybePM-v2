-- Add whiteboard_url column to projects table
ALTER TABLE vybepm_projects ADD COLUMN IF NOT EXISTS whiteboard_url VARCHAR(500);

-- Seed whiteboard URLs for existing active projects
UPDATE vybepm_projects SET whiteboard_url = 'http://localhost:5555/' || name WHERE is_active = true AND name != 'voiceq-api';

-- Insert Whiteboard project
INSERT INTO vybepm_projects (name, display_name, description, tech_stack, github_repo, deploy_url, color, whiteboard_url, is_active)
VALUES ('Whiteboard', 'Whiteboard', 'Visual design notebook for the 1000Problems portfolio',
        '{"Vite", "React", "TypeScript", "Express", "Tailwind"}',
        '1000Problems/Whiteboard', 'http://localhost:5555', '#79c0ff',
        'http://localhost:5555/_shared', true)
ON CONFLICT (name) DO NOTHING;
