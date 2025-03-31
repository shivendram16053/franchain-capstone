import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json(); // Fix: Properly await request body parsing
    const { username } = body;

    if (!username) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }

    // Fetch existing usernames from Supabase
    const { data: existingUsernames, error } = await supabase
      .from("users")
      .select("username");

    if (error) {
      console.error("Supabase Error:", error);
      return NextResponse.json({ error: "Failed to fetch usernames" }, { status: 500 });
    }

    // Ensure existingUsernames is not null
    const usernameList = existingUsernames?.map((user) => user.username) || [];

    return NextResponse.json({ available: !usernameList.includes(username) });
  } catch (err) {
    console.error("API Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
