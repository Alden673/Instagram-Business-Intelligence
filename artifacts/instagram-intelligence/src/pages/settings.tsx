import { useState } from 'react';
import {
  Check,
  FileJson,
  FileUp,
  Info,
  Instagram,
  Trash2,
} from 'lucide-react';

import {
  useAnalyzeInstagramData,
  useLoadInstagramDemo,
} from '@workspace/api-client-react';

import type {
  InstagramAnalysis,
  InstagramPost,
} from '@workspace/api-client-react';

import { Button } from '@/components/ui/button';

type SettingsProps = {
  analysis: InstagramAnalysis | null;
  onAnalysis: (analysis: InstagramAnalysis) => void;
  onClear: () => void;
};

/* =========================================================
   BUILT-IN SAMPLE DATA
   ========================================================= */

const SAMPLE_POSTS: InstagramPost[] = [
  {
    id: 'p-01',
    date: '2026-08-21',
    caption: 'The 3-minute morning ritual that changed my focus.',
    contentType: 'Reel',
    reach: 8420,
    likes: 684,
    comments: 74,
    saves: 286,
    shares: 119,
    engagementRate: 13.8,
  },
  {
    id: 'p-02',
    date: '2026-08-18',
    caption: 'A behind-the-scenes look at our Sunday bake.',
    contentType: 'Carousel',
    reach: 6210,
    likes: 512,
    comments: 42,
    saves: 168,
    shares: 54,
    engagementRate: 12.5,
  },
  {
    id: 'p-03',
    date: '2026-08-15',
    caption: 'New seasonal menu: bright, fresh, and made for sharing.',
    contentType: 'Image',
    reach: 4070,
    likes: 238,
    comments: 19,
    saves: 44,
    shares: 8,
    engagementRate: 7.6,
  },
  {
    id: 'p-04',
    date: '2026-08-12',
    caption: 'What would you add to the perfect workday playlist?',
    contentType: 'Reel',
    reach: 7330,
    likes: 602,
    comments: 89,
    saves: 218,
    shares: 93,
    engagementRate: 13.7,
  },
  {
    id: 'p-05',
    date: '2026-08-09',
    caption: 'Five details we never skip when styling a table.',
    contentType: 'Carousel',
    reach: 5660,
    likes: 451,
    comments: 31,
    saves: 140,
    shares: 37,
    engagementRate: 11.6,
  },
  {
    id: 'p-06',
    date: '2026-08-06',
    caption: 'A quiet corner for your next catch-up.',
    contentType: 'Image',
    reach: 2980,
    likes: 151,
    comments: 11,
    saves: 22,
    shares: 5,
    engagementRate: 6.3,
  },
  {
    id: 'p-07',
    date: '2026-08-03',
    caption: "Meet the maker: our founder's favorite local spots.",
    contentType: 'Story',
    reach: 1880,
    likes: 104,
    comments: 7,
    saves: 10,
    shares: 2,
    engagementRate: 6.5,
  },
  {
    id: 'p-08',
    date: '2026-07-30',
    caption: 'The ingredients behind our signature blend.',
    contentType: 'Reel',
    reach: 6540,
    likes: 490,
    comments: 61,
    saves: 194,
    shares: 76,
    engagementRate: 12.5,
  },
];

/* =========================================================
   SETTINGS PAGE
   ========================================================= */

