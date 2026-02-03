import { readNxJson, Tree, updateNxJson } from '@nx/devkit'
import { InitGeneratorSchema } from './schema'
import { DEFAULT_FORMAT_TARGET_NAME, NX_PLUGIN_NAME } from '../../constants'

export default async function initGenerator(tree: Tree, options: InitGeneratorSchema) {
    const nxJson = readNxJson(tree) || {}
    const hasPlugin = nxJson.plugins?.some((plugin) => {
        return typeof plugin === 'string' ?
                plugin === NX_PLUGIN_NAME
            :   plugin.plugin === NX_PLUGIN_NAME
    })

    if (!hasPlugin) {
        nxJson.plugins = [
            ...(nxJson.plugins || []),
            {
                plugin: NX_PLUGIN_NAME,
                options: {
                    lintTargetName: DEFAULT_FORMAT_TARGET_NAME,
                },
            },
        ]
        updateNxJson(tree, nxJson)
    }
}
