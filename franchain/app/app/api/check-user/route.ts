import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {  wallet } = body;

    if (!wallet) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data: existingUser, error: userCheckError } = await supabase
      .from("users")
      .select("id") 
      .eq("wallet", wallet)
      .maybeSingle(); 

    

    if (existingUser) {
      return NextResponse.json({ data:true }, { status: 200 });
    }



    return NextResponse.json({ data:false }, { status: 200 });

  } catch (error) {
    console.error("Unexpected Server Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
