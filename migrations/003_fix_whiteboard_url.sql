-- Fix Whiteboard project's own whiteboard_url
-- The previous migration set it to /localhost:5555/_shared, but the
-- Whiteboard project itself should link to the gallery root.
UPDATE vybepm_projects
SET whiteboard_url = 'http://localhost:5555'
WHERE name = 'Whiteboard';
