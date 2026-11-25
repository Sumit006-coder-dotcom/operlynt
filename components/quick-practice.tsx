"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui";

type Role = "AI / ML Engineer" | "Data Analyst" | "Python Developer" | "SQL Developer";
type Question = { role: Role; topic: string; prompt: string; choices: string[]; answer: number; explanation: string; recommendation: string; href: string };

const questions: Question[] = [
  { role: "AI / ML Engineer", topic: "Model evaluation", prompt: "You are evaluating a highly imbalanced classifier. Which metric is usually more informative than accuracy alone?", choices: ["R² score", "Precision–recall AUC", "Mean absolute error", "Training loss only"], answer: 1, explanation: "Precision–recall AUC focuses on the positive class and is often more useful when the classes are heavily imbalanced.", recommendation: "Strengthen your ML fundamentals with a guided evaluation path.", href: "/courses?skill=Machine%20Learning" },
  { role: "Data Analyst", topic: "SQL joins", prompt: "Which join keeps every row from the customers table, even when no matching order exists?", choices: ["INNER JOIN", "LEFT JOIN", "CROSS JOIN", "SELF JOIN"], answer: 1, explanation: "A LEFT JOIN preserves every row from the table on the left and fills missing order values with NULL.", recommendation: "Build stronger SQL fluency for analyst interviews.", href: "/courses?skill=SQL" },
  { role: "Python Developer", topic: "Python fundamentals", prompt: "What does `items[1:3]` return for `[10, 20, 30, 40]`?", choices: ["[10, 20]", "[20, 30]", "[20, 30, 40]", "[30, 40]"], answer: 1, explanation: "Python slices include the start index and exclude the stop index, so indices 1 and 2 are returned.", recommendation: "Practice Python fundamentals with short, hands-on lessons.", href: "/courses?skill=Python" },
  { role: "SQL Developer", topic: "Window functions", prompt: "What does `PARTITION BY department` do inside a window function?", choices: ["Deletes duplicate departments", "Resets the window calculation for each department", "Sorts departments alphabetically", "Combines all departments into one row"], answer: 1, explanation: "PARTITION BY creates independent groups for the window calculation without collapsing the result rows.", recommendation: "Go deeper on SQL and database interview patterns.", href: "/courses?skill=SQL" },
];

const roleLabels: Role[] = ["AI / ML Engineer", "Data Analyst", "Python Developer", "SQL Developer"];

export function QuickPractice() {
  const [role, setRole] = useState<Role>("AI / ML Engineer");
  const [selected, setSelected] = useState<number | null>(null);
  const question = useMemo(() => questions.find((item) => item.role === role)!, [role]);

  function changeRole(next: Role) {
    setRole(next);
    setSelected(null);
  }

  return (
    <div className="quick-practice-card">
      <div className="quick-practice-head">
        <div>
          <span className="eyebrow"><span className="eyebrow-dot" /> PRACTICE A REAL QUESTION</span>
          <h2>See how feedback feels.</h2>
          <p>Choose a role, pick an answer, and get the concept plus the next useful resource.</p>
        </div>
        <span className="practice-count"><strong>01</strong><small>of 100+</small></span>
      </div>
      <div className="role-tabs" aria-label="Practice role">
        {roleLabels.map((item) => <button key={item} className={role === item ? "active" : ""} onClick={() => changeRole(item)}>{item}</button>)}
      </div>
      <div className="quick-question">
        <div className="quick-question-meta"><span>{question.topic}</span><span>Intermediate</span></div>
        <h3>{question.prompt}</h3>
        <div className="choice-list">
          {question.choices.map((choice, index) => {
            const answered = selected !== null;
            const state = answered && index === question.answer ? "correct" : answered && index === selected ? "wrong" : "";
            return <button key={choice} className={`choice ${state}`} onClick={() => setSelected(index)} disabled={answered}><span>{String.fromCharCode(65 + index)}</span>{choice}{state === "correct" && <Icon name="check" />}{state === "wrong" && <b>×</b>}</button>;
          })}
        </div>
        {selected !== null && <div className={`answer-result ${selected === question.answer ? "is-correct" : "is-wrong"}`} role="status">
          <div className="answer-result-icon">{selected === question.answer ? "✓" : "!"}</div>
          <div><strong>{selected === question.answer ? "That’s right." : "Not quite — keep going."}</strong><p>{question.explanation}</p><Link href={question.href}>{question.recommendation} <Icon name="arrow" /></Link></div>
        </div>}
      </div>
      <div className="quick-practice-foot"><span><Icon name="spark" /> Feedback, solutions, and recommendations are connected.</span><Link href="/interview-preparation">Explore the full question bank <Icon name="arrow" /></Link></div>
    </div>
  );
}
