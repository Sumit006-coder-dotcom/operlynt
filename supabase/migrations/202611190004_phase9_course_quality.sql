-- Refresh items whose provider metadata was verified during Phase 9.
update public.courses set title='Introduction to Data Analysis Using Excel',last_verified='2026-11-19',updated_at=now()
where slug='coursera-excel-data-analysis';
update public.courses set url='https://career.skills.google/course_templates/1226',last_verified='2026-11-19',updated_at=now()
where slug='google-python-data-analysis';
update public.courses set last_verified='2026-11-19',updated_at=now()
where slug in ('coursera-sql-data-science','coursera-statistics-python','coursera-google-data-analytics','udemy-python-absolute-beginners','edx-ibm-analyzing-data-python','fcc-python-programming-fundamentals','fcc-relational-databases','microsoft-power-bi-visualize','microsoft-query-t-sql','kaggle-intro-sql','kaggle-python','kaggle-machine-learning','google-cloud-data-analytics-essentials');
update public.courses set affiliate_approved=false,updated_at=now()
where affiliate_approved and (affiliate_url is null or not private.course_destination_is_valid(provider,affiliate_url));
