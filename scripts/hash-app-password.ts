import { stdin, stdout } from "node:process";
import { hashAppPassword } from "../apps/api/src/modules/auth/auth";

if (!stdin.isTTY || !stdout.isTTY) {
  throw new Error("Run this command in an interactive terminal.");
}

const password = await readHidden("App password: ");
const confirmation = await readHidden("Confirm app password: ");

if (!password) {
  throw new Error("The app password cannot be empty.");
}

if (password.length > 256) {
  throw new Error("The app password must be 256 characters or fewer.");
}

if (password !== confirmation) {
  throw new Error("The app passwords do not match.");
}

stdout.write(`${await hashAppPassword(password)}\n`);

function readHidden(prompt: string) {
  return new Promise<string>((resolve, reject) => {
    let value = "";

    stdout.write(prompt);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");

    function finish() {
      stdin.setRawMode(false);
      stdin.pause();
      stdin.off("data", onData);
      stdout.write("\n");
    }

    function onData(chunk: string) {
      for (const character of chunk) {
        if (character === "\u0003") {
          finish();
          reject(new Error("Cancelled."));
          return;
        }

        if (character === "\r" || character === "\n") {
          finish();
          resolve(value);
          return;
        }

        if (character === "\u007f") {
          value = value.slice(0, -1);
          continue;
        }

        value += character;
      }
    }

    stdin.on("data", onData);
  });
}
