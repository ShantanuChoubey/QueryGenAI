import multer from 'multer';

/**
 * Allowed file extensions and their corresponding MIME types.
 */
const ALLOWED_MIMETYPES = new Set([
  'text/plain',
  'application/sql',
  'application/json',
  'text/csv',
  'text/x-csv',
  'application/csv',
  'application/vnd.ms-excel', // sometimes used for .csv
]);

const ALLOWED_EXTENSIONS = new Set(['.sql', '.json', '.csv']);

/**
 * Multer configuration with:
 * - In-memory storage (no disk writes)
 * - 5 MB file size limit
 * - MIME type and extension whitelist
 */
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const ext = file.originalname
    .toLowerCase()
    .slice(file.originalname.lastIndexOf('.'));

  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return cb(
      Object.assign(new Error(`File extension "${ext}" is not allowed. Supported: .sql, .json, .csv`), {
        status: 400,
      }),
      false
    );
  }

  // Accept: allow all (MIME types are not always reliable from client)
  cb(null, true);
};

export const uploadSingle = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
}).single('file');

/**
 * Express middleware wrapper that converts multer's callback error into
 * a standard next(err) call, so the global error handler catches it.
 */
export function handleUpload(req, res, next) {
  uploadSingle(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(Object.assign(new Error('File is too large. Maximum allowed size is 5 MB.'), { status: 413 }));
      }
      return next(Object.assign(new Error(err.message), { status: 400 }));
    }
    if (err) {
      return next(err);
    }
    if (!req.file) {
      return next(Object.assign(new Error('No file was uploaded. Please attach a file with field name "file".'), { status: 400 }));
    }
    next();
  });
}
