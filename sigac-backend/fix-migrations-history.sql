-- Resgistrer migrations that exist on Render but missing from history
INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES 
  ('20260115220405_AddVideoCallEntity', '8.0.0'),
  ('20260116091258_AddIceCandidatesToVideoCall', '8.0.0')
ON CONFLICT DO NOTHING;
