-- Fix all active projects to use consistent whiteboard_url format
UPDATE vybepm_projects
SET whiteboard_url = 'http://localhost:5555/' || name
WHERE is_active = true AND name != 'Whiteboard';

-- Fix Whiteboard project itself (gallery root, not a slug path)
UPDATE vybepm_projects
SET whiteboard_url = 'http://localhost:5555'
WHERE name = 'Whiteboard';
