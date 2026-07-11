"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ListItemRow, ListRow, MediaType } from "@/lib/types";
import { DEMO_MODE, DEMO_LISTS, DEMO_LIST_ITEMS } from "@/lib/demoData";

export function useLists() {
  // Memoize the client so it's created once per hook instance.
  const supabase = useMemo(() => createClient(), []);

  // Cache the user ID to avoid repeated auth.getUser() calls in mutations.
  const userIdRef = useRef<string | null>(null);

  const [lists, setLists] = useState<ListRow[]>(DEMO_MODE ? DEMO_LISTS : []);
  const [items, setItems] = useState<ListItemRow[]>(DEMO_MODE ? DEMO_LIST_ITEMS : []);
  const [loading, setLoading] = useState(!DEMO_MODE);

  const refresh = useCallback(async () => {
    if (DEMO_MODE) return; // demo data is static, nothing to fetch
    setLoading(true);

    if (!userIdRef.current) {
      const { data } = await supabase.auth.getUser();
      userIdRef.current = data.user?.id ?? null;
    }

    const [{ data: listData, error: listErr }, { data: itemData, error: itemErr }] =
      await Promise.all([
        supabase.from("lists").select("*").order("created_at", { ascending: false }),
        supabase.from("list_items").select("*"),
      ]);

    if (listErr) console.error("Failed to load lists:", listErr.message);
    if (itemErr) console.error("Failed to load list items:", itemErr.message);

    setLists(listData ?? []);
    setItems(itemData ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function createList(name: string) {
    if (DEMO_MODE) return;
    const userId = userIdRef.current;
    if (!userId) return;

    const { error } = await supabase.from("lists").insert({ user_id: userId, name });
    if (error) console.error("Failed to create list:", error.message);
    await refresh();
  }

  async function renameList(listId: string, name: string) {
    if (DEMO_MODE) return;
    const { error } = await supabase.from("lists").update({ name }).eq("id", listId);
    if (error) console.error("Failed to rename list:", error.message);
    await refresh();
  }

  async function deleteList(listId: string) {
    if (DEMO_MODE) return;
    const { error } = await supabase.from("lists").delete().eq("id", listId);
    if (error) console.error("Failed to delete list:", error.message);
    await refresh();
  }

  async function addItemToList(
    listId: string,
    item: { tmdb_id: number; media_type: MediaType; title: string; poster_path: string | null }
  ) {
    if (DEMO_MODE) return;
    const userId = userIdRef.current;
    if (!userId) return;

    const { error } = await supabase.from("list_items").upsert(
      {
        list_id: listId,
        user_id: userId,
        tmdb_id: item.tmdb_id,
        media_type: item.media_type,
        title: item.title,
        poster_path: item.poster_path,
      },
      { onConflict: "list_id,tmdb_id,media_type" }
    );
    if (error) console.error("Failed to add item to list:", error.message);
    await refresh();
  }

  async function removeItemFromList(itemId: string) {
    if (DEMO_MODE) return;
    const { error } = await supabase.from("list_items").delete().eq("id", itemId);
    if (error) console.error("Failed to remove item from list:", error.message);
    await refresh();
  }

  function itemsFor(listId: string) {
    return items.filter((i) => i.list_id === listId);
  }

  return {
    lists,
    items,
    loading,
    createList,
    renameList,
    deleteList,
    addItemToList,
    removeItemFromList,
    itemsFor,
    refresh,
  };
}
