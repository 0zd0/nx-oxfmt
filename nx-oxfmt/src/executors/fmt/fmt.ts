import { PromiseExecutor, logger } from '@nx/devkit'
import { spawn } from 'child_process'
import { FmtExecutorSchema } from './schema'

const runExecutor: PromiseExecutor<FmtExecutorSchema> = async (options, context) => {
    const projectRoot = context.projectsConfigurations.projects[context.projectName]?.root
    const args: string[] = []

    if (options.check) args.push('--check')
    if (options.write) args.push('--write')
    if (options.config) args.push(`--config=${options.config}`)
    if (options.listDifferent) args.push('--list-different')
    if (options.withNodeModules) args.push('--with-node-modules')
    if (options.noErrorOnUnmatchedPattern) args.push('--no-error-on-unmatched-pattern')
    if (options.threads) args.push(`--threads=${options.threads}`)
    if (options.ignorePath) {
        const paths = Array.isArray(options.ignorePath) ? options.ignorePath : [options.ignorePath]
        paths.forEach((path) => args.push(`--ignore-path=${path}`))
    }
    if (Array.isArray(options.__unparsed__)) {
        args.push(...options.__unparsed__)
    }

    args.push(projectRoot)

    logger.info(`Running oxfmt for ${context.projectName}`)

    return new Promise((resolve) => {
        const child = spawn('oxfmt', args, {
            cwd: context.root,
            stdio: 'inherit',
            shell: true,
        })

        child.on('close', (code) => {
            if (code === 0) {
                resolve({ success: true })
            } else {
                logger.error(`oxfmt exited with code ${code}`)
                resolve({ success: false })
            }
        })

        child.on('error', (e) => {
            logger.error(`Error starting oxfmt: ${e.message}`)
            resolve({ success: false })
        })
    })
}

export default runExecutor
