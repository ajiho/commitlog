import { runGitCliff } from "git-cliff";
import { parse, stringify } from "smol-toml";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { merge } from "lodash-es";
import { temporaryFile } from "tempy";

// 当前脚本所在目录
const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runCommitLog(options) {
  //  拿到模板名称和用户配置
  const [templateName, userTplOptions] = options.template;

  // 读取本地templates目录下的默认的toml配置文件
  const defaultTplPath = path.resolve(
    __dirname,
    "templates",
    `${templateName}.toml`
  );

  if (!fs.existsSync(defaultTplPath)) {
    throw new Error(`Default template file not found: ${defaultTplPath}`);
  }

  // 然后利用smol-toml的parse解析该配置项
  const defaultTplRaw = fs.readFileSync(defaultTplPath, "utf-8");
  const defaultTplConfig = parse(defaultTplRaw);

  // 然后拿到用户需要覆盖的配置
  const finalConfig = merge({}, defaultTplConfig, userTplOptions);

  // 然后再把该配置使用smol-toml的stringify转成toml,然后写入到一个临时目录得到配置文件的绝对路径
  const tmpFile = temporaryFile({ extension: "toml" });
  // 写入 TOML 内容
  fs.writeFileSync(tmpFile, stringify(finalConfig));

  // 然后再把该配置传递给runGitCliff让它指向这个配置
  await runGitCliff({ config: tmpFile, output: "CHANGELOG.md" });

  fs.unlinkSync(tmpFile);
}

export { runCommitLog };
