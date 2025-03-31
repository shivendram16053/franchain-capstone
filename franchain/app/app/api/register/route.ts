import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, role, name, email, phone, description, wallet } = body;

    // 🔹 Validate required fields
    if (![username, role, name, email, phone, wallet].every(Boolean)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 🔹 Check for existing username, email, and phone separately
    const errors: Record<string, string> = {};

    // ✅ Check username
    const { data: existingUsername } = await supabase
      .from("users")
      .select("id")
      .eq("username", username)
      .maybeSingle();

    if (existingUsername) {
      errors.username = "Username already taken";
    }

    // ✅ Check email
    const { data: existingEmail } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existingEmail) {
      errors.email = "Email already registered";
    }

    // ✅ Check phone
    const { data: existingPhone } = await supabase
      .from("users")
      .select("id")
      .eq("phone", phone)
      .maybeSingle();

    if (existingPhone) {
      errors.phone = "Phone number already registered";
    }

    // 🔹 If any errors exist, return them
    if (Object.keys(errors).length > 0) {
      return NextResponse.json(errors, { status: 409 }); // ✅ Fixed the issue
    }

    // 🔹 Insert user data into Supabase
    const { data, error } = await supabase
      .from("users")
      .insert([{ username, role, name, email, phone, bio: description, wallet }])
      .select("id, username, email")
      .single();

    if (error) {
      console.error("Error inserting user:", error);
      return NextResponse.json({ error: "Database error while inserting user" }, { status: 500 });
    }

    return NextResponse.json({ message: "User registered successfully", user: data }, { status: 201 });

  } catch (error) {
    console.error("Unexpected Server Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
