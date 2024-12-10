const multer = require("multer");
const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (typeof file !== "string") {
      cb(null, "uploads");
    } else cb(null);
  },
  filename: (req, file, cb) => {
    if (typeof file !== "string") {
      const ext = file.mimetype.split("/")[1];
      cb(null, `${file.fieldname}-${Date.now()}.${ext}`);
    } else cb(null);
  },
});

module.exports = multer({ storage: multerStorage });