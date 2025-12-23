-- Make refresh_token optional
ALTER TABLE mp_credentials ALTER COLUMN refresh_token DROP NOT NULL;
