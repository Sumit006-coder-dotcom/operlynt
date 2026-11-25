-- Operlynt Phase 4: curated course catalogue, owner learning actions and consent-based personalization.
alter table public.profiles add column career_interests text[] not null default '{}';
alter table public.profiles add column learning_skills text[] not null default '{}';
alter table public.profiles add column course_recommendations_consent boolean not null default false;
alter table public.courses add column career_roles text[] not null default '{}';
alter table public.courses add column category text not null default 'Other';
alter table public.courses add column language text not null default 'English';
alter table public.courses add column pricing_type text not null default 'Varies' check(pricing_type in ('Free','Paid','Varies'));
alter table public.courses add column certificate_availability text not null default 'Not stated' check(certificate_availability in ('Available','Unavailable','Varies','Not stated'));
alter table public.courses add column affiliate_url text;
alter table public.courses add column affiliate_approved boolean not null default false;
alter table public.courses add column last_verified date not null default current_date;
alter table public.courses add column course_status text not null default 'draft' check(course_status in ('published','draft','archived'));
update public.courses set course_status=case when is_published then 'published' else 'draft' end;
drop policy "published courses read" on public.courses;
create policy "published courses read" on public.courses for select to anon, authenticated using (is_published and course_status='published');
create index courses_filter_idx on public.courses(course_status,provider,category,level,pricing_type);
create index course_skills_skill_idx on public.course_skills(lower(skill));
create table public.course_clicks (
 id uuid primary key default gen_random_uuid(), course_id uuid not null references public.courses(id) on delete cascade,
 destination text not null check(destination in ('official','affiliate')),
 created_at timestamptz not null default now()
);
alter table public.course_clicks enable row level security;
revoke all on public.course_clicks from anon,authenticated;

