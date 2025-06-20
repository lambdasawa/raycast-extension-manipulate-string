import crypto from "crypto";
import qs from "qs";
import * as htmlEntities from "html-entities";
import { getTimeDifference, splitIntoWords } from "./utils";

export type Manipulation = {
  key: string;
  manipulation: (text: string) => string | null;
};

const manipulations: Manipulation[] = [
  {
    key: "Raw",
    manipulation: (text: string): string | null => {
      return text;
    },
  },
  {
    key: "Hex encoding",
    manipulation: (text: string): string | null => {
      return Buffer.from(text, "utf-8").toString("hex");
    },
  },
  {
    key: "Hex decoding",
    manipulation: (text: string): string | null => {
      return Buffer.from(text, "hex").toString("utf-8");
    },
  },
  {
    key: "Base64 encoding",
    manipulation: (text: string): string | null => {
      return Buffer.from(text, "utf-8").toString("base64");
    },
  },
  {
    key: "Base64 decoding",
    manipulation: (text: string): string | null => {
      return Buffer.from(text, "base64").toString("utf-8");
    },
  },
  {
    key: "URL encoding",
    manipulation: (text: string): string | null => {
      return encodeURIComponent(text);
    },
  },
  {
    key: "URL decoding",
    manipulation: (text: string): string | null => {
      return decodeURIComponent(text);
    },
  },
  {
    key: "HTML encoding",
    manipulation: (text: string): string | null => {
      return htmlEntities.encode(text);
    },
  },
  {
    key: "HTML decoding",
    manipulation: (text: string): string | null => {
      return htmlEntities.decode(text);
    },
  },
  {
    key: "Parse URL",
    manipulation: (text: string): string | null => {
      const url = new URL(text.trim());

      const searchParamKeys = [...url.searchParams.keys()];

      return JSON.stringify(
        {
          href: url.href,
          origin: url.origin,
          protocol: url.protocol,
          username: url.username,
          password: url.password,
          host: url.host,
          port: url.port,
          hostname: url.hostname,
          pathname: url.pathname,
          search: url.search,
          searchParams: Object.fromEntries(searchParamKeys.map((key) => [key, url.searchParams.get(key)])),
          searchAllParams: Object.fromEntries(searchParamKeys.map((key) => [key, url.searchParams.getAll(key)])),
          hash: url.hash,
        },
        null,
        2,
      );
    },
  },
  {
    key: "Convert UNIX timestamp (sec) to ISO 8601",
    manipulation: (text: string): string | null => {
      const timestamp = parseInt(text.trim(), 10);
      return new Date(timestamp * 1000).toISOString();
    },
  },
  {
    key: "Convert ISO 8601 to UNIX timestamp (sec)",
    manipulation: (text: string): string | null => {
      const date = new Date(text.trim());
      const time = date.getTime() / 1000;
      if (isNaN(time)) {
        return null;
      }
      return time.toString();
    },
  },
  {
    key: "Convert UNIX timestamp (ms) to ISO 8601",
    manipulation: (text: string): string | null => {
      const timestamp = parseInt(text.trim(), 10);
      return new Date(timestamp).toISOString();
    },
  },
  {
    key: "Convert ISO 8601 to UNIX timestamp (ms)",
    manipulation: (text: string): string | null => {
      const date = new Date(text.trim());
      const time = date.getTime();
      if (isNaN(time)) {
        return null;
      }
      return time.toString();
    },
  },
  {
    key: "Convert duration from now",
    manipulation: (text: string): string | null => {
      const now = new Date();
      const date = new Date(text.trim());
      return getTimeDifference(now.getTime(), date.getTime());
    },
  },
  {
    key: "Prettify JSON",
    manipulation: (text: string): string | null => {
      return JSON.stringify(JSON.parse(text), null, 2);
    },
  },
  {
    key: "Minify JSON",
    manipulation: (text: string): string | null => {
      return JSON.stringify(JSON.parse(text), null, 0);
    },
  },
  {
    key: "Escape as JSON string",
    manipulation: (text: string): string | null => {
      return JSON.stringify(text);
    },
  },
  {
    key: "Convert JSON to form",
    manipulation: (text: string): string | null => {
      const json = JSON.parse(text.trim());
      return qs.stringify(json);
    },
  },
  {
    key: "Convert form to JSON",
    manipulation: (text: string): string | null => {
      const obj = qs.parse(text.trim());
      return JSON.stringify(obj, null, 2);
    },
  },
  {
    key: "Extract JWT",
    manipulation: (text: string): string | null => {
      const regex = /(eyJ[a-zA-Z0-9_-]+?\.eyJ[a-zA-Z0-9_-]+?\.[a-zA-Z0-9_-]*)/g;
      const matches = text.match(regex);
      if (matches === null) {
        return null;
      }
      return matches.join("\n");
    },
  },
  {
    key: "Extract and Decode JWT",
    manipulation: (text: string): string | null => {
      const regex = /(eyJ[a-zA-Z0-9_-]+?\.eyJ[a-zA-Z0-9_-]+?\.[a-zA-Z0-9_-]*)/g;

      return [...text.matchAll(regex)]
        .map((jwt) => {
          const parts = jwt[1].split(".");
          if (parts.length !== 3) {
            return jwt[0];
          }

          const header = JSON.parse(Buffer.from(parts[0], "base64").toString("utf-8"));
          const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf-8"));

          return JSON.stringify(
            {
              header,
              payload,
              iat_iso8601: payload.iat ? new Date(payload.iat * 1000).toISOString() : undefined,
              nbf_iso8601: payload.nbf ? new Date(payload.nbf * 1000).toISOString() : undefined,
              exp_iso8601: payload.exp ? new Date(payload.exp * 1000).toISOString() : undefined,
              signature: parts[2],
            },
            null,
            2,
          );
        })
        .join("\n");
    },
  },
  {
    key: "Calculate md5",
    manipulation: (text: string): string | null => {
      const hash = crypto.createHash("md5");
      hash.update(text);
      return hash.digest("hex");
    },
  },
  {
    key: "Calculate sha1",
    manipulation: (text: string): string | null => {
      const hash = crypto.createHash("sha1");
      hash.update(text);
      return hash.digest("hex");
    },
  },
  {
    key: "Calculate sha256",
    manipulation: (text: string): string | null => {
      const hash = crypto.createHash("sha256");
      hash.update(text);
      return hash.digest("hex");
    },
  },
  {
    key: "Convert camelCase",
    manipulation: (text: string): string | null => {
      const words = splitIntoWords(text.trim());
      return words
        .map((word, index) => {
          return index === 0 ? word : word[0].toUpperCase() + word.slice(1);
        })
        .join("");
    },
  },
  {
    key: "Convert PascalCase",
    manipulation: (text: string): string | null => {
      const words = splitIntoWords(text.trim());
      return words.map((word) => word[0].toUpperCase() + word.slice(1)).join("");
    },
  },
  {
    key: "Convert lower-kebab-case",
    manipulation: (text: string): string | null => {
      const words = splitIntoWords(text.trim());
      return words.map((word) => word.toLowerCase()).join("-");
    },
  },
  {
    key: "Convert UPPER-KEBAB-CASE",
    manipulation: (text: string): string | null => {
      const words = splitIntoWords(text.trim());
      return words.map((word) => word.toUpperCase()).join("-");
    },
  },
  {
    key: "Convert lower_snake_case",
    manipulation: (text: string): string | null => {
      const words = splitIntoWords(text.trim());
      return words.map((word) => word.toLowerCase()).join("_");
    },
  },
  {
    key: "Convert UPPER_SNAKE_CASE",
    manipulation: (text: string): string | null => {
      const words = splitIntoWords(text.trim());
      return words.map((word) => word.toUpperCase()).join("_");
    },
  },
  {
    key: "Convert dot.case",
    manipulation: (text: string): string | null => {
      const words = splitIntoWords(text.trim());
      return words.map((word) => word.toLowerCase()).join(".");
    },
  },
  {
    key: "Convert lowercase",
    manipulation: (text: string): string | null => {
      return text.toLowerCase();
    },
  },
  {
    key: "Convert UPPERCASE",
    manipulation: (text: string): string | null => {
      return text.toUpperCase();
    },
  },
  {
    key: "Convert words lowercase",
    manipulation: (text: string): string | null => {
      const words = splitIntoWords(text.trim());
      return words.map((word) => word.toLowerCase()).join(" ");
    },
  },
  {
    key: "Convert First word capitalized",
    manipulation: (text: string): string | null => {
      const words = splitIntoWords(text.trim());
      return words.map((word, index) => (index === 0 ? word[0].toUpperCase() + word.slice(1) : word)).join(" ");
    },
  },
  {
    key: "Convert Words Capitalized",
    manipulation: (text: string): string | null => {
      const words = splitIntoWords(text.trim());
      return words.map((word) => word[0].toUpperCase() + word.slice(1)).join(" ");
    },
  },
  {
    key: "Generate fuzzy search regex",
    manipulation: (text: string): string | null => {
      const words = splitIntoWords(text.trim());
      return words.join(".*");
    },
  },
  {
    key: "Hex(16) to Decimal(10)",
    manipulation: (text: string): string | null => {
      const n = parseInt(text.trim(), 16);
      if (Number.isNaN(n)) {
        return "";
      }

      return n.toString(10);
    },
  },
  {
    key: "Hex(16) to Binary(2)",
    manipulation: (text: string): string | null => {
      const n = parseInt(text.trim(), 16);
      if (Number.isNaN(n)) {
        return "";
      }

      return formatBinaryNumber(n.toString(2));
    },
  },
  {
    key: "Decimal(10) to Hex(16)",
    manipulation: (text: string): string | null => {
      const n = parseInt(text.trim(), 10);
      if (Number.isNaN(n)) {
        return "";
      }

      return n.toString(16);
    },
  },
  {
    key: "Decimal(10) to Binary(2)",
    manipulation: (text: string): string | null => {
      const n = parseInt(text.trim(), 10);
      if (Number.isNaN(n)) {
        return "";
      }

      return formatBinaryNumber(n.toString(2));
    },
  },
  {
    key: "Binary(2) to Hex(16)",
    manipulation: (text: string): string | null => {
      const n = parseInt(text.trim().replaceAll(" ", ""), 2);
      if (Number.isNaN(n)) {
        return "";
      }

      return n.toString(16);
    },
  },
  {
    key: "Binary(2) to Decimal(10)",
    manipulation: (text: string): string | null => {
      const n = parseInt(text.trim().replaceAll(" ", ""), 2);
      if (Number.isNaN(n)) {
        return "";
      }

      return n.toString(10);
    },
  },
];

export function manipulateString(string: string): { key: string; value: string }[] {
  return manipulations.map((converter) => {
    let value: string | null = null;

    try {
      value = converter.manipulation(string);
    } catch (error) {
      value = null;
    }

    return { key: converter.key, value: value ?? "" };
  });
}

function formatBinaryNumber(text: string): string {
  return [...new Array(text.length / 8)].map((_, i) => text.slice(i * 8, (i + 1) * 8)).join(" ");
}
