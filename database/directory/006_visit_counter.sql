-- Aggregate visits to Directorio Sarchí. No IP addresses or personal data stored.
CREATE TABLE IF NOT EXISTS directory.visit_counter (
    id integer PRIMARY KEY CHECK (id = 1),
    total_visits bigint NOT NULL DEFAULT 0 CHECK (total_visits >= 0)
);
INSERT INTO directory.visit_counter (id, total_visits)
VALUES (1, 0) ON CONFLICT (id) DO NOTHING;
