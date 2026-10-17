-- Remover tabelas relacionadas à Hubla
DROP TABLE IF EXISTS hubla_webhook_logs CASCADE;
DROP TABLE IF EXISTS webhook_logs CASCADE;

-- Remover colunas relacionadas à Hubla da tabela profiles
ALTER TABLE profiles DROP COLUMN IF EXISTS hubla_transaction_id;
ALTER TABLE profiles DROP COLUMN IF EXISTS purchased_via_hubla;