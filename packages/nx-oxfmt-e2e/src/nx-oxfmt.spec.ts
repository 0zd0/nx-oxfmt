import {
    cleanup,
    runCommand,
    runNxCommandAsync,
    tmpProjPath,
    readJson,
    updateFile,
    readFile,
} from '@nx/plugin/testing'
import { existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'fs'
import { dirname, join } from 'path'

const LIB_PROJECT = 'lib'
const FMT_PROJECT = 'lib-fmt'

const skipSetup = process.env.E2E_SKIP_SETUP === 'true'

const ensureCustomProject = async () => {
    const projectDirectory = tmpProjPath()

    if (skipSetup && existsSync(projectDirectory)) {
        return
    }

    if (existsSync(projectDirectory)) {
        rmSync(projectDirectory, { recursive: true, force: true })
    }

    const parentDir = dirname(projectDirectory)
    mkdirSync(parentDir, { recursive: true })

    runCommand(
        `npx create-nx-workspace@latest proj --preset=apps --nxCloud=skip --no-interactive`,
        { cwd: parentDir },
    )

    runCommand(`npx nx add @0zd0/nx-oxfmt@e2e`, {
        cwd: projectDirectory,
    })

    runCommand(`npm install -D @nx/js`, {
        cwd: projectDirectory,
    })

    await runNxCommandAsync(
        `g @nx/js:lib ${LIB_PROJECT} --directory=libs/${LIB_PROJECT} --no-interactive`,
    )
    await runNxCommandAsync(
        `g @nx/js:lib ${FMT_PROJECT} --directory=libs/${FMT_PROJECT} --no-interactive`,
    )
}

describe('nx-oxfmt', () => {
    beforeAll(async () => {
        await ensureCustomProject()
    }, 120000)

    afterAll(() => {
        if (!skipSetup) cleanup()
    })

    it('should be installed', () => {
        const output = runCommand('npm ls @0zd0/nx-oxfmt', {
            cwd: tmpProjPath(),
        })
        expect(output).toContain('@0zd0/nx-oxfmt')
    })

    it('should be registered in nx.json', () => {
        const nxJson = readJson('nx.json')

        const hasPlugin = nxJson.plugins?.some(
            (p: any) =>
                (typeof p === 'string' && p === '@0zd0/nx-oxfmt') ||
                (p.plugin && p.plugin === '@0zd0/nx-oxfmt'),
        )

        expect(hasPlugin).toBeTruthy()
    })

    it('should infer oxfmt target for new projects', async () => {
        const result = await runNxCommandAsync(`show project ${LIB_PROJECT} --json`)
        const projectConfig = JSON.parse(result.stdout)

        expect(projectConfig.targets['fmt']).toBeDefined()
    })

    it('should format files', async () => {
        const filePath = `libs/${FMT_PROJECT}/src/index.ts`

        const dirtyContent = 'const a=1;console.log(a)'
        updateFile(filePath, dirtyContent)

        console.log('\n🔍🔍🔍 FS DEBUG START 🔍🔍🔍')
        try {
            // Ищем, где реально лежит бинарник во временной папке
            const binPath = join(tmpProjPath(), 'node_modules', '.bin', 'oxfmt')
            console.log(`Checking path: ${binPath}`)

            const stats = statSync(binPath)
            console.log('✅ File exists!')
            console.log(`Size: ${stats.size}`)
            // mode 33261 = 755 (rwxr-xr-x), mode 33188 = 644 (rw-r--r--)
            console.log(`Mode: ${stats.mode}`)
        } catch (err: any) {
            console.log('❌ BINARY MISSING OR INACCESSIBLE:', err.message)

            // Если файла нет, покажем, что вообще есть в папке .bin
            try {
                const dirPath = join(tmpProjPath(), 'node_modules', '.bin')
                console.log('Contents of .bin:', readdirSync(dirPath))
            } catch (e) {
                console.log('Cannot read .bin directory')
            }
        }
        console.log('🔍🔍🔍 FS DEBUG END 🔍🔍🔍\n')

        await runNxCommandAsync(`fmt ${FMT_PROJECT} --verbose`)

        const formattedContent = readFile(filePath)

        expect(formattedContent).not.toBe(dirtyContent)
        expect(formattedContent).toContain('const a = 1')
    })
})
