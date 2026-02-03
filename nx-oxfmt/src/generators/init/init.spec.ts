import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import { Tree, readNxJson, updateNxJson } from '@nx/devkit'

import initGenerator from './init'
import { InitGeneratorSchema } from './schema'
import { DEFAULT_FORMAT_TARGET_NAME, NX_PLUGIN_NAME } from '../../constants'

describe('init generator', () => {
    let tree: Tree
    const options: InitGeneratorSchema = {} as InitGeneratorSchema

    beforeEach(() => {
        tree = createTreeWithEmptyWorkspace()
    })

    it('should add the plugin to nx.json if not present', async () => {
        await initGenerator(tree, options)

        const nxJson = readNxJson(tree)

        expect(nxJson?.plugins).toContainEqual({
            plugin: NX_PLUGIN_NAME,
            options: {
                formatTargetName: DEFAULT_FORMAT_TARGET_NAME,
            },
        })
    })

    it('should not add the plugin if already present as object', async () => {
        const nxJson = readNxJson(tree) || {}
        nxJson.plugins = [
            ...(nxJson.plugins || []),
            {
                plugin: NX_PLUGIN_NAME,
                options: {
                    formatTargetName: 'custom-lint-name',
                },
            },
        ]
        updateNxJson(tree, nxJson)

        await initGenerator(tree, options)

        const updatedNxJson = readNxJson(tree)

        const myPlugins = updatedNxJson?.plugins?.filter((plugin) => {
            return typeof plugin === 'string' ?
                    plugin === NX_PLUGIN_NAME
                :   plugin.plugin === NX_PLUGIN_NAME
        })

        expect(myPlugins).toHaveLength(1)
    })

    it('should not add the plugin if already present as string', async () => {
        const nxJson = readNxJson(tree) || {}
        nxJson.plugins = [...(nxJson.plugins || []), NX_PLUGIN_NAME]
        updateNxJson(tree, nxJson)

        await initGenerator(tree, options)

        const updatedNxJson = readNxJson(tree)
        const myPlugins = updatedNxJson?.plugins?.filter((plugin) => {
            return typeof plugin === 'string' ?
                    plugin === NX_PLUGIN_NAME
                :   plugin.plugin === NX_PLUGIN_NAME
        })

        expect(myPlugins).toHaveLength(1)
    })
})
