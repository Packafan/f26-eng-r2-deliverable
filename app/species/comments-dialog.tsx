"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { createBrowserSupabaseClient } from "@/lib/client-utils";
import type { Database } from "@/lib/schema";
import { useCallback, useEffect, useState } from "react";

type Species = Database["public"]["Tables"]["species"]["Row"];
type Comment = Database["public"]["Tables"]["comments"]["Row"] & {
  profiles: { display_name: string } | null;
};

const supabase = createBrowserSupabaseClient();

export default function CommentsDialog({ species }: { species: Species }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Keep the list refreshable so a newly posted comment appears immediately.
  const loadComments = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("comments")
      .select("id, species_id, author, content, created_at, profiles(display_name)")
      .eq("species_id", species.id)
      .order("created_at", { ascending: false });

    if (error) {
      setErrorMessage("Comments could not be loaded.");
    } else {
      setComments((data ?? []) as Comment[]);
    }
    setIsLoading(false);
  }, [species.id]);

  useEffect(() => {
    void loadComments();
  }, [loadComments]);

  const handleSubmit = async () => {
    const content = newComment.trim();
    if (!content) return;

    // Use the authenticated user's ID so the database policy can verify authorship.
    setIsSubmitting(true);
    setErrorMessage("");
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      setErrorMessage("You must be signed in to comment.");
      setIsSubmitting(false);
      return;
    }

    const { error } = await supabase.from("comments").insert({
      species_id: species.id,
      author: userData.user.id,
      content,
    });

    if (error) {
      setErrorMessage("Your comment could not be posted.");
    } else {
      setNewComment("");
      await loadComments();
    }
    setIsSubmitting(false);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="mt-2 w-full" variant="outline">
          Comments
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Comments on {species.scientific_name}</DialogTitle>
          <DialogDescription>See what other people have said about this species.</DialogDescription>
        </DialogHeader>

        <div className="max-h-64 space-y-3 overflow-y-auto pr-1">
          {isLoading && <p className="text-sm text-muted-foreground">Loading comments...</p>}
          {!isLoading && comments.length === 0 && (
            <p className="text-sm text-muted-foreground">No comments yet. Start the conversation.</p>
          )}
          {comments.map((comment) => (
            <article key={comment.id} className="rounded-md border p-3">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-sm font-semibold">{comment.profiles?.display_name ?? "Unknown author"}</p>
                <time className="text-xs text-muted-foreground" dateTime={comment.created_at}>
                  {new Date(comment.created_at).toLocaleDateString()}
                </time>
              </div>
              <p className="mt-1 text-sm">{comment.content}</p>
            </article>
          ))}
        </div>

        <div className="space-y-2">
          <Textarea
            value={newComment}
            onChange={(event) => setNewComment(event.target.value)}
            placeholder="Leave a comment"
            maxLength={500}
            disabled={isSubmitting}
          />
          {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
        </div>
        <DialogFooter>
          <Button onClick={() => void handleSubmit()} disabled={isSubmitting || !newComment.trim()}>
            {isSubmitting ? "Posting..." : "Post comment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
