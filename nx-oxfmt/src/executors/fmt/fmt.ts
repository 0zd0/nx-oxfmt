import { PromiseExecutor, ExecutorContext } from '@nx/devkit';
import { FmtExecutorSchema } from './schema';
import { execSync } from 'child_process';
import { join } from 'path';
import { existsSync } from 'fs';

const runExecutor: PromiseExecutor<FmtExecutorSchema> = async (options, context) => {
  const projectRoot = context.projectsConfigurations?.projects[context.projectName ?? '']?.root ?? '';
  const root = context.root;

  // Locate oxfmt binary
  // Try to find it in the workspace root node_modules first (standard usage)
  let oxfmtPath = join(root, 'node_modules', '.bin', 'oxfmt');

  if (!existsSync(oxfmtPath)) {
    // If not found, check if it's installed in the plugin's directory (dev/monorepo context)
    // Adjust this logic if the plugin structure is different
    oxfmtPath = join(root, 'nx-oxfmt', 'node_modules', '.bin', 'oxfmt');
  }

  if (!existsSync(oxfmtPath)) {
    // Fallback for when installed as a dependency of the plugin in a consumer repo
    try {
      // This might not work if oxfmt doesn't expose a main entry point that resolves near the binary
      // But usually npm installs binaries to the top-level node_modules/.bin
      oxfmtPath = join(root, 'node_modules', '.bin', 'oxfmt');
    } catch (e) { }
  }

  if (!existsSync(oxfmtPath)) {
    throw new Error(`Could not find oxfmt binary. checked path: ${oxfmtPath}. Please ensure oxfmt is installed.`);
  }

  const args: string[] = [];

  // Config map
  if (options.config) args.push(`--config=${options.config}`);
  if (options.ignorePath) {
    const paths = Array.isArray(options.ignorePath) ? options.ignorePath : [options.ignorePath];
    paths.forEach(p => args.push(`--ignore-path=${p}`));
  }
  if (options.threads) args.push(`--threads=${options.threads}`);

  // Boolean flags
  if (options.check) args.push('--check');
  if (options.write !== false && !options.check && !options.listDifferent) {
    // Default is write, but we only add it if explicitly requested or if no other mode is set?
    // oxfmt defaults to write.
    // If user sets write: false, we shouldn't add it? But oxfmt might write by default.
    // CLI docs say: --write Format and write files in place (default)
    // So checks only needed if we want to disable it... but there is no --no-write usually?
    // Actually typically you pass --check OR --list-different OR [nothing=write].
    // So if options.write is explicitly false, we rely on user passing another flag. 
    // If check or listDifferent is passed, write is implicitly disabled by oxfmt usually.
    // Let's assume default behavior.
  }
  // Actually, if we want to force write, we pass --write.
  if (options.write) args.push('--write');

  if (options.listDifferent) args.push('--list-different');
  if (options.withNodeModules) args.push('--with-node-modules');
  if (options.noErrorOnUnmatchedPattern) args.push('--no-error-on-unmatched-pattern');

  if (options.additionalArguments) {
    args.push(...options.additionalArguments.split(' ').filter(Boolean));
  }

  // Target paths
  args.push(projectRoot);

  const command = `${oxfmtPath} ${args.join(' ')}`;
  console.log(`Executing: ${command}`);

  try {
    execSync(command, {
      cwd: root,
      stdio: 'inherit',
    });
    return { success: true };
  } catch (e) {
    console.error(`oxfmt failed with error: ${e}`);
    return { success: false };
  }
};

export default runExecutor;
