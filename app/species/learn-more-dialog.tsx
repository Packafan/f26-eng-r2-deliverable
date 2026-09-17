"use client";
// Adds functionality for the "Learn More" button to open a dialog with more information about the species.

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Database } from "@/lib/schema";

type Species = Database["public"]["Tables"]["species"]["Row"];
// Functionality for the "Learn More" button to open a dialog with more information about the species.

export default function LearnMoreDialog({ species }: { species: Species }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="mt-3 w-full">Learn More</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{species.scientific_name}</DialogTitle>
          <DialogDescription>{species.common_name ?? "Species details"}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <p>{species.description ?? "No description available."}</p>
          <p>
            <span className="font-semibold">Kingdom:</span> {species.kingdom}
          </p>
          {species.total_population !== null && (
            <p>
              <span className="font-semibold">Total population:</span> {species.total_population.toLocaleString()}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
