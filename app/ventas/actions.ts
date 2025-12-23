"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function deleteSale(id: string) {
    const supabase = await createServerClient()

    const { error } = await supabase.from("sales").delete().eq("id", id)

    if (error) {
        throw new Error(error.message)
    }

    revalidatePath("/ventas")
}
