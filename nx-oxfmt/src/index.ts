import {
    createNodesFromFiles,
    CreateNodesV2,
    joinPathFragments,
    TargetConfiguration,
} from '@nx/devkit'
import { dirname } from 'path'
import {
    DEFAULT_FORMAT_TARGET_NAME,
    FORMAT_EXECUTOR_NAME,
    NX_PLUGIN_NAME,
    NX_PROJECT_CONFIG_GLOB,
    OXFMT_CONFIG_GLOB,
} from './constants'

interface OxfmtPluginOptions {
    formatTargetName?: string
}

export const createNodesV2: CreateNodesV2<OxfmtPluginOptions> = [
    NX_PROJECT_CONFIG_GLOB,
    async (configFiles, options, context) => {
        return await createNodesFromFiles(
            (configFile, options, context) => {
                const projectRoot = dirname(configFile)

                const target: TargetConfiguration = {
                    executor: `${NX_PLUGIN_NAME}:${FORMAT_EXECUTOR_NAME}`,
                    options: {
                        ...options,
                        cwd: projectRoot,
                    },
                    cache: true,
                    inputs: [
                        `{workspaceRoot}/${OXFMT_CONFIG_GLOB}`,
                        `{projectRoot}/${OXFMT_CONFIG_GLOB}`,
                        joinPathFragments('{projectRoot}', '**', '*'),
                        {
                            externalDependencies: ['oxfmt'],
                        },
                    ],
                }

                return {
                    projects: {
                        [projectRoot]: {
                            targets: {
                                [options.formatTargetName ?? DEFAULT_FORMAT_TARGET_NAME]: target,
                            },
                        },
                    },
                }
            },
            configFiles,
            options,
            context,
        )
    },
]
