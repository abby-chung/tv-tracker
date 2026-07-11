"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ListItemRow, ListRow, MediaType } from "@/lib/types";
import { DEMO_MODE, DEMO_LISTS, DEMO_LIST_ITEMS } from "@/lib/demoData";

export function useLists() {
  const supabase = createClient();
  const [lists, setLists] = useState<ListRow[]>(DEMO_MODE ? DEMO_LISTS : []);
  const [items, setItems] = useState<ListItemRow[]>(DEMO_MODE ? DEMO_LIST_ITEMS : []);
  const [loading, setLoading] = useState(!DEMO_MODE);

  const refresh = useCallback(async () => {
    if (DEMO_MODE) return; // demo data is static, nothing to fetch
    setLoading(true);
    const { data: listData } = await supabase
      .from("lists")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: itemData } = await supabase.from("list_items").select("*");

    setLists(listData ?? []);
    setItems(itemData ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function createList(name: string) {
    if (DEMO_MODE) return; // preview mode doesn't persist changes
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    await supabase.from("lists").insert({ user_id: userData.user.id, name });
    await refresh();
  }

  async function renameList(listId: string, name: string) {
    if (DEMO_MODE) return; // preview mode doesn't persist changes
    await supabase.from("lists").update({ name }).eq("id", listId);
    await refresh();
  }

  async function deleteList(listId: string) {
    if (DEMO_MODE) return; // preview mode doesn't persist changes
    await supabase.from("lists").delete().eq("id", listId);
    await refresh();
  }

  async function addItemToList(
    listId: string,
    item: { tmdb_id: number; media_type: MediaType; title: string; poster_path: string | null }
  ) {
    if (DEMO_MODE) return; // preview mode doesn't persist changes
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    await supabase.from("list_items").upsert(
      {
        list_id: listId,
        user_id: userData.user.id,
        tmdb_id: item.tmdb_id,
        media_type: item.media_type,
        title: item.title,
        poster_path: item.poster_path,
      },
      { onConflict: "list_id,tmdb_id,media_type" }
    );
    await refresh();
  }

  async function removeItemFromList(itemId: string) {
    if (DEMO_MODE) return; // preview mode doesn't persist changes
    await supabase.from("list_items").delete().eq("id", itemId);
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
