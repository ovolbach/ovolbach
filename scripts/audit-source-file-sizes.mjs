import { readFile, writeFile } from 'node:fs/promises';

const sources = JSON.parse(await readFile(new URL('../src/data/sources.json', import.meta.url), 'utf8'));
const auditDate = new Date().toISOString().slice(0, 10);
const output = new URL(`../docs/source-file-sizes-${auditDate}.json`, import.meta.url);
const directFilePath = /\.(?:pdf|csv|xlsx?|docx?|odt|rtf|txt|zip|jpg|jpeg|png|gif|svg|webp|mp[34]|mov|webm|ogg|wav)$/i;
const downloadPath = /(?:download|conversion\/pdf|\/dokument\/|\/documentpreview)/i;
const contentTypeForFile = /(?:application\/(?:pdf|zip|octet-stream|vnd\.|msword)|text\/csv|image\/|audio\/|video\/)/i;

function sizeFromHeaders(response) {
  const contentRange = response.headers.get('content-range');
  const rangeTotal = contentRange?.match(/\/(\d+)$/)?.[1];
  if (rangeTotal) return { bytes: Number(rangeTotal), method: 'content-range' };
  const contentLength = response.headers.get('content-length');
  if (contentLength && response.status !== 206) return { bytes: Number(contentLength), method: 'content-length' };
  return { bytes: null, method: null };
}

async function request(url, method, range = false) {
  return fetch(url, {
    method,
    redirect: 'follow',
    headers: {
      'Accept-Encoding': 'identity',
      ...(range ? { Range: 'bytes=0-0' } : {}),
    },
    signal: AbortSignal.timeout(15000),
  });
}

async function inspect(source) {
  const url = new URL(source.url);
  const likelyFile = directFilePath.test(url.pathname) || downloadPath.test(url.pathname);
  const row = { id: source.id, sourceType: source.type, url: source.url, likelyFile };
  let head;
  try {
    head = await request(source.url, 'HEAD');
    row.headStatus = head.status;
    row.finalUrl = head.url;
    row.contentType = head.headers.get('content-type');
    row.contentDisposition = head.headers.get('content-disposition');
    Object.assign(row, sizeFromHeaders(head));
  } catch (error) {
    row.headError = error.message;
  }

  const typeSaysFile = contentTypeForFile.test(row.contentType ?? '');
  const needsRange = likelyFile || typeSaysFile || !head?.ok || !row.contentType;
  if (needsRange) {
    try {
      const response = await request(source.url, 'GET', true);
      row.rangeStatus = response.status;
      row.finalUrl = response.url;
      row.contentType = response.headers.get('content-type') ?? row.contentType;
      row.contentDisposition = response.headers.get('content-disposition') ?? row.contentDisposition;
      const size = sizeFromHeaders(response);
      if (size.bytes !== null) Object.assign(row, size);
      await response.body?.cancel();
    } catch (error) {
      row.rangeError = error.message;
    }
  }

  const finalPath = new URL(row.finalUrl ?? row.url).pathname;
  const html = /text\/html|application\/xhtml\+xml/i.test(row.contentType ?? '');
  row.isFile = !html && (contentTypeForFile.test(row.contentType ?? '') || directFilePath.test(finalPath) || /attachment/i.test(row.contentDisposition ?? ''));
  if (row.isFile && row.bytes == null) {
    try {
      const response = await fetch(source.url, {
        headers: { 'Accept-Encoding': 'identity' },
        signal: AbortSignal.timeout(60000),
      });
      if (response.ok && response.body) {
        let bytes = 0;
        for await (const chunk of response.body) {
          bytes += chunk.byteLength;
          if (bytes > 100 * 1048576) {
            await response.body.cancel();
            throw new Error('file exceeds 100 MiB measurement cap');
          }
        }
        row.bytes = bytes;
        row.method = 'counted-body';
      }
    } catch (error) {
      row.bodyError = error.message;
    }
  }
  return row;
}

const rows = Array(sources.length);
let next = 0;
let finished = 0;
async function worker() {
  while (next < sources.length) {
    const index = next++;
    rows[index] = await inspect(sources[index]);
    finished++;
    if (finished % 25 === 0) console.log(`checked ${finished}/${sources.length}`);
  }
}

await Promise.all(Array.from({ length: 6 }, () => worker()));
await writeFile(output, JSON.stringify({ checkedAt: new Date().toISOString(), rows }, null, 2) + '\n');
console.log(`saved ${rows.length} rows to ${output.pathname}`);
