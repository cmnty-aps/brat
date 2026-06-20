import express from "express";
import {
  createCanvas,
  loadImage,
  GlobalFonts
} from "@napi-rs/canvas";

const app = express();

/*
  Download font ini lalu simpan:
  ./fonts/NotoSans-Regular.ttf

  https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSans/NotoSans-Regular.ttf
*/

GlobalFonts.registerFromPath(
  "./fonts/NotoSans-Regular.ttf",
  "NotoSans"
);

const templates = {
  prabowo: "https://c.termai.cc/i134/Vd7gL.png",
  cmnty: "https://c.termai.cc/i106/EHtPm.jpg",
  jokowi: "https://files.catbox.moe/qp05dv.png",
  doraemon: "https://c.termai.cc/i157/BjE.jpg",
  sinchan: "https://c.termai.cc/i150/8Klx.jpg",
  shizuka: "https://c.termai.cc/i130/snxF.jpg",
  nobita: "https://c.termai.cc/i100/2ze1.jpg",
  hellokitty: "https://c.termai.cc/i124/OqMH6L.jpg",
  bearnad: "https://c.termai.cc/i105/QkZM.jpg",
  bearnad1: "https://c.termai.cc/i175/MYxYzJ.jpg",
  tom: "https://c.termai.cc/i106/oaXbTNA.jpg"
};

function wrapLines(ctx, text, maxWidth) {
  const words = text.split(" ");
  let lines = [];
  let line = "";

  for (const word of words) {
    const test = line + word + " ";

    if (
      ctx.measureText(test).width > maxWidth &&
      line !== ""
    ) {
      lines.push(line.trim());
      line = word + " ";
    } else {
      line = test;
    }
  }

  lines.push(line.trim());

  return lines;
}

async function generateBrat(imageUrl, text) {
  const response = await fetch(imageUrl);

  const buffer = Buffer.from(
    await response.arrayBuffer()
  );

  const img = await loadImage(buffer);

  const canvas = createCanvas(
    img.width,
    img.height
  );

  const ctx = canvas.getContext("2d");

  ctx.drawImage(
    img,
    0,
    0,
    img.width,
    img.height
  );

  const boardX = img.width * 0.16;
  const boardY = img.height * 0.66;
  const boardW = img.width * 0.68;
  const boardH = img.height * 0.26;

  const padding = boardW * 0.08;
  const textAreaW = boardW - padding * 2;

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#000";

  let fontSize = 80;
  let lines = [];

  while (fontSize > 20) {
    ctx.font = `500 ${fontSize}px NotoSans`;

    lines = wrapLines(
      ctx,
      text,
      textAreaW
    );

    const lineHeight = fontSize * 1.05;

    if (
      lines.length <= 3 &&
      lines.length * lineHeight <= boardH
    ) {
      break;
    }

    fontSize--;
  }

  ctx.font = `500 ${fontSize}px NotoSans`;

  ctx.shadowColor =
    "rgba(0,0,0,0.12)";
  ctx.shadowBlur = 2;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 1;

  const lineHeight = fontSize * 1.05;

  const startY =
    boardY +
    boardH / 2 -
    (lines.length * lineHeight) / 2 +
    lineHeight * 0.48;

  lines
    .slice(0, 3)
    .forEach((line, i) => {
      ctx.fillText(
        line,
        boardX + boardW / 2,
        startY + i * lineHeight
      );
    });

  return await canvas.encode("png");
}

app.get("/brat/:char", async (req, res) => {
  try {
    const char =
      req.params.char.toLowerCase();

    const text =
      req.query.teks || "Halo";

    const imageUrl =
      templates[char];

    if (!imageUrl) {
      return res.status(404).json({
        status: false,
        message:
          "Karakter tidak ditemukan"
      });
    }

    const image =
      await generateBrat(
        imageUrl,
        text
      );

    res.setHeader(
      "Content-Type",
      "image/png"
    );

    res.end(Buffer.from(image));
  } catch (err) {
    console.error(err);

    res.status(500).json({
      status: false,
      error: err.message
    });
  }
});

app.get("/", (req, res) => {
  res.json({
    status: true,
    creator: "Oji",
    endpoints: Object.keys(
      templates
    ).map(
      x =>
        `/brat/${x}?teks=halo`
    )
  });
});

const PORT =
  process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(
    `Server running on ${PORT}`
  );
});