-- Provider catalog entries are manually curated with official URLs. Pricing is categorical; prices and ratings are never inferred.
insert into public.courses(slug,title,provider,description,url,level,is_published,career_roles,category,language,pricing_type,certificate_availability,affiliate_url,affiliate_approved,last_verified,course_status) values
('coursera-sql-data-science','SQL for Data Science','Coursera','Learn to query, filter, sort, and summarize data with SQL.','https://www.coursera.org/learn/sql-for-data-science','Beginner',true,array['Data Analyst','Data Scientist'],'Data','English','Varies','Available',null,false,'2026-11-18','published'),
('coursera-statistics-python','Statistics with Python','Coursera','Use Python for statistical visualization, inference, and modeling.','https://www.coursera.org/specializations/statistics-with-python','Beginner',true,array['Machine Learning Engineer','Data Scientist','Data Analyst'],'AI & Machine Learning','English','Varies','Available',null,false,'2026-11-18','published'),
('coursera-excel-data-analysis','Excel for Data Analysis','Coursera','Use spreadsheet tools and formulas to structure data and create clear analysis.','https://www.coursera.org/learn/excel-data-analysis','Beginner',true,array['Data Analyst','Business Analyst'],'Data','English','Varies','Available',null,false,'2026-11-18','published'),
('coursera-google-data-analytics','Google Data Analytics Certificate','Coursera','A structured path covering analysis workflows, spreadsheets, SQL, and visualization. Subscription or certificate pricing may apply.','https://www.coursera.org/professional-certificates/google-data-analytics','Beginner',true,array['Data Analyst','Business Analyst'],'Data','English','Paid','Available',null,false,'2026-11-18','published'),
('udemy-python-absolute-beginners','Python for Absolute Beginners','Udemy','A beginner introduction to Python programming and core language concepts. Check the provider page for current access terms.','https://www.udemy.com/course/python-programming-for-absolute-beginners/','Beginner',true,array['Python Developer','Software Developer','Data Analyst'],'Programming','English','Paid','Varies',null,false,'2026-11-18','published'),
('edx-ibm-analyzing-data-python','Analyzing Data with Python','edX','Work with Python tools and methods used in data analysis, including common scientific libraries.','https://www.edx.org/learn/python/ibm-analyzing-data-with-python','Intermediate',true,array['Data Analyst','Data Scientist','Python Developer'],'Data','English','Varies','Available',null,false,'2026-11-18','published'),
('fcc-python-programming-fundamentals','Python Programming Fundamentals','freeCodeCamp','Practice Python basics, loops, data structures, error handling, and object-oriented programming.','https://www.freecodecamp.org/learn/python-programming-fundamentals/','Beginner',true,array['Python Developer','Software Developer'],'Programming','English','Free','Available',null,false,'2026-11-18','published'),
('fcc-relational-databases','Relational Databases Certification','freeCodeCamp','Build SQL and relational database foundations through lessons and practical projects.','https://www.freecodecamp.org/learn/relational-database/','Beginner',true,array['Data Analyst','Backend Developer'],'Data','English','Free','Available',null,false,'2026-11-18','published'),
('microsoft-power-bi-visualize','Prepare and visualize data with Microsoft Power BI','Microsoft Learn','Connect to data, shape it, and create interactive Power BI reports.','https://learn.microsoft.com/training/paths/prepare-visualize-data-power-bi/','Beginner',true,array['Data Analyst','Business Analyst'],'Data','English','Free','Not stated',null,false,'2026-11-18','published'),
('microsoft-query-t-sql','Query and modify data with Transact-SQL','Microsoft Learn','Learn to retrieve and change data using Transact-SQL fundamentals.','https://learn.microsoft.com/training/paths/get-started-querying-with-transact-sql/','Beginner',true,array['Data Analyst','Database Developer'],'Data','English','Free','Not stated',null,false,'2026-11-18','published'),
('kaggle-intro-sql','Intro to SQL','Kaggle Learn','Learn SQL for working with databases and BigQuery through short lessons and exercises.','https://www.kaggle.com/learn/intro-to-sql','Beginner',true,array['Data Analyst','Data Engineer'],'Data','English','Free','Not stated',null,false,'2026-11-18','published'),
('kaggle-python','Python','Kaggle Learn','Practice Python fundamentals in short, interactive exercises.','https://www.kaggle.com/learn/python','Beginner',true,array['Python Developer','Data Analyst','Data Scientist'],'Programming','English','Free','Not stated',null,false,'2026-11-18','published'),
('kaggle-machine-learning','Intro to Machine Learning','Kaggle Learn','Build and evaluate basic machine learning models with practical exercises.','https://www.kaggle.com/learn/intro-to-machine-learning','Beginner',true,array['Machine Learning Engineer','Data Scientist'],'AI & Machine Learning','English','Free','Not stated',null,false,'2026-11-18','published'),
('google-cloud-data-analytics-essentials','Google Cloud Data Analytics Essentials','Google Skills','Explore a beginner analytics workflow using BigQuery, Looker, and interactive reporting activities. Lab access terms may vary.','https://www.skills.google/paths/18/course_templates/578','Beginner',true,array['Data Analyst','Business Analyst'],'Data','English','Varies','Available',null,false,'2026-11-18','published'),
('google-python-data-analysis','Introduction to Data Analysis Using Python','Google Skills','Learn Python fundamentals and how data professionals apply Python to analysis tasks.','https://www.skills.google/course_templates/1226','Beginner',true,array['Data Analyst','Data Scientist','Python Developer'],'Data','English','Varies','Available',null,false,'2026-11-18','published')
on conflict(slug) do update set title=excluded.title,provider=excluded.provider,description=excluded.description,url=excluded.url,level=excluded.level,is_published=true,career_roles=excluded.career_roles,category=excluded.category,language=excluded.language,pricing_type=excluded.pricing_type,certificate_availability=excluded.certificate_availability,last_verified=excluded.last_verified,course_status='published',updated_at=now();

