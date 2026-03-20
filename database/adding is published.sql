-- migration: add IsPublished column to StudentProfiles
-- run this in SSMS on GradeAndGrindDB
-- only needed if you already ran the original Grade&GrindDB.sql

use GradeAndGrindDB;
go

-- add IsPublished column if it doesn't exist
if not exists (
  select 1 from sys.columns
  where object_id = object_id('StudentProfiles')
    and name = 'IsPublished'
)
begin
  alter table StudentProfiles
  add IsPublished bit default 0;
  print 'IsPublished column added.';
end
else
begin
  print 'IsPublished column already exists.';
end
go