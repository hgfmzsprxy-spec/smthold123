-- One-time cleanup: strip embedded base64 from protection_logs.screenshots.
-- Keep storage path + meta only. Huge jsonb blobs were causing /api/admin/protection-logs 500s.
--
-- Run in Supabase SQL Editor after deploying the API that omits screenshots from list GET.

UPDATE public.protection_logs
SET screenshots = COALESCE(
  (
    SELECT jsonb_agg(
      jsonb_strip_nulls(
        jsonb_build_object(
          'path', NULLIF(trim(both FROM coalesce(elem->>'path', '')), ''),
          'monitor', elem->'monitor',
          'width', elem->'width',
          'height', elem->'height',
          'mime', NULLIF(trim(both FROM coalesce(elem->>'mime', '')), '')
        )
      )
    )
    FROM jsonb_array_elements(
      CASE
        WHEN jsonb_typeof(screenshots) = 'array' THEN screenshots
        ELSE '[]'::jsonb
      END
    ) AS elem
    WHERE NULLIF(trim(both FROM coalesce(elem->>'path', '')), '') IS NOT NULL
  ),
  '[]'::jsonb
)
WHERE screenshots::text LIKE '%"data"%'
   OR screenshots::text LIKE '%"base64"%'
   OR screenshots::text LIKE '%"b64"%';