export default function Settings({
  analysis,
  onAnalysis,
  onClear,
}: SettingsProps) {
  const demo = useLoadInstagramDemo();
  const analyze = useAnalyzeInstagramData();

  const [fileName, setFileName] = useState('');
  const [uploadError, setUploadError] = useState('');

  const isBusy = demo.isPending || analyze.isPending;

  /* =======================================================
     LOAD SAMPLE ACCOUNT

     First tries the backend /instagram/demo endpoint.

     If that fails, it sends the built-in sample posts
     through /instagram/analyze instead.
     ======================================================= */

  const loadDemo = () => {
    setUploadError('');

    demo.mutate(undefined, {
      onSuccess: (result) => {
        setFileName('Sample Instagram account');
        onAnalysis(result);
      },

      onError: () => {
        console.warn(
          'Demo endpoint failed. Falling back to built-in sample data.',
        );

        analyze.mutate(
          {
            data: {
              posts: SAMPLE_POSTS,
            },
          },
          {
            onSuccess: (result) => {
              setFileName('Sample Instagram account');
              onAnalysis(result);
            },

            onError: (error) => {
              console.error('Sample account failed:', error);

              setUploadError(
                'Unable to load the sample account. Make sure the API server is running.',
              );
            },
          },
        );
      },
    });
  };

  /* =======================================================
     FILE UPLOAD
     ======================================================= */

  const onUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setFileName(file.name);
    setUploadError('');

    try {
      const extension = file.name
        .toLowerCase()
        .split('.')
        .pop();

      if (extension !== 'csv' && extension !== 'json') {
        throw new Error(
          'Only CSV and JSON files are supported.',
        );
      }

      const text = await file.text();

      if (!text.trim()) {
        throw new Error('The selected file is empty.');
      }

      let posts: InstagramPost[];

      if (extension === 'json') {
        posts = parseJson(text);
      } else {
        posts = parseCsv(text);
      }

      if (!posts.length) {
        throw new Error(
          'No valid Instagram posts were found.',
        );
      }

      console.log(
        `Uploading ${posts.length} Instagram posts...`,
      );

      analyze.mutate(
        {
          data: {
            posts,
          },
        },
        {
          onSuccess: (result) => {
            console.log(
              'Instagram analysis completed successfully.',
            );

            onAnalysis(result);
            setUploadError('');
          },

          onError: (error) => {
            console.error(
              'Instagram analysis failed:',
              error,
            );

            setUploadError(
              'The file was read successfully, but the server could not analyze it. Check that the API server is running.',
            );
          },
        },
      );
    } catch (error) {
      console.error('File parsing failed:', error);

      setUploadError(
        error instanceof Error
          ? error.message
          : 'That file could not be analyzed. Check that it contains Instagram post metrics.',
      );
    }

    // Allow selecting the same file again.
    event.target.value = '';
  };

  /* =======================================================
     UI
     ======================================================= */

  return (
    <div className="mx-auto max-w-4xl">
      {/* HEADER */}

      <div className="mb-9">
        <div className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-primary">
          Account / settings
        </div>

        <h1 className="mt-2 font-display text-4xl font-semibold tracking-[-.045em]">
          Your data,{' '}
          <span className="text-primary">
            your call.
          </span>
        </h1>

        <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">
          Choose the source behind your weekly signals.
          Nothing is posted to Instagram from here.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-[1.15fr_.85fr]">
        {/* =================================================
            UPLOAD SECTION
            ================================================= */}

        <section className="rounded-2xl border border-card-border bg-card p-6 shadow-[0_8px_24px_hsl(var(--foreground)/.035)]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Instagram size={20} />
            </div>

            <div>
              <h2 className="font-display text-lg font-semibold">
                Instagram analytics
              </h2>

              <p className="text-xs text-muted-foreground">
                CSV or JSON post export
              </p>
            </div>

            <span
              className={`ml-auto flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono-ui text-[9px] uppercase tracking-wider ${
                analysis
                  ? 'bg-accent/10 text-accent'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  analysis
                    ? 'bg-accent'
                    : 'bg-muted-foreground/50'
                }`}
              />

              {analysis ? 'Connected' : 'Not connected'}
            </span>
          </div>

          {/* UPLOAD BOX */}

          <div className="mt-7 rounded-xl border border-dashed border-border bg-background px-5 py-6 text-center">
            <FileUp
              className="mx-auto text-primary"
              size={23}
            />

            <div className="mt-3 text-sm font-semibold">
              {analyze.isPending
                ? 'Analyzing your export…'
                : fileName || 'Upload a fresh export'}
            </div>

            <p className="mt-1 text-xs text-muted-foreground">
              Use a CSV or JSON file with post-level reach
              and engagement metrics.
            </p>

            <label
              className="mt-4 inline-flex cursor-pointer items-center rounded-lg bg-secondary px-3 py-2 text-xs font-semibold hover:bg-primary/10"
              data-testid="label-upload-settings"
            >
              {analyze.isPending
                ? 'Analyzing…'
                : 'Choose file'}

              <input
                type="file"
                accept=".csv,.json,text/csv,application/json"
                onChange={onUpload}
                disabled={isBusy}
                className="sr-only"
                data-testid="input-upload-settings"
              />
            </label>

            {uploadError && (
              <div
                className="mt-3 rounded-lg bg-primary/5 px-3 py-2 text-xs text-primary"
                data-testid="status-settings-upload-error"
              >
                {uploadError}
              </div>
            )}

            {analysis && !uploadError && (
              <div className="mt-3 text-xs text-accent">
                ✓ Account data loaded successfully.
              </div>
            )}
          </div>

          {/* INFO */}

          <div className="mt-5 flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground">
            <Info
              size={14}
              className="mt-0.5 shrink-0 text-primary"
            />

            <span>
              Your file is analyzed in this workspace
              session and becomes the source for the
              overview, content planner, recommendations,
              and AI assistant.
            </span>
          </div>
        </section>

        {/* =================================================
            WORKSPACE CONTROLS
            ================================================= */}

        <section className="rounded-2xl border border-card-border bg-card p-6 shadow-[0_8px_24px_hsl(var(--foreground)/.035)]">
          <div className="font-mono-ui text-[10px] uppercase tracking-[.17em] text-muted-foreground">
            Workspace controls
          </div>

          <h2 className="mt-2 font-display text-lg font-semibold">
            Keep exploring
          </h2>

          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Load a prepared Instagram account or clear
            the current analysis from this session.
          </p>

          {/* LOAD SAMPLE */}

          <Button
            type="button"
            onClick={loadDemo}
            disabled={isBusy}
            variant="outline"
            className="mt-6 w-full justify-start"
            data-testid="button-load-demo-settings"
          >
            <FileJson size={16} />

            {demo.isPending
              ? 'Loading sample…'
              : analyze.isPending
                ? 'Preparing sample…'
                : 'Load sample account'}
          </Button>

          {/* CLEAR */}

          {analysis && (
            <Button
              type="button"
              onClick={() => {
                setFileName('');
                setUploadError('');
                onClear();
              }}
              disabled={isBusy}
              variant="outline"
              className="mt-3 w-full justify-start text-destructive hover:text-destructive"
              data-testid="button-clear-analysis"
            >
              <Trash2 size={16} />
              Clear current analysis
            </Button>
          )}

          {/* PRIVACY */}

          <div className="mt-7 border-t border-border pt-5">
            <div className="flex items-center gap-2 text-xs font-semibold">
              <Check
                size={14}
                className="text-accent"
              />

              Private by default
            </div>

            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Your upload stays in this workspace session
              and powers your recommendations and
              assistant context.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

/* =========================================================
   JSON PARSER
   ========================================================= */

function parseJson(text: string): InstagramPost[] {
  const parsed = JSON.parse(text);

  let rawPosts: unknown = parsed;

  if (
    parsed &&
    typeof parsed === 'object' &&
    !Array.isArray(parsed)
  ) {
    const object = parsed as Record<string, unknown>;

    rawPosts =
      object.posts ??
      object.data ??
      object.items ??
      object.results ??
      [];
  }

  if (!Array.isArray(rawPosts)) {
    throw new Error(
      'JSON must contain an array of Instagram posts.',
    );
  }

  const posts = rawPosts
    .map((post, index) =>
      normalizePost(post, index),
    )
    .filter(
      (post): post is InstagramPost => post !== null,
    );

  if (!posts.length) {
    throw new Error(
      'No valid Instagram posts were found in the JSON file.',
    );
  }

  return posts;
}

/* =========================================================
   CSV PARSER
   ========================================================= */

function parseCsv(text: string): InstagramPost[] {
  const rows = parseCsvRows(text);

  if (rows.length < 2) {
    throw new Error(
      'CSV must contain a header row and at least one post.',
    );
  }

  const headers = rows[0].map((header) =>
    normalizeHeader(header),
  );

  const posts: InstagramPost[] = [];

  for (let i = 1; i < rows.length; i++) {
    const values = rows[i];

    if (
      values.every(
        (value) => !String(value).trim(),
      )
    ) {
      continue;
    }

    const row: Record<string, string> = {};

    headers.forEach((header, index) => {
      row[header] = values[index] ?? '';
    });

    const post = normalizePost(row, i - 1);

    if (post) {
      posts.push(post);
    }
  }

  if (!posts.length) {
    throw new Error(
      'No valid Instagram posts were found in the CSV file.',
    );
  }

  return posts;
}

/* =========================================================
   REAL CSV PARSER

   Handles captions like:

   "This caption, contains commas"

   unlike the old line.split(',') parser.
   ========================================================= */

function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];

  let row: string[] = [];
  let value = '';
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (char === '"') {
      if (
        insideQuotes &&
        text[i + 1] === '"'
      ) {
        value += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }

      continue;
    }

    if (char === ',' && !insideQuotes) {
      row.push(value.trim());
      value = '';
      continue;
    }

    if (
      (char === '\n' || char === '\r') &&
      !insideQuotes
    ) {
      if (
        char === '\r' &&
        text[i + 1] === '\n'
      ) {
        i++;
      }

      row.push(value.trim());
      value = '';

      if (
        row.some(
          (cell) => cell.length > 0,
        )
      ) {
        rows.push(row);
      }

      row = [];

      continue;
    }

    value += char;
  }

  if (value.length > 0 || row.length > 0) {
    row.push(value.trim());

    if (
      row.some(
        (cell) => cell.length > 0,
      )
    ) {
      rows.push(row);
    }
  }

  return rows;
}

