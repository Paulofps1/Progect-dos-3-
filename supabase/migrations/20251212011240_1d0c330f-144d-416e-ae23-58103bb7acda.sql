-- Add debug columns to hubla_webhook_logs
ALTER TABLE hubla_webhook_logs 
ADD COLUMN IF NOT EXISTS request_headers JSONB,
ADD COLUMN IF NOT EXISTS request_method TEXT,
ADD COLUMN IF NOT EXISTS request_ip TEXT,
ADD COLUMN IF NOT EXISTS token_validation TEXT,
ADD COLUMN IF NOT EXISTS processing_steps JSONB,
ADD COLUMN IF NOT EXISTS error_details TEXT;