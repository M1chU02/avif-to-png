const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const archiver = require('archiver');
const path = require('path');
const fs = require('fs');

const app = express();
// accept many files, allow reasonably large uploads
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 50 * 1024 * 1024 } // 50 MiB per file
});

// Serve the UI
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Multiple file upload handler
app.post('/upload', upload.array('avif', 20), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).send('No files uploaded');
  }

  // If only one file, return PNG directly instead of zip
  if (req.files.length === 1) {
    const file = req.files[0];
    const inputPath = file.path;
    const baseName = path.parse(file.originalname).name;
    try {
      const pngBuffer = await sharp(inputPath).png().toBuffer();
      res.set({
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="${baseName}.png"`
      });
      res.send(pngBuffer);
    } catch (e) {
      console.error('Conversion error for', file.originalname, e);
      res.status(500).send(`Error converting ${file.originalname}: ${e.message}`);
    } finally {
      // remove temp upload
      fs.unlink(inputPath, () => {});
    }
    return; // done
  }

  // Prepare zip response
  res.set({
    'Content-Type': 'application/zip',
    'Content-Disposition': 'attachment; filename="converted_pngs.zip"'
  });
  const archive = archiver('zip', { zlib: { level: 9 } });
  archive.on('error', err => {
    console.error('Archive error', err);
    return res.status(500).end();
  });
  archive.pipe(res);

  // Process each file
  for (const file of req.files) {
    const inputPath = file.path;
    const baseName = path.parse(file.originalname).name;
    try {
      const pngBuffer = await sharp(inputPath).png().toBuffer();
      archive.append(pngBuffer, { name: `${baseName}.png` });
    } catch (e) {
      console.error('Conversion error for', file.originalname, e);
      archive.append(`Error converting ${file.originalname}: ${e.message}`,
        { name: `${baseName}_ERROR.txt` });
    } finally {
      // remove temp upload
      fs.unlink(inputPath, () => {});
    }
  }

  // finalize zip
  await archive.finalize();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}`);
});
