// You can include shared interfaces/types in a separate file
// and then use them in any component by importing them. For
// example, to import the interface below do:
//
// import { User } from 'path/to/interfaces';


export interface DocumentValues {
  list: number[]
  custom?: number
}

export interface Document {
  id?: string
  name: string
  units: number
  values: DocumentValues
  limit?: number
}

export type DocumentList = Document[]

export class DocumentItem {
  static create(params:Document) {
    return params
  }
}

export interface AppConfig {
  token: string,
  dataTables: DocumentList
}