// src/logger.ts — Colored console output (zero dependencies)

const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const BLUE = "\x1b[34m";
const CYAN = "\x1b[36m";
const DIM = "\x1b[2m";

const supportsColor = (): boolean => {
    if (process.env.NO_COLOR) return false;
    if (process.env.FORCE_COLOR) return true;
    return process.stdout.isTTY === true;
};

const color = supportsColor();

const c = (code: string, text: string): string =>
    color ? `${code}${text}${RESET}` : text;

export const info = (msg: string): void =>
    console.log(`  ${c(BLUE, "ℹ")} ${msg}`);

export const ok = (msg: string): void =>
    console.log(`  ${c(GREEN, "✓")} ${msg}`);

export const warn = (msg: string): void =>
    console.log(`  ${c(YELLOW, "⚠")} ${msg}`);

export const err = (msg: string): void =>
    console.error(`  ${c(RED, "✗")} ${msg}`);

export const step = (msg: string): void =>
    console.log(`\n${c(BOLD, `── ${msg} ──`)}`);

export const banner = (): void => {
    console.log("");
    console.log(
        c(BOLD, "  agent-security-policies") +
        c(DIM, " — secure coding rules for AI agents")
    );
    console.log("");
};

export const dim = (msg: string): string => c(DIM, msg);
export const bold = (msg: string): string => c(BOLD, msg);
export const cyan = (msg: string): string => c(CYAN, msg);
