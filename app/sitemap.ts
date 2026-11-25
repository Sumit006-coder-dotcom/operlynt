import type {MetadataRoute} from "next";
import {COURSE_CATALOG} from "@/lib/courses/catalog";
import {landingPages} from "@/lib/seo/landing-pages";
const siteUrl=(process.env.NEXT_PUBLIC_SITE_URL??"https://operlynt-hmuwvgxe.manus.space").replace(/\/$/,"");
const publicPaths=["","/about","/contact","/pricing","/free-resume-builder","/resume-analyzer","/courses","/career-roadmaps","/interview-preparation","/python-interview-questions","/sql-interview-questions","/privacy-policy","/terms",...landingPages.map(page=>`/${page.slug}`),...(["data-analyst","data-scientist","python-developer","ai-ml-engineer"].map(slug=>`/career-roadmaps/${slug}`)),...COURSE_CATALOG.filter(course=>course.status==="published").map(course=>`/courses/${course.slug}`)];
export default function sitemap():MetadataRoute.Sitemap{return publicPaths.map(path=>({url:`${siteUrl}${path}`,changeFrequency:path===""?"weekly":"monthly",priority:path===""?1:(path.startsWith("/career-roadmaps")||path.startsWith("/courses"))?0.7:0.65}))}
