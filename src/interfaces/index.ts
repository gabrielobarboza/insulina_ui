// You can include shared interfaces/types in a separate file
// and then use them in any component by importing them. For
// example, to import the interface below do:
//
// import { User } from 'path/to/interfaces';


export interface TableValues {
  list: number[]
  custom?: number
}

export interface Table {
  id?: string
  name: string
  units: number
  values: TableValues
}

export type TableList = Table[]

export class TableItem {
  static create(params:Table) {
    return params
  }
}

export interface AppConfig {
  token: string,
  dataTables: TableList
}