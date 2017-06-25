import ProgressBar from 'progress';
import chalk from 'chalk';
import https from 'https';
import fs from 'fs';
import url from 'url';

let DIR = './photos_gallery';

/**
 * All GroupMe photos either are, or end with, a 32 digit hash.
 * @param  {String} URL to a GroupMe image or video
 * @return {String} '<hash>.<extension>'
 */
function renameFile (file) {
  if (typeof file !== 'string') {
    console.log("WARN: file is not a string!")
    return "<hash>.<extension>"
  }
  let _url = url.parse(file);
  let host = _url.hostname;
  let isImage = host === 'i.groupme.com';
  let hash, fileTypes;

  if (isImage) {
    hash = /(.{32})\s*$/.exec(file)[0];
    fileTypes = /\.(png|jpeg|jpg|gif|bmp)/;
  } else {
    hash = /([^/]+$)/.exec(file)[0].split('.')[0];
    fileTypes = /\.(mp4|mov|wmv|mkv)/;
  }

  let fileType = fileTypes.exec(file);
  let extension;
  if (fileType === null) {
    extension = ".unknown"
  } else {
    extension = fileType[0]
  }
  return `${hash}${extension}`;
}

/**
 * @param  {Array} Flat array of GroupMe photo URL's
 * @return {[type]}
 */
export default function (photos, group_id) {
  let galleryDir = DIR + "/" + group_id;
  let hasDir = fs.existsSync(galleryDir);
  let totalPhotos = photos.length;

  // Create the photo dump directory
  if (!hasDir) fs.mkdirSync(galleryDir);

  // If the folder exists and is not empty
  if (hasDir && !!fs.readdirSync(galleryDir).length) {
    console.log(chalk.red(`Error: The directory - ${galleryDir} - is not empty and can not continue.`));
    process.exit();
    return;
  }

  // Recursive downloader
  let downloader = (arr, curr = 0) => {
    if (arr.length) {

      // Move on to the next one if the URL is malformed or undefined.
      if (!arr[0]) {
        arr = arr.splice(1, arr.length - 1);
        curr = curr + 1;
        downloader(arr, curr);
      }

      let URL = arr[0];
      let fileName = renameFile(URL);
      let file = fs.createWriteStream(`${galleryDir}/${fileName}`);

      // Could probably use https.get here, but still want to spoof being a browser.
      let request = https.request({
        host: url.parse(URL).host,
        path: url.parse(URL).pathname,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/47.0.2526.106 Safari/537.36',
          'Referer': 'https://app.groupme.com/chats'
        }
      });

      request.on('response', response => {
        let total = Number(response.headers['content-length']);
        let bar = new ProgressBar(`Downloading [:bar] [${curr} / ${totalPhotos}]`, {
          complete: '=',
          incomplete: '-',
          width: 20,
          total: total
        });

        response.on('data', chunk => {
          file.write(chunk);
          bar.tick(chunk.length);
        });

        response.on('end', () => {
          file.end();
          arr = arr.splice(1, arr.length - 1);
          curr = curr + 1;
          downloader(arr, curr);
        });
      });

      request.end();

      request.on('error', error => {
        console.error('Error with connector:', '\n', error.stack);
      });
    }
  }

  if (photos.length) {
    downloader(photos);
  }
}
