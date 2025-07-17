-- Migration: Add Quality Checkpoints table for Enhanced Traceability
-- Run this after init.sql

CREATE TABLE Quality_Checkpoints (
    checkpoint_id SERIAL PRIMARY KEY,
    inventory_id INT REFERENCES Inventory(inventory_id) ON DELETE CASCADE,
    checkpoint_type VARCHAR(50) NOT NULL CHECK (checkpoint_type IN ('HARVEST', 'PROCESSING', 'STORAGE', 'TRANSPORT', 'DELIVERY')),
    checkpoint_name VARCHAR(255) NOT NULL,
    checkpoint_date DATE NOT NULL,
    quality_score NUMERIC(5,2) CHECK (quality_score >= 0 AND quality_score <= 100),
    status VARCHAR(20) NOT NULL CHECK (status IN ('PASSED', 'FAILED', 'PENDING')),
    test_results JSONB,
    defects_found TEXT[],
    recommendations TEXT,
    notes TEXT,
    inspector_id INT REFERENCES Users(user_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE
);

-- Add indexes for better performance
CREATE INDEX idx_quality_checkpoints_inventory_id ON Quality_Checkpoints(inventory_id);
CREATE INDEX idx_quality_checkpoints_date ON Quality_Checkpoints(checkpoint_date);
CREATE INDEX idx_quality_checkpoints_status ON Quality_Checkpoints(status);
CREATE INDEX idx_quality_checkpoints_type ON Quality_Checkpoints(checkpoint_type);

-- Add some sample quality checkpoints data for testing
INSERT INTO Quality_Checkpoints (
    inventory_id, checkpoint_type, checkpoint_name, checkpoint_date,
    quality_score, status, test_results, defects_found, recommendations, notes, inspector_id
) VALUES 
(1, 'HARVEST', 'Farm Quality Control', '2024-01-15', 95.5, 'PASSED', 
 '{"moisture_content": 12.5, "bean_size": "grade_1", "defects": 2}', 
 ARRAY['minor discoloration'], 'Continue current practices', 'Excellent quality harvest', 1),
(1, 'PROCESSING', 'Cherry Processing QC', '2024-01-16', 92.0, 'PASSED',
 '{"processing_time": 24, "fermentation_ph": 4.2, "temperature": 28}',
 ARRAY[]::TEXT[], 'Monitor fermentation closely', 'Good processing standards', 1),
(2, 'HARVEST', 'Field Inspection', '2024-01-20', 88.5, 'PASSED',
 '{"moisture_content": 13.2, "bean_size": "grade_2", "defects": 5}',
 ARRAY['some cracked beans'], 'Improve drying process', 'Acceptable quality', 1),
(2, 'STORAGE', 'Warehouse Storage Check', '2024-01-25', 85.0, 'PASSED',
 '{"humidity": 60, "temperature": 22, "pest_control": "clear"}',
 ARRAY[]::TEXT[], 'Maintain storage conditions', 'Storage conditions good', 1);

-- Add audit trigger for quality checkpoints
CREATE OR REPLACE FUNCTION audit_quality_checkpoints()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO Audit_Log (table_name, record_id, action, new_values, user_id)
        VALUES ('Quality_Checkpoints', NEW.checkpoint_id, 'CREATE', row_to_json(NEW), NEW.inspector_id);
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO Audit_Log (table_name, record_id, action, old_values, new_values, user_id)
        VALUES ('Quality_Checkpoints', NEW.checkpoint_id, 'UPDATE', row_to_json(OLD), row_to_json(NEW), NEW.inspector_id);
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO Audit_Log (table_name, record_id, action, old_values, user_id)
        VALUES ('Quality_Checkpoints', OLD.checkpoint_id, 'DELETE', row_to_json(OLD), OLD.inspector_id);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER quality_checkpoints_audit
    AFTER INSERT OR UPDATE OR DELETE ON Quality_Checkpoints
    FOR EACH ROW EXECUTE FUNCTION audit_quality_checkpoints();