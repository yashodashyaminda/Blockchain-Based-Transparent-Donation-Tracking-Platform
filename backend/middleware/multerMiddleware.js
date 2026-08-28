// backend/middleware/multerMiddleware.js
const multer = require('multer');

// Configure storage for temporary file uploads to memory (no local disk files)
const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // Limit file size to 10MB
});

module.exports = upload;