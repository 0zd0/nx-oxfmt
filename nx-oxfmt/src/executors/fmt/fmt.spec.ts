import { ExecutorContext, logger } from '@nx/devkit'

import { FmtExecutorSchema } from './schema'
import executor from './fmt'
import { spawn, ChildProcess } from 'child_process'

jest.mock('child_process')
const mockedSpawn = jest.mocked(spawn)
jest.mock('@nx/devkit', () => ({
    ...jest.requireActual('@nx/devkit'),
    logger: {
        info: jest.fn(),
        error: jest.fn(),
    },
}))

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
    let mockChildProcess: { on: jest.Mock<unknown, [string, (...args: unknown[]) => void]> }
    let mockOn: jest.Mock<unknown, [string, (...args: unknown[]) => void]>

    beforeEach(() => {
        jest.clearAllMocks()

        mockOn = jest.fn().mockImplementation(function (this: unknown) {
            return this
        })
        mockChildProcess = {
            on: mockOn,
        }

        mockedSpawn.mockReturnValue(mockChildProcess as unknown as ChildProcess)
    })

    const runAndEmit = async (options: FmtExecutorSchema, exitCode = 0) => {
        const promise = executor(options, context)

        const closeCall = mockOn.mock.calls.find((call) => call[0] === 'close')
        if (closeCall) {
            closeCall[1](exitCode)
        }

        return promise
    }

    it('should run oxfmt with base paths', async () => {
        const result = await runAndEmit({ write: true })

        expect(result.success).toBe(true)
        expect(spawn).toHaveBeenCalledWith(
            'oxfmt',
            ['--write', 'apps/my-project'],
            expect.objectContaining({ cwd: '/root', shell: true }),
        )
    })

    it('should correctly pass all boolean flags', async () => {
        await runAndEmit({
            check: true,
            listDifferent: true,
            withNodeModules: true,
            noErrorOnUnmatchedPattern: true,
        })

        const args = mockedSpawn.mock.calls[0][1]
        expect(args).toContain('--check')
        expect(args).toContain('--list-different')
        expect(args).toContain('--with-node-modules')
        expect(args).toContain('--no-error-on-unmatched-pattern')
    })

    it('should handle threads and config values', async () => {
        await runAndEmit({ threads: 4, config: 'custom.json' })

        const args = mockedSpawn.mock.calls[0][1]
        expect(args).toContain('--threads=4')
        expect(args).toContain('--config=custom.json')
    })

    it('should handle ignorePath array', async () => {
        await runAndEmit({ ignorePath: ['dist', '.next'] })

        const args = mockedSpawn.mock.calls[0][1]
        expect(args).toContain('--ignore-path=dist')
        expect(args).toContain('--ignore-path=.next')
    })

    it('should pass unknown arguments via __unparsed__', async () => {
        await runAndEmit({
            write: true,
            __unparsed__: ['--max-width=120', '--no-semi'],
        })

        const args = mockedSpawn.mock.calls[0][1]
        expect(args).toContain('--max-width=120')
        expect(args).toContain('--no-semi')
        expect(args[args.length - 1]).toBe('apps/my-project')
    })

    it('should return success: false on non-zero exit code', async () => {
        const result = await runAndEmit({}, 1)

        expect(result.success).toBe(false)
        expect(logger.error).toHaveBeenCalledWith(
            expect.stringContaining('oxfmt exited with code 1'),
        )
    })

    it('should handle system spawn error (error event)', async () => {
        const promise = executor({}, context)

        const errorCall = mockOn.mock.calls.find((call) => call[0] === 'error')
        if (errorCall) {
            errorCall[1](new Error('Spawn failed'))
        }

        const result = await promise
        expect(result.success).toBe(false)
        expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Error starting oxfmt'))
    })
})
