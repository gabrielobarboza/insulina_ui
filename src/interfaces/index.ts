// You can include shared interfaces/types in a separate file
// and then use them in any component by importing them. For
// example, to import the interface below do:
//
// import { User } from 'path/to/interfaces';

export interface Table {
  id: string
  name: string
  initial: number
  values: number[]
}

export type TableList = Table[]