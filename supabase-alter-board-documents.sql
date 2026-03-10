-- Add document_type column to board_documents
ALTER TABLE board_documents
ADD COLUMN IF NOT EXISTS document_type text NOT NULL DEFAULT 'minutes';

-- Add check constraint for valid types
ALTER TABLE board_documents
ADD CONSTRAINT board_documents_type_check
CHECK (document_type IN ('agenda', 'minutes', 'resolution', 'board_packet'));
