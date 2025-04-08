import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Destructure incoming data
        const {
            title, description, terms_conditions, payment_terms, termination_clause,
            franchisor, initial_fee, contract_duration, franchisor_share,
            dispute_resolution, status, email
        } = body;

        // Validate required fields
        if (
            !franchisor || !title || !description || !terms_conditions ||
            !payment_terms || !termination_clause || initial_fee == null ||
            contract_duration == null || franchisor_share == null || 
            !dispute_resolution || !status || !email
        ) {
            console.error("Validation Error: Missing required fields", body);
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Insert data into Supabase
        const { data, error } = await supabase
            .from("agreements")
            .insert([{
                title, description, terms_conditions, payment_terms, termination_clause,
                franchisor, initial_fee, contract_duration, franchisor_share,
                dispute_resolution, status, email
            }])
            .select();

        // Handle insertion errors
        if (error) {
            console.error("Supabase Insert Error:", error);
            return NextResponse.json({ error: error.message || "Error saving agreement" }, { status: 500 });
        }

        return NextResponse.json({ success: true, data }, { status: 200 });
    } catch (error) {
        console.error("Unexpected Server Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
