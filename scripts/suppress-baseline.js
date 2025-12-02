// Suppress noisy baseline-browser-mapping warning during dev startup
// This file is intentionally minimal and only filters the specific message.
const origLog = console.log.bind(console);
const origWarn = console.warn.bind(console);

function shouldSuppress(args) {
  try {
    if (!args || args.length === 0) return false;
    const first = String(args[0]);
    return first.includes('[baseline-browser-mapping] The data in this module is over two months old');
  } catch (e) {
    return false;
  }
}

console.log = (...args) => {
  if (shouldSuppress(args)) return;
  origLog(...args);
};

console.warn = (...args) => {
  if (shouldSuppress(args)) return;
  origWarn(...args);
};

// Also silently ignore the message if it's emitted via process.stdout.write
const origStdoutWrite = process.stdout.write.bind(process.stdout);
process.stdout.write = (chunk, encoding, callback) => {
  try {
    const s = String(chunk);
    if (s.includes('[baseline-browser-mapping] The data in this module is over two months old')) {
      if (typeof callback === 'function') callback();
      return true;
    }
  } catch (e) {}
  return origStdoutWrite(chunk, encoding, callback);
};

// No export; module is meant to be preloaded with `-r`.
