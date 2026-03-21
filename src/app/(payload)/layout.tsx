/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import config from '@payload-config'
import { handleServerFunctions, RootLayout } from '@payloadcms/next/layouts'
import React from 'react'
import { importMap } from './admin/importMap'

import '@payloadcms/next/css'

type Args = {
  children: React.ReactNode
}

const Layout = ({ children }: Args) => (
  <RootLayout config={config} importMap={importMap} serverFunction={async function(args: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    'use server'
    return handleServerFunctions({
      ...args,
      config,
      importMap,
    })
  }}>
    {children}
  </RootLayout>
)

export default Layout
