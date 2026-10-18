const TAG_OFFSET = 0xe0000;
const FRAME_START = 0xe0001;
const FRAME_END = 0xe007f;

export const encodeTagInstruction = (payload: string): string => {
  let encoded = String.fromCodePoint(FRAME_START);

  for (let index = 0; index < payload.length; index += 1) {
    const code = payload.charCodeAt(index);
    if (code < 0x20 || code > 0x7e) {
      throw new RangeError("Tag instructions accept printable ASCII only.");
    }
    encoded += String.fromCodePoint(TAG_OFFSET + code);
  }

  return encoded + String.fromCodePoint(FRAME_END);
};

type TagFrame = {
  start: number;
  end: number;
  payload: string;
};

const parseTagFrames = (text: string): TagFrame[] => {
  const frames: TagFrame[] = [];
  let index = 0;

  while (index < text.length) {
    const codePoint = text.codePointAt(index);
    if (codePoint !== FRAME_START) {
      index += codePoint !== undefined && codePoint > 0xffff ? 2 : 1;
      continue;
    }

    const start = index;
    let cursor = index + 2;
    let payload = "";
    let valid = true;
    let complete = false;

    while (cursor < text.length) {
      const current = text.codePointAt(cursor);
      if (current === undefined) {
        break;
      }
      const width = current > 0xffff ? 2 : 1;

      if (current === FRAME_END) {
        if (valid) {
          frames.push({ start, end: cursor + width, payload });
        }
        index = cursor + width;
        complete = true;
        break;
      }

      if (current === FRAME_START) {
        valid = false;
      } else if (current >= TAG_OFFSET + 0x20 && current <= TAG_OFFSET + 0x7e) {
        if (valid) {
          payload += String.fromCharCode(current - TAG_OFFSET);
        }
      } else {
        valid = false;
      }

      cursor += width;
    }

    if (!complete) {
      break;
    }
  }

  return frames;
};

export const decodeTagInstructions = (text: string): string[] =>
  parseTagFrames(text).map((frame) => frame.payload);

export const stripTagInstructions = (text: string): string => {
  const frames = parseTagFrames(text);
  let stripped = "";
  let index = 0;

  for (const frame of frames) {
    stripped += text.slice(index, frame.start);
    index = frame.end;
  }

  return stripped + text.slice(index);
};
