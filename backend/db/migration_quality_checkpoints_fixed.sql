-- Migration: Add Quality Checkpoints table with proper naming convention
-- Run this after init.sql

CREATE TABLE quality_checkpoints (
    checkpoint_id SERIAL PRIMARY KEY,
    inventory_id INT REFERENCES inventory(inventory_id) ON DELETE CASCADE,
    checkpoint_type VARCHAR(50) NOT NULL CHECK (checkpoint_type IN ('HARVEST', 'PROCESSING', 'STORAGE', 'TRANSPORT', 'DELIVERY')),
    checkpoint_name VARCHAR(255) NOT NULL,
    checkpoint_date DATE NOT NULL,
    quality_score NUMERIC(5,2) CHECK (quality_score >= 0 AND quality_score <= 100),
    status VARCHAR(20) NOT NULL CHECK (status IN ('PASSED', 'FAILED', 'PENDING')),
    test_results JSONB,
    defects_found TEXT[],
    recommendations TEXT,
    notes TEXT,
    inspector_id INT REFERENCES users(user_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE
);

-- Add indexes for better performance
CREATE INDEX idx_quality_checkpoints_inventory_id ON quality_checkpoints(inventory_id);
CREATE INDEX idx_quality_checkpoints_date ON quality_checkpoints(checkpoint_date);
CREATE INDEX idx_quality_checkpoints_status ON quality_checkpoints(status);
CREATE INDEX idx_quality_checkpoints_type ON quality_checkpoints(checkpoint_type);

-- Add audit trigger for quality checkpoints
CREATE OR REPLACE FUNCTION audit_quality_checkpoints()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_log (table_name, record_id, action, new_values, user_id)
        VALUES ('quality_checkpoints', NEW.checkpoint_id, 'CREATE', row_to_json(NEW), NEW.inspector_id);
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_log (table_name, record_id, action, old_values, new_values, user_id)
        VALUES ('quality_checkpoints', NEW.checkpoint_id, 'UPDATE', row_to_json(OLD), row_to_json(NEW), NEW.inspector_id);
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_log (table_name, record_id, action, old_values, user_id)
        VALUES ('quality_checkpoints', OLD.checkpoint_id, 'DELETE', row_to_json(OLD), OLD.inspector_id);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER quality_checkpoints_audit
    AFTER INSERT OR UPDATE OR DELETE ON quality_checkpoints
    FOR EACH ROW EXECUTE FUNCTION audit_quality_checkpoints();