interface FlowToolbarProps {
  flowName: string;
  onSave: () => void;
  onPublish: () => void;
  isSaving: boolean;
  isPublishing: boolean;
}

export function FlowToolbar({
  flowName,
  onSave,
  onPublish,
  isSaving,
  isPublishing,
}: FlowToolbarProps) {
  return (
    <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-2">
      <h2 className="text-lg font-semibold text-gray-900">{flowName}</h2>
      <div className="flex gap-2">
        <button
          onClick={onSave}
          disabled={isSaving}
          className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isSaving ? "Saving…" : "Save"}
        </button>
        <button
          onClick={onPublish}
          disabled={isPublishing}
          className="rounded-lg bg-green-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
        >
          {isPublishing ? "Publishing…" : "Publish"}
        </button>
      </div>
    </div>
  );
}
