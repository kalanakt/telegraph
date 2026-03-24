ALTER TABLE "WorkflowRule"
ADD COLUMN "flowDefinition" JSONB NOT NULL DEFAULT '{"nodes":[{"id":"start_1","type":"start","position":{"x":0,"y":0},"data":{}}],"edges":[]}'::jsonb;
