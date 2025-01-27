CREATE TABLE IF NOT EXISTS conditions (
    id TEXT,
    system TEXT,
    name TEXT,
);

CREATE INDEX IF NOT EXISTS "idx_conditions_id" ON conditions(id);
