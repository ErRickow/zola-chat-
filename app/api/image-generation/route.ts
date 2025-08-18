import { NextResponse } from "next/server"
import { getOrCreateGuestUserId } from "@/lib/api"
import { createSupabase } from "@/lib/supabase/server"
import { nanoid } from "@/lib/utils"

export async function POST(req: Request) {
  try {
    const { prompt, userId } = await req.json()

    if (!prompt) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 })
    }

    // Ambil API key dari database atau environment
    // Anda perlu mengimplementasikan fungsi getNeosantaraApiKey
    const supabase = createSupabase()
    const apiKey = process.env.NEOSANTARA_API_KEY ?? ""

    if (!apiKey) {
      return NextResponse.json({ error: "Missing API key" }, { status: 401 })
    }

    const response = await fetch("https://api.neosantara.xyz/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        prompt: prompt,
        n: 1, // Jumlah gambar yang akan dibuat
        size: "1024x1024",
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      return NextResponse.json(
        { error: errorData.error.message || "Failed to generate image" },
        { status: response.status }
      )
    }

    const data = await response.json()
    const imageUrl = data.data[0].url

    return NextResponse.json({ imageUrl })
  } catch (error) {
    console.error("Image generation error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}