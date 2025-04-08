import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import jwt from "jsonwebtoken";



export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, email,wallet } = body;

    // 🔹 Validate required fields
    if (![username,email,wallet].every(Boolean)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data: User, error: userCheckError } = await supabase
      .from("users")
      .select("id, email,role")
      .eq("wallet", wallet)
      .eq("email", email)
      .eq("username", username)
      .maybeSingle();

    if (userCheckError) {
      console.error("Error checking existing user:", userCheckError);
      return NextResponse.json({ error: "Database error while checking user" }, { status: 500 });
    }

     

    if (!User) {
      return NextResponse.json({ error: "No user registered" }, { status: 409 });
    }

    const token = jwt.sign({ id: User.id, email: User.email,role:User.role }, "secretKey", { expiresIn: "7d" });

    return NextResponse.json({ message: "User Login Successful", role:User.role}, { status: 201 });

  } catch (error) {
    console.error("Unexpected Server Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
