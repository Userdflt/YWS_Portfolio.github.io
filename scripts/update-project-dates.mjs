// Refresh date snapshots intentionally. Normal builds never depend on GitHub availability.
import fs from 'node:fs';
const projects=JSON.parse(fs.readFileSync('content/projects.json','utf8'));
const savedDates=Object.fromEntries(JSON.parse(fs.readFileSync('content/project-dates.json','utf8')).map(record=>[record.project,record]));
const records=await Promise.all(projects.map(async project=>{
 // Projects without a verified repository retain their recorded project year.
 // A portfolio edit is not evidence of when the project was worked on.
 if(!project.repository){
  const saved=savedDates[project.id];
  if(saved?.sourceType!=='project'||!/^\d{4}$/.test(saved.year))throw new Error(`${project.id}: no recorded project year`);
  return saved;
 }
 const repo=project.repository.replace('https://github.com/','');
 const response=await fetch(`https://api.github.com/repos/${repo}/commits?per_page=1`,{headers:{Accept:'application/vnd.github+json','User-Agent':'YWS-Portfolio-Date-Audit'},signal:AbortSignal.timeout(30000)});
 if(!response.ok)throw new Error(`${project.id}: GitHub returned ${response.status}`);
 const [commit]=await response.json();
 const record={project:project.id,sourceType:'repository',repository:project.repository,commit:commit.sha,committedAt:commit.commit.committer.date,source:commit.html_url};
 if(!/^[a-f0-9]{40}$/.test(record.commit)||!Number.isFinite(Date.parse(record.committedAt)))throw new Error(`${project.id}: no valid commit date`);
 return record;
}));
for(const project of projects){
 const record=records.find(record=>record.project===project.id);
 project.year=record.sourceType==='project'?record.year:new Date(record.committedAt).toISOString().slice(0,4);
 project.status='Past personal project';
}
fs.writeFileSync('content/project-dates.json',JSON.stringify(records,null,2)+'\n');
fs.writeFileSync('content/projects.json',JSON.stringify(projects,null,2)+'\n');
console.log(`Updated ${records.filter(record=>record.sourceType==='repository').length} project repository dates; preserved ${records.filter(record=>record.sourceType==='project').length} recorded project years.`);
