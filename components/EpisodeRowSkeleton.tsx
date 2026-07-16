/** A single skeleton row, shaped like a real episode <li>, shown while a season's episodes are loading. */
export default function EpisodeRowSkeleton() {
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <div className="h-14 w-24 shrink-0 animate-pulse rounded-sm bg-surface2" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="h-3 w-20 animate-pulse rounded bg-surface2" />
        <div className="h-4 w-3/4 animate-pulse rounded bg-surface2" />
      </div>
      <div className="h-7 w-7 shrink-0 animate-pulse rounded-full bg-surface2" />
    </li>
  );
}
