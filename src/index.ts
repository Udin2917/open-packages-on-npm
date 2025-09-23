/* eslint-disable antfu/no-top-level-await */
import fs from 'node:fs/promises'
import { join } from 'node:path'
import * as p from '@clack/prompts'
import open from 'open'
import c from 'picocolors'
import { x } from 'tinyexec'

const result = await x('pnpm', ['recursive', 'ls', '--json'])

interface RawProject {
  name: string
  path: string
  version: string
  private: boolean
  dependencies: Record<string, string>
  devDependencies: Record<string, string>
}

interface Project {
  name: string
  path: string
  pkg: any
}

const raw = (JSON.parse(result.stdout) as RawProject[])
  .filter(project => !project.private && !!project.version)

const projects: Project[] = (await Promise.all(raw.map(async (project) => {
  const pkg = JSON.parse(await fs.readFile(join(project.path, 'package.json'), 'utf-8'))
  return {
    name: project.name,
    path: project.path,
    pkg,
  }
})))
  .filter(project => project.name)

p.note(
  projects.map(project => c.reset(c.green(`${project.name}`))).join('\n'),
  c.cyan(`${projects.length} projects found`),
)

const confirm = await p.confirm({
  message: 'Enter to open all packages\' npm pages in browser, are you sure?',
  initialValue: false,
})

if (confirm) {
  for (const project of projects) {
    open(`https://npmjs.com/package/${project.pkg.name}/access`)
  }
}
