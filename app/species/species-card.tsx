"use client";

import type { Database } from "@/lib/schema";
import Image from "next/image";
import CommentsDialog from "./comments-dialog";
import LearnMoreDialog from "./learn-more-dialog";
import EditSpeciesDialog from "./edit-species-dialog";
type Species = Database["public"]["Tables"]["species"]["Row"];

export default function SpeciesCard({ species, currentUserId }: { species: Species; currentUserId: string }) {
  // Only the person who created a species should see its edit controls.
  const canEdit = species.author === currentUserId;

  return (
    <div className="m-4 w-72 min-w-72 flex-none rounded border-2 p-3 shadow">
      {species.image && (
        <div className="relative h-40 w-full">
          <Image src={species.image} alt={species.scientific_name} fill style={{ objectFit: "cover" }} />
        </div>
      )}
      <h3 className="mt-3 text-2xl font-semibold">{species.scientific_name}</h3>
      <h4 className="text-lg font-light italic">{species.common_name}</h4>
      <p>{species.description ? species.description.slice(0, 150).trim() + "..." : ""}</p>
      <LearnMoreDialog species={species} />
      <CommentsDialog species={species} />
      {canEdit && <EditSpeciesDialog species={species} />}
    </div>
  );
}
