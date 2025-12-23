"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"

export async function login(formData: FormData) {
    const supabase = await createServerClient()

    const email = formData.get("email") as string
    const password = formData.get("password") as string

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        return redirect("/login?message=Could not authenticate user")
    }

    revalidatePath("/", "layout")
    redirect("/dashboard")
}

export async function signup(formData: FormData) {
    const supabase = await createServerClient()

    const email = formData.get("email") as string
    const password = formData.get("password") as string

    const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback`,
        },
    })

    if (error) {
        return redirect("/login?message=Could not authenticate user")
    }

    return redirect("/login?message=Check email to continue sign in process")
}

export async function logout() {
    const supabase = await createServerClient()
    await supabase.auth.signOut()
    revalidatePath("/", "layout")
    redirect("/login")
}
