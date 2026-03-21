-- Add ON DELETE CASCADE for published_plans → flows
ALTER TABLE published_plans DROP CONSTRAINT IF EXISTS published_plans_flow_id_flows_id_fk;
ALTER TABLE published_plans ADD CONSTRAINT published_plans_flow_id_flows_id_fk 
  FOREIGN KEY (flow_id) REFERENCES flows(id) ON DELETE CASCADE;

-- Add ON DELETE CASCADE for flows → bots  
ALTER TABLE flows DROP CONSTRAINT IF EXISTS flows_bot_id_bots_id_fk;
ALTER TABLE flows ADD CONSTRAINT flows_bot_id_bots_id_fk
  FOREIGN KEY (bot_id) REFERENCES bots(id) ON DELETE CASCADE;

-- Add ON DELETE RESTRICT for bots → tenants (prevent accidental tenant deletion)
ALTER TABLE bots DROP CONSTRAINT IF EXISTS bots_tenant_id_tenants_id_fk;
ALTER TABLE bots ADD CONSTRAINT bots_tenant_id_tenants_id_fk
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE RESTRICT;

-- Unique constraint on published_plans(flow_id, version)
ALTER TABLE published_plans ADD CONSTRAINT published_plans_flow_version_unique 
  UNIQUE (flow_id, version);

-- Auto-update updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bots_updated_at BEFORE UPDATE ON bots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_flows_updated_at BEFORE UPDATE ON flows
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
