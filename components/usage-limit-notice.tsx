"use client";
import Link from "next/link";
export function UsageLimitNotice({feature,period}:{feature:string,period:"day"|"month"}){
 const formatter=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit"});const parts=formatter.formatToParts(new Date()),value=(type:string)=>parts.find(part=>part.type===type)?.value??"00";const [year,month,day]=[value("year"),value("month"),value("day")].map(Number);const now=new Date(Date.UTC(year,month-1,day));if(period==="day")now.setUTCDate(now.getUTCDate()+1);else{now.setUTCMonth(now.getUTCMonth()+1,1)}const reset=`${new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"long"}).format(now)} at 12:00 AM IST`;
 return <div className="usage-limit-notice" role="status"><strong>{feature} limit reached</strong><p>Your quota resets {reset}. Your saved work and completed attempts remain available. Pro removes these free-plan limits for ₹199/month or ₹1,499/year.</p><div><Link className="btn" href="/pricing">See Pro plans</Link><Link href="/courses">Continue with free courses</Link><Link href="/dashboard/career-roadmaps">Explore free roadmaps</Link></div></div>
}
