import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const { 
            id, 
            title, 
            description, 
            terms_conditions, 
            payment_terms, 
            termination_clause, 
            franchisor, 
            initial_fee, 
            contract_duration, 
            franchisor_share, 
            dispute_resolution,
            email 
        } = body;

        if (!id) {
            return NextResponse.json({ message: "Agreement ID is required" }, { status: 400 });
        }

        // Check if agreement exists
        const { data: existingAgreement, error: fetchError } = await supabase
            .from("agreements")
            .select("*")
            .eq("id", id)
            .single();

        if (fetchError || !existingAgreement) {
            return NextResponse.json({ message: "Agreement not found" }, { status: 404 });
        }

        // Update agreement
        const { data, error } = await supabase
            .from("agreements")
            .update({
                title,
                description,
                terms_conditions,
                payment_terms,
                termination_clause,
                franchisor,
                initial_fee,
                contract_duration,
                franchisor_share,
                dispute_resolution,
                email,
            })
            .eq("id", id)
            .select();

        if (error) {
            console.error("Error updating agreement:", error);
            return NextResponse.json({ message: "Error updating agreement", error: error.message }, { status: 500 });
        }

        return NextResponse.json({ 
            data, 
            message: "Agreement updated successfully" 
        }, { status: 200 });

    } catch (error: any) {
        console.error("Unexpected error:", error);
        return NextResponse.json({ 
            message: "An unexpected error occurred", 
            error: error.message 
        }, { status: 500 });
    }
}