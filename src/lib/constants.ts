/** Days after expiration during which login shows "account expired" message */
export const EXPIRED_GRACE_DAYS = 3

/** Default account expiry in days from creation */
export const DEFAULT_EXPIRY_DAYS = 10

/** Cookie / JWT token lifetime in seconds (7 days) */
export const TOKEN_MAX_AGE = 60 * 60 * 24 * 7

/** S3 presigned URL expiration in seconds */
export const PRESIGNED_URL_EXPIRY = 3600

/** Chunked upload: single chunk size in bytes (10 MB) */
export const UPLOAD_CHUNK_SIZE = 10 * 1024 * 1024

/** Chunked upload: files above this threshold bypass Payload buffer (1.5 GB) */
export const UPLOAD_BUFFER_THRESHOLD = 1.5 * 1024 * 1024 * 1024

/** Orphaned tmp directories older than this are cleaned up (1 hour) */
export const TMP_CLEANUP_CUTOFF_MS = 60 * 60 * 1000

/** Shared image sizes for Media and GalleryImages collections */
export const IMAGE_SIZES = [
  { name: 'thumbnail' as const, width: 400, height: 300, position: 'centre' as const },
  { name: 'card' as const, width: 768, height: 512, position: 'centre' as const },
  { name: 'full' as const, width: 1920, height: undefined, position: 'centre' as const },
]

/** File category options shared between ClientFiles and ZipCache */
export const FILE_CATEGORIES = [
  { label: 'Zdjecie', value: 'photo' },
  { label: 'Film', value: 'video' },
] as const
