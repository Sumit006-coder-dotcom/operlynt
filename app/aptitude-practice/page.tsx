import type {Metadata} from "next";import {PublicLearningLanding,landingMetadata} from "@/components/public-learning-landing";import {landingPages} from "@/lib/seo/landing-pages";
const page=landingPages.find(item=>item.slug==="aptitude-practice")!;export const metadata:Metadata=landingMetadata(page);export default function Page(){return <PublicLearningLanding page={page}/>}
