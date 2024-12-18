import { Document } from "@/api/graphql";
import { Document as DataDocument } from "@/interfaces";

export function parseDataDocument({
  id,
  increment_mgdl,
  initial_mgdl,
  initial_ui,
  limit_ui,
  name,
  triggers_mgdl
}: Document): DataDocument {
  const _table: DataDocument = {
    id,
    name,
    units: initial_ui,
    values: {
      list: [initial_mgdl]
    }
  }
  if(limit_ui) _table.limit = limit_ui
  if(triggers_mgdl?.length)
    triggers_mgdl?.forEach(val => _table.values.list.push(val))
  if(increment_mgdl)
    _table.values.custom = increment_mgdl

  return _table
}

export function dataDocumentInput({
  id,
  name,
  units,
  values,
  limit
}:DataDocument):Document{
  const _table: Document = {
    id,
    name,
    initial_mgdl: values.list[0],
    initial_ui: units
  }
  if(values.list.length > 1)
    _table.triggers_mgdl = values.list.slice(1)
  
  if(limit)
    _table.limit_ui = limit

  if(values?.custom)
    _table.increment_mgdl = values.custom

  return _table
}