insert into public.course_skills(course_id,skill)
select c.id,s.skill from public.courses c join (values
('coursera-sql-data-science','SQL'),('coursera-sql-data-science','Data analysis'),('coursera-sql-data-science','Data quality'),
('coursera-statistics-python','Statistics'),('coursera-statistics-python','Python'),('coursera-statistics-python','Probability'),('coursera-statistics-python','Model evaluation'),
('coursera-excel-data-analysis','Excel'),('coursera-excel-data-analysis','Spreadsheets'),('coursera-excel-data-analysis','Data analysis'),('coursera-excel-data-analysis','Pivot tables'),
('coursera-google-data-analytics','SQL'),('coursera-google-data-analytics','Spreadsheets'),('coursera-google-data-analytics','Data analysis'),('coursera-google-data-analytics','Data visualization'),
('udemy-python-absolute-beginners','Python'),('udemy-python-absolute-beginners','Programming'),('udemy-python-absolute-beginners','Problem solving'),
('edx-ibm-analyzing-data-python','Python'),('edx-ibm-analyzing-data-python','Pandas'),('edx-ibm-analyzing-data-python','NumPy'),('edx-ibm-analyzing-data-python','Data visualization'),
('fcc-python-programming-fundamentals','Python'),('fcc-python-programming-fundamentals','Data structures'),('fcc-python-programming-fundamentals','Object-oriented programming'),
('fcc-relational-databases','SQL'),('fcc-relational-databases','Relational databases'),('fcc-relational-databases','Database design'),
('microsoft-power-bi-visualize','Power BI'),('microsoft-power-bi-visualize','Data visualization'),('microsoft-power-bi-visualize','Data transformation'),
('microsoft-query-t-sql','SQL'),('microsoft-query-t-sql','Transact-SQL'),('microsoft-query-t-sql','Databases'),
('kaggle-intro-sql','SQL'),('kaggle-intro-sql','BigQuery'),('kaggle-intro-sql','Data analysis'),
('kaggle-python','Python'),('kaggle-python','Programming'),('kaggle-python','Data structures'),
('kaggle-machine-learning','Machine Learning'),('kaggle-machine-learning','Python'),('kaggle-machine-learning','Model evaluation'),
('google-cloud-data-analytics-essentials','Data analysis'),('google-cloud-data-analytics-essentials','BigQuery'),('google-cloud-data-analytics-essentials','Looker'),('google-cloud-data-analytics-essentials','Data visualization'),
('google-python-data-analysis','Python'),('google-python-data-analysis','Pandas'),('google-python-data-analysis','Data analysis')
) as s(slug,skill) on s.slug=c.slug on conflict(course_id,skill) do nothing;

-- Only same-provider official domains can be destinations. Affiliate URLs stay inactive until explicitly approved.
create or replace function private.course_destination_is_valid(p_provider text,p_url text)
returns boolean language sql immutable set search_path = '' as $$
 select p_url ~* case p_provider
  when 'Coursera' then '^https://([a-z0-9-]+\.)*coursera\.org(/|$)'
  when 'Udemy' then '^https://([a-z0-9-]+\.)*udemy\.com(/|$)'
  when 'edX' then '^https://([a-z0-9-]+\.)*edx\.org(/|$)'
  when 'freeCodeCamp' then '^https://([a-z0-9-]+\.)*freecodecamp\.org(/|$)'
  when 'Microsoft Learn' then '^https://learn\.microsoft\.com(/|$)'
  when 'Kaggle Learn' then '^https://([a-z0-9-]+\.)*kaggle\.com(/|$)'
  when 'Google Skills' then '^https://([a-z0-9-]+\.)*(skills\.google|cloudskillsboost\.google)(/|$)'
  else '^$' end;
$$;
revoke all on function private.course_destination_is_valid(text,text) from public,anon,authenticated;

create or replace function public.course_outbound(p_slug text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_course public.courses%rowtype; v_destination text; v_url text; v_click_id uuid;
begin
 select * into v_course from public.courses c where c.slug=p_slug and c.is_published and c.course_status='published';
 if not found or not private.course_destination_is_valid(v_course.provider,v_course.url) then return jsonb_build_object('ok',false,'reason','course_unavailable'); end if;
 v_destination:='official'; v_url:=v_course.url;
 if v_course.affiliate_approved and v_course.affiliate_url is not null and private.course_destination_is_valid(v_course.provider,v_course.affiliate_url) then v_destination:='affiliate';v_url:=v_course.affiliate_url; end if;
 insert into public.course_clicks(course_id,destination) values(v_course.id,v_destination) returning id into v_click_id;
 return jsonb_build_object('ok',true,'url',v_url,'destination',v_destination,'click_id',v_click_id);
end;
$$;
revoke all on function public.course_outbound(text) from public;
grant execute on function public.course_outbound(text) to anon,authenticated;
