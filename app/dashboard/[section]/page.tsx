import {Suspense} from "react";
import {redirect} from "next/navigation";
type Props={params:Promise<{section:string}>};
export default function SectionPage({params}:Props){return <Suspense fallback={<div className="empty-state"><p>Loading workspace…</p></div>}><SectionContent params={params}/></Suspense>}
async function SectionContent({params}:Props){const {section}=await params;if(section==="subscription-usage")redirect("/dashboard/billing");return <div className="empty-state"><h3>Workspace section not found</h3><p>Choose an area from your workspace navigation.</p></div>}
