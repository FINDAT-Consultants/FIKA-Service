import { createClient } from "npm:@supabase/supabase-js@2.89.0";
const headers={
  "Access-Control-Allow-Origin":"*",
  "Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods":"POST, OPTIONS",
  "Content-Type":"application/json"
};
function result(status:number,body:unknown){return new Response(JSON.stringify(body),{status,headers});}
Deno.serve(async(request:Request)=>{
  if(request.method==="OPTIONS")return new Response(null,{headers});
  if(request.method!=="POST")return result(405,{error:"POST required"});
  try{
    const url=Deno.env.get("SUPABASE_URL")||"";
    const anon=Deno.env.get("SUPABASE_ANON_KEY")||"";
    const service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
    if(!url||!anon||!service)return result(503,{error:"Backend keys not configured"});
    const token=(request.headers.get("authorization")||"").replace(/^Bearer\s+/i,"").trim();
    if(!token)return result(401,{error:"Sign in as authorized FIKova Management"});
    const authClient=createClient(url,anon,{auth:{persistSession:false,autoRefreshToken:false}});
    const checked=await authClient.auth.getUser(token);
    if(checked.error||!checked.data.user)return result(401,{error:"Invalid user session"});
    const actor=checked.data.user.id;
    const admin=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
    const permitted=await admin.from("fikova_management_users").select("user_id").eq("user_id",actor).maybeSingle();
    if(permitted.error||!permitted.data)return result(403,{error:"FIKova Management authorization required"});
    const data=await request.json();
    const name=String(data.business_name||"").trim(),owner=String(data.owner_name||"").trim();
    const email=String(data.email||"").trim().toLowerCase(),phone=String(data.phone||"").trim();
    const country=String(data.country_code||"ZM").trim().toUpperCase(),currency=String(data.currency||"ZMW").trim().toUpperCase();
    const category=String(data.category||"Other").trim(),location=String(data.location||"").trim();
    if(name.length<2||name.length>120||owner.length<2||owner.length>120||!(/^[^\s@]+@[^\s@]+\.[^\s@]+$/).test(email)||phone.length<7||phone.length>24)
      return result(400,{error:"Provide valid business name, owner, email and phone"});
    if(country.length>8||currency.length>8||category.length>100||location.length>160)return result(400,{error:"Company details are too long"});
    const metadata={fikova_business_registration:{business_name:name,owner_name:owner,phone,category,location,country_code:country,currency}};
    const invited=await admin.auth.admin.inviteUserByEmail(email,{data:metadata});
    if(invited.error||!invited.data.user)return result(409,{error:"Invitation failed: "+(invited.error?.message||"account unavailable")+". Existing accounts should register their company by signing in."});
    const insert=await admin.from("fikova_businesses").insert({
      owner_id:invited.data.user.id,business_name:name,owner_name:owner,business_email:email,
      phone,category,location,country_code:country,currency,status:"pending"
    }).select("id,code,business_name,status").single();
    if(insert.error)return result(409,{error:"Account invited, but the company record could not be created: "+insert.error.message+". The owner can complete registration after signing in."});
    return result(200,{company:insert.data,invited:true});
  }catch(error){return result(500,{error:error instanceof Error?error.message:"Request failed"});}
});