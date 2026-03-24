-- Guarded: in some migration histories this column is added in a later migration.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'WorkflowRule'
      AND column_name = 'flowDefinition'
  ) THEN
    ALTER TABLE "WorkflowRule" ALTER COLUMN "flowDefinition" DROP DEFAULT;
  END IF;
END $$;
