"use client";
import {trackAnalyticsEvent} from "@/lib/analytics/client";

export function CourseOutboundForm({slug,children}:{slug:string;children:React.ReactNode}){
  return <form action={`/api/courses/${slug}/outbound`} method="post" onSubmit={()=>trackAnalyticsEvent("course_outbound_click",{course_slug:slug})}>{children}</form>;
}
