import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data: agreements, error } = await supabase
      .from("agreements")
      .select("*")
      .eq("email", email);

    if (error) {
      console.error("Supabase Error:", error);
      return NextResponse.json({ error: "Failed to fetch agreements" }, { status: 500 });
    }

    if (!agreements || agreements.length === 0) {
      return NextResponse.json({ data: [], message: "No agreements found" }, { status: 200 });
    }

    return NextResponse.json({ data: agreements, message: "Agreements fetched successfully" }, { status: 200 });

  } catch (error) {
    console.error("Unexpected Server Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
