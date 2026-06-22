declare interface Scheduler {
  yield(): Promise<void>
}

declare const scheduler: Scheduler | undefined
