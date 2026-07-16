import Image from "next/image";
import { User } from "lucide-react";
import { PROFILE_IMAGE_BASE } from "@/lib/constants";
import type { CastMember } from "@/lib/types";

export default function CastCard({ member }: { member: CastMember }) {
  return (
    <div className="w-24 shrink-0 text-center sm:w-28">
      <div className="relative aspect-square w-full overflow-hidden rounded-full bg-surface2">
        {member.profile_path ? (
          <Image
            src={`${PROFILE_IMAGE_BASE}${member.profile_path}`}
            alt={member.name}
            fill
            sizes="112px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted">
            <User className="h-8 w-8" strokeWidth={1.5} />
          </div>
        )}
      </div>
      <p className="mt-2 line-clamp-1 text-body-sm font-medium text-ink">{member.name}</p>
      {member.character && (
        <p className="line-clamp-1 text-caption text-muted">{member.character}</p>
      )}
    </div>
  );
}
