import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl as string, supabaseKey as string);

export async function POST(req: Request) {
  try {
    const { username, role, name, email, phone, description, walletAddress } = await req.json();

    // Validate required fields
    if (!username || !role || !name || !email || !phone || !walletAddress) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Insert user data into Supabase
    const { data, error } = await supabase.from("users").insert([
      { username, role, name, email, phone, description, wallet_address: walletAddress }
    ]);

    if (error) {
      throw error;
    }

    return NextResponse.json({ message: "User registered successfully", data }, { status: 201 });
  } catch (error) {
    console.error("Error registering user:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
