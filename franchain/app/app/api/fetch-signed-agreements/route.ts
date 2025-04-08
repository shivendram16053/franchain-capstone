import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { wallet } = body;

        if (!wallet) {
            return NextResponse.json({ message: "id required to fetch" }, { status: 400 })
        }

        const { data: agreementData, error } = await supabase
            .from("agreements")
            .select("*")
            .eq("franchisee", wallet)
            .eq("status","active")

        if (error) {
            return NextResponse.json({ message: "Error fetching details" }, { status: 404 })
        }

        return NextResponse.json({ data: agreementData, message: "Fetch successfull" }, { status: 200 })

    } catch (error) {
        console.error("error happened", error);
        return NextResponse.json({ message: "Error occured while fetching" }, { status: 500 })
    }

}