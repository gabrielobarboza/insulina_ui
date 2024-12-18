import { DocumentList } from '@/interfaces'

/** Dummy Document data. */
export const mockedDocuments: DocumentList = [
  {
    id: "1010",
    name: "Café da Manha",
    units: 2,
    values: {
      list: [ 80, 170, 260 ]
    }
  },
  {
    id: "2020",
    name: "Almoço",
    units: 3,
    values: {
      list: [ 70 ]
    }
  }
]
