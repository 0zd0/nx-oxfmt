import { ExecutorContext } from '@nx/devkit'

import { FmtExecutorSchema } from './schema'
import executor from './fmt'
import * as child_process from 'child_process'
import * as fs from 'fs'
import { join } from 'path'

jest.mock('child_process')
jest.mock('fs')

const options: FmtExecutorSchema = {
    write: true,
}
const context: ExecutorContext = {
    root: '/root',
    cwd: '/root',
    isVerbose: false,
    projectName: 'my-project',
    projectGraph: {
        nodes: {
            'my-project': {
                type: 'app',
                name: 'my-project',
                data: {
                    root: 'apps/my-project',
                },
            },
        },
        dependencies: {},
    },
    projectsConfigurations: {
        projects: {
            'my-project': {
                root: 'apps/my-project',
            },
        },
        version: 2,
    },
    nxJsonConfiguration: {},
}

describe('Fmt Executor', () => {
    beforeEach(() => {
        ;(child_process.execSync as jest.Mock).mockClear()
        ;(fs.existsSync as jest.Mock).mockReturnValue(true)
    })

    it('should execute oxfmt with default arguments', async () => {
        const output = await executor(options, context)
        expect(output.success).toBe(true)
        const expectedBinary = join('/root', 'node_modules', '.bin', 'oxfmt')
        const expectedCommand = `${expectedBinary} --write apps/my-project`
        expect(child_process.execSync).toHaveBeenCalledWith(expectedCommand, {
            cwd: '/root',
            stdio: 'inherit',
        })
    })

    it('should pass --check flag', async () => {
        const output = await executor({ ...options, check: true, write: false }, context)
        expect(output.success).toBe(true)
        const expectedBinary = join('/root', 'node_modules', '.bin', 'oxfmt')
        const expectedCommand = `${expectedBinary} --check apps/my-project`
        expect(child_process.execSync).toHaveBeenCalledWith(expectedCommand, expect.anything())
    })

    it('should pass configuration file', async () => {
        const output = await executor({ ...options, config: 'oxfmt.json' }, context)
        expect(output.success).toBe(true)
        expect(child_process.execSync).toHaveBeenCalledWith(
            expect.stringContaining('--config=oxfmt.json'),
            expect.anything(),
        )
    })

    it('should handle failure', async () => {
        ;(child_process.execSync as jest.Mock).mockImplementation(() => {
            throw new Error('Some error')
        })
        const output = await executor(options, context)
        expect(output.success).toBe(false)
    })
})
