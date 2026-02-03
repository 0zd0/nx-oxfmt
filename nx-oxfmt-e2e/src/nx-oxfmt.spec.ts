import { execSync } from 'child_process'
import { join, dirname } from 'path'
import { mkdirSync, rmSync, existsSync } from 'fs'

const skipSetup = process.env.E2E_SKIP_SETUP === 'true'

describe('nx-oxfmt', () => {
    let projectDirectory: string

    beforeAll(() => {
        projectDirectory = ensureTestProject()
    })

    afterAll(() => {
        if (projectDirectory && !skipSetup) {
            // Cleanup the test project
            rmSync(projectDirectory, {
                recursive: true,
                force: true,
            })
        }
    })

    it('should be installed', () => {
        // npm ls will fail if the package is not installed properly
        execSync('npm ls @0zd0/nx-oxfmt', {
            cwd: projectDirectory,
            stdio: 'inherit',
        })
        // console.log('ok')
    })
})

/**
 * Creates a test project with create-nx-workspace and installs the plugin
 * @returns The directory where the test project was created
 */
function ensureTestProject() {
    const projectName = 'test-project'
    const projectDirectory = join(process.cwd(), 'tmp', projectName)

    if (skipSetup && existsSync(projectDirectory)) {
        console.log(`Skipping setup, reusing existing project at "${projectDirectory}"`)
        return projectDirectory
    }

    if (existsSync(projectDirectory)) {
        rmSync(projectDirectory, {
            recursive: true,
            force: true,
        })
    }

    mkdirSync(dirname(projectDirectory), {
        recursive: true,
    })

    execSync(
        `npx create-nx-workspace@latest ${projectName} --preset apps --nxCloud=skip --no-interactive`,
        {
            cwd: dirname(projectDirectory),
            stdio: 'inherit',
            env: process.env,
        },
    )
    console.log(`Created test project in "${projectDirectory}"`)

    // The plugin has been built and published to a local registry in the jest globalSetup
    // Install the plugin built with the latest source code into the test repo
    execSync(`npm install -D @0zd0/nx-oxfmt@e2e`, {
        cwd: projectDirectory,
        stdio: 'inherit',
        env: process.env,
    })

    return projectDirectory
}
