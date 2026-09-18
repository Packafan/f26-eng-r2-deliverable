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
import { createBrowserSupabaseClient } from "@/lib/client-utils";
import type { Database } from "@/lib/schema";
import { useEffect, useState } from "react";

type Species = Database["public"]["Tables"]["species"]["Row"];
// Functionality for the "Learn More" button to open a dialog with more information about the species.

// Extra Goal 1: Adds author name on the learn more card.
export default function LearnMoreDialog({ species }: { species: Species }) {
  const [authorName, setAuthorName] = useState("Unknown author");

  useEffect(() => {
    let isMounted = true;
    const supabase = createBrowserSupabaseClient();

    void supabase
      .from("profiles")
      .select("display_name")
      .eq("id", species.author)
      .single()
      .then(({ data }) => {
        if (isMounted && data?.display_name) {
          setAuthorName(data.display_name);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [species.author]);

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
        <p className="mt-5 border-t pt-3 text-xs text-muted-foreground">Added By: {authorName}</p>
      </DialogContent>
    </Dialog>
  );
}
