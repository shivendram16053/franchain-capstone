import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            id,
            wallet
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

        if( existingAgreement.franchisor_termination || existingAgreement.franchisee_termination) {
            return NextResponse.json({ message: "Agreement already terminated" }, { status: 400 });
        }

        if (wallet == existingAgreement.franchisor) {

            // Update agreement
            const { data, error } = await supabase
                .from("agreements")
                .update({
                    franchisor_termination:true,
                    status: "terminated"
                })
                .eq("id", id)
                .select();

            if (error) {
                console.error("Error updating agreement:", error);
                return NextResponse.json({ message: "Error updating agreement", error: error.message }, { status: 500 });
            }

            return NextResponse.json({
                data,
                message: "Agreement terminated by franchisor"
            }, { status: 200 });

        }
        else if (wallet == existingAgreement.franchisee) {

            // Update agreement
            const { data, error } = await supabase
                .from("agreements")
                .update({
                    franchisee_termination:true,
                    status: "terminated"
                })
                .eq("id", id)
                .select();

            if (error) {
                console.error("Error updating agreement:", error);
                return NextResponse.json({ message: "Error updating agreement", error: error.message }, { status: 500 });
            }

            return NextResponse.json({
                data,
                message: "Agreement terminated by franchisee"
            }, { status: 200 });

        }

        



    } catch (error: any) {
        console.error("Unexpected error:", error);
        return NextResponse.json({
            message: "An unexpected error occurred",
            error: error.message
        }, { status: 500 });
    }
}