import { copyFileSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const COMPETITION = "gta6-meme-x-01";
const BOUNTY_NAME = "Post a GTA 6 meme on X";
const BOUNTY_URL = "https://make.fun/bounty/gta6-meme-x-01";

function fail(reason: string, detail?: string): never {
  console.error(`error: validation failed: ${reason}`);
  if (detail) {
    console.error(`detail: ${detail}`);
  }
  console.error(
    `expected: POST.json with {"url": "https://x.com/<account>/status/<numeric_status_id>"} for bounty ${BOUNTY_URL}`,
  );
  process.exit(1);
}

function main(): void {
  const here = dirname(fileURLToPath(import.meta.url));
  const postPath = join(here, "POST.json");

  let raw: string;
  try {
    raw = readFileSync(postPath, "utf8");
  } catch (e) {
    fail(
      `could not read POST.json`,
      `path=${postPath} reason=${e instanceof Error ? e.message : String(e)}`,
    );
  }

  let data: unknown;
  try {
    data = JSON.parse(raw!);
  } catch (e) {
    fail(
      "POST.json is not valid JSON",
      `parse_error=${e instanceof Error ? e.message : String(e)} content=${raw!.slice(0, 120)}`,
    );
  }

  const url =
    data !== null && typeof data === "object" && "url" in data
      ? (data as { url: unknown }).url
      : undefined;

  if (typeof url !== "string" || url.length === 0) {
    fail(
      `POST.json does not contain a non-empty string field "url"`,
      `field "url" was ${url === undefined ? "missing" : `type=${typeof url} value=${JSON.stringify(url)}`}`,
    );
  }

  const placeholderToken = ["REPLACE", "PLACEHOLDER", "YOUR_"].find((t) =>
    url!.includes(t),
  );
  if (placeholderToken) {
    fail(
      "url still contains a placeholder value and is not a real post URL",
      `matched_placeholder=${placeholderToken} url=${url}`,
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(url!);
  } catch (e) {
    fail(
      `url is not a parseable URL`,
      `url=${url} reason=${e instanceof Error ? e.message : String(e)}`,
    );
  }

  if (parsed.protocol !== "https:") {
    fail(
      `url must use https, not ${parsed.protocol}`,
      `url=${url} protocol=${parsed.protocol}`,
    );
  }

  const host = parsed.hostname;
  if (host !== "x.com" && host !== "twitter.com" && host !== "www.twitter.com") {
    fail(
      `url host must be x.com or twitter.com`,
      `got host=${host} url=${url}`,
    );
  }

  // Expected path: /<account>/status/<status_id>
  const parts = parsed.pathname.split("/").filter((p) => p.length > 0);
  if (parts.length !== 3 || parts[1] !== "status") {
    fail(
      `url path must be /<account>/status/<status_id> (exactly 3 segments, middle segment "status")`,
      `got path=${parsed.pathname} segments=[${parts.join(", ")}] count=${parts.length}`,
    );
  }

  const account = parts[0];
  const statusId = parts[2];

  if (!/^[A-Za-z0-9_]{1,15}$/.test(account)) {
    fail(
      `invalid X account handle (must be 1-15 chars of letters, digits, or underscore)`,
      `got account=${account}`,
    );
  }

  if (!/^[0-9]+$/.test(statusId)) {
    fail(
      `status id must be numeric only`,
      `got status_id=${statusId} (non-numeric characters: ${statusId.replace(/[0-9]/g, "") || "none"})`,
    );
  }

  const valid = true;
  const placeholder = false;

  console.log(`bounty: ${BOUNTY_NAME} (${COMPETITION})`);
  console.log(`competition: ${COMPETITION}`);
  console.log(`bounty_url: ${BOUNTY_URL}`);
  console.log(`url: ${url}`);
  console.log(`post_url: ${url}`);
  console.log(`host: ${host}`);
  console.log(`account: ${account}`);
  console.log(`status_id: ${statusId}`);
  console.log(`format: ${valid ? "valid" : "invalid"}`);
  console.log(`placeholder: ${placeholder ? "yes" : "no"}`);
  console.log(
    `summary_bounty: ${BOUNTY_NAME} (${COMPETITION}) at ${BOUNTY_URL}`,
  );
  console.log(
    `summary_post: @${account} posted ${url} (status ${statusId} on ${host})`,
  );
  console.log(
    `summary: entry for ${BOUNTY_URL} is the X post ${url} by @${account}`,
  );

  const outputDir = process.env.MAKEFUN_OUTPUT_DIR;
  if (outputDir) {
    mkdirSync(outputDir, { recursive: true });
    const copiedPostPath = join(outputDir, "POST.json");
    copyFileSync(postPath, copiedPostPath);
    console.log(`copied_post: ${copiedPostPath}`);
    const summary = {
      competition: COMPETITION,
      bounty_url: BOUNTY_URL,
      url: url,
      post_url: url,
      host: host,
      account: account,
      status_id: statusId,
    };
    const outPath = join(outputDir, "post-summary.json");
    writeFileSync(outPath, JSON.stringify(summary, null, 2) + "\n", "utf8");
    console.log(`summary_file: ${outPath}`);
  }
}

main();