/* =========================================================
   NORMALIZE HEADER
   ========================================================= */

function normalizeHeader(
  value: string,
): string {
  return value
    .trim()
    .replace(/^["']|["']$/g, '')
    .replace(/[\s-]+/g, '_')
    .replace(/[A-Z]/g, (letter) =>
      `_${letter.toLowerCase()}`,
    )
    .replace(/^_/, '')
    .toLowerCase();
}

/* =========================================================
   NORMALIZE POST
   ========================================================= */

function normalizePost(
  raw: unknown,
  index: number,
): InstagramPost | null {
  if (
    !raw ||
    typeof raw !== 'object'
  ) {
    return null;
  }

  const source =
    raw as Record<string, unknown>;

  const get = (
    ...keys: string[]
  ): unknown => {
    for (const key of keys) {
      if (
        source[key] !== undefined &&
        source[key] !== null &&
        String(source[key]).trim() !== ''
      ) {
        return source[key];
      }
    }

    return undefined;
  };

  const id = String(
    get(
      'id',
      'post_id',
      'postId',
    ) ?? `upload-${index + 1}`,
  );

  const date = String(
    get(
      'date',
      'created_at',
      'createdAt',
      'timestamp',
    ) ?? '',
  );

  const caption = String(
    get(
      'caption',
      'text',
      'description',
    ) ?? '',
  );

  const contentTypeRaw = String(
    get(
      'content_type',
      'contenttype',
      'contentType',
      'type',
      'media_type',
      'mediaType',
    ) ?? 'Image',
  );

  const contentType =
    normalizeContentType(
      contentTypeRaw,
    );

  const reach = toNumber(
    get(
      'reach',
      'accounts_reached',
      'accountsReached',
    ),
  );

  const likes = toNumber(
    get(
      'likes',
      'like_count',
      'likeCount',
    ),
  );

  const comments = toNumber(
    get(
      'comments',
      'comment_count',
      'commentCount',
    ),
  );

  const saves = toNumber(
    get(
      'saves',
      'save_count',
      'saveCount',
    ),
  );

  const shares = toNumber(
    get(
      'shares',
      'share_count',
      'shareCount',
    ),
  );

  let engagementRate = toNumber(
    get(
      'engagement_rate',
      'engagementrate',
      'engagementRate',
      'engagement',
    ),
  );

  /*
   * If engagementRate wasn't supplied,
   * calculate it from interactions / reach.
   */

  if (
    engagementRate === 0 &&
    reach > 0
  ) {
    const interactions =
      likes +
      comments +
      saves +
      shares;

    engagementRate = Number(
      (
        (interactions / reach) *
        100
      ).toFixed(1),
    );
  }

  /*
   * A post should have at least reach
   * and some engagement information.
   */

  if (
    !date ||
    !Number.isFinite(reach) ||
    reach <= 0
  ) {
    return null;
  }

  return {
    id,
    date,
    caption,
    contentType,
    reach,
    likes,
    comments,
    saves,
    shares,
    engagementRate,
  };
}

/* =========================================================
   NUMBER PARSER
   ========================================================= */

function toNumber(
  value: unknown,
): number {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return 0;
  }

  const cleaned = String(value)
    .replace(/,/g, '')
    .replace(/%/g, '')
    .trim();

  const number = Number(cleaned);

  return Number.isFinite(number)
    ? number
    : 0;
}

/* =========================================================
   CONTENT TYPE NORMALIZER
   ========================================================= */

function normalizeContentType(
  value: string,
): InstagramPost['contentType'] {
  const normalized =
    value.trim().toLowerCase();

  if (
    normalized.includes('reel') ||
    normalized.includes('video')
  ) {
    return 'Reel';
  }

  if (
    normalized.includes('carousel') ||
    normalized.includes('album')
  ) {
    return 'Carousel';
  }

  if (
    normalized.includes('story')
  ) {
    return 'Story';
  }

  return 'Image';
}