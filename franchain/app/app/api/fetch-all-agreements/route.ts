import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
    try {
        const { data: agreements, error } = await supabase
            .from("agreements")
            .select("*");

        if (error) {
            console.error("Supabase Error:", error);
            return NextResponse.json({ error: "Failed to fetch agreements" }, { status: 500 });
        }

        if (!agreements || agreements.length === 0) {
            return NextResponse.json({ data: [], message: "No agreements found" }, { status: 200 });
        }

        return NextResponse.json({ data: agreements, message: "Agreements fetched successfully" }, { status: 200 });

    } catch (error) {
        console.error("Error occurred:", error);
        return NextResponse.json({ message: "Error occurred" }, { status: 500 });
    }
}
