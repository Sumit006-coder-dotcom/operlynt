import type {ResumeDocument} from "./model";
const accentColors:Record<string,string>={modern:"0.40 0.31 0.77",classic:"0.10 0.18 0.30",minimal:"0.20 0.22 0.26"};
function clean(value:string){return value.normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[\u2018\u2019]/g,"'").replace(/[\u201c\u201d]/g,'"').replace(/[\u2013\u2014]/g,"-").replace(/\u2022/g,"*").replace(/\u20b9/g,"INR ").replace(/[^\x20-\xff]/g,"?")}
function escapePdf(value:string){return clean(value).replace(/\\/g,"\\\\").replace(/\(/g,"\\(").replace(/\)/g,"\\)")}
function wrap(value:string,max:number){const words=clean(value).split(/\s+/).filter(Boolean);const lines:string[]=[];let line="";for(const word of words){const next=line?`${line} ${word}`:word;if(next.length>max&&line){lines.push(line);line=word}else line=next}if(line)lines.push(line);return lines}
export function generateResumePdf(document:ResumeDocument){
 const accent=accentColors[document.template]??accentColors.modern;const pages:string[][]=[[]];let y=748;
 const page=()=>{pages.push([]);y=748};const push=(line:string)=>{if(y<58)page();pages[pages.length-1].push(line)};
 const text=(value:string,size=10,font="F1",color="0.12 0.16 0.24",x=48)=>{push(`BT /${font} ${size} Tf ${color} rg ${x} ${y} Td (${escapePdf(value)}) Tj ET`);y-=size+4};
 const paragraph=(value:string,size=9,font="F1",color="0.18 0.20 0.26",indent=0)=>{for(const row of value.split(/\n+/)){for(const line of wrap(row,Math.max(25,96-Math.floor(indent/5)))){text(line,size,font,color,48+indent);y-=1}}};
 const section=(title:string)=>{y-=7;if(y<70)page();text(title.toLocaleUpperCase(),10,"F2",accent);push(`0.78 w ${accent} RG 48 ${y+4} m 564 ${y+4} l S`);y-=7};
 text(document.contact.fullName||"Your Name",22,"F2",accent);if(document.targetRole)text(document.targetRole,11,"F1","0.35 0.38 0.45");
 const contact=[document.contact.email,document.contact.phone,document.contact.location,document.contact.linkedin,document.contact.website].filter(Boolean).join(" | ");if(contact)paragraph(contact,8,"F1","0.40 0.42 0.47");y-=6;
 for(const sectionEntry of document.sections.filter(x=>x.visible)){
  const heading=sectionEntry.title;
  if(sectionEntry.type==="personal")continue;
  if(sectionEntry.type==="summary"){if(!document.summary.trim())continue;section(heading);paragraph(document.summary);continue}
  if(sectionEntry.type==="experience"){if(!document.experience.length)continue;section(heading);for(const item of document.experience){text([item.role,item.company].filter(Boolean).join(" - "),10,"F2");const place=[item.location,[item.startDate,item.endDate].filter(Boolean).join(" - ")].filter(Boolean).join(" | ");if(place)paragraph(place,8,"F1","0.40 0.42 0.47");if(item.description)paragraph(item.description,9,"F1","0.18 0.20 0.26",8);y-=4}continue}
  if(sectionEntry.type==="education"){if(!document.education.length)continue;section(heading);for(const item of document.education){text([item.degree,item.field].filter(Boolean).join(" - ")||item.school,10,"F2");const details=[item.school,item.location,[item.startDate,item.endDate].filter(Boolean).join(" - ")].filter(Boolean).join(" | ");paragraph(details,8,"F1","0.40 0.42 0.47");if(item.details)paragraph(item.details);y-=3}continue}
  if(sectionEntry.type==="projects"){if(!document.projects.length)continue;section(heading);for(const item of document.projects){text(item.name||"Project",10,"F2");if(item.technologies)paragraph(item.technologies,8,"F1","0.40 0.42 0.47");if(item.description)paragraph(item.description,9,"F1","0.18 0.20 0.26",8);y-=3}continue}
  if(sectionEntry.type==="skills"){if(!document.skills.length)continue;section(heading);paragraph(document.skills.join("  |  "));continue}
  if(sectionEntry.type==="certifications"){if(!document.certifications.length)continue;section(heading);for(const item of document.certifications)paragraph([item.name,item.issuer,item.date].filter(Boolean).join(" | "),9);continue}
  if(sectionEntry.type==="achievements"){if(!document.achievements.length)continue;section(heading);for(const item of document.achievements){text(item.title||"Achievement",9,"F2");paragraph([item.description,item.date].filter(Boolean).join(" | "),9,"F1","0.18 0.20 0.26",8)}continue}
  if(sectionEntry.type==="custom"){if(!sectionEntry.customContent?.trim())continue;section(heading);paragraph(sectionEntry.customContent)}
 }
 const objects:string[]=[];objects[1]="<< /Type /Catalog /Pages 2 0 R >>";objects[3]="<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>";objects[4]="<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>";
 const pageRefs=pages.map((_,index)=>`${5+index*2} 0 R`).join(" ");objects[2]=`<< /Type /Pages /Kids [${pageRefs}] /Count ${pages.length} >>`;
 pages.forEach((lines,index)=>{const pageId=5+index*2;const streamId=pageId+1;const footer=`BT /F1 8 Tf 0.48 0.50 0.55 rg 545 28 Td (${index+1} / ${pages.length}) Tj ET`;const stream=[...lines,footer].join("\n");objects[pageId]=`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${streamId} 0 R >>`;objects[streamId]=`<< /Length ${Buffer.byteLength(stream,"latin1")} >>\nstream\n${stream}\nendstream`});
 const chunks:Buffer[]=[Buffer.from("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n","latin1")];const offsets=[0];let length=chunks[0].length;for(let i=1;i<objects.length;i++){offsets[i]=length;const chunk=Buffer.from(`${i} 0 obj\n${objects[i]}\nendobj\n`,"latin1");chunks.push(chunk);length+=chunk.length}const xrefOffset=length;let xref=`xref\n0 ${objects.length}\n0000000000 65535 f \n`;for(let i=1;i<objects.length;i++)xref+=`${String(offsets[i]).padStart(10,"0")} 00000 n \n`;xref+=`trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;chunks.push(Buffer.from(xref,"latin1"));return Buffer.concat(chunks);
}
