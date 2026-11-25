import Link from "next/link";
import { ButtonLink, Icon, SectionHeading } from "@/components/ui";
import { AppDownloadSection } from "@/components/app-download";
import { QuickPractice } from "@/components/quick-practice";
import { COURSE_CATALOG } from "@/lib/courses/catalog";

const spotlightCourses = COURSE_CATALOG.filter((course) => course.status === "published").slice(0, 3);

export default function Home() {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://operlynt-hmuwvgxe.manus.space").replace(/\/$/, "");
  const jsonLd = { "@context": "https://schema.org", "@type": "WebApplication", name: "Operlynt", url: siteUrl, applicationCategory: "EducationalApplication", operatingSystem: "Web", description: "Build resumes, check ATS scores, practice tech interviews, and follow career roadmaps.", offers: { "@type": "Offer", price: "0", priceCurrency: "INR" } };
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    <section className="new-hero">
      <div className="hero-glow" />
      <div className="container new-hero-grid">
        <div className="new-hero-copy">
          <span className="eyebrow"><span className="eyebrow-dot" /> CAREER GROWTH, WITHOUT THE FOG</span>
          <h1>Your next role starts with <em>one clear move.</em></h1>
          <p>Build a resume that sounds like you, practice the questions that matter, and find learning that moves you toward the work you want.</p>
          <div className="hero-actions"><ButtonLink href="/free-resume-builder">Build my resume <Icon name="arrow" /></ButtonLink><Link className="text-link" href="/interview-preparation">Practice one question <Icon name="arrow" /></Link></div>
          <div className="hero-trust"><div className="hero-avatars"><span>AK</span><span>RM</span><span>NS</span><span>+</span></div><span>Resume tools, practice, and learning in one place.</span></div>
        </div>
        <div className="hero-board" aria-label="Operlynt workspace preview">
          <div className="board-top"><span><i className="status-dot" /> Your workspace</span><span>Today · 12 min</span></div>
          <div className="board-intro"><span className="board-kicker">NEXT BEST MOVE</span><h2>Make your resume <em>more specific.</em></h2><p>Two small edits could make your impact easier to see.</p><Link href="/resume-analyzer">Open resume score <Icon name="arrow" /></Link></div>
          <div className="board-stats"><div><span>Resume score</span><strong>78<small>/100</small></strong><b><i style={{ width: "78%" }} /></b></div><div><span>Practice streak</span><strong>04<small> days</small></strong><b><i style={{ width: "64%", background: "#7bc59c" }} /></b></div></div>
          <div className="board-footer"><span className="board-role"><span className="mini-role-icon">ML</span><span><b>AI / ML Engineer</b><small>Next up: model evaluation</small></span></span><span className="board-arrow">↗</span></div>
        </div>
      </div>
    </section>

    <section className="signal-strip"><div className="container signal-grid"><span className="signal-label">A calmer way to move forward</span><span><b>01</b> Make progress visible</span><span><b>02</b> Learn with context</span><span><b>03</b> Practice with feedback</span></div></section>

    <section className="section container entry-section"><SectionHeading eyebrow="YOUR CAREER, IN ONE WORKSPACE" title={<>Start where you are.<br /><em>Go from there.</em></>} text="You do not need a perfect plan. You need a next step that connects to the one after it." /><div className="entry-grid"><Link className="entry-card entry-resume" href="/free-resume-builder"><div className="entry-card-top"><span className="entry-icon"><Icon name="resume" /></span><span>01</span></div><h3>Build a resume that gets read.</h3><p>Use a guided builder, choose your story, and check your score before you send it.</p><span className="entry-link">Resume Studio <Icon name="arrow" /></span></Link><Link className="entry-card entry-practice" href="/interview-preparation"><div className="entry-card-top"><span className="entry-icon"><Icon name="interview" /></span><span>02</span></div><h3>Practice for the role you want.</h3><p>Work through technical, HR, scenario, and project questions with clear explanations.</p><span className="entry-link">Interview Lab <Icon name="arrow" /></span></Link><Link className="entry-card entry-learn" href="/courses"><div className="entry-card-top"><span className="entry-icon"><Icon name="learn" /></span><span>03</span></div><h3>Learn what closes the gap.</h3><p>Find courses linked to your role, your practice, and the skills you are building next.</p><span className="entry-link">Learning Hub <Icon name="arrow" /></span></Link></div></section>

    <section className="practice-section"><div className="container"><QuickPractice /></div></section>

    <section className="section container recommendation-section"><div className="recommendation-intro"><div><span className="eyebrow">RECOMMENDATIONS WITH A REASON</span><h2>Less browsing.<br /><em>More relevance.</em></h2></div><p>When you practice SQL, you see SQL courses. When you choose an ML path, you see ML questions. Operlynt keeps your next action connected to your goal.</p></div><div className="course-shelf">{spotlightCourses.map((course, index) => <Link className="shelf-card" href={`/courses/${course.slug}`} key={course.slug}><div className="shelf-top"><span className="shelf-number">0{index + 1}</span><span className="shelf-provider">{course.provider}</span></div><h3>{course.title}</h3><p>{course.description}</p><div className="shelf-bottom"><span>{course.difficulty} · {course.pricing}</span><Icon name="arrow" /></div></Link>)}</div><div className="center-link"><Link className="text-link" href="/courses">See all courses <Icon name="arrow" /></Link></div></section>

    <section className="path-band new-path"><div className="container new-path-grid"><div><span className="eyebrow">A PLAN THAT FEELS POSSIBLE</span><h2>Pick a direction.<br /><em>Keep moving.</em></h2><p>Explore clear roadmaps for data, software, and AI roles. Then turn the roadmap into practice, learning, and proof of progress.</p><ButtonLink href="/career-roadmaps" variant="light">Explore career roadmaps <Icon name="arrow" /></ButtonLink></div><div className="path-card"><div className="path-card-head"><span>YOUR NEXT CHAPTER</span><span className="path-badge">IN PROGRESS</span></div><h3>AI / ML Engineer</h3><p>A practical route from Python foundations to model evaluation and production thinking.</p><div className="path-steps"><span className="complete"><i>✓</i><b>Python</b><small>Done</small></span><span className="active"><i>02</i><b>Modeling</b><small>Up next</small></span><span><i>03</i><b>Ship a project</b><small>Later</small></span></div><div className="path-card-foot"><span>2 of 6 milestones complete</span><Link href="/career-roadmaps/ai-ml-engineer">View roadmap <Icon name="arrow" /></Link></div></div></div></section>

    <AppDownloadSection />

    <section className="section container closing-cta new-closing"><span className="eyebrow">YOUR FUTURE ISN’T ONE SIZE FITS ALL</span><h2>Make room for the career<br /><em>you’re becoming.</em></h2><p>Start with a resume. Stay for the momentum.</p><ButtonLink href="/register">Create my free workspace <Icon name="arrow" /></ButtonLink></section>
  </>;
}
