import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req:NextRequest){
    try{
        const body = await req.json();
        const {wallet}= body;

        if(!wallet){
            return NextResponse.json({error:"Missing required fields"},{status:401});
        }

        const {data:userData,error:userError} = await supabase
        .from("users")
        .select("*")
        .eq("wallet",wallet)
        .maybeSingle();

        if(userError){
            console.error("Error fetching user details :",userError);
            return NextResponse.json({error:"Error fetching user details"},{status:501})
        }

        return NextResponse.json({user:userData},{status:200})

    }catch(error){
        console.log("unexpected server error :",error);
        return NextResponse.json({error:"Internal Server Error"},{status:500})
    }
}