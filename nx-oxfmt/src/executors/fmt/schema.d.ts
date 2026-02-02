export interface FmtExecutorSchema {
    check?: boolean
    write?: boolean
    listDifferent?: boolean
    config?: string
    ignorePath?: string | string[]
    withNodeModules?: boolean
    noErrorOnUnmatchedPattern?: boolean
    threads?: number
    additionalArguments?: string
}